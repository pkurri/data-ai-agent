from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer
import re
import json
import os
from io import BytesIO
from werkzeug.utils import secure_filename
from services.data_source import DataSource
from config.database import get_db
from validation.service import ValidationService
from validation.rules import EMPLOYEE_SCHEMA, PRODUCT_SCHEMA
from sqlalchemy import inspect
from api.endpoints.chat import chat_bp
from config.database_config import DB2Config, SQLServerConfig, RedisConfig
from adapters.db_adapter import DB2Adapter
from adapters.sql_server_adapter import SQLServerAdapter
from adapters.redis_adapter import RedisAdapter
from utils.logging import get_logger

logger = get_logger(__name__)

app = Flask(__name__)
CORS(app)

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls', 'json', 'txt'}

# Initialize services
data_source = DataSource()
validation_service = ValidationService()

# Register default SQLite database
data_source.register_database('default', "sqlite:///./data.db")
validation_service.register_database('default', data_source.db_connections['default'])

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Data cleaning API is running"})

@app.route('/api/datasets', methods=['POST'])
def upload_file():
    """Upload a new dataset."""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
            
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Read the file and validate
        df = data_source.read_data('file', path=filepath)
        
        # Determine schema based on file content
        schema_name = 'employees' if 'employee_id' in df.columns else 'products'
        validation_errors = validation_service.validate_dataframe(df, schema_name)
        
        if validation_errors:
            os.remove(filepath)  # Remove invalid file
            return jsonify({
                'error': 'Validation failed',
                'validation_errors': validation_errors
            }), 400
        
        return jsonify({
            'message': 'File uploaded successfully',
            'filename': filename,
            'rows': len(df),
            'columns': list(df.columns)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clean', methods=['POST'])
def clean_data():
    """Clean data from various sources (files or database tables)."""
    try:
        data = request.get_json()
        source_type = data.get('source_type', 'file')
        source_params = data.get('source_params', {})
        cleaning_operations = data.get('cleaning_operations', [])
        validation_schema = data.get('validation_schema')
        
        # Read data from source
        df = data_source.read_data(source_type, **source_params)
        
        # Validate data if schema provided
        if validation_schema:
            validation_errors = validation_service.validate_dataframe(df, validation_schema)
            if validation_errors:
                return jsonify({
                    'error': 'Validation failed',
                    'validation_errors': validation_errors
                }), 400
        
        # Apply cleaning operations
        for operation in cleaning_operations:
            op_type = operation['type']
            op_params = operation.get('params', {})
            
            if op_type == 'text_normalization':
                text_columns = op_params.get('columns', df.select_dtypes(include=['object']).columns)
                for col in text_columns:
                    if col in df.columns:
                        df[col] = df[col].str.lower().str.strip()
            
            elif op_type == 'missing_values':
                strategy = op_params.get('strategy', 'mean')
                columns = op_params.get('columns', df.select_dtypes(include=np.number).columns)
                imputer = SimpleImputer(strategy=strategy)
                df[columns] = imputer.fit_transform(df[columns])
            
            elif op_type == 'outliers':
                method = op_params.get('method', 'iqr')
                columns = op_params.get('columns', df.select_dtypes(include=np.number).columns)
                
                if method == 'iqr':
                    for col in columns:
                        Q1 = df[col].quantile(0.25)
                        Q3 = df[col].quantile(0.75)
                        IQR = Q3 - Q1
                        lower_bound = Q1 - 1.5 * IQR
                        upper_bound = Q3 + 1.5 * IQR
                        df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)
            
            elif op_type == 'duplicates':
                subset = op_params.get('columns', None)
                df = df.drop_duplicates(subset=subset)
        
        # Validate cleaned data if schema provided
        if validation_schema:
            validation_errors = validation_service.validate_dataframe(df, validation_schema)
            if validation_errors:
                return jsonify({
                    'error': 'Cleaned data failed validation',
                    'validation_errors': validation_errors
                }), 400
        
        # Save cleaned data
        output_params = data.get('output_params', {
            'target_type': 'file',
            'path': os.path.join(app.config['UPLOAD_FOLDER'], 'cleaned_data.csv')
        })
        
        data_source.write_data(df, **output_params)
        
        return jsonify({
            'message': 'Data cleaned successfully',
            'rows': len(df),
            'columns': list(df.columns)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/validate', methods=['POST'])
def validate_data():
    """Validate data from various sources."""
    try:
        data = request.get_json()
        source_type = data.get('source_type', 'file')
        source_params = data.get('source_params', {})
        validation_schema = data.get('validation_schema')
        
        if not validation_schema:
            return jsonify({'error': 'Validation schema is required'}), 400
        
        # For database tables, use database validator
        if source_type == 'database':
            db_name = source_params.get('db_name', 'default')
            table_name = source_params.get('table_name')
            schema = source_params.get('schema')
            
            validation_errors = validation_service.validate_database_table(
                db_name, table_name, schema
            )
        else:
            # For other sources, read into DataFrame and validate
            df = data_source.read_data(source_type, **source_params)
            validation_errors = validation_service.validate_dataframe(
                df, validation_schema
            )
        
        if validation_errors:
            return jsonify({
                'valid': False,
                'errors': validation_errors
            })
        
        return jsonify({
            'valid': True,
            'message': 'Data validation successful'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/schemas', methods=['GET'])
def list_schemas():
    """List available validation schemas."""
    try:
        return jsonify({
            'schemas': {
                'employees': EMPLOYEE_SCHEMA,
                'products': PRODUCT_SCHEMA
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/datasets', methods=['GET'])
def list_datasets():
    """List all available datasets."""
    try:
        files = []
        for filename in os.listdir(app.config['UPLOAD_FOLDER']):
            if allowed_file(filename):
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                files.append({
                    'name': filename,
                    'size': os.path.getsize(file_path),
                    'modified': os.path.getmtime(file_path)
                })
        return jsonify({'success': True, 'datasets': files})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/datasets/<dataset_name>/preview', methods=['GET'])
def preview_dataset(dataset_name):
    """Preview the first few rows of a dataset."""
    try:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(dataset_name))
        if not os.path.exists(file_path):
            return jsonify({'error': 'Dataset not found'}), 404

        df = pd.read_csv(file_path) if dataset_name.endswith('.csv') else \
             pd.read_excel(file_path) if dataset_name.endswith(('.xlsx', '.xls')) else \
             pd.read_json(file_path) if dataset_name.endswith('.json') else \
             pd.read_csv(file_path, sep='\t')

        preview = df.head(10).to_dict('records')
        return jsonify({
            'success': True,
            'preview': preview,
            'total_rows': len(df),
            'total_columns': len(df.columns),
            'columns': df.columns.tolist()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/datasets/<dataset_name>/download', methods=['GET'])
def download_dataset(dataset_name):
    """Download a dataset."""
    try:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(dataset_name))
        if not os.path.exists(file_path):
            return jsonify({'error': 'Dataset not found'}), 404
            
        return send_file(file_path, as_attachment=True)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/datasets/<dataset_name>', methods=['DELETE'])
def delete_dataset(dataset_name):
    """Delete a dataset."""
    try:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(dataset_name))
        if not os.path.exists(file_path):
            return jsonify({'error': 'Dataset not found'}), 404
            
        os.remove(file_path)
        return jsonify({'success': True, 'message': f'Dataset {dataset_name} deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tables', methods=['GET'])
def list_tables():
    """List available database tables."""
    try:
        db_name = request.args.get('db_name', 'default')
        if db_name not in data_source.db_connections:
            return jsonify({'error': f'Database {db_name} not registered'}), 400
            
        engine = data_source.db_connections[db_name]
        inspector = inspect(engine)
        
        tables = []
        for schema in inspector.get_schema_names():
            for table in inspector.get_table_names(schema=schema):
                tables.append({
                    'schema': schema,
                    'table': table,
                    'columns': [
                        {'name': col['name'], 'type': str(col['type'])}
                        for col in inspector.get_columns(table, schema=schema)
                    ]
                })
        
        return jsonify({'tables': tables})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/preview', methods=['POST'])
def preview_data():
    """Preview data from various sources."""
    try:
        data = request.get_json()
        source_type = data.get('source_type', 'file')
        source_params = data.get('source_params', {})
        
        # Read sample of data
        if source_type == 'database':
            source_params['query'] = f"SELECT * FROM {source_params.get('table_name')} LIMIT 5"
            source_type = 'query'
            
        df = data_source.read_data(source_type, **source_params)
        preview = df.head().to_dict(orient='records')
        
        return jsonify({
            'preview': preview,
            'total_rows': len(df),
            'columns': list(df.columns)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# Initialize database connections
try:
    # DB2 connection
    db2_adapter = DB2Adapter(DB2Config())
    db2_adapter.connect()
    logger.info("Successfully connected to DB2")

    # SQL Server connection
    sql_adapter = SQLServerAdapter(SQLServerConfig())
    sql_adapter.connect()
    logger.info("Successfully connected to SQL Server")

    # Redis connection
    redis_adapter = RedisAdapter(RedisConfig())
    redis_adapter.connect()
    logger.info("Successfully connected to Redis")

except Exception as e:
    logger.error(f"Error initializing database connections: {str(e)}")
    raise

# Register blueprints
app.register_blueprint(chat_bp, url_prefix='/api/chat')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
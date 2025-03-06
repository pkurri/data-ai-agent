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

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls', 'json', 'txt'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Data cleaning API is running"})

@app.route('/api/data/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"error": "File type not allowed"}), 400
    
    try:
        filename = secure_filename(file.filename)
        dataset_name = request.form.get('dataset_name', filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Read the file to get basic info
        df = pd.read_csv(file_path) if filename.endswith('.csv') else \
             pd.read_excel(file_path) if filename.endswith(('.xlsx', '.xls')) else \
             pd.read_json(file_path) if filename.endswith('.json') else \
             pd.read_csv(file_path, sep='\t')
        
        info = {
            "name": dataset_name,
            "original_filename": filename,
            "rows": len(df),
            "columns": len(df.columns),
            "column_names": df.columns.tolist(),
            "file_size": os.path.getsize(file_path),
            "upload_date": pd.Timestamp.now().isoformat()
        }
        
        return jsonify({
            "success": True,
            "message": "File uploaded successfully",
            "dataset_info": info
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/data/clean', methods=['POST'])
def clean_data():
    try:
        data = request.get_json()
        dataset_name = data.get('dataset_name')
        options = data.get('options', {})
        
        if not dataset_name:
            return jsonify({"error": "Dataset name is required"}), 400
        
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], dataset_name)
        if not os.path.exists(file_path):
            return jsonify({"error": "Dataset not found"}), 404
        
        # Read the file
        file_ext = os.path.splitext(dataset_name)[1].lower()
        df = pd.read_csv(file_path) if file_ext == '.csv' else \
             pd.read_excel(file_path) if file_ext in ('.xlsx', '.xls') else \
             pd.read_json(file_path) if file_ext == '.json' else \
             pd.read_csv(file_path, sep='\t')
        
        # Get initial statistics
        initial_stats = {
            "rows": len(df),
            "columns": len(df.columns),
            "missing_values": df.isna().sum().sum(),
            "duplicates": df.duplicated().sum()
        }
        
        # Apply cleaning operations
        if options.get('removeDuplicates', True):
            df = df.drop_duplicates()
        
        missing_values_strategy = options.get('handleMissingValues', 'impute')
        if missing_values_strategy == 'impute':
            # Impute numerical columns with mean
            num_cols = df.select_dtypes(include=[np.number]).columns
            if len(num_cols) > 0:
                imputer = SimpleImputer(strategy='mean')
                df[num_cols] = imputer.fit_transform(df[num_cols])
            
            # Impute categorical columns with most frequent value
            cat_cols = df.select_dtypes(exclude=[np.number]).columns
            if len(cat_cols) > 0:
                imputer = SimpleImputer(strategy='most_frequent')
                df[cat_cols] = imputer.fit_transform(df[cat_cols])
        elif missing_values_strategy == 'remove':
            df = df.dropna()
        elif missing_values_strategy == 'fill':
            df = df.fillna({col: '' if pd.api.types.is_object_dtype(df[col]) else 0 for col in df.columns})
        
        if options.get('normalizeText', True):
            for col in df.select_dtypes(include=['object']).columns:
                df[col] = df[col].apply(lambda x: str(x).lower().strip() if isinstance(x, str) else x)
                df[col] = df[col].apply(lambda x: re.sub(r'\s+', ' ', str(x)) if isinstance(x, str) else x)
        
        if options.get('detectOutliers', True):
            for col in df.select_dtypes(include=[np.number]).columns:
                mean = df[col].mean()
                std = df[col].std()
                if std > 0:
                    z_scores = (df[col] - mean) / std
                    df[col] = df[col].mask(abs(z_scores) > 3, mean)
        
        # Get final statistics
        final_stats = {
            "rows": len(df),
            "columns": len(df.columns),
            "missing_values": df.isna().sum().sum(),
            "duplicates": df.duplicated().sum()
        }
        
        # Calculate changes
        changes = {
            "rows_removed": initial_stats["rows"] - final_stats["rows"],
            "missing_values_handled": initial_stats["missing_values"] - final_stats["missing_values"],
            "duplicates_removed": initial_stats["duplicates"] - final_stats["duplicates"]
        }
        
        # Save cleaned dataset
        cleaned_filename = f"cleaned_{dataset_name}"
        cleaned_path = os.path.join(app.config['UPLOAD_FOLDER'], cleaned_filename)
        
        if file_ext == '.csv':
            df.to_csv(cleaned_path, index=False)
        elif file_ext in ('.xlsx', '.xls'):
            df.to_excel(cleaned_path, index=False)
        elif file_ext == '.json':
            df.to_json(cleaned_path, orient='records')
        else:
            df.to_csv(cleaned_path, sep='\t', index=False)
        
        return jsonify({
            "success": True,
            "filename": cleaned_filename,
            "initial_stats": initial_stats,
            "final_stats": final_stats,
            "changes": changes,
            "preview": df.head(10).to_dict(orient='records')
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/data/datasets', methods=['GET'])
def list_datasets():
    try:
        files = []
        for filename in os.listdir(app.config['UPLOAD_FOLDER']):
            if allowed_file(filename):
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file_stats = os.stat(file_path)
                
                # Read basic file info without loading entire dataset
                df = pd.read_csv(file_path, nrows=1) if filename.endswith('.csv') else \
                     pd.read_excel(file_path, nrows=1) if filename.endswith(('.xlsx', '.xls')) else \
                     pd.read_json(file_path, lines=True, nrows=1) if filename.endswith('.json') else \
                     pd.read_csv(file_path, sep='\t', nrows=1)
                
                files.append({
                    "name": filename,
                    "size": file_stats.st_size,
                    "modified": pd.Timestamp(file_stats.st_mtime, unit='s').isoformat(),
                    "columns": len(df.columns),
                    "file_type": filename.split('.')[-1]
                })
        
        return jsonify({
            "success": True,
            "datasets": files
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/data/datasets/<dataset_name>/preview', methods=['GET'])
def preview_dataset(dataset_name):
    try:
        rows = int(request.args.get('rows', 10))
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], dataset_name)
        
        if not os.path.exists(file_path):
            return jsonify({"error": "Dataset not found"}), 404
        
        # Read the file
        file_ext = os.path.splitext(dataset_name)[1].lower()
        df = pd.read_csv(file_path, nrows=rows) if file_ext == '.csv' else \
             pd.read_excel(file_path, nrows=rows) if file_ext in ('.xlsx', '.xls') else \
             pd.read_json(file_path, lines=True, nrows=rows) if file_ext == '.json' else \
             pd.read_csv(file_path, sep='\t', nrows=rows)
        
        return jsonify({
            "success": True,
            "preview": df.to_dict(orient='records'),
            "columns": df.columns.tolist(),
            "total_rows": len(pd.read_csv(file_path)) if file_ext == '.csv' else \
                         len(pd.read_excel(file_path)) if file_ext in ('.xlsx', '.xls') else \
                         len(pd.read_json(file_path, lines=True)) if file_ext == '.json' else \
                         len(pd.read_csv(file_path, sep='\t'))
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/data/datasets/<dataset_name>/download', methods=['GET'])
def download_dataset(dataset_name):
    try:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], dataset_name)
        
        if not os.path.exists(file_path):
            return jsonify({"error": "Dataset not found"}), 404
        
        return send_file(
            file_path,
            as_attachment=True,
            download_name=dataset_name
        )
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/data/datasets/<dataset_name>', methods=['DELETE'])
def delete_dataset(dataset_name):
    try:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], dataset_name)
        
        if not os.path.exists(file_path):
            return jsonify({"error": "Dataset not found"}), 404
        
        os.remove(file_path)
        
        return jsonify({
            "success": True,
            "message": f"Dataset {dataset_name} deleted successfully"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
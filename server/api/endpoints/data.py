from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from agents.ingestion_agent import IngestionAgent
from agents.cleaning_agent import CleaningAgent
from agents.validation_agent import ValidationAgent
from agents.storage_agent import StorageAgent
from utils.config import load_config
import os

bp = Blueprint('data', __name__)
config = load_config()

ingestion_agent = IngestionAgent()
cleaning_agent = CleaningAgent()
validation_agent = ValidationAgent()
storage_agent = StorageAgent()

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in config['storage']['allowed_extensions']

@bp.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"error": "File type not allowed"}), 400
    
    try:
        # Secure the filename
        filename = secure_filename(file.filename)
        dataset_name = request.form.get('dataset_name', filename)
        
        # Save file temporarily
        temp_path = os.path.join(config['storage']['upload_folder'], filename)
        file.save(temp_path)
        
        # Process the file through our pipeline
        validation_result = validation_agent.validate_file(temp_path)
        if not validation_result['valid']:
            os.remove(temp_path)
            return jsonify({"error": "File validation failed", "details": validation_result['errors']}), 400
        
        # Ingest the data
        df = ingestion_agent.ingest_file(temp_path)
        
        # Get initial info
        info = {
            "name": dataset_name,
            "original_filename": filename,
            "rows": len(df),
            "columns": len(df.columns),
            "column_names": df.columns.tolist(),
            "file_size": os.path.getsize(temp_path),
            "validation": validation_result
        }
        
        # Store the data
        storage_result = storage_agent.store_dataset(df, dataset_name)
        
        return jsonify({
            "success": True,
            "message": "File uploaded and processed successfully",
            "dataset_info": info,
            "storage_info": storage_result
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/clean', methods=['POST'])
def clean_data():
    try:
        data = request.get_json()
        dataset_name = data.get('dataset_name')
        options = data.get('options', {})
        
        if not dataset_name:
            return jsonify({"error": "Dataset name is required"}), 400
        
        # Retrieve dataset
        df = storage_agent.get_dataset(dataset_name)
        if df is None:
            return jsonify({"error": "Dataset not found"}), 404
        
        # Get initial statistics
        initial_stats = cleaning_agent.get_statistics(df)
        
        # Clean the data
        cleaned_df, cleaning_report = cleaning_agent.clean_dataset(df, options)
        
        # Get final statistics
        final_stats = cleaning_agent.get_statistics(cleaned_df)
        
        # Store cleaned dataset
        cleaned_name = f"cleaned_{dataset_name}"
        storage_result = storage_agent.store_dataset(cleaned_df, cleaned_name)
        
        return jsonify({
            "success": True,
            "cleaned_dataset_name": cleaned_name,
            "initial_stats": initial_stats,
            "final_stats": final_stats,
            "cleaning_report": cleaning_report,
            "storage_info": storage_result,
            "preview": cleaned_df.head(10).to_dict(orient='records')
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/datasets', methods=['GET'])
def list_datasets():
    try:
        datasets = storage_agent.list_datasets()
        return jsonify({
            "success": True,
            "datasets": datasets
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/datasets/<dataset_name>/preview', methods=['GET'])
def preview_dataset(dataset_name):
    try:
        rows = int(request.args.get('rows', 10))
        df = storage_agent.get_dataset(dataset_name, nrows=rows)
        
        if df is None:
            return jsonify({"error": "Dataset not found"}), 404
        
        return jsonify({
            "success": True,
            "preview": df.to_dict(orient='records'),
            "columns": df.columns.tolist(),
            "total_rows": len(df)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/datasets/<dataset_name>/download', methods=['GET'])
def download_dataset(dataset_name):
    try:
        format = request.args.get('format', 'csv')
        file_path = storage_agent.export_dataset(dataset_name, format)
        
        if not file_path:
            return jsonify({"error": "Dataset not found"}), 404
        
        return send_file(
            file_path,
            as_attachment=True,
            download_name=f"{dataset_name}.{format}"
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/datasets/<dataset_name>', methods=['DELETE'])
def delete_dataset(dataset_name):
    try:
        success = storage_agent.delete_dataset(dataset_name)
        
        if not success:
            return jsonify({"error": "Dataset not found"}), 404
        
        return jsonify({
            "success": True,
            "message": f"Dataset {dataset_name} deleted successfully"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
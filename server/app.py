from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer
import os
from pathlib import Path
from werkzeug.utils import secure_filename
from utils.logging import get_logger
from datetime import datetime
import json

logger = get_logger(__name__)

class NumpyJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.int_, np.intc, np.intp, np.int8, np.int16, np.int32, np.int64,
                          np.uint8, np.uint16, np.uint32, np.uint64)):
            return int(obj)
        elif isinstance(obj, (np.float_, np.float16, np.float32, np.float64)):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)

app = Flask(__name__)
app.json_encoder = NumpyJSONEncoder
CORS(app, origins=["http://localhost:5175"], supports_credentials=True)

# Configure upload folder using absolute path
UPLOAD_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'uploads'))
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls', 'json', 'txt'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/datasets', methods=['POST'])
def upload_file():
    """Upload a new dataset."""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'File type not allowed. Supported formats: CSV, Excel, JSON, TXT'}), 400
            
        original_name = secure_filename(file.filename)
        name, ext = os.path.splitext(original_name)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{name}_{timestamp}{ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Ensure upload directory exists
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        
        try:
            file.save(filepath)
            logger.info(f"File saved successfully: {filepath}")
        except Exception as e:
            logger.error(f"Error saving file: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to save file'}), 500
        
        # Read and validate the file
        try:
            file_type = filename.rsplit('.', 1)[1].lower()
            df = read_file_with_encoding(filepath, file_type)
                
            return jsonify({
                'success': True,
                'message': 'File uploaded successfully',
                'filename': filename,
                'original_filename': original_name,
                'rows': len(df),
                'columns': list(df.columns)
            })
            
        except Exception as e:
            # Clean up invalid file
            os.remove(filepath)
            logger.error(f"Error processing file: {str(e)}")
            return jsonify({'success': False, 'error': f'Error processing file: {str(e)}'}), 400
        
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/datasets', methods=['GET'])
def list_datasets():
    """List all available datasets."""
    try:
        files = []
        for filename in os.listdir(app.config['UPLOAD_FOLDER']):
            if allowed_file(filename):
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                files.append({
                    'name': filename,
                    'size': os.path.getsize(filepath),
                    'modified': os.path.getmtime(filepath)
                })
        return jsonify({'success': True, 'datasets': files})
    except Exception as e:
        logger.error(f"Error listing datasets: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/datasets/<name>/preview', methods=['GET'])
def preview_dataset(name):
    """Preview the contents of a dataset."""
    try:
        logger.info(f"Received preview request for dataset: {name}")
        
        if not allowed_file(name):
            logger.warning(f"Invalid file type for dataset: {name}")
            return jsonify({
                'success': False, 
                'error': 'Invalid file type. Supported types: CSV, Excel, JSON, TXT'
            }), 400
            
        # Find the actual file with timestamp
        filename = find_timestamped_file(name)
        if not filename:
            logger.warning(f"Dataset not found: {name}")
            return jsonify({
                'success': False, 
                'error': 'Dataset not found'
            }), 404
            
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if not os.path.exists(filepath):
            logger.error(f"File exists in directory listing but not on disk: {filepath}")
            return jsonify({
                'success': False, 
                'error': 'Dataset file is missing'
            }), 404
            
        try:
            file_type = name.rsplit('.', 1)[1].lower()
            df = read_file_with_encoding(filepath, file_type)
            
            if df is None or df.empty:
                logger.warning(f"Empty dataset: {filename}")
                return jsonify({
                    'success': False,
                    'error': 'Dataset is empty'
                }), 400
            
            preview_rows = min(10, len(df))
            preview_data = df.head(preview_rows).to_dict('records')
            
            # Convert any numpy types to Python native types for JSON serialization
            for row in preview_data:
                for key, value in row.items():
                    if isinstance(value, (np.integer, np.floating)):
                        row[key] = value.item()
                    elif isinstance(value, (np.ndarray, list)):
                        row[key] = str(value)
                    elif pd.isna(value):
                        row[key] = None
            
            return jsonify({
                'success': True,
                'preview': preview_data,
                'columns': list(df.columns),
                'total_rows': len(df),
                'filename': filename
            })
            
        except Exception as e:
            logger.error(f"Error reading file {filename}: {str(e)}")
            return jsonify({
                'success': False, 
                'error': f'Error reading file: {str(e)}'
            }), 400
            
    except Exception as e:
        logger.error(f"Error previewing dataset: {str(e)}")
        return jsonify({
            'success': False, 
            'error': 'Internal server error occurred while previewing dataset'
        }), 500

@app.route('/datasets/<name>/download', methods=['GET'])
def download_dataset(name):
    """Download a dataset."""
    try:
        if not allowed_file(name):
            return jsonify({'success': False, 'error': 'Invalid file type'}), 400
            
        filename = find_timestamped_file(name)
        if not filename:
            return jsonify({'success': False, 'error': 'Dataset not found'}), 404
            
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        return send_file(filepath, as_attachment=True, download_name=name)
        
    except Exception as e:
        logger.error(f"Error downloading dataset: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/datasets/<name>', methods=['DELETE'])
def delete_dataset(name):
    """Delete a dataset."""
    try:
        if not allowed_file(name):
            return jsonify({'success': False, 'error': 'Invalid file type'}), 400
            
        filename = find_timestamped_file(name)
        if not filename:
            return jsonify({'success': False, 'error': 'Dataset not found'}), 404
            
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        os.remove(filepath)
        return jsonify({'success': True, 'message': 'Dataset deleted successfully'})
        
    except Exception as e:
        logger.error(f"Error deleting dataset: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

def convert_to_native_types(obj):
    """Convert numpy types to native Python types for JSON serialization."""
    if isinstance(obj, dict):
        return {key: convert_to_native_types(value) for key, value in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [convert_to_native_types(item) for item in obj]
    elif isinstance(obj, (np.int_, np.intc, np.intp, np.int8, np.int16, np.int32, np.int64)):
        return int(obj)
    elif isinstance(obj, (np.float_, np.float16, np.float32, np.float64)):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    return obj

@app.route('/clean', methods=['POST'])
def clean_data():
    """Clean a dataset with specified operations."""
    try:
        data = request.get_json()
        logger.info(f"Received cleaning request: {data}")
        
        if not data or 'filename' not in data:
            return jsonify({'success': False, 'error': 'No filename provided'}), 400
            
        filename = find_timestamped_file(data['filename'])
        if not filename:
            return jsonify({'success': False, 'error': 'Dataset not found'}), 404
            
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Read the dataset
        try:
            file_type = filename.rsplit('.', 1)[1].lower()
            df = read_file_with_encoding(filepath, file_type)
        except Exception as e:
            logger.error(f"Error reading file {filename}: {str(e)}")
            return jsonify({'success': False, 'error': f'Error reading file: {str(e)}'}), 400
            
        # Extract operations from the request
        ops = data.get('operations', {})
        logger.info(f"Operations received: {ops}")
        
        # Initialize statistics
        initial_rows = int(len(df))
        initial_stats = {
            'rows': initial_rows,
            'missing_values': int(df.isna().sum().sum()),
            'duplicates': int(len(df) - len(df.drop_duplicates()))
        }
        
        changes = {
            'missing_values_handled': 0,
            'duplicates_removed': 0,
            'rows_removed': 0
        }
        
        # Track applied operations for reporting
        applied_operations = []
        
        # Text normalization
        if isinstance(ops, dict) and (ops.get('normalizeText') or ops.get('normalize_text')):
            logger.info("Applying text normalization")
            # Get selected text columns or use all text columns
            text_columns = ops.get('selectedColumns', {}).get('textColumns', [])
            if not text_columns:
                text_columns = df.select_dtypes(include=['object']).columns
            
            for col in text_columns:
                if col in df.columns:
                    df[col] = df[col].str.lower().str.strip()
            applied_operations.append('text_normalization')
        
        # Missing values
        if isinstance(ops, dict):
            missing_values_strategy = ops.get('handleMissingValues') or ops.get('handle_missing_values')
            if missing_values_strategy and missing_values_strategy != 'none':
                logger.info(f"Handling missing values with strategy: {missing_values_strategy}")
                
                # Count missing values before handling
                missing_before = int(df.isna().sum().sum())
                
                # Get selected numeric columns or use all numeric columns
                numeric_columns = ops.get('selectedColumns', {}).get('numericColumns', [])
                if not numeric_columns:
                    numeric_columns = df.select_dtypes(include=np.number).columns
                
                if missing_values_strategy == 'impute':
                    imputer = SimpleImputer(strategy='mean')
                    df[numeric_columns] = imputer.fit_transform(df[numeric_columns])
                elif missing_values_strategy == 'custom':
                    custom_value = ops.get('customMissingValue', '')
                    try:
                        # Try to convert custom value to float for numeric columns
                        custom_value = float(custom_value)
                        df[numeric_columns] = df[numeric_columns].fillna(custom_value)
                    except (ValueError, TypeError):
                        # If conversion fails, treat it as a string value
                        logger.warning(f"Could not convert custom value '{custom_value}' to float, using as string")
                        df = df.fillna(custom_value)
                elif missing_values_strategy == 'remove':
                    df = df.dropna(subset=numeric_columns)
                
                # Count handled missing values
                missing_after = int(df.isna().sum().sum())
                changes['missing_values_handled'] = missing_before - missing_after
                applied_operations.append('missing_values')
        
        # Outliers
        if isinstance(ops, dict) and (ops.get('detectOutliers') or ops.get('detect_outliers')):
            logger.info("Detecting and handling outliers")
            
            # Get selected outlier columns or use all numeric columns
            outlier_columns = ops.get('selectedColumns', {}).get('outlierColumns', [])
            if not outlier_columns:
                outlier_columns = df.select_dtypes(include=np.number).columns
            
            for col in outlier_columns:
                if col in df.columns:
                    Q1 = float(df[col].quantile(0.25))
                    Q3 = float(df[col].quantile(0.75))
                    IQR = Q3 - Q1
                    lower_bound = Q1 - 1.5 * IQR
                    upper_bound = Q3 + 1.5 * IQR
                    df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)
            applied_operations.append('outliers')
        
        # Duplicates
        if isinstance(ops, dict) and (ops.get('removeDuplicates') or ops.get('remove_duplicates')):
            logger.info("Removing duplicates")
            
            # Count duplicates before removal
            duplicates_before = int(len(df))
            
            # Get selected duplicate check columns or use all columns
            duplicate_columns = ops.get('selectedColumns', {}).get('duplicateCheckColumns', [])
            if duplicate_columns:
                df = df.drop_duplicates(subset=duplicate_columns)
            else:
                df = df.drop_duplicates()
            
            # Count removed duplicates
            duplicates_removed = duplicates_before - int(len(df))
            changes['duplicates_removed'] = duplicates_removed
            applied_operations.append('duplicates')
        
        # Calculate final statistics
        final_rows = int(len(df))
        changes['rows_removed'] = initial_rows - final_rows
        
        final_stats = {
            'rows': final_rows,
            'missing_values': int(df.isna().sum().sum()),
            'duplicates': int(len(df) - len(df.drop_duplicates()))
        }
        
        # Save cleaned dataset
        cleaned_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'cleaned')
        if not os.path.exists(cleaned_dir):
            os.makedirs(cleaned_dir)
            
        base_name = os.path.splitext(filename)[0]
        extension = os.path.splitext(filename)[1]
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        cleaned_filename = f"{base_name}_cleaned_{timestamp}{extension}"
        cleaned_filepath = os.path.join(app.config['UPLOAD_FOLDER'], cleaned_filename)
        
        if extension.lower() == '.csv':
            df.to_csv(cleaned_filepath, index=False)
        elif extension.lower() in ('.xls', '.xlsx'):
            df.to_excel(cleaned_filepath, index=False)
        elif extension.lower() == '.json':
            df.to_json(cleaned_filepath)
        else:  # .txt
            df.to_csv(cleaned_filepath, sep='\t', index=False)
            
        response_data = {
            'success': True,
            'message': 'Dataset cleaned successfully',
            'cleaned_dataset_name': cleaned_filename,
            'report': {
                'initial_stats': initial_stats,
                'final_stats': final_stats,
                'changes': changes,
                'operations_applied': applied_operations
            }
        }
        
        # Convert numpy types to native Python types
        response_data = convert_to_native_types(response_data)
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error cleaning dataset: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

def find_timestamped_file(base_filename):
    """Find the most recent timestamped version of a file."""
    logger.info(f"Looking for file: {base_filename}")
    base_name, ext = os.path.splitext(secure_filename(base_filename))
    logger.info(f"Base name: {base_name}, Extension: {ext}")
    
    # Get all files in the upload directory
    all_files = os.listdir(app.config['UPLOAD_FOLDER'])
    logger.info(f"All files in upload directory: {all_files}")
    
    # Check if the exact file exists
    exact_match = secure_filename(base_filename)
    logger.info(f"Secure filename: {exact_match}")
    
    if exact_match in all_files:
        logger.info(f"Found exact match for {base_filename}: {exact_match}")
        return exact_match
    
    # Look for timestamped versions
    matching_files = [f for f in all_files 
                     if f.startswith(base_name + '_') and f.endswith(ext)]
    logger.info(f"Timestamped matches: {matching_files}")
    
    # Also look for files that match the base name without timestamp
    base_matches = [f for f in all_files 
                   if f.startswith(base_name) and f.endswith(ext) and '_' not in f]
    logger.info(f"Base matches: {base_matches}")
    
    # Combine both lists
    all_matches = matching_files + base_matches
    logger.info(f"All matches: {all_matches}")
    
    if not all_matches:
        logger.warning(f"No matching files found for {base_filename}")
        return None
    
    # Get the most recent file if multiple matches exist
    # For simplicity, we'll use alphabetical sorting which works for timestamps in YYYYMMDD format
    latest_file = sorted(all_matches)[-1]
    logger.info(f"Found match for {base_filename}: {latest_file}")
    return latest_file

def read_file_with_encoding(filepath, file_type='csv'):
    """Read file with different encodings if UTF-8 fails."""
    logger.info(f"Reading file: {filepath} of type: {file_type}")
    
    # Try these encodings in order - adding UTF-16 encodings
    encodings = ['utf-8', 'utf-16', 'utf-16le', 'utf-16be', 'latin1', 'iso-8859-1', 'cp1252']
    
    # For CSV files, try with and without BOM detection
    if file_type == 'csv':
        try:
            # First try with utf-8-sig to handle BOM characters
            logger.info(f"Trying to read CSV with utf-8-sig encoding to handle BOM")
            df = pd.read_csv(filepath, encoding='utf-8-sig')
            if not df.empty and len(df.columns) > 0:
                logger.info(f"Successfully read file with utf-8-sig encoding")
                return df
        except Exception as e:
            logger.debug(f"Failed to read with utf-8-sig encoding: {str(e)}")
    
    last_error = None
    for encoding in encodings:
        try:
            if file_type == 'csv':
                # Try with different CSV parser settings
                for sep in [',', ';', '\t', '|']:
                    try:
                        logger.info(f"Trying to read CSV with encoding: {encoding}, separator: {sep}")
                        df = pd.read_csv(filepath, encoding=encoding, sep=sep)
                        # Validate that we have meaningful data
                        if len(df.columns) > 1 or (len(df.columns) == 1 and len(df) > 0):
                            # Check if the columns look reasonable (not starting with BOM characters)
                            if not any(col.startswith('ÿþ') or col.startswith('þÿ') for col in df.columns):
                                logger.info(f"Successfully read CSV with encoding: {encoding}, separator: {sep}")
                                return df
                            else:
                                logger.warning(f"Found BOM characters in column names with {encoding}, trying next encoding")
                    except Exception as e:
                        logger.debug(f"Failed with encoding {encoding}, separator {sep}: {str(e)}")
                        continue
            elif file_type in ['xls', 'xlsx']:
                df = pd.read_excel(filepath)
                logger.info(f"Successfully read Excel file")
                return df
            elif file_type == 'json':
                df = pd.read_json(filepath, encoding=encoding)
                logger.info(f"Successfully read JSON with encoding: {encoding}")
                return df
            elif file_type == 'txt':
                # Try different delimiters for txt files
                for delimiter in ['\t', ',', ';', '|']:
                    try:
                        df = pd.read_csv(filepath, encoding=encoding, sep=delimiter)
                        if len(df.columns) > 1:  # Found a valid delimiter
                            logger.info(f"Successfully read TXT with encoding: {encoding}, delimiter: {delimiter}")
                            return df
                    except Exception as e:
                        logger.debug(f"Failed with encoding {encoding}, delimiter {delimiter}: {str(e)}")
                        continue
            else:
                raise ValueError(f"Unsupported file type: {file_type}")
        except Exception as e:
            last_error = str(e)
            logger.debug(f"Failed to read with encoding {encoding}: {str(e)}")
            continue
    
    # If we get here, all encodings failed
    error_msg = f"Failed to read file with any encoding. Last error: {last_error}"
    logger.error(error_msg)
    raise ValueError(error_msg)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000)
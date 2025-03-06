import pandas as pd
from .base_agent import BaseAgent
from utils.config import load_config

class ValidationAgent(BaseAgent):
    def __init__(self):
        self.config = load_config()['agents']['validation']
    
    def initialize(self):
        pass
    
    def process(self, data):
        pass
    
    def cleanup(self):
        pass
    
    def validate_file(self, file_path):
        """Validate a data file."""
        try:
            # Basic file validation
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path, nrows=5)
            elif file_path.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(file_path, nrows=5)
            elif file_path.endswith('.json'):
                df = pd.read_json(file_path)
            else:
                df = pd.read_csv(file_path, sep='\t', nrows=5)
            
            validation_result = {
                "valid": True,
                "errors": [],
                "warnings": []
            }
            
            # Check for empty dataframe
            if len(df) == 0:
                validation_result["valid"] = False
                validation_result["errors"].append("File contains no data")
            
            # Check for empty columns
            empty_cols = df.columns[df.isna().all()].tolist()
            if empty_cols:
                validation_result["warnings"].append(f"Found empty columns: {empty_cols}")
            
            return validation_result
            
        except Exception as e:
            return {
                "valid": False,
                "errors": [str(e)],
                "warnings": []
            }
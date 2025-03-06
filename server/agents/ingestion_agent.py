import pandas as pd
from .base_agent import BaseAgent
from utils.config import load_config

class IngestionAgent(BaseAgent):
    def __init__(self):
        self.config = load_config()['agents']['ingestion']
    
    def initialize(self):
        pass
    
    def process(self, data):
        pass
    
    def cleanup(self):
        pass
    
    def ingest_file(self, file_path):
        """Ingest data from a file."""
        try:
            if file_path.endswith('.csv'):
                return pd.read_csv(file_path)
            elif file_path.endswith(('.xlsx', '.xls')):
                return pd.read_excel(file_path)
            elif file_path.endswith('.json'):
                return pd.read_json(file_path)
            else:
                return pd.read_csv(file_path, sep='\t')
        except Exception as e:
            raise Exception(f"Error ingesting file: {str(e)}")
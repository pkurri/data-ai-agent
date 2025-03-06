import os
import pandas as pd
from .base_agent import BaseAgent
from utils.config import load_config

class StorageAgent(BaseAgent):
    def __init__(self):
        self.config = load_config()['agents']['storage']
        self.storage_dir = 'storage/datasets'
        os.makedirs(self.storage_dir, exist_ok=True)
    
    def initialize(self):
        pass
    
    def process(self, data):
        pass
    
    def cleanup(self):
        pass
    
    def store_dataset(self, df, dataset_name):
        """Store a dataset."""
        try:
            file_path = os.path.join(self.storage_dir, f"{dataset_name}.parquet")
            df.to_parquet(file_path, compression='gzip' if self.config['compression'] else None)
            
            return {
                "success": True,
                "file_path": file_path,
                "size": os.path.getsize(file_path)
            }
        except Exception as e:
            raise Exception(f"Error storing dataset: {str(e)}")
    
    def get_dataset(self, dataset_name, nrows=None):
        """Retrieve a dataset."""
        try:
            file_path = os.path.join(self.storage_dir, f"{dataset_name}.parquet")
            if not os.path.exists(file_path):
                return None
            
            if nrows:
                return pd.read_parquet(file_path).head(nrows)
            return pd.read_parquet(file_path)
        except Exception as e:
            raise Exception(f"Error retrieving dataset: {str(e)}")
    
    def list_datasets(self):
        """List all available datasets."""
        try:
            datasets = []
            for file in os.listdir(self.storage_dir):
                if file.endswith('.parquet'):
                    name = file[:-8]  # Remove .parquet extension
                    file_path = os.path.join(self.storage_dir, file)
                    df = pd.read_parquet(file_path)
                    
                    datasets.append({
                        "name": name,
                        "rows": len(df),
                        "columns": len(df.columns),
                        "size": os.path.getsize(file_path),
                        "modified": os.path.getmtime(file_path)
                    })
            return datasets
        except Exception as e:
            raise Exception(f"Error listing datasets: {str(e)}")
    
    def delete_dataset(self, dataset_name):
        """Delete a dataset."""
        try:
            file_path = os.path.join(self.storage_dir, f"{dataset_name}.parquet")
            if not os.path.exists(file_path):
                return False
            
            os.remove(file_path)
            return True
        except Exception as e:
            raise Exception(f"Error deleting dataset: {str(e)}")
    
    def export_dataset(self, dataset_name, format='csv'):
        """Export a dataset in the specified format."""
        try:
            df = self.get_dataset(dataset_name)
            if df is None:
                return None
            
            export_path = os.path.join(self.storage_dir, f"{dataset_name}_export.{format}")
            
            if format == 'csv':
                df.to_csv(export_path, index=False)
            elif format in ('xlsx', 'xls'):
                df.to_excel(export_path, index=False)
            elif format == 'json':
                df.to_json(export_path, orient='records')
            else:
                df.to_csv(export_path, sep='\t', index=False)
            
            return export_path
        except Exception as e:
            raise Exception(f"Error exporting dataset: {str(e)}")
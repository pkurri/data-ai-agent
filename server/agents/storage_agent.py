import os
import pandas as pd
import json
from datetime import datetime
from .base_agent import BaseAgent
from utils.config import load_config
from adapters.db_adapter import DatabaseAdapter

class StorageAgent(BaseAgent):
    def __init__(self):
        self.config = load_config()['agents']['storage']
        self.storage_dir = 'storage/datasets'
        os.makedirs(self.storage_dir, exist_ok=True)
        
        # Initialize database adapter
        self.db_adapter = DatabaseAdapter(self.config)
        self._setup_connections()
    
    def _setup_connections(self):
        """Set up database connections based on configuration."""
        # Set up DB2 connection if configured
        if 'db2' in self.config:
            self.db_adapter.connect_db2('default', self.config['db2'])
            
        # Set up Redis connection if configured
        if 'redis' in self.config:
            self.db_adapter.connect_redis('default', self.config['redis'])
    
    def initialize(self):
        pass
    
    def process(self, data):
        pass
    
    def cleanup(self):
        self.db_adapter.close_connections()
    
    def store_dataset(self, df, dataset_name, storage_type='file'):
        """
        Store a dataset using the specified storage type.
        
        Args:
            df: pandas DataFrame to store
            dataset_name: name of the dataset
            storage_type: 'file', 'db2', or 'both'
        """
        result = {"success": True, "storage_info": {}}
        
        try:
            # Store in file system
            if storage_type in ('file', 'both'):
                file_path = os.path.join(self.storage_dir, f"{dataset_name}.parquet")
                df.to_parquet(file_path, compression='gzip' if self.config['compression'] else None)
                result["storage_info"]["file"] = {
                    "path": file_path,
                    "size": os.path.getsize(file_path)
                }
            
            # Store in DB2
            if storage_type in ('db2', 'both'):
                success = self.db_adapter.store_dataframe('default', dataset_name, df)
                result["storage_info"]["db2"] = {
                    "success": success,
                    "table": dataset_name
                }
                
            # Cache metadata in Redis
            metadata = {
                "name": dataset_name,
                "rows": len(df),
                "columns": list(df.columns),
                "storage_type": storage_type,
                "last_modified": datetime.now().isoformat()
            }
            self.db_adapter.cache_data('default', f"dataset:{dataset_name}:metadata", 
                                     json.dumps(metadata))
            
            return result
        except Exception as e:
            raise Exception(f"Error storing dataset: {str(e)}")
    
    def get_dataset(self, dataset_name, nrows=None, source='auto'):
        """
        Retrieve a dataset from the specified source.
        
        Args:
            dataset_name: name of the dataset
            nrows: number of rows to retrieve (None for all)
            source: 'file', 'db2', or 'auto' (tries DB2 first, then file)
        """
        try:
            df = None
            
            # Try to get from DB2 first if source is auto or db2
            if source in ('auto', 'db2'):
                query = f"SELECT * FROM {dataset_name}"
                if nrows:
                    query += f" FETCH FIRST {nrows} ROWS ONLY"
                df = self.db_adapter.query_db2('default', query)
            
            # Try file if DB2 failed or if source is file
            if df is None and source in ('auto', 'file'):
                file_path = os.path.join(self.storage_dir, f"{dataset_name}.parquet")
                if os.path.exists(file_path):
                    df = pd.read_parquet(file_path)
                    if nrows:
                        df = df.head(nrows)
            
            return df
        except Exception as e:
            raise Exception(f"Error retrieving dataset: {str(e)}")
    
    def list_datasets(self):
        """List all available datasets with their metadata."""
        try:
            datasets = []
            
            # Get datasets from file system
            for file in os.listdir(self.storage_dir):
                if file.endswith('.parquet'):
                    name = file[:-8]  # Remove .parquet extension
                    
                    # Try to get metadata from Redis
                    metadata = self.db_adapter.get_cached_data('default', f"dataset:{name}:metadata")
                    if metadata:
                        datasets.append(json.loads(metadata))
                    else:
                        # Create metadata if not in cache
                        file_path = os.path.join(self.storage_dir, file)
                        df = pd.read_parquet(file_path)
                        metadata = {
                            "name": name,
                            "rows": len(df),
                            "columns": list(df.columns),
                            "storage_type": "file",
                            "last_modified": datetime.fromtimestamp(os.path.getmtime(file_path)).isoformat(),
                            "size": os.path.getsize(file_path)
                        }
                        datasets.append(metadata)
                        
                        # Cache the metadata
                        self.db_adapter.cache_data('default', f"dataset:{name}:metadata",
                                                 json.dumps(metadata))
            
            return datasets
        except Exception as e:
            raise Exception(f"Error listing datasets: {str(e)}")
    
    def delete_dataset(self, dataset_name, storage_type='all'):
        """
        Delete a dataset from the specified storage.
        
        Args:
            dataset_name: name of the dataset to delete
            storage_type: 'file', 'db2', or 'all'
        """
        try:
            success = True
            
            # Delete from file system
            if storage_type in ('file', 'all'):
                file_path = os.path.join(self.storage_dir, f"{dataset_name}.parquet")
                if os.path.exists(file_path):
                    os.remove(file_path)
            
            # Delete from DB2
            if storage_type in ('db2', 'all'):
                try:
                    self.db_adapter.query_db2('default', f"DROP TABLE {dataset_name}")
                except:
                    success = False
            
            # Remove metadata from Redis
            if storage_type == 'all':
                self.db_adapter.cache_data('default', f"dataset:{dataset_name}:metadata", '')
            
            return success
        except Exception as e:
            raise Exception(f"Error deleting dataset: {str(e)}")
    
    def export_dataset(self, dataset_name, format='csv', source='auto'):
        """
        Export a dataset in the specified format.
        
        Args:
            dataset_name: name of the dataset to export
            format: export format ('csv', 'xlsx', 'json')
            source: source to export from ('file', 'db2', 'auto')
        """
        try:
            df = self.get_dataset(dataset_name, source=source)
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
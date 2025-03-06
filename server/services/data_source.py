from typing import List, Dict, Union, Optional
import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from pathlib import Path
import os

class DataSource:
    def __init__(self):
        self.db_connections: Dict[str, Engine] = {}
        
    def register_database(self, name: str, connection_string: str) -> None:
        """Register a database connection."""
        self.db_connections[name] = create_engine(connection_string)
    
    def read_data(self, source_type: str, **kwargs) -> pd.DataFrame:
        """
        Read data from various sources into a pandas DataFrame.
        
        Args:
            source_type: Type of source ('file', 'database', 'query')
            **kwargs: Source-specific parameters
                For file: path
                For database: db_name, table_name, schema
                For query: db_name, query
        """
        if source_type == 'file':
            return self._read_file(**kwargs)
        elif source_type == 'database':
            return self._read_table(**kwargs)
        elif source_type == 'query':
            return self._read_query(**kwargs)
        else:
            raise ValueError(f"Unsupported source type: {source_type}")
    
    def _read_file(self, path: str) -> pd.DataFrame:
        """Read data from a file."""
        file_ext = Path(path).suffix.lower()
        if file_ext == '.csv':
            return pd.read_csv(path)
        elif file_ext in ['.xlsx', '.xls']:
            return pd.read_excel(path)
        elif file_ext == '.json':
            return pd.read_json(path)
        else:
            raise ValueError(f"Unsupported file type: {file_ext}")
    
    def _read_table(self, db_name: str, table_name: str, schema: Optional[str] = None) -> pd.DataFrame:
        """Read data from a database table."""
        if db_name not in self.db_connections:
            raise ValueError(f"Database {db_name} not registered")
        
        engine = self.db_connections[db_name]
        if schema:
            table_name = f"{schema}.{table_name}"
        return pd.read_sql_table(table_name, engine)
    
    def _read_query(self, db_name: str, query: str) -> pd.DataFrame:
        """Read data from a custom SQL query."""
        if db_name not in self.db_connections:
            raise ValueError(f"Database {db_name} not registered")
        
        engine = self.db_connections[db_name]
        return pd.read_sql_query(text(query), engine)
    
    def write_data(self, df: pd.DataFrame, target_type: str, **kwargs) -> None:
        """
        Write DataFrame to various targets.
        
        Args:
            df: DataFrame to write
            target_type: Type of target ('file', 'database')
            **kwargs: Target-specific parameters
                For file: path
                For database: db_name, table_name, schema, if_exists
        """
        if target_type == 'file':
            self._write_file(df, **kwargs)
        elif target_type == 'database':
            self._write_table(df, **kwargs)
        else:
            raise ValueError(f"Unsupported target type: {target_type}")
    
    def _write_file(self, df: pd.DataFrame, path: str) -> None:
        """Write DataFrame to a file."""
        file_ext = Path(path).suffix.lower()
        os.makedirs(os.path.dirname(path), exist_ok=True)
        
        if file_ext == '.csv':
            df.to_csv(path, index=False)
        elif file_ext in ['.xlsx', '.xls']:
            df.to_excel(path, index=False)
        elif file_ext == '.json':
            df.to_json(path, orient='records')
        else:
            raise ValueError(f"Unsupported file type: {file_ext}")
    
    def _write_table(self, df: pd.DataFrame, db_name: str, table_name: str, 
                     schema: Optional[str] = None, if_exists: str = 'fail') -> None:
        """Write DataFrame to a database table."""
        if db_name not in self.db_connections:
            raise ValueError(f"Database {db_name} not registered")
        
        engine = self.db_connections[db_name]
        df.to_sql(table_name, engine, schema=schema, if_exists=if_exists, index=False)

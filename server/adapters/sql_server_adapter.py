import pyodbc
import pandas as pd
from utils.logging import get_logger
from config.database_config import SQLServerConfig

logger = get_logger(__name__)

class SQLServerAdapter:
    def __init__(self, config: SQLServerConfig):
        self.config = config
        self.connection_string = (
            f'DRIVER={{ODBC Driver 17 for SQL Server}};'
            f'SERVER={config.server};'
            f'DATABASE={config.database};'
            f'UID={config.username};'
            f'PWD={config.password}'
        )
        
    def connect(self):
        try:
            return pyodbc.connect(self.connection_string)
        except Exception as e:
            logger.error(f"Error connecting to SQL Server: {str(e)}")
            raise
            
    def execute_query(self, query, params=None):
        with self.connect() as conn:
            cursor = conn.cursor()
            try:
                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)
                return cursor
            except Exception as e:
                logger.error(f"Error executing query: {str(e)}")
                raise
                
    def query_to_df(self, query, params=None):
        cursor = self.execute_query(query, params)
        columns = [column[0] for column in cursor.description]
        return pd.DataFrame.from_records(cursor.fetchall(), columns=columns)
        
    def insert_report(self, table_name, report_data):
        query = f"""
        INSERT INTO {table_name} 
        (report_id, dataset_name, report_type, report_data, created_at)
        VALUES (?, ?, ?, ?, GETDATE())
        """
        self.execute_query(query, (
            report_data['report_id'],
            report_data['dataset_name'],
            report_data['report_type'],
            report_data['report_data']
        ))
        
    def get_reports(self, dataset_name=None, report_type=None, limit=10):
        query = """
        SELECT TOP ? *
        FROM analysis_reports
        WHERE 1=1
        """
        params = [limit]
        
        if dataset_name:
            query += " AND dataset_name = ?"
            params.append(dataset_name)
        if report_type:
            query += " AND report_type = ?"
            params.append(report_type)
            
        query += " ORDER BY created_at DESC"
        return self.query_to_df(query, params)

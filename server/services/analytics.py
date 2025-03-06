import pandas as pd
import numpy as np
from storage.database import get_db_session
from agents.storage_agent import StorageAgent

class AnalyticsService:
    def __init__(self):
        self.storage_agent = StorageAgent()
    
    def generate_data_quality_report(self, dataset_name):
        """Generate a data quality report for a dataset."""
        df = self.storage_agent.get_dataset(dataset_name)
        if df is None:
            raise Exception("Dataset not found")
        
        report = {
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "missing_values": {
                "total": df.isna().sum().sum(),
                "by_column": df.isna().sum().to_dict()
            },
            "duplicates": {
                "total": df.duplicated().sum(),
                "percentage": (df.duplicated().sum() / len(df)) * 100
            },
            "column_types": df.dtypes.astype(str).to_dict(),
            "numeric_columns": {
                col: {
                    "mean": df[col].mean(),
                    "std": df[col].std(),
                    "min": df[col].min(),
                    "max": df[col].max(),
                    "quartiles": df[col].quantile([0.25, 0.5, 0.75]).to_dict()
                }
                for col in df.select_dtypes(include=[np.number]).columns
            },
            "categorical_columns": {
                col: {
                    "unique_values": df[col].nunique(),
                    "top_values": df[col].value_counts().head(5).to_dict()
                }
                for col in df.select_dtypes(include=['object']).columns
            }
        }
        
        return report
    
    def calculate_statistics(self, dataset_name):
        """Calculate basic statistics for a dataset."""
        df = self.storage_agent.get_dataset(dataset_name)
        if df is None:
            raise Exception("Dataset not found")
        
        stats = {
            "summary": df.describe().to_dict(),
            "correlation": df.corr().to_dict() if len(df.select_dtypes(include=[np.number]).columns) > 1 else {},
            "missing_values": df.isna().sum().to_dict(),
            "unique_values": df.nunique().to_dict()
        }
        
        return stats
    
    def calculate_correlation_matrix(self, dataset_name, method='pearson'):
        """Calculate correlation matrix for numeric columns."""
        df = self.storage_agent.get_dataset(dataset_name)
        if df is None:
            raise Exception("Dataset not found")
        
        numeric_df = df.select_dtypes(include=[np.number])
        if len(numeric_df.columns) < 2:
            return {}
        
        correlation_matrix = numeric_df.corr(method=method).to_dict()
        return correlation_matrix
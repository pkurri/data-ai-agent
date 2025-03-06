import pandas as pd
import numpy as np
from .base_agent import BaseAgent
from utils.config import load_config

class CleaningAgent(BaseAgent):
    def __init__(self):
        self.config = load_config()['agents']['cleaning']
    
    def initialize(self):
        pass
    
    def process(self, data):
        pass
    
    def cleanup(self):
        pass
    
    def get_statistics(self, df):
        """Get basic statistics about the dataset."""
        return {
            "rows": len(df),
            "columns": len(df.columns),
            "missing_values": df.isna().sum().sum(),
            "duplicates": df.duplicated().sum()
        }
    
    def clean_dataset(self, df, options):
        """Clean the dataset based on provided options."""
        cleaning_report = {"operations": []}
        
        # Make a copy of the dataframe
        cleaned_df = df.copy()
        
        # Remove duplicates
        if options.get('removeDuplicates', True):
            initial_rows = len(cleaned_df)
            cleaned_df = cleaned_df.drop_duplicates()
            rows_removed = initial_rows - len(cleaned_df)
            cleaning_report["operations"].append({
                "operation": "remove_duplicates",
                "rows_affected": rows_removed
            })
        
        # Handle missing values
        missing_strategy = options.get('handleMissingValues', 'impute')
        if missing_strategy == 'impute':
            for column in cleaned_df.columns:
                if cleaned_df[column].dtype in [np.number]:
                    cleaned_df[column].fillna(cleaned_df[column].mean(), inplace=True)
                else:
                    cleaned_df[column].fillna(cleaned_df[column].mode()[0], inplace=True)
            cleaning_report["operations"].append({
                "operation": "impute_missing_values",
                "strategy": "mean/mode"
            })
        elif missing_strategy == 'remove':
            initial_rows = len(cleaned_df)
            cleaned_df = cleaned_df.dropna()
            rows_removed = initial_rows - len(cleaned_df)
            cleaning_report["operations"].append({
                "operation": "remove_missing_values",
                "rows_affected": rows_removed
            })
        
        # Normalize text
        if options.get('normalizeText', True):
            text_columns = cleaned_df.select_dtypes(include=['object']).columns
            for column in text_columns:
                cleaned_df[column] = cleaned_df[column].str.lower().str.strip()
            cleaning_report["operations"].append({
                "operation": "normalize_text",
                "columns_affected": len(text_columns)
            })
        
        # Detect outliers
        if options.get('detectOutliers', True):
            numeric_columns = cleaned_df.select_dtypes(include=[np.number]).columns
            for column in numeric_columns:
                mean = cleaned_df[column].mean()
                std = cleaned_df[column].std()
                cleaned_df[column] = cleaned_df[column].mask(
                    np.abs(cleaned_df[column] - mean) > 3 * std,
                    mean
                )
            cleaning_report["operations"].append({
                "operation": "handle_outliers",
                "columns_affected": len(numeric_columns)
            })
        
        return cleaned_df, cleaning_report
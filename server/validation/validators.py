"""
Data validators for different types of data sources.
"""
from typing import Dict, List, Any, Optional
import pandas as pd
import numpy as np
from datetime import datetime
import re
from sqlalchemy import inspect

class BaseValidator:
    """Base validator class with common validation methods."""
    
    def __init__(self, validation_rules: Dict[str, Dict[str, Any]]):
        self.validation_rules = validation_rules
        self.errors = []
    
    def validate_numeric(self, value: Any, rules: Dict[str, Any], column: str) -> None:
        """Validate numeric values against rules."""
        if pd.isna(value):
            if rules.get('required', False):
                self.errors.append(f"Column '{column}' has missing value")
            return
            
        try:
            num_value = float(value)
            if rules.get('integer_only') and not float(num_value).is_integer():
                self.errors.append(f"Column '{column}' must be integer, got {value}")
            
            if rules.get('min') is not None and num_value < rules['min']:
                self.errors.append(f"Column '{column}' value {value} below minimum {rules['min']}")
                
            if rules.get('max') is not None and num_value > rules['max']:
                self.errors.append(f"Column '{column}' value {value} above maximum {rules['max']}")
                
            if rules.get('decimal_places') is not None:
                str_value = str(num_value)
                if '.' in str_value:
                    decimal_places = len(str_value.split('.')[1])
                    if decimal_places > rules['decimal_places']:
                        self.errors.append(
                            f"Column '{column}' value {value} has more than {rules['decimal_places']} decimal places"
                        )
        except ValueError:
            self.errors.append(f"Column '{column}' value {value} is not numeric")
    
    def validate_string(self, value: Any, rules: Dict[str, Any], column: str) -> None:
        """Validate string values against rules."""
        if pd.isna(value):
            if rules.get('required', False):
                self.errors.append(f"Column '{column}' has missing value")
            return
            
        str_value = str(value).strip()
        
        if rules.get('min_length') and len(str_value) < rules['min_length']:
            self.errors.append(
                f"Column '{column}' value '{value}' shorter than minimum length {rules['min_length']}"
            )
            
        if rules.get('max_length') and len(str_value) > rules['max_length']:
            self.errors.append(
                f"Column '{column}' value '{value}' longer than maximum length {rules['max_length']}"
            )
            
        if rules.get('pattern') and not re.match(rules['pattern'], str_value):
            self.errors.append(f"Column '{column}' value '{value}' does not match pattern {rules['pattern']}")
            
        if rules.get('no_duplicate_spaces') and '  ' in str_value:
            self.errors.append(f"Column '{column}' value '{value}' contains consecutive spaces")
            
        if rules.get('allowed_values'):
            allowed = rules['allowed_values']
            if not rules.get('case_sensitive', True):
                str_value = str_value.lower()
                allowed = [str(v).lower() for v in allowed]
            if str_value not in allowed:
                self.errors.append(
                    f"Column '{column}' value '{value}' not in allowed values: {rules['allowed_values']}"
                )
    
    def validate_date(self, value: Any, rules: Dict[str, Any], column: str) -> None:
        """Validate date values against rules."""
        if pd.isna(value):
            if rules.get('required', False):
                self.errors.append(f"Column '{column}' has missing value")
            return
            
        try:
            if isinstance(value, str):
                date_value = datetime.strptime(value, rules.get('format', '%Y-%m-%d'))
            elif isinstance(value, (datetime, pd.Timestamp)):
                date_value = value
            else:
                raise ValueError(f"Invalid date format for value: {value}")
            
            if rules.get('min_date'):
                min_date = datetime.strptime(rules['min_date'], rules.get('format', '%Y-%m-%d'))
                if date_value < min_date:
                    self.errors.append(f"Column '{column}' date {value} before minimum date {rules['min_date']}")
                    
            if rules.get('max_date'):
                max_date = datetime.strptime(rules['max_date'], rules.get('format', '%Y-%m-%d'))
                if date_value > max_date:
                    self.errors.append(f"Column '{column}' date {value} after maximum date {rules['max_date']}")
                    
        except ValueError as e:
            self.errors.append(f"Column '{column}' value {value} is not a valid date: {str(e)}")

class DataFrameValidator(BaseValidator):
    """Validator for pandas DataFrames."""
    
    def validate(self, df: pd.DataFrame) -> List[str]:
        """Validate a pandas DataFrame against the rules."""
        self.errors = []
        
        # Validate DataFrame structure
        if len(df.columns) == 0:
            self.errors.append("DataFrame has no columns")
            return self.errors
            
        # Check required columns
        required_columns = [col for col, rules in self.validation_rules.items() 
                          if rules.get('required', False)]
        missing_columns = set(required_columns) - set(df.columns)
        if missing_columns:
            self.errors.append(f"Missing required columns: {missing_columns}")
            
        # Validate each column
        for column, rules in self.validation_rules.items():
            if column not in df.columns:
                continue
                
            # Check unique constraint
            if rules.get('unique', False):
                duplicates = df[column].duplicated()
                if duplicates.any():
                    self.errors.append(
                        f"Column '{column}' has duplicate values: {df[column][duplicates].tolist()}"
                    )
            
            # Validate each value
            for idx, value in df[column].items():
                if rules['type'] == 'numeric':
                    self.validate_numeric(value, rules, column)
                elif rules['type'] == 'string':
                    self.validate_string(value, rules, column)
                elif rules['type'] == 'date':
                    self.validate_date(value, rules, column)
                    
        return self.errors

class DatabaseValidator(BaseValidator):
    """Validator for database tables."""
    
    def __init__(self, validation_rules: Dict[str, Dict[str, Any]], engine):
        super().__init__(validation_rules)
        self.engine = engine
        
    def validate_table_schema(self, table_name: str, schema: Optional[str] = None) -> List[str]:
        """Validate database table schema against rules."""
        self.errors = []
        inspector = inspect(self.engine)
        
        # Get table columns
        try:
            columns = inspector.get_columns(table_name, schema=schema)
        except Exception as e:
            self.errors.append(f"Error accessing table {table_name}: {str(e)}")
            return self.errors
            
        # Check required columns
        db_columns = {col['name'] for col in columns}
        required_columns = {col for col, rules in self.validation_rules.items() 
                          if rules.get('required', False)}
        missing_columns = required_columns - db_columns
        if missing_columns:
            self.errors.append(f"Missing required columns in table {table_name}: {missing_columns}")
            
        # Validate column types
        for column in columns:
            col_name = column['name']
            if col_name not in self.validation_rules:
                continue
                
            rules = self.validation_rules[col_name]
            col_type = str(column['type']).lower()
            
            # Validate numeric types
            if rules['type'] == 'numeric':
                if not any(t in col_type for t in ['int', 'float', 'decimal', 'numeric']):
                    self.errors.append(
                        f"Column '{col_name}' should be numeric, but has type {col_type}"
                    )
                if rules.get('integer_only', False) and not any(t in col_type for t in ['int', 'integer']):
                    self.errors.append(
                        f"Column '{col_name}' should be integer, but has type {col_type}"
                    )
                    
            # Validate string types
            elif rules['type'] == 'string':
                if not any(t in col_type for t in ['char', 'text', 'string']):
                    self.errors.append(
                        f"Column '{col_name}' should be string, but has type {col_type}"
                    )
                    
            # Validate date types
            elif rules['type'] == 'date':
                if not any(t in col_type for t in ['date', 'timestamp']):
                    self.errors.append(
                        f"Column '{col_name}' should be date, but has type {col_type}"
                    )
                    
        return self.errors
    
    def validate_constraints(self, table_name: str, schema: Optional[str] = None) -> List[str]:
        """Validate database constraints against rules."""
        self.errors = []
        inspector = inspect(self.engine)
        
        # Check primary key constraints
        pk_constraint = inspector.get_pk_constraint(table_name, schema=schema)
        if pk_constraint:
            pk_columns = set(pk_constraint['constrained_columns'])
            for col, rules in self.validation_rules.items():
                if rules.get('unique', False) and col not in pk_columns:
                    self.errors.append(
                        f"Column '{col}' should be unique but is not part of primary key"
                    )
                    
        # Check foreign key constraints
        fk_constraints = inspector.get_foreign_keys(table_name, schema=schema)
        # Add custom foreign key validation logic here
        
        return self.errors

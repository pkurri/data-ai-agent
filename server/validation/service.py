"""
Validation service to handle validation for different data sources.
"""
from typing import Dict, List, Any, Optional, Union
import pandas as pd
from sqlalchemy.engine import Engine
from .validators import DataFrameValidator, DatabaseValidator
from .rules import DATABASE_SCHEMAS

class ValidationService:
    def __init__(self):
        self._db_connections: Dict[str, Engine] = {}
        self._schemas = DATABASE_SCHEMAS.copy()
    
    def register_database(self, name: str, engine: Engine, dialect: str = 'sqlite') -> None:
        """Register a database connection and its schema."""
        self._db_connections[name] = engine
        if dialect not in self._schemas:
            self._schemas[dialect] = {}
    
    def add_schema(self, name: str, schema: Dict[str, Dict[str, Any]], 
                  dialect: Optional[str] = None) -> None:
        """Add or update a schema for validation."""
        if dialect:
            if dialect not in self._schemas:
                self._schemas[dialect] = {}
            self._schemas[dialect][name] = schema
        else:
            # Add schema to all dialects
            for dialect_schemas in self._schemas.values():
                dialect_schemas[name] = schema
    
    def validate_dataframe(self, df: pd.DataFrame, schema_name: str,
                          dialect: Optional[str] = None) -> List[str]:
        """Validate a pandas DataFrame against a schema."""
        # Get schema
        schema = self._get_schema(schema_name, dialect)
        if not schema:
            return [f"Schema '{schema_name}' not found"]
        
        # Create validator and validate
        validator = DataFrameValidator(schema)
        return validator.validate(df)
    
    def validate_database_table(self, db_name: str, table_name: str,
                              schema: Optional[str] = None) -> List[str]:
        """Validate a database table against its schema."""
        # Check database connection
        if db_name not in self._db_connections:
            return [f"Database '{db_name}' not registered"]
        
        engine = self._db_connections[db_name]
        dialect = engine.dialect.name
        
        # Get validation schema
        validation_schema = self._get_schema(table_name, dialect)
        if not validation_schema:
            return [f"Schema for table '{table_name}' not found"]
        
        # Create validator and validate
        validator = DatabaseValidator(validation_schema, engine)
        
        # Validate schema and constraints
        errors = validator.validate_table_schema(table_name, schema)
        errors.extend(validator.validate_constraints(table_name, schema))
        
        return errors
    
    def _get_schema(self, schema_name: str, dialect: Optional[str] = None) -> Optional[Dict]:
        """Get schema for validation."""
        if dialect and dialect in self._schemas:
            return self._schemas[dialect].get(schema_name)
        
        # Try to find schema in any dialect
        for dialect_schemas in self._schemas.values():
            if schema_name in dialect_schemas:
                return dialect_schemas[schema_name]
        
        return None

"""
Specific database configuration classes for different database types.
"""
from typing import Dict, Any
from .database_config import DatabaseConfig

class DB2Config:
    """DB2 database configuration."""
    def __init__(self, config: Dict[str, Any] = None):
        if config is None:
            config = {
                'dialect': 'db2',
                'database': 'data_cleaning',
                'host': 'localhost',
                'port': 50000,
                'username': 'db2admin',
                'password': '',  # Set via environment variable in production
                'options': {
                    'SECURITY': 'SSL'
                }
            }
        self.config = config
        # Add direct attribute access
        for key, value in config.items():
            setattr(self, key, value)

class SQLServerConfig:
    """SQL Server database configuration."""
    def __init__(self, config: Dict[str, Any] = None):
        if config is None:
            config = {
                'dialect': 'mssql',
                'database': 'data_cleaning',
                'server': 'localhost',  # Changed from host to server for SQL Server
                'port': 1433,
                'username': 'sa',
                'password': '',  # Set via environment variable in production
                'options': {
                    'TrustServerCertificate': 'yes'
                }
            }
        self.config = config
        # Add direct attribute access
        for key, value in config.items():
            setattr(self, key, value)

class RedisConfig:
    """Redis configuration."""
    def __init__(self, config: Dict[str, Any] = None):
        if config is None:
            config = {
                'host': 'localhost',
                'port': 6379,
                'db': 0,
                'decode_responses': True
            }
        self.config = config
        # Add direct attribute access
        for key, value in config.items():
            setattr(self, key, value)

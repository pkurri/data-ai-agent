"""
Database configuration for multiple database types.
"""
from typing import Dict, Any, Optional
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
import os
import redis

class DatabaseConfig:
    def __init__(self):
        self.connections: Dict[str, Engine] = {}
        self.redis_connections: Dict[str, redis.Redis] = {}
        self.dialects = {
            'sqlite': 'sqlite:///{}',
            'postgresql': 'postgresql://{}:{}@{}:{}/{}',
            'mysql': 'mysql+pymysql://{}:{}@{}:{}/{}',
            'mssql': 'mssql+pyodbc://{}:{}@{}:{}/{}?driver=SQL+Server',
            'db2': 'db2+ibm_db://{}:{}@{}:{}/{}'
        }
    
    def register_database(self, name: str, config: Dict[str, Any]) -> Engine:
        """
        Register a database connection.
        
        Args:
            name: Name of the database connection
            config: Database configuration with the following keys:
                - dialect: Database type (sqlite, postgresql, mysql, mssql, db2)
                - database: Database name
                - host: Database host (not needed for sqlite)
                - port: Database port (not needed for sqlite)
                - username: Database username (not needed for sqlite)
                - password: Database password (not needed for sqlite)
                - options: Additional connection options
        """
        dialect = config['dialect'].lower()
        if dialect not in self.dialects:
            raise ValueError(f"Unsupported database dialect: {dialect}")
        
        if dialect == 'sqlite':
            db_path = os.path.abspath(config['database'])
            connection_string = self.dialects[dialect].format(db_path)
        else:
            # Build connection string for other databases
            connection_string = self.dialects[dialect].format(
                config.get('username', ''),
                config.get('password', ''),
                config.get('host', 'localhost'),
                config.get('port', self._get_default_port(dialect)),
                config['database']
            )
        
        # Add any additional options
        options = config.get('options', {})
        if options:
            option_strings = []
            for key, value in options.items():
                option_strings.append(f"{key}={value}")
            if option_strings:
                connection_string += '?' + '&'.join(option_strings)
        
        # Create engine with appropriate settings
        engine_options = {
            'pool_size': config.get('pool_size', 5),
            'max_overflow': config.get('max_overflow', 10),
            'pool_timeout': config.get('pool_timeout', 30),
            'pool_recycle': config.get('pool_recycle', 1800),
        }
        
        engine = create_engine(connection_string, **engine_options)
        self.connections[name] = engine
        return engine
    
    def get_connection(self, name: str) -> Optional[Engine]:
        """Get a database connection by name."""
        return self.connections.get(name)
    
    def _get_default_port(self, dialect: str) -> int:
        """Get default port for database type."""
        default_ports = {
            'postgresql': 5432,
            'mysql': 3306,
            'mssql': 1433,
            'db2': 50000
        }
        return default_ports.get(dialect, 5432)
    
    def register_redis(self, name: str, config: Dict[str, Any]) -> redis.Redis:
        """
        Register a Redis connection.
        
        Args:
            name: Name of the Redis connection
            config: Redis configuration with the following keys:
                - host: Redis host
                - port: Redis port
                - db: Redis database number
                - password: Redis password (optional)
                - decode_responses: Whether to decode response automatically (default: True)
        """
        redis_config = {
            'host': config.get('host', 'localhost'),
            'port': config.get('port', 6379),
            'db': config.get('db', 0),
            'decode_responses': config.get('decode_responses', True)
        }
        
        if 'password' in config:
            redis_config['password'] = config['password']
            
        redis_client = redis.Redis(**redis_config)
        self.redis_connections[name] = redis_client
        return redis_client
    
    def get_redis(self, name: str) -> Optional[redis.Redis]:
        """Get a Redis connection by name."""
        return self.redis_connections.get(name)
    
    def close_all(self) -> None:
        """Close all database connections."""
        for engine in self.connections.values():
            engine.dispose()
        for redis_client in self.redis_connections.values():
            redis_client.close()
        self.connections.clear()
        self.redis_connections.clear()

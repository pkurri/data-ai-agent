"""
Database adapter layer for managing different database connections.
"""
from typing import Dict, Any, Optional
import pandas as pd
import redis
from sqlalchemy import create_engine, text
from utils.logging import get_logger

logger = get_logger(__name__)

class DatabaseAdapter:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.db_connections = {}
        self.redis_clients = {}
        
    def connect_db2(self, connection_name: str, config: Dict[str, Any]) -> bool:
        """Connect to DB2 database."""
        try:
            connection_string = f"db2+ibm_db://{config['username']}:{config['password']}@{config['host']}:{config['port']}/{config['database']}"
            engine = create_engine(connection_string)
            self.db_connections[connection_name] = engine
            return True
        except Exception as e:
            logger.error(f"Error connecting to DB2: {str(e)}")
            return False
            
    def connect_redis(self, connection_name: str, config: Dict[str, Any]) -> bool:
        """Connect to Redis database."""
        try:
            redis_client = redis.Redis(
                host=config.get('host', 'localhost'),
                port=config.get('port', 6379),
                db=config.get('db', 0),
                password=config.get('password', None),
                decode_responses=True
            )
            self.redis_clients[connection_name] = redis_client
            return True
        except Exception as e:
            logger.error(f"Error connecting to Redis: {str(e)}")
            return False
            
    def store_dataframe(self, connection_name: str, table_name: str, df: pd.DataFrame, if_exists: str = 'replace') -> bool:
        """Store DataFrame in DB2."""
        try:
            if connection_name not in self.db_connections:
                raise ValueError(f"Connection {connection_name} not found")
                
            engine = self.db_connections[connection_name]
            df.to_sql(table_name, engine, if_exists=if_exists, index=False)
            return True
        except Exception as e:
            logger.error(f"Error storing DataFrame: {str(e)}")
            return False
            
    def query_db2(self, connection_name: str, query: str) -> Optional[pd.DataFrame]:
        """Execute query on DB2 database."""
        try:
            if connection_name not in self.db_connections:
                raise ValueError(f"Connection {connection_name} not found")
                
            engine = self.db_connections[connection_name]
            return pd.read_sql(query, engine)
        except Exception as e:
            logger.error(f"Error executing query: {str(e)}")
            return None
            
    def cache_data(self, connection_name: str, key: str, value: Any, expiry: int = None) -> bool:
        """Cache data in Redis."""
        try:
            if connection_name not in self.redis_clients:
                raise ValueError(f"Redis connection {connection_name} not found")
                
            redis_client = self.redis_clients[connection_name]
            if expiry:
                redis_client.setex(key, expiry, str(value))
            else:
                redis_client.set(key, str(value))
            return True
        except Exception as e:
            logger.error(f"Error caching data: {str(e)}")
            return False
            
    def get_cached_data(self, connection_name: str, key: str) -> Optional[str]:
        """Retrieve cached data from Redis."""
        try:
            if connection_name not in self.redis_clients:
                raise ValueError(f"Redis connection {connection_name} not found")
                
            redis_client = self.redis_clients[connection_name]
            return redis_client.get(key)
        except Exception as e:
            logger.error(f"Error retrieving cached data: {str(e)}")
            return None
            
    def close_connections(self):
        """Close all database connections."""
        for engine in self.db_connections.values():
            engine.dispose()
        for redis_client in self.redis_clients.values():
            redis_client.close()
        self.db_connections.clear()
        self.redis_clients.clear()

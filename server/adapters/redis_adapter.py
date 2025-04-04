"""
Redis adapter for caching and data storage.
"""
import redis
import json
from typing import Any, Optional, Dict, List
from utils.logging import get_logger
from config.db_configs import RedisConfig

logger = get_logger(__name__)

class RedisAdapter:
    def __init__(self, config: RedisConfig):
        """Initialize Redis adapter with configuration."""
        self.config = config
        self.client = redis.Redis(
            host=config.host,
            port=config.port,
            db=config.db,
            decode_responses=config.decode_responses
        )
        
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set a key-value pair in Redis with optional TTL."""
        try:
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            if ttl:
                return self.client.setex(key, ttl, value)
            return self.client.set(key, value)
        except Exception as e:
            logger.error(f"Error setting Redis key {key}: {str(e)}")
            return False
            
    def get(self, key: str) -> Optional[Any]:
        """Get value for a key from Redis."""
        try:
            value = self.client.get(key)
            if value:
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value
            return None
        except Exception as e:
            logger.error(f"Error getting Redis key {key}: {str(e)}")
            return None
            
    def delete(self, key: str) -> bool:
        """Delete a key from Redis."""
        try:
            return bool(self.client.delete(key))
        except Exception as e:
            logger.error(f"Error deleting Redis key {key}: {str(e)}")
            return False
            
    def exists(self, key: str) -> bool:
        """Check if a key exists in Redis."""
        try:
            return bool(self.client.exists(key))
        except Exception as e:
            logger.error(f"Error checking Redis key {key}: {str(e)}")
            return False
            
    def expire(self, key: str, ttl: int) -> bool:
        """Set expiration time for a key."""
        try:
            return bool(self.client.expire(key, ttl))
        except Exception as e:
            logger.error(f"Error setting expiration for Redis key {key}: {str(e)}")
            return False
            
    def ttl(self, key: str) -> int:
        """Get remaining time to live for a key."""
        try:
            return self.client.ttl(key)
        except Exception as e:
            logger.error(f"Error getting TTL for Redis key {key}: {str(e)}")
            return -2  # -2 means key does not exist
            
    def close(self):
        """Close Redis connection."""
        try:
            self.client.close()
        except Exception as e:
            logger.error(f"Error closing Redis connection: {str(e)}")

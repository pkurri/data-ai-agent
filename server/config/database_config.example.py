"""
Example database configuration file.
Copy this file to database_config.py and update with your credentials.
"""

class DB2Config:
    def __init__(self):
        self.host = 'your_db2_host'
        self.port = 50000  # Default DB2 port
        self.database = 'your_db2_database'
        self.username = 'your_username'
        self.password = 'your_password'
        
        # Connection settings
        self.schema = 'your_schema'  # Optional
        self.pool_size = 5
        self.max_overflow = 10
        self.timeout = 30

class SQLServerConfig:
    def __init__(self):
        self.server = 'your_sql_server'
        self.database = 'your_database'
        self.username = 'your_username'
        self.password = 'your_password'
        
        # Connection settings
        self.driver = 'ODBC Driver 17 for SQL Server'  # Update based on your system
        self.pool_size = 5
        self.timeout = 30
        self.encrypt = 'yes'
        self.trust_server_certificate = 'no'

class RedisConfig:
    def __init__(self):
        self.host = 'your_redis_host'
        self.port = 6379  # Default Redis port
        self.password = 'your_redis_password'  # Optional
        
        # Connection settings
        self.db = 0  # Database number
        self.decode_responses = True
        self.socket_timeout = 5
        self.retry_on_timeout = True
        self.max_connections = 10

        # Cache settings
        self.default_ttl = 3600  # 1 hour
        self.key_prefix = 'data_ai_agent:'

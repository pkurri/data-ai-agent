import pandas as pd
from datetime import datetime
from typing import Dict, List, Any
from utils.logging import get_logger
from adapters.db_adapter import DB2Adapter
from adapters.sql_server_adapter import SQLServerAdapter
from adapters.redis_adapter import RedisAdapter
from config.database_config import DB2Config, SQLServerConfig, RedisConfig

logger = get_logger(__name__)

class ChatAnalyticsAgent:
    def __init__(self):
        self.db2_adapter = DB2Adapter(DB2Config())
        self.sql_adapter = SQLServerAdapter(SQLServerConfig())
        self.redis_adapter = RedisAdapter(RedisConfig())
        self.cache_ttl = 3600  # 1 hour default
        
    def _cache_key(self, dataset_name: str, query: str) -> str:
        """Generate cache key for query results"""
        return f"chat_query:{dataset_name}:{hash(query)}"
        
    def _get_cached_result(self, dataset_name: str, query: str) -> Dict:
        """Get cached query result"""
        cache_key = self._cache_key(dataset_name, query)
        cached_data = self.redis_adapter.get(cache_key)
        return eval(cached_data) if cached_data else None
        
    def _cache_result(self, dataset_name: str, query: str, result: Dict):
        """Cache query result"""
        cache_key = self._cache_key(dataset_name, query)
        self.redis_adapter.set(cache_key, str(result), self.cache_ttl)
        
    def _store_query_history(self, dataset_name: str, query: str, result: Dict):
        """Store query history in SQL Server"""
        history_data = {
            'dataset_name': dataset_name,
            'query': query,
            'result': str(result),
            'timestamp': datetime.now()
        }
        self.sql_adapter.insert_report('query_history', history_data)
        
    def _parse_date_condition(self, condition: str) -> str:
        """Parse date conditions from natural language"""
        if 'this date' in condition.lower():
            return datetime.now().strftime('%Y-%m-%d')
        # Add more date parsing logic as needed
        return condition
        
    def _generate_sql_query(self, dataset_name: str, question: str) -> str:
        """Generate SQL query from natural language question"""
        question = question.lower()
        
        # Example query patterns - extend based on common questions
        if 'how many' in question:
            if 'active' in question:
                return f"SELECT COUNT(*) as count FROM {dataset_name} WHERE status = 'active'"
            elif 'terminated' in question:
                date_condition = self._parse_date_condition(question)
                return f"""
                SELECT COUNT(*) as count 
                FROM {dataset_name} 
                WHERE status = 'terminated' 
                AND termination_date <= '{date_condition}'
                """
                
        # Add more query patterns based on common questions
        return None
        
    def process_question(self, dataset_name: str, question: str) -> Dict[str, Any]:
        """Process natural language question about dataset"""
        try:
            # Check cache first
            cached_result = self._get_cached_result(dataset_name, question)
            if cached_result:
                return cached_result
                
            # Generate SQL query
            sql_query = self._generate_sql_query(dataset_name, question)
            if not sql_query:
                return {
                    'error': 'Could not understand the question. Please rephrase.',
                    'timestamp': datetime.now().isoformat()
                }
                
            # Execute query on appropriate storage
            try:
                # Try DB2 first
                result_df = self.db2_adapter.query_to_df(sql_query)
            except Exception as db2_error:
                logger.warning(f"DB2 query failed, falling back to SQL Server: {str(db2_error)}")
                result_df = self.sql_adapter.query_to_df(sql_query)
                
            # Process results
            result = {
                'data': result_df.to_dict('records'),
                'sql_query': sql_query,
                'timestamp': datetime.now().isoformat(),
                'metadata': {
                    'row_count': len(result_df),
                    'columns': result_df.columns.tolist()
                }
            }
            
            # Cache result
            self._cache_result(dataset_name, question, result)
            
            # Store in history
            self._store_query_history(dataset_name, question, result)
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing question: {str(e)}")
            return {
                'error': f"Error processing question: {str(e)}",
                'timestamp': datetime.now().isoformat()
            }
            
    def get_query_history(self, dataset_name: str = None, limit: int = 10) -> List[Dict]:
        """Get recent query history"""
        try:
            history_df = self.sql_adapter.get_reports(
                dataset_name=dataset_name,
                report_type='query',
                limit=limit
            )
            return history_df.to_dict('records')
        except Exception as e:
            logger.error(f"Error fetching query history: {str(e)}")
            return []

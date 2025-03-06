import pandas as pd
import numpy as np
from datetime import datetime
import uuid
import json
from scipy import stats
from models.data_models import AnomalyReport
from utils.logging import get_logger
from adapters.db_adapter import DB2Adapter
from adapters.redis_adapter import RedisAdapter
from config.database_config import DB2Config, RedisConfig

logger = get_logger(__name__)

class AnomalyDetectionAgent:
    def __init__(self, config):
        self.config = config
        self.numeric_columns = config.get('numeric_columns', [])
        self.date_columns = config.get('date_columns', [])
        self.time_series_columns = config.get('time_series_columns', [])
        self.anomaly_thresholds = config.get('anomaly_thresholds', {})
        
        # Initialize storage adapters
        self.db2_adapter = DB2Adapter(DB2Config())
        self.redis_adapter = RedisAdapter(RedisConfig())
        self.cache_ttl = config.get('cache_ttl', 3600)  # 1 hour default
        
    def _cache_key(self, data_id, method):
        """Generate cache key for anomaly results"""
        return f"anomaly:{data_id}:{method}"
        
    def _get_cached_results(self, data_id, method):
        """Retrieve cached anomaly detection results"""
        cache_key = self._cache_key(data_id, method)
        cached_data = self.redis_adapter.get(cache_key)
        return json.loads(cached_data) if cached_data else None
        
    def _cache_results(self, data_id, method, results):
        """Cache anomaly detection results"""
        cache_key = self._cache_key(data_id, method)
        self.redis_adapter.set(cache_key, json.dumps(results), self.cache_ttl)

    def detect_statistical_outliers(self, df, data_id=None):
        """Detect outliers using statistical methods (Z-score)"""
        if data_id:
            cached = self._get_cached_results(data_id, "statistical")
            if cached:
                return cached

        anomalies = []
        
        for col in self.numeric_columns:
            if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
                # Define Z-score threshold (default to 3 if not specified)
                z_threshold = self.anomaly_thresholds.get(f"{col}_zscore", 3.0)
                
                # Calculate Z-scores
                mean = df[col].mean()
                std = df[col].std()
                if std == 0:  # Skip if standard deviation is 0
                    continue
                    
                z_scores = np.abs((df[col] - mean) / std)
                
                # Find outliers
                outliers = df[z_scores > z_threshold]
                if not outliers.empty:
                    anomaly_data = {
                        'column': col,
                        'method': 'zscore',
                        'threshold': z_threshold,
                        'mean': float(mean),
                        'std': float(std),
                        'outlier_count': len(outliers),
                        'outlier_indices': outliers.index.tolist(),
                        'timestamp': datetime.now().isoformat()
                    }
                    anomalies.append(anomaly_data)
                    
                    # Store detailed outlier data in DB2
                    if data_id:
                        outlier_details = outliers[[col]].to_dict('records')
                        self.db2_adapter.insert_batch(
                            'anomaly_details',
                            [{
                                'data_id': data_id,
                                'column': col,
                                'value': row[col],
                                'detection_time': datetime.now(),
                                'method': 'zscore'
                            } for row in outlier_details]
                        )
        
        if data_id:
            self._cache_results(data_id, "statistical", anomalies)
        return anomalies
    
    def detect_distribution_anomalies(self, df, data_id=None):
        """Detect anomalies using distribution tests"""
        if data_id:
            cached = self._get_cached_results(data_id, "distribution")
            if cached:
                return cached

        anomalies = []
        
        for col in self.numeric_columns:
            if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
                # Check for distribution anomalies (highly skewed or bimodal)
                try:
                    # Calculate skewness
                    skew = stats.skew(df[col].dropna())
                    if abs(skew) > 2.0:  # Significantly skewed
                        anomaly_data = {
                            'column': col,
                            'method': 'skewness',
                            'skew_value': float(skew),
                            'description': 'Highly skewed distribution',
                            'timestamp': datetime.now().isoformat()
                        }
                        anomalies.append(anomaly_data)
                    
                    # Check for bimodality using Hartigan's dip test
                    # (Simplified approximation - check if histogram has two peaks)
                    hist, bin_edges = np.histogram(df[col].dropna(), bins='auto')
                    if len(hist) > 3:
                        peak_indices = np.where((hist[1:-1] > hist[:-2]) & (hist[1:-1] > hist[2:]))[0] + 1
                        if len(peak_indices) >= 2:
                            anomaly_data = {
                                'column': col,
                                'method': 'multimodal',
                                'peak_count': len(peak_indices),
                                'description': 'Potentially multimodal distribution',
                                'timestamp': datetime.now().isoformat()
                            }
                            anomalies.append(anomaly_data)
                except Exception as e:
                    logger.error(f"Error analyzing distribution for {col}: {str(e)}")
        
        if data_id:
            self._cache_results(data_id, "distribution", anomalies)
        return anomalies
    
    def detect_time_series_anomalies(self, df, historical_data=None, data_id=None):
        """Detect anomalies in time series data"""
        if data_id:
            cached = self._get_cached_results(data_id, "time_series")
            if cached:
                return cached

        anomalies = []
        
        # Check if we have time series columns defined
        if not self.time_series_columns:
            return anomalies
            
        # Need at least one date column for time series analysis
        date_col = next((col for col in self.date_columns if col in df.columns), None)
        if not date_col or not pd.api.types.is_datetime64_dtype(df[date_col]):
            return anomalies
            
        # Sort by date for time series analysis
        df = df.sort_values(by=date_col)
        
        for col in self.time_series_columns:
            if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
                # Calculate rate of change
                df[f'{col}_pct_change'] = df[col].pct_change()
                
                # Define threshold for sudden changes
                change_threshold = self.anomaly_thresholds.get(f"{col}_change", 0.3)  # 30% by default
                
                # Find sudden changes
                sudden_changes = df[abs(df[f'{col}_pct_change']) > change_threshold]
                if not sudden_changes.empty:
                    anomaly_data = {
                        'column': col,
                        'method': 'sudden_change',
                        'threshold': change_threshold,
                        'anomaly_count': len(sudden_changes),
                        'anomaly_details': [{
                            'date': row[date_col].strftime('%Y-%m-%d'),
                            'value': float(row[col]),
                            'change': float(row[f'{col}_pct_change'])
                        } for _, row in sudden_changes.iterrows()],
                        'timestamp': datetime.now().isoformat()
                    }
                    anomalies.append(anomaly_data)
                
                # If we have historical data, compare trends
                if historical_data is not None and col in historical_data.columns:
                    # Logic for comparing with historical data
                    # (This would be expanded based on historical data format)
                    pass
        
        if data_id:
            self._cache_results(data_id, "time_series", anomalies)
        return anomalies
    
    def detect_seasonality_anomalies(self, df, data_id=None):
        """Detect anomalies in seasonal patterns"""
        if data_id:
            cached = self._get_cached_results(data_id, "seasonality")
            if cached:
                return cached

        # This is a placeholder for more complex time series analysis
        # Would require sufficient historical data and potentially additional libraries
        return []
    
    def detect_anomalies(self, processed_data, df, historical_data=None):
        """Apply all anomaly detection methods"""
        data_id = processed_data.source_id
        all_anomalies = []
        
        # Apply detection methods
        all_anomalies.extend(self.detect_statistical_outliers(df, data_id))
        all_anomalies.extend(self.detect_distribution_anomalies(df, data_id))
        all_anomalies.extend(self.detect_time_series_anomalies(df, historical_data, data_id))
        all_anomalies.extend(self.detect_seasonality_anomalies(df, data_id))
        
        # Create anomaly report
        anomaly_report = AnomalyReport(
            data_id=data_id,
            anomalies=all_anomalies,
            detection_method="combined",
            timestamp=datetime.now()
        )
        
        # Store anomaly report in DB2
        report_data = {
            'report_id': str(uuid.uuid4()),
            'data_id': data_id,
            'timestamp': anomaly_report.timestamp,
            'anomaly_count': len(all_anomalies),
            'report_data': json.dumps(all_anomalies)
        }
        self.db2_adapter.insert('anomaly_reports', report_data)
        
        return anomaly_report, df

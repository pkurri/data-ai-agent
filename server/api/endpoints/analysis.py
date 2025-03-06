from flask import Blueprint, request, jsonify
from agents.anomaly_agent import AnomalyDetectionAgent
from agents.validation_agent import ValidationAgent
from services.analytics import AnalyticsService
from utils.logging import get_logger
from models.data_models import AnalysisRequest

logger = get_logger(__name__)
analysis_bp = Blueprint('analysis', __name__)

@analysis_bp.route('/analyze', methods=['POST'])
def analyze_dataset():
    """Analyze a dataset using specified methods"""
    try:
        data = request.get_json()
        dataset_name = data.get('dataset_name')
        analysis_type = data.get('analysis_type', 'all')
        storage_type = data.get('storage_type', 'hybrid')
        use_cache = data.get('use_cache', True)
        
        analytics_service = AnalyticsService()
        anomaly_agent = AnomalyDetectionAgent(config={
            'numeric_columns': data.get('numeric_columns', []),
            'date_columns': data.get('date_columns', []),
            'time_series_columns': data.get('time_series_columns', []),
            'anomaly_thresholds': data.get('anomaly_thresholds', {}),
            'cache_ttl': data.get('cache_ttl', 3600)
        })
        
        results = analytics_service.analyze_dataset(
            dataset_name=dataset_name,
            analysis_type=analysis_type,
            storage_type=storage_type,
            use_cache=use_cache,
            anomaly_agent=anomaly_agent
        )
        
        return jsonify({
            'success': True,
            'results': results,
            'dataset': dataset_name,
            'analysis_type': analysis_type
        })
        
    except Exception as e:
        logger.error(f"Error analyzing dataset: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@analysis_bp.route('/reports', methods=['GET'])
def get_analysis_reports():
    """Get analysis reports for a dataset"""
    try:
        dataset_name = request.args.get('dataset_name')
        report_type = request.args.get('type', 'all')
        limit = int(request.args.get('limit', 10))
        
        analytics_service = AnalyticsService()
        reports = analytics_service.get_reports(
            dataset_name=dataset_name,
            report_type=report_type,
            limit=limit
        )
        
        return jsonify({
            'success': True,
            'reports': reports
        })
        
    except Exception as e:
        logger.error(f"Error fetching analysis reports: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@analysis_bp.route('/validate', methods=['POST'])
def validate_dataset():
    """Validate a dataset against specified rules"""
    try:
        data = request.get_json()
        dataset_name = data.get('dataset_name')
        validation_rules = data.get('rules', [])
        
        validation_agent = ValidationAgent()
        validation_results = validation_agent.validate(
            dataset_name=dataset_name,
            rules=validation_rules
        )
        
        return jsonify({
            'success': True,
            'validation_results': validation_results
        })
        
    except Exception as e:
        logger.error(f"Error validating dataset: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

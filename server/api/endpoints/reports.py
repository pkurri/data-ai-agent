from flask import Blueprint, request, jsonify
from services.analytics import AnalyticsService
from agents.anomaly_agent import AnomalyAgent
from storage.database import get_db_session
from utils.config import load_config

bp = Blueprint('reports', __name__)
config = load_config()

analytics_service = AnalyticsService()
anomaly_agent = AnomalyAgent()

@bp.route('/data-quality', methods=['GET'])
def get_data_quality_report():
    try:
        dataset_name = request.args.get('dataset_name')
        if not dataset_name:
            return jsonify({"error": "Dataset name is required"}), 400
            
        report = analytics_service.generate_data_quality_report(dataset_name)
        return jsonify({
            "success": True,
            "report": report
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/anomalies', methods=['GET'])
def get_anomaly_report():
    try:
        dataset_name = request.args.get('dataset_name')
        if not dataset_name:
            return jsonify({"error": "Dataset name is required"}), 400
            
        report = anomaly_agent.detect_anomalies(dataset_name)
        return jsonify({
            "success": True,
            "anomalies": report
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/statistics', methods=['GET'])
def get_statistics():
    try:
        dataset_name = request.args.get('dataset_name')
        if not dataset_name:
            return jsonify({"error": "Dataset name is required"}), 400
            
        stats = analytics_service.calculate_statistics(dataset_name)
        return jsonify({
            "success": True,
            "statistics": stats
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/correlation', methods=['GET'])
def get_correlation_matrix():
    try:
        dataset_name = request.args.get('dataset_name')
        if not dataset_name:
            return jsonify({"error": "Dataset name is required"}), 400
            
        method = request.args.get('method', 'pearson')
        matrix = analytics_service.calculate_correlation_matrix(dataset_name, method)
        return jsonify({
            "success": True,
            "correlation_matrix": matrix
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
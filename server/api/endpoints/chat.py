from flask import Blueprint, request, jsonify
from agents.chat_analytics_agent import ChatAnalyticsAgent
from utils.logging import get_logger

logger = get_logger(__name__)
chat_bp = Blueprint('chat', __name__)
chat_agent = ChatAnalyticsAgent()

@chat_bp.route('/ask', methods=['POST'])
def ask_question():
    """Process a natural language question about a dataset"""
    try:
        data = request.get_json()
        dataset_name = data.get('dataset_name')
        question = data.get('question')
        
        if not dataset_name or not question:
            return jsonify({
                'success': False,
                'error': 'Dataset name and question are required'
            }), 400
            
        result = chat_agent.process_question(dataset_name, question)
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        logger.error(f"Error processing question: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@chat_bp.route('/history', methods=['GET'])
def get_history():
    """Get query history for a dataset"""
    try:
        dataset_name = request.args.get('dataset_name')
        limit = int(request.args.get('limit', 10))
        
        history = chat_agent.get_query_history(
            dataset_name=dataset_name,
            limit=limit
        )
        
        return jsonify({
            'success': True,
            'history': history
        })
        
    except Exception as e:
        logger.error(f"Error fetching query history: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@chat_bp.route('/suggestions', methods=['GET'])
def get_suggestions():
    """Get suggested questions for a dataset"""
    try:
        dataset_name = request.args.get('dataset_name')
        
        # Get dataset schema and generate relevant suggestions
        suggestions = [
            'How many employees are currently active?',
            'How many employees were terminated this year?',
            'What is the average tenure of active employees?',
            'Show me department-wise employee count',
            'What is the average salary by department?'
        ]
        
        return jsonify({
            'success': True,
            'suggestions': suggestions
        })
        
    except Exception as e:
        logger.error(f"Error getting suggestions: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

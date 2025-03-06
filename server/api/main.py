from flask import Flask
from flask_cors import CORS
import yaml
import os
from api.endpoints import data, reports
from utils.logging import setup_logging
from utils.config import load_config
from storage.database import init_db

def create_app():
    # Load configuration
    config = load_config()
    
    # Initialize Flask app
    app = Flask(__name__)
    CORS(app)
    
    # Configure app
    app.config.update(
        UPLOAD_FOLDER=config['storage']['upload_folder'],
        MAX_CONTENT_LENGTH=config['storage']['max_file_size']
    )
    
    # Ensure upload directory exists
    os.makedirs(config['storage']['upload_folder'], exist_ok=True)
    
    # Setup logging
    setup_logging(config['logging'])
    
    # Initialize database
    init_db(config['database'])
    
    # Register blueprints
    app.register_blueprint(data.bp, url_prefix='/api/data')
    app.register_blueprint(reports.bp, url_prefix='/api/reports')
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(
        host=app.config.get('API_HOST', '0.0.0.0'),
        port=app.config.get('API_PORT', 5000),
        debug=app.config.get('DEBUG', True)
    )
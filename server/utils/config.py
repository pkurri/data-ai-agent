import os
import yaml
from pathlib import Path

def load_config():
    """Load configuration from config.yaml file."""
    config_path = Path(__file__).parent.parent / 'config.yaml'
    
    if not config_path.exists():
        raise FileNotFoundError(f"Configuration file not found at {config_path}")
    
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    
    # Override with environment variables if they exist
    if os.getenv('API_HOST'):
        config['api']['host'] = os.getenv('API_HOST')
    if os.getenv('API_PORT'):
        config['api']['port'] = int(os.getenv('API_PORT'))
    if os.getenv('DEBUG'):
        config['app']['debug'] = os.getenv('DEBUG').lower() == 'true'
    
    return config
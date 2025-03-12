import logging
import os
from pathlib import Path

# Default logging configuration
DEFAULT_CONFIG = {
    'level': 'INFO',
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    'file': 'logs/app.log'
}

def setup_logging(config=None):
    """Configure logging based on the provided configuration."""
    if config is None:
        config = DEFAULT_CONFIG

    # Create logs directory if it doesn't exist
    log_dir = Path('logs')
    log_dir.mkdir(exist_ok=True)
    
    # Configure logging
    logging.basicConfig(
        level=getattr(logging, config['level']),
        format=config['format'],
        handlers=[
            logging.FileHandler(config['file']),
            logging.StreamHandler()
        ]
    )

def get_logger(name):
    """Get a logger instance with the specified name.
    
    Args:
        name (str): Name of the logger, typically __name__ from the calling module
        
    Returns:
        logging.Logger: Configured logger instance
    """
    # Ensure logging is set up
    if not logging.getLogger().handlers:
        setup_logging()
    
    # Create and return logger
    logger = logging.getLogger(name)
    return logger
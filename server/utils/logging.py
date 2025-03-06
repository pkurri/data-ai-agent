import logging
import os
from pathlib import Path

def setup_logging(config):
    """Configure logging based on the provided configuration."""
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
    
    # Create logger instance
    logger = logging.getLogger(__name__)
    logger.info('Logging system initialized')
    
    return logger
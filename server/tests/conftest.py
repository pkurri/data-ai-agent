import os
import pytest

@pytest.fixture
def test_data_dir():
    """Return the path to the test data directory."""
    return os.path.join(os.path.dirname(__file__), 'data')

@pytest.fixture
def api_base_url():
    """Return the base URL for the API server."""
    return 'http://localhost:5000/api'

@pytest.fixture
def upload_endpoint(api_base_url):
    """Return the upload endpoint URL."""
    return f"{api_base_url}/data/upload"

@pytest.fixture
def clean_endpoint(api_base_url):
    """Return the clean endpoint URL."""
    return f"{api_base_url}/data/clean"

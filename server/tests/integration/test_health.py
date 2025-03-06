import requests
import json
import pytest

def test_health_check():
    """Test the health check endpoint."""
    response = requests.get('http://localhost:5000/api/health')
    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'healthy'

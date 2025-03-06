import requests
import json
import os
import pytest

def test_list_datasets():
    """Test listing all datasets."""
    response = requests.get('http://localhost:5000/api/datasets')
    assert response.status_code == 200
    data = response.json()
    assert 'datasets' in data
    assert isinstance(data['datasets'], list)

def test_preview_dataset():
    """Test previewing a dataset."""
    # First upload a test file
    test_data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'edge_cases.csv')
    files = {
        'file': ('edge_cases.csv', open(test_data_path, 'rb'), 'text/csv')
    }
    upload_data = {'dataset_name': 'edge_cases_preview'}
    
    upload_response = requests.post('http://localhost:5000/api/datasets', files=files, data=upload_data)
    assert upload_response.status_code == 200
    
    # Test preview endpoint
    response = requests.get('http://localhost:5000/api/datasets/edge_cases_preview.csv/preview')
    assert response.status_code == 200
    data = response.json()
    assert 'preview' in data
    assert isinstance(data['preview'], list)
    assert len(data['preview']) > 0

def test_download_dataset():
    """Test downloading a dataset."""
    response = requests.get('http://localhost:5000/api/datasets/edge_cases_preview.csv/download')
    assert response.status_code == 200
    assert response.headers['Content-Type'] == 'text/csv'
    assert len(response.content) > 0

def test_delete_dataset():
    """Test deleting a dataset."""
    # First upload a test file to delete
    test_data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'edge_cases.csv')
    files = {
        'file': ('edge_cases.csv', open(test_data_path, 'rb'), 'text/csv')
    }
    upload_data = {'dataset_name': 'edge_cases_delete'}
    
    upload_response = requests.post('http://localhost:5000/api/datasets', files=files, data=upload_data)
    assert upload_response.status_code == 200
    
    # Test delete endpoint
    response = requests.delete('http://localhost:5000/api/datasets/edge_cases_delete.csv')
    assert response.status_code == 200
    data = response.json()
    assert data['success'] is True
    
    # Verify dataset is deleted
    response = requests.get('http://localhost:5000/api/datasets/edge_cases_delete.csv/preview')
    assert response.status_code == 404

def test_invalid_dataset_operations():
    """Test operations with invalid dataset names."""
    # Test preview of non-existent dataset
    response = requests.get('http://localhost:5000/api/datasets/nonexistent.csv/preview')
    assert response.status_code == 404
    
    # Test download of non-existent dataset
    response = requests.get('http://localhost:5000/api/datasets/nonexistent.csv/download')
    assert response.status_code == 404
    
    # Test delete of non-existent dataset
    response = requests.delete('http://localhost:5000/api/datasets/nonexistent.csv')
    assert response.status_code == 404

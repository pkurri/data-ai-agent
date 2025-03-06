import requests
import json
import os
import pytest

def test_valid_file_formats():
    """Test uploading files with valid formats."""
    test_files = {
        'csv': 'edge_cases.csv',
        'json': 'test_formats.json'
    }
    
    for file_type, filename in test_files.items():
        test_data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', filename)
        files = {
            'file': (filename, open(test_data_path, 'rb'), f'text/{file_type}')
        }
        upload_data = {'dataset_name': f'test_{file_type}'}
        
        response = requests.post('http://localhost:5000/api/data/upload', files=files, data=upload_data)
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert 'dataset_info' in data

def test_invalid_file_formats():
    """Test uploading files with invalid formats."""
    # Create a temporary text file with invalid format
    invalid_file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'invalid.txt')
    with open(invalid_file_path, 'w') as f:
        f.write('This is not a valid data file')
    
    try:
        files = {
            'file': ('invalid.txt', open(invalid_file_path, 'rb'), 'text/plain')
        }
        upload_data = {'dataset_name': 'invalid_format'}
        
        response = requests.post('http://localhost:5000/api/data/upload', files=files, data=upload_data)
        assert response.status_code == 400
        data = response.json()
        assert data['success'] is False
        assert 'error' in data
    finally:
        # Clean up temporary file
        if os.path.exists(invalid_file_path):
            os.remove(invalid_file_path)

def test_large_file_upload():
    """Test uploading a file that exceeds size limit."""
    # Create a temporary large file (17MB)
    large_file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'large_file.csv')
    with open(large_file_path, 'w') as f:
        f.write('header1,header2\n')
        for i in range(1000000):  # This should create a file > 16MB
            f.write(f'data{i},value{i}\n')
    
    try:
        files = {
            'file': ('large_file.csv', open(large_file_path, 'rb'), 'text/csv')
        }
        upload_data = {'dataset_name': 'large_file'}
        
        response = requests.post('http://localhost:5000/api/data/upload', files=files, data=upload_data)
        assert response.status_code == 413  # Request Entity Too Large
    finally:
        # Clean up temporary file
        if os.path.exists(large_file_path):
            os.remove(large_file_path)

def test_missing_file():
    """Test upload request without a file."""
    response = requests.post('http://localhost:5000/api/data/upload', data={'dataset_name': 'missing_file'})
    assert response.status_code == 400
    data = response.json()
    assert data['success'] is False
    assert 'error' in data

def test_missing_dataset_name():
    """Test upload request without a dataset name."""
    test_data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'edge_cases.csv')
    files = {
        'file': ('edge_cases.csv', open(test_data_path, 'rb'), 'text/csv')
    }
    
    response = requests.post('http://localhost:5000/api/data/upload', files=files)
    assert response.status_code == 400
    data = response.json()
    assert data['success'] is False
    assert 'error' in data

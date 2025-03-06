import requests
import json
import os

def test_cleaning(force=False):
    # First upload the edge cases file
    upload_url = 'http://localhost:5000/api/data/upload'
    test_data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'edge_cases.csv')
    files = {
        'file': ('edge_cases.csv', open(test_data_path, 'rb'), 'text/csv')
    }
    upload_data = {
        'dataset_name': 'edge_cases'
    }
    
    print("\nUploading edge cases dataset...")
    response = requests.post(upload_url, files=files, data=upload_data)
    print("Upload Results:")
    print(json.dumps(response.json(), indent=2))

    # Then try to clean it
    clean_url = 'http://localhost:5000/api/data/clean'
    clean_data = {
        'dataset_name': 'edge_cases.csv',
        'options': {
            'removeDuplicates': True,
            'handleMissingValues': 'impute',
            'normalizeText': True,
            'detectOutliers': True,
            'force': force
        }
    }

    print("\nAttempting to clean data...")
    print("Request data:", json.dumps(clean_data, indent=2))
    response = requests.post(clean_url, json=clean_data)
    result = response.json()

    print("\nCleaning Results:")
    print(json.dumps(result, indent=2))
    return result

if __name__ == '__main__':
    # First try without force to see validation errors
    print("Testing without force=True:")
    result = test_cleaning(force=False)

    if not result.get('success', True):
        print("\nRetrying with force=True to clean data anyway:")
        result = test_cleaning(force=True)

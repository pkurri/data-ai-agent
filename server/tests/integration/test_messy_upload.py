import requests
import json
import os

def test_messy_data_upload():
    # Upload the messy data file
    upload_url = 'http://localhost:5000/api/data/upload'
    test_data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'messy_data.csv')
    files = {
        'file': ('messy_data.csv', open(test_data_path, 'rb'), 'text/csv')
    }
    upload_data = {
        'dataset_name': 'messy_data'
    }
    
    print("\nUploading messy dataset...")
    response = requests.post(upload_url, files=files, data=upload_data)
    print("Upload Results:")
    print(json.dumps(response.json(), indent=2))

    # Then try to clean it
    clean_url = 'http://localhost:5000/api/data/clean'
    clean_data = {
        'dataset_name': 'messy_data.csv',
        'options': {
            'removeDuplicates': True,
            'handleMissingValues': 'impute',
            'normalizeText': True,
            'detectOutliers': True
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
    test_messy_data_upload()

import requests
import json

# Base URL for the API
base_url = 'http://127.0.0.1:5000'

# Test files to preview
test_files = [
    'sample_data.csv',  # Regular file without timestamp
    'messy_data.csv',   # Has both regular and timestamped versions
]

# Test preview functionality
for filename in test_files:
    print(f"\nTesting preview for: {filename}")
    try:
        response = requests.get(f"{base_url}/datasets/{filename}/preview")
        print(f"Status code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Success: {data.get('success', False)}")
            print(f"Columns: {len(data.get('columns', []))}")
            print(f"Preview rows: {len(data.get('preview', []))}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {str(e)}")

import requests
import json

url = 'http://localhost:5000/api/data/clean'
data = {
    'dataset_name': 'messy_data.csv',  # Make sure this matches the exact filename
    'options': {
        'removeDuplicates': True,
        'handleMissingValues': 'impute',
        'normalizeText': True,
        'detectOutliers': True
    }
}

print("Sending request with data:", json.dumps(data, indent=2))
response = requests.post(url, json=data)
result = response.json()

print("\nCleaning Results:")
print(json.dumps(result, indent=2))

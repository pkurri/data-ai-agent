import requests
import json

url = 'http://localhost:5000/api/data/clean'
data = {
    'dataset_name': 'sample_data.csv',
    'options': {
        'removeDuplicates': True,
        'handleMissingValues': 'impute',
        'normalizeText': True,
        'detectOutliers': True
    }
}

response = requests.post(url, json=data)
result = response.json()

print("Cleaning Results:")
print(json.dumps(result, indent=2))

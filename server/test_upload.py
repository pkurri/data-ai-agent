import requests

url = 'http://localhost:5000/api/data/upload'
files = {
    'file': ('sample_data.csv', open('sample_data.csv', 'rb'), 'text/csv')
}
data = {
    'dataset_name': 'employee_data'
}

response = requests.post(url, files=files, data=data)
print(response.json())

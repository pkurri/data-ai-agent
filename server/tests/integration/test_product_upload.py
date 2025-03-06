import requests

url = 'http://localhost:5000/api/data/upload'
files = {
    'file': ('product_data.csv', open('product_data.csv', 'rb'), 'text/csv')
}
data = {
    'dataset_name': 'product_data'
}

response = requests.post(url, files=files, data=data)
print("Upload Results:")
print(response.json())

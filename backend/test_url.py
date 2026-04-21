import requests
try:
    r = requests.get('http://172.20.10.5:5000/api/complaints/5001')
    print(f"Status: {r.status_code}")
    print(f"Body: {r.text}")
except Exception as e:
    print(f"Error: {e}")

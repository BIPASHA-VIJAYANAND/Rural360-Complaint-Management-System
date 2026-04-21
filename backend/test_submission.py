import requests

BASE_URL = "http://localhost:5000/api"

# Login
resp = requests.post(f"{BASE_URL}/auth/login", json={
    "phone_number": "9876543210",
    "password": "Password123"
})
print("Login:", resp.json())
token = resp.json().get("token")

# Submit complaint
if token:
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "category": "Water",
        "description": "No water since morning",
        "location_text": "Block A",
        "priority": "High"
    }
    resp = requests.post(f"{BASE_URL}/complaints/", json=payload, headers=headers)
    print("Submit Status:", resp.status_code)
    try:
        print("Submit Response:", resp.json())
    except:
        print("Submit Text:", resp.text)

import requests

BASE_URL = "http://localhost:5000/api"

# Login
resp = requests.post(f"{BASE_URL}/auth/login", json={
    "phone_number": "9876543210",
    "password": "Password123"
})
token = resp.json().get("token")

# Get complaints
if token:
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/complaints/", headers=headers)
    print("Complaints Status:", resp.status_code)
    try:
        print("Complaints Response:", resp.json())
    except:
        print("Complaints Text:", resp.text)

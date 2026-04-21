import requests

response = requests.post(
    "http://localhost:5000/api/auth/send-otp",
    json={"email": "test@example.com"}
)
print("Status:", response.status_code)
print("Text:", response.text)
print("Status:", response.status_code)
print("Text:", response.text)

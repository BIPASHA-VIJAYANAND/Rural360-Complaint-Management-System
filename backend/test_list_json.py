from app import create_app
from flask import json
from app.routes.complaints import list_complaints
from flask_jwt_extended import create_access_token

app = create_app()
with app.app_context():
    # Simulate a login for user 1001 (Citizen)
    token = create_access_token(identity="1001", additional_claims={"role": "Citizen"})
    
    with app.test_client() as client:
        res = client.get("/api/complaints/", headers={"Authorization": f"Bearer {token}"})
        print(f"Status: {res.status_code}")
        print(f"Data: {json.loads(res.data)}")

from app import create_app
from app.extensions import bcrypt
from app.utils.db import execute_one

app = create_app()
with app.app_context():
    email = 'vabipasha@gmail.com'
    pwd = 'Mobile123!'
    user = execute_one(
        "SELECT user_id, email, password_hash, role, is_active FROM USERS WHERE email = :email",
        {"email": email}
    )
    if not user:
        print("FAIL: EMAIL NOT FOUND")
    elif not user["is_active"]:
        print(f"FAIL: NOT ACTIVE. is_active is {user['is_active']}")
    elif not bcrypt.check_password_hash(user["password_hash"], pwd):
        print("FAIL: WRONG PASSWORD")
    else:
        print("SUCCESS! DB IS PERFECT")

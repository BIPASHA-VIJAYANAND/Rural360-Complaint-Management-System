from app import create_app
from app.extensions import bcrypt
from app.utils.db import execute_query

app = create_app()

with app.app_context():
    users = [
        ("Admin Portal", "noreplyemail042@gmail.com", "Admin"),
        ("Clerk Desk", "clerk@example.com", "Clerk"),
        ("Staff Worker", "staff@example.com", "Staff"),
    ]
    
    password_plain = "password123"
    password_hash = bcrypt.generate_password_hash(password_plain).decode("utf-8")
    
    for name, email, role in users:
        # Check if exists
        res = execute_query("SELECT user_id FROM USERS WHERE email = :email", {"email": email}, fetch=True)
        if not res:
            print(f"Creating {role}...")
            sql = """INSERT INTO USERS (user_id, full_name, email, password_hash, role, is_active)
                     VALUES (SEQ_USER_ID.NEXTVAL, :name, :email, :hash, :role, 1)"""
            execute_query(sql, {
                "name": name,
                "email": email,
                "hash": password_hash,
                "role": role
            }, fetch=False)
            print(f"Created {role}: {email} / {password_plain}")
        else:
            print(f"{role} already exists: {email} / {password_plain}")

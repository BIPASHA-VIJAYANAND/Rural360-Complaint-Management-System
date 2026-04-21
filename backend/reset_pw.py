from app import create_app
from app.extensions import bcrypt
from app.utils.db import execute_query

app = create_app()

with app.app_context():
    h = bcrypt.generate_password_hash('Mobile123!').decode('utf-8')
    execute_query("UPDATE USERS SET password_hash = :h WHERE email = 'vabipasha@gmail.com'", {'h': h}, fetch=False)
    print('Password reset success!')

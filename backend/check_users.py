from app import create_app
from app.utils.db import execute_query

app = create_app()
with app.app_context():
    rows = execute_query("SELECT user_id, full_name, role, email FROM USERS")
    for r in rows:
        print(r)

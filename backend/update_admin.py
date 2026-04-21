import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.utils.db import execute_query

app = create_app()

with app.app_context():
    execute_query(
        "UPDATE USERS SET email = 'noreplyemail042@gmail.com' WHERE email = 'admin@example.com'",
        fetch=False
    )
    print("Successfully updated Admin email to noreplyemail042@gmail.com!")

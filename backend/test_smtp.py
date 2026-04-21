import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.utils.otp import send_otp_email

app = create_app()

with app.app_context():
    print("Testing SMTP sending...")
    email = "test@example.com"
    otp = "123456"
    success = send_otp_email(email, otp)
    print("Success:", success)

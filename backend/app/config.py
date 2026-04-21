"""Application configuration loaded from environment variables."""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Oracle DB
    DB_DSN      = os.environ.get("DB_DSN",      "localhost:1521/ORCL")
    DB_USER     = os.environ.get("DB_USER",     "system")
    DB_PASSWORD = os.environ.get("DB_PASSWORD", "oracle")

    # JWT
    JWT_SECRET_KEY          = os.environ.get("JWT_SECRET_KEY", "dev-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # seconds

    # SMS
    SMS_API_KEY = os.environ.get("SMS_API_KEY", "")
    SMS_API_URL = os.environ.get("SMS_API_URL", "")

    # SMTP (Email OTP)
    SMTP_SERVER   = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT     = int(os.environ.get("SMTP_PORT", 587))
    SMTP_USER     = os.environ.get("SMTP_USER", "")
    SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
    SMTP_FROM     = os.environ.get("SMTP_FROM", "panchayat.noreply@gmail.com")

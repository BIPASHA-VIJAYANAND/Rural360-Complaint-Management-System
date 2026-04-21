"""OTP generation and Email dispatch utility."""
import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app


def generate_otp(length: int = 6) -> str:
    """Return a zero-padded numeric OTP."""
    return "".join(random.choices(string.digits, k=length))


def send_otp_email(email_addr: str, otp_code: str) -> bool:
    """
    Dispatch OTP via SMTP (Email).
    Returns True on success, False on failure.
    Always attempts real SMTP delivery.
    """
    smtp_server = current_app.config.get("SMTP_SERVER")
    smtp_port   = current_app.config.get("SMTP_PORT")
    smtp_user   = current_app.config.get("SMTP_USER")
    smtp_pass   = current_app.config.get("SMTP_PASSWORD")
    smtp_from   = current_app.config.get("SMTP_FROM")

    if not smtp_server or not smtp_user or not smtp_pass:
        current_app.logger.error(
            "SMTP not configured! Set SMTP_SERVER, SMTP_USER, SMTP_PASSWORD in .env"
        )
        print(f"[ERROR] SMTP not configured. OTP for {email_addr}: {otp_code}")
        return False

    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_from or smtp_user
        msg['To'] = email_addr
        msg['Subject'] = "Panchayat Portal - Verification OTP"

        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #2c3e50; text-align: center;">Account Verification</h2>
                <p>Hello,</p>
                <p>Your One-Time Password (OTP) for the <b>Panchayat Grievance Redressal System</b> is:</p>
                <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; border-radius: 5px; color: #e74c3c;">
                    {otp_code}
                </div>
                <p>This OTP is valid for <b>10 minutes</b>. Do not share this code with anyone.</p>
                <p>If you didn't request this, please ignore this email.</p>
                <hr style="border: 0; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #777; text-align: center;">&copy; 2026 Panchayat System. All rights reserved.</p>
            </div>
        </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))

        print(f"[SMTP] Connecting to {smtp_server}:{smtp_port} as {smtp_user}...")
        with smtplib.SMTP(smtp_server, int(smtp_port)) as server:
            server.set_debuglevel(0)
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)

        print(f"[SMTP] ✅ OTP email sent successfully to {email_addr}")
        current_app.logger.info("OTP email sent to %s", email_addr)
        return True
    except smtplib.SMTPAuthenticationError as exc:
        current_app.logger.error("SMTP Auth failed (check App Password): %s", exc)
        with open("smtp_error.txt", "a") as f:
            f.write(f"SMTPAuthError: {exc}\n")
        print(f"[SMTP ERROR] Authentication failed: {exc}")
        return _dev_fallback(email_addr, otp_code)
    except smtplib.SMTPException as exc:
        current_app.logger.error("SMTP error: %s", exc)
        with open("smtp_error.txt", "a") as f:
            f.write(f"SMTPException: {exc}\n")
        print(f"[SMTP ERROR] {exc}")
        return _dev_fallback(email_addr, otp_code)
    except Exception as exc:
        current_app.logger.error("Email send failed: %s", exc)
        with open("smtp_error.txt", "a") as f:
            f.write(f"Exception: {exc}\n")
        print(f"[SMTP ERROR] Unexpected: {exc}")
        return _dev_fallback(email_addr, otp_code)


def _dev_fallback(email_addr: str, otp_code: str) -> bool:
    """In development mode, print OTP to console and return True so testing can continue."""
    is_dev = current_app.config.get("FLASK_ENV") == "development" or current_app.debug
    if is_dev:
        print(f"\n{'='*60}")
        print(f"  [DEV MODE] OTP for {email_addr}: {otp_code}")
        print(f"  (SMTP failed — use this OTP from the console)")
        print(f"{'='*60}\n")
        return True
    return False

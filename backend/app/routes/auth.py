"""Authentication routes: Email OTP send/verify, register, login."""
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from marshmallow import ValidationError

from ..extensions import bcrypt
from ..utils.db   import execute_query, execute_one
from ..utils.otp  import generate_otp, send_otp_email
from ..models.schemas import SendOTPSchema, VerifyOTPSchema, RegisterSchema, LoginSchema

auth_bp = Blueprint("auth", __name__)

# Simple in-memory OTP rate limiting (per identifier per process restart)
_otp_requests: dict = {}
OTP_LIMIT_SECONDS = 60  # one OTP per minute per identifier


# ── Send OTP ─────────────────────────────────────────────────────────────────

@auth_bp.post("/send-otp")
def send_otp():
    schema = SendOTPSchema()
    try:
        data = schema.load(request.get_json(force=True) or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    email = data.get("email")
    if not email:
        return jsonify({"error": "Email is required."}), 400

    identifier = email

    # Rate limit
    last_sent = _otp_requests.get(identifier)
    now = datetime.now(timezone.utc)
    if last_sent and (now - last_sent).seconds < OTP_LIMIT_SECONDS:
        return jsonify({"error": "Please wait before requesting another OTP."}), 429

    otp_code   = generate_otp()
    expires_at = now + timedelta(minutes=10)

    execute_query(
        """INSERT INTO OTP_VERIFICATION (otp_id, phone_number, email, otp_code, expires_at, is_used)
           VALUES (SEQ_OTP_ID.NEXTVAL, :phone, :email, :otp, :exp, 0)""",
        {"phone": None, "email": email, "otp": otp_code, "exp": expires_at},
        fetch=False
    )

    success = send_otp_email(email, otp_code)

    if not success:
        return jsonify({"error": "Failed to send OTP email. Check SMTP configuration."}), 503

    _otp_requests[identifier] = now
    return jsonify({"message": "OTP sent successfully to your email."}), 200


# ── Verify OTP (used internally by register/forgot-password) ─────────────────

def _verify_otp_internal(email=None, otp_code=None) -> bool:
    now = datetime.now(timezone.utc)
    
    if not email:
        return False

    query = """SELECT otp_id FROM OTP_VERIFICATION
               WHERE otp_code     = :otp
                 AND is_used      = 0
                 AND expires_at   > :now
                 AND email        = :email
               ORDER BY otp_id DESC FETCH FIRST 1 ROWS ONLY"""
    
    params = {"otp": otp_code, "now": now, "email": email}

    row = execute_one(query, params)
    if not row:
        return False
    # Mark as used
    execute_query(
        "UPDATE OTP_VERIFICATION SET is_used = 1 WHERE otp_id = :id",
        {"id": row["otp_id"]}, fetch=False
    )
    return True


# ── Register ──────────────────────────────────────────────────────────────────

@auth_bp.post("/register")
def register():
    schema = RegisterSchema()
    try:
        data = schema.load(request.get_json(force=True) or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    email = data.get("email")
    if not email:
        return jsonify({"error": "Email is required for registration."}), 400

    # Check duplicate email
    existing_email = execute_one(
        "SELECT user_id FROM USERS WHERE email = :email",
        {"email": email}
    )
    if existing_email:
        return jsonify({"error": "Email already registered."}), 409

    # Verify OTP
    if not _verify_otp_internal(email=email, otp_code=data["otp_code"]):
        return jsonify({"error": "Invalid or expired OTP."}), 400

    pw_hash = bcrypt.generate_password_hash(data["password"]).decode("utf-8")

    execute_query(
        """INSERT INTO USERS (user_id, full_name, phone_number, email, password_hash, role, is_active)
           VALUES (SEQ_USER_ID.NEXTVAL, :name, :phone, :email, :hash, :role, 1)""",
        {
            "name":  data["full_name"],
            "phone": None,
            "email": email,
            "hash":  pw_hash,
            "role":  data.get("role", "Citizen")
        },
        fetch=False
    )

    return jsonify({"message": "Registration successful. Please log in."}), 201


# ── Login ─────────────────────────────────────────────────────────────────────

@auth_bp.post("/login")
def login():
    schema = LoginSchema()
    try:
        data = schema.load(request.get_json(force=True) or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    email = data.get("email")
    if not email:
        return jsonify({"error": "Email is required."}), 400

    user = execute_one(
        "SELECT user_id, full_name, phone_number, email, password_hash, role, is_active "
        "FROM USERS WHERE email = :email",
        {"email": email}
    )

    if not user:
        return jsonify({"error": "Invalid credentials."}), 401
    
    if not user["is_active"]:
        return jsonify({"error": "Account is deactivated. Contact admin."}), 403

    if not bcrypt.check_password_hash(user["password_hash"], data["password"]):
        return jsonify({"error": "Invalid credentials."}), 401

    token = create_access_token(
        identity=str(user["user_id"]),
        additional_claims={
            "role":      user["role"],
            "full_name": user["full_name"],
            "phone":     user["phone_number"],
            "email":     user["email"]
        }
    )

    return jsonify({
        "token":     token,
        "user_id":   user["user_id"],
        "full_name": user["full_name"],
        "role":      user["role"],
        "email":     user["email"]
    }), 200


# ── Forgot Password ───────────────────────────────────────────────────────────

@auth_bp.post("/forgot-password")
def forgot_password():
    try:
        data = request.get_json(force=True) or {}
        email    = data.get("email", "")
        otp_code = data.get("otp_code", "")
        new_pass = data.get("new_password", "")
    except Exception:
        return jsonify({"error": "Invalid request body."}), 400

    if not email or not otp_code or not new_pass or len(new_pass) < 6:
        return jsonify({"error": "email, otp_code, new_password (min 6 chars) required."}), 400

    user = execute_one(
        "SELECT user_id FROM USERS WHERE email = :email",
        {"email": email}
    )
    if not user:
        return jsonify({"error": "No account found for this email."}), 404

    if not _verify_otp_internal(email=email, otp_code=otp_code):
        return jsonify({"error": "Invalid or expired OTP."}), 400

    pw_hash = bcrypt.generate_password_hash(new_pass).decode("utf-8")
    execute_query(
        "UPDATE USERS SET password_hash = :hash WHERE user_id = :usr_id",
        {"hash": pw_hash, "usr_id": user["user_id"]}, fetch=False
    )

    return jsonify({"message": "Password reset successful."}), 200

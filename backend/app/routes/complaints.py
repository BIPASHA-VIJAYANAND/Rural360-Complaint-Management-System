"""Complaints CRUD, status-transition routes, and image upload."""
import os
import uuid
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from marshmallow import ValidationError

from ..utils.db   import execute_query, execute_one
from ..utils.decorators import roles_required
from ..models.schemas   import ComplaintSchema, StatusUpdateSchema, STATUS_TRANSITIONS
from ..utils.notifications import send_status_update_email

complaints_bp = Blueprint("complaints", __name__)

# Upload config
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
MAX_IMAGES = 5
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def ensure_upload_dir():
    os.makedirs(UPLOAD_DIR, exist_ok=True)


# ── Submit complaint (Citizen) ────────────────────────────────────────────────

@complaints_bp.post("/")
@jwt_required()
def submit_complaint():
    schema = ComplaintSchema()
    try:
        data = schema.load(request.get_json(force=True) or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    user_id = int(get_jwt_identity())

    execute_query(
        """INSERT INTO COMPLAINTS
               (complaint_id, user_id, category, description, location_text, priority)
           VALUES (SEQ_COMPLAINT_ID.NEXTVAL, :user_id, :cat, :descr, :loc, :pri)""",
        {
            "user_id":  user_id,
            "cat":  data["category"],
            "descr": data["description"],
            "loc":  data["location_text"],
            "pri":  data["priority"]
        },
        fetch=False
    )

    # Fetch the generated complaint_id
    new_complaint = execute_one(
        """SELECT complaint_id FROM COMPLAINTS
           WHERE user_id = :usr_id ORDER BY complaint_id DESC
           FETCH FIRST 1 ROWS ONLY""",
        {"usr_id": user_id}
    )

    # Log initial status
    execute_query(
        """INSERT INTO STATUS_HISTORY
               (history_id, complaint_id, old_status, new_status, changed_by)
           VALUES (SEQ_HISTORY_ID.NEXTVAL, :cid, NULL, 'Submitted', :usr_id)""",
        {"cid": new_complaint["complaint_id"], "usr_id": user_id},
        fetch=False
    )

    return jsonify({
        "message": "Complaint submitted successfully.",
        "complaint_id": new_complaint["complaint_id"]
    }), 201


# ── Citizen Stats ─────────────────────────────────────────────────────────────

@complaints_bp.get("/stats")
@jwt_required()
def citizen_stats():
    user_id = int(get_jwt_identity())
    
    total = execute_one(
        "SELECT COUNT(*) AS cnt FROM COMPLAINTS WHERE user_id = :usr_id",
        {"usr_id": user_id}
    )["cnt"]
    
    pending = execute_one(
        "SELECT COUNT(*) AS cnt FROM COMPLAINTS WHERE user_id = :usr_id AND status NOT IN ('Completed', 'Closed')",
        {"usr_id": user_id}
    )["cnt"]
    
    resolved = execute_one(
        "SELECT COUNT(*) AS cnt FROM COMPLAINTS WHERE user_id = :usr_id AND status IN ('Completed', 'Closed')",
        {"usr_id": user_id}
    )["cnt"]
    
    return jsonify({
        "total": total,
        "pending": pending,
        "resolved": resolved
    }), 200


# ── Upload images for a complaint ─────────────────────────────────────────────

@complaints_bp.post("/<int:complaint_id>/images")
@jwt_required()
def upload_images(complaint_id):
    user_id = int(get_jwt_identity())

    # Verify complaint belongs to user
    complaint = execute_one(
        "SELECT complaint_id, user_id FROM COMPLAINTS WHERE complaint_id = :cid",
        {"cid": complaint_id}
    )
    if not complaint:
        return jsonify({"error": "Complaint not found."}), 404
    if complaint["user_id"] != user_id:
        return jsonify({"error": "Access forbidden."}), 403

    if 'images' not in request.files:
        return jsonify({"error": "No images provided."}), 400

    files = request.files.getlist('images')
    if len(files) > MAX_IMAGES:
        return jsonify({"error": f"Maximum {MAX_IMAGES} images allowed."}), 400

    # Check existing images count
    existing = execute_query(
        "SELECT COUNT(*) AS cnt FROM COMPLAINT_IMAGES WHERE complaint_id = :cid",
        {"cid": complaint_id}
    )
    existing_count = existing[0]["cnt"] if existing else 0
    if existing_count + len(files) > MAX_IMAGES:
        return jsonify({
            "error": f"Total images cannot exceed {MAX_IMAGES}. You already have {existing_count}."
        }), 400

    ensure_upload_dir()
    uploaded = []

    for file in files:
        if not file or not file.filename:
            continue
        if not allowed_file(file.filename):
            return jsonify({"error": f"Invalid file type: {file.filename}"}), 400

        # Generate unique filename
        ext = file.filename.rsplit('.', 1)[1].lower()
        unique_name = f"{complaint_id}_{uuid.uuid4().hex[:8]}.{ext}"
        filepath = os.path.join(UPLOAD_DIR, unique_name)
        file.save(filepath)

        # Store in DB
        execute_query(
            """INSERT INTO COMPLAINT_IMAGES
                   (image_id, complaint_id, file_name, original_name)
               VALUES (SEQ_IMAGE_ID.NEXTVAL, :cid, :fname, :orig)""",
            {"cid": complaint_id, "fname": unique_name, "orig": file.filename},
            fetch=False
        )

        uploaded.append({
            "file_name": unique_name,
            "original_name": file.filename
        })

    return jsonify({
        "message": f"{len(uploaded)} image(s) uploaded successfully.",
        "images": uploaded
    }), 201


# ── Get images for a complaint ────────────────────────────────────────────────

@complaints_bp.get("/<int:complaint_id>/images")
@jwt_required()
def get_images(complaint_id):
    claims = get_jwt()
    role = claims.get("role", "Citizen")
    user_id = int(get_jwt_identity())

    complaint = execute_one(
        "SELECT complaint_id, user_id FROM COMPLAINTS WHERE complaint_id = :cid",
        {"cid": complaint_id}
    )
    if not complaint:
        return jsonify({"error": "Complaint not found."}), 404
    if role == "Citizen" and complaint["user_id"] != user_id:
        return jsonify({"error": "Access forbidden."}), 403

    images = execute_query(
        """SELECT image_id, file_name, original_name, uploaded_at
           FROM COMPLAINT_IMAGES WHERE complaint_id = :cid
           ORDER BY uploaded_at ASC""",
        {"cid": complaint_id}
    )

    for img in images:
        for k, v in img.items():
            if hasattr(v, "isoformat"):
                img[k] = v.isoformat()
        img["url"] = f"/api/complaints/uploads/{img['file_name']}"

    return jsonify(images), 200


# ── Serve uploaded images ─────────────────────────────────────────────────────

@complaints_bp.get("/uploads/<filename>")
def serve_image(filename):
    ensure_upload_dir()
    return send_from_directory(UPLOAD_DIR, filename)


# ── List complaints ───────────────────────────────────────────────────────────

@complaints_bp.get("/")
@jwt_required()
def list_complaints():
    claims  = get_jwt()
    role    = claims.get("role", "Citizen")
    user_id = int(get_jwt_identity())

    status_filter = request.args.get("status")
    cat_filter    = request.args.get("category")

    if role == "Citizen":
        sql = """SELECT c.complaint_id, c.category, c.status, c.priority,
                        c.created_at, c.updated_at, c.location_text, c.description
                 FROM COMPLAINTS c
                 WHERE c.user_id = :usr_id"""
        params = {"usr_id": user_id}
        if status_filter:
            sql += " AND c.status = :status"
            params["status"] = status_filter
        sql += " ORDER BY c.created_at DESC"
    else:
        sql = """SELECT c.complaint_id, c.category, c.status, c.priority,
                        c.created_at, c.updated_at, c.location_text,
                        u.full_name AS citizen_name, u.phone_number AS citizen_phone
                 FROM COMPLAINTS c
                 JOIN USERS u ON c.user_id = u.user_id
                 WHERE 1=1"""
        params = {}
        if status_filter:
            sql += " AND c.status = :status"
            params["status"] = status_filter
        if cat_filter:
            sql += " AND c.category = :cat"
            params["cat"] = cat_filter
        if role == "Staff":
            sql += """ AND c.complaint_id IN (
                SELECT complaint_id FROM ASSIGNMENTS WHERE staff_id = :sid
            )"""
            params["sid"] = user_id
        sql += " ORDER BY c.created_at DESC"

    rows = execute_query(sql, params)
    # Convert datetime objects to string for JSON
    for row in rows:
        for k, v in row.items():
            if hasattr(v, "isoformat"):
                row[k] = v.isoformat()
    return jsonify(rows), 200


# ── Get single complaint ──────────────────────────────────────────────────────

@complaints_bp.get("/<int:complaint_id>")
@jwt_required()
def get_complaint(complaint_id):
    claims  = get_jwt()
    role    = claims.get("role", "Citizen")
    user_id = int(get_jwt_identity())

    complaint = execute_one(
        """SELECT c.*, u.full_name AS citizen_name, u.phone_number AS citizen_phone
           FROM COMPLAINTS c JOIN USERS u ON c.user_id = u.user_id
           WHERE c.complaint_id = :cid""",
        {"cid": complaint_id}
    )

    if not complaint:
        return jsonify({"error": "Complaint not found."}), 404

    if role == "Citizen" and complaint["user_id"] != user_id:
        return jsonify({"error": "Access forbidden."}), 403

    # Convert datetimes
    for k, v in complaint.items():
        if hasattr(v, "isoformat"):
            complaint[k] = v.isoformat()

    # Fetch timeline
    history = execute_query(
        """SELECT sh.old_status, sh.new_status, sh.changed_at,
                  sh.remarks, u.full_name AS changed_by_name
           FROM STATUS_HISTORY sh
           JOIN USERS u ON sh.changed_by = u.user_id
           WHERE sh.complaint_id = :cid
           ORDER BY sh.changed_at ASC""",
        {"cid": complaint_id}
    )
    for h in history:
        for k, v in h.items():
            if hasattr(v, "isoformat"):
                h[k] = v.isoformat()

    complaint["history"] = history

    # Fetch images
    images = execute_query(
        """SELECT image_id, file_name, original_name, uploaded_at
           FROM COMPLAINT_IMAGES WHERE complaint_id = :cid
           ORDER BY uploaded_at ASC""",
        {"cid": complaint_id}
    )
    for img in images:
        for k, v in img.items():
            if hasattr(v, "isoformat"):
                img[k] = v.isoformat()
        img["url"] = f"/api/complaints/uploads/{img['file_name']}"

    complaint["images"] = images

    return jsonify(complaint), 200


# ── Update complaint status ───────────────────────────────────────────────────

@complaints_bp.patch("/<int:complaint_id>/status")
@jwt_required()
def update_status(complaint_id):
    claims  = get_jwt()
    role    = claims.get("role", "Citizen")
    user_id = int(get_jwt_identity())

    if role == "Citizen":
        return jsonify({"error": "Citizens cannot update complaint status."}), 403

    schema = StatusUpdateSchema()
    try:
        data = schema.load(request.get_json(force=True) or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    complaint = execute_one(
        "SELECT complaint_id, status, user_id FROM COMPLAINTS WHERE complaint_id = :cid",
        {"cid": complaint_id}
    )
    if not complaint:
        return jsonify({"error": "Complaint not found."}), 404

    old_status = complaint["status"]
    new_status = data["new_status"]

    # Validate transition for role
    allowed = STATUS_TRANSITIONS.get(role, {}).get(old_status, [])
    if new_status not in allowed:
        return jsonify({
            "error": f"Role '{role}' cannot transition from '{old_status}' to '{new_status}'."
        }), 403

    execute_query(
        "UPDATE COMPLAINTS SET status = :ns WHERE complaint_id = :cid",
        {"ns": new_status, "cid": complaint_id}, fetch=False
    )

    # Sync with ASSIGNMENTS table if it's a staff transition
    if role == "Staff":
        execute_query(
            "UPDATE ASSIGNMENTS SET progress_status = :ns WHERE complaint_id = :cid",
            {"ns": new_status, "cid": complaint_id}, fetch=False
        )

    execute_query(
        """INSERT INTO STATUS_HISTORY
               (history_id, complaint_id, old_status, new_status, changed_by, remarks)
           VALUES (SEQ_HISTORY_ID.NEXTVAL, :cid, :os, :ns, :usr_id, :rem)""",
        {
            "cid": complaint_id,
            "os":  old_status,
            "ns":  new_status,
            "usr_id": user_id,
            "rem": data.get("remarks", "")
        },
        fetch=False
    )

    # ── Send email notification to the citizen ─────────────────────────────
    try:
        citizen = execute_one(
            "SELECT u.email, u.full_name FROM USERS u WHERE u.user_id = :uid",
            {"uid": complaint["user_id"]}
        )
        if citizen and citizen.get("email"):
            send_status_update_email(
                citizen_email=citizen["email"],
                citizen_name=citizen["full_name"],
                complaint_id=complaint_id,
                old_status=old_status,
                new_status=new_status,
                remarks=data.get("remarks", "")
            )
    except Exception as exc:
        current_app.logger.warning("Failed to send notification: %s", exc)
        print(f"[NOTIFY WARNING] Could not send notification: {exc}")

    return jsonify({"message": f"Status updated to '{new_status}'."}), 200

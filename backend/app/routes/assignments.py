"""Assignment routes: assign staff to complaints, update progress."""
from datetime import date
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from marshmallow import ValidationError

from ..utils.db   import execute_query, execute_one
from ..utils.decorators import clerk_or_admin_required
from ..models.schemas   import AssignStaffSchema
from ..utils.notifications import send_status_update_email

assignments_bp = Blueprint("assignments", __name__)


@assignments_bp.post("/<int:complaint_id>")
@jwt_required()
@clerk_or_admin_required
def assign_staff(complaint_id):
    schema = AssignStaffSchema()
    try:
        data = schema.load(request.get_json(force=True) or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    # Validate deadline is future
    if data["deadline"] <= date.today():
        return jsonify({"error": "Deadline must be a future date."}), 400

    # Validate staff exists and has Staff role
    staff = execute_one(
        "SELECT user_id, role FROM USERS WHERE user_id = :sid AND is_active = 1",
        {"sid": data["staff_id"]}
    )
    if not staff or staff["role"] != "Staff":
        return jsonify({"error": "Staff member not found or invalid role."}), 404

    # Check complaint exists
    complaint = execute_one(
        "SELECT complaint_id, status, user_id FROM COMPLAINTS WHERE complaint_id = :cid",
        {"cid": complaint_id}
    )
    if not complaint:
        return jsonify({"error": "Complaint not found."}), 404

    if complaint["status"] != "Approved":
        return jsonify({"error": "Complaint must be 'Approved' before assigning staff."}), 400

    # Upsert assignment (remove old, insert new)
    execute_query(
        "DELETE FROM ASSIGNMENTS WHERE complaint_id = :cid",
        {"cid": complaint_id}, fetch=False
    )

    execute_query(
        """INSERT INTO ASSIGNMENTS
               (assignment_id, complaint_id, staff_id, deadline, progress_status)
           VALUES (SEQ_ASSIGNMENT_ID.NEXTVAL, :cid, :sid, :dl, 'Assigned')""",
        {"cid": complaint_id, "sid": data["staff_id"], "dl": data["deadline"]},
        fetch=False
    )

    # Update complaint status to Assigned
    changer = int(get_jwt_identity())
    execute_query(
        "UPDATE COMPLAINTS SET status = 'Assigned' WHERE complaint_id = :cid",
        {"cid": complaint_id}, fetch=False
    )
    execute_query(
        """INSERT INTO STATUS_HISTORY
               (history_id, complaint_id, old_status, new_status, changed_by, remarks)
           VALUES (SEQ_HISTORY_ID.NEXTVAL, :cid, 'Approved', 'Assigned', :usr_id,
                   'Staff assigned by admin/clerk')""",
        {"cid": complaint_id, "usr_id": changer}, fetch=False
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
                old_status="Approved",
                new_status="Assigned",
                remarks="Staff has been assigned to resolve your complaint."
            )
    except Exception as exc:
        current_app.logger.warning("Failed to send assignment notification: %s", exc)

    return jsonify({"message": "Staff assigned successfully."}), 200


@assignments_bp.get("/")
@jwt_required()
def list_assignments():
    claims  = get_jwt()
    role    = claims.get("role", "Citizen")
    user_id = int(get_jwt_identity())

    if role == "Staff":
        rows = execute_query(
            """SELECT a.assignment_id, a.complaint_id, a.deadline, a.progress_status,
                      c.category, c.description, c.location_text, c.priority, c.status AS complaint_status
               FROM ASSIGNMENTS a JOIN COMPLAINTS c ON a.complaint_id = c.complaint_id
               WHERE a.staff_id = :sid ORDER BY a.deadline ASC""",
            {"sid": user_id}
        )
    elif role in ("Admin", "Clerk"):
        rows = execute_query(
            """SELECT a.assignment_id, a.complaint_id, a.staff_id, a.deadline,
                      a.progress_status, u.full_name AS staff_name,
                      c.category, c.status AS complaint_status
               FROM ASSIGNMENTS a
               JOIN USERS u ON a.staff_id = u.user_id
               JOIN COMPLAINTS c ON a.complaint_id = c.complaint_id
               ORDER BY a.deadline ASC""",
            {}
        )
    else:
        return jsonify({"error": "Access forbidden."}), 403

    for row in rows:
        for k, v in row.items():
            if hasattr(v, "isoformat"):
                row[k] = v.isoformat()

    return jsonify(rows), 200

"""Feedback routes: citizens submit feedback on closed/completed complaints."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from marshmallow import ValidationError

from ..utils.db  import execute_query, execute_one
from ..models.schemas import FeedbackSchema

feedback_bp = Blueprint("feedback", __name__)


@feedback_bp.post("/<int:complaint_id>")
@jwt_required()
def submit_feedback(complaint_id):
    claims  = get_jwt()
    role    = claims.get("role", "")
    user_id = int(get_jwt_identity())

    if role != "Citizen":
        return jsonify({"error": "Only citizens can submit feedback."}), 403

    complaint = execute_one(
        "SELECT user_id, status FROM COMPLAINTS WHERE complaint_id = :cid",
        {"cid": complaint_id}
    )
    if not complaint:
        return jsonify({"error": "Complaint not found."}), 404

    if complaint["user_id"] != user_id:
        return jsonify({"error": "Access forbidden."}), 403

    if complaint["status"] not in ("Completed", "Closed"):
        return jsonify({"error": "Feedback can only be submitted for completed or closed complaints."}), 400

    # Check duplicate
    existing = execute_one(
        "SELECT feedback_id FROM FEEDBACK WHERE complaint_id = :cid",
        {"cid": complaint_id}
    )
    if existing:
        return jsonify({"error": "Feedback already submitted for this complaint."}), 409

    schema = FeedbackSchema()
    try:
        data = schema.load(request.get_json(force=True) or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    execute_query(
        """INSERT INTO FEEDBACK (feedback_id, complaint_id, rating, comments)
           VALUES (SEQ_FEEDBACK_ID.NEXTVAL, :cid, :rating, :comments)""",
        {"cid": complaint_id, "rating": data["rating"], "comments": data.get("comments", "")},
        fetch=False
    )

    return jsonify({"message": "Feedback submitted. Thank you."}), 201


@feedback_bp.get("/<int:complaint_id>")
@jwt_required()
def get_feedback(complaint_id):
    fb = execute_one(
        "SELECT * FROM FEEDBACK WHERE complaint_id = :cid",
        {"cid": complaint_id}
    )
    if not fb:
        return jsonify({"error": "No feedback found."}), 404

    for k, v in fb.items():
        if hasattr(v, "isoformat"):
            fb[k] = v.isoformat()

    return jsonify(fb), 200

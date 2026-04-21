"""Admin dashboard analytics routes."""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt

from ..utils.db  import execute_query, execute_one
from ..utils.decorators import clerk_or_admin_required

admin_bp = Blueprint("admin", __name__)


@admin_bp.get("/stats")
@jwt_required()
@clerk_or_admin_required
def dashboard_stats():
    """High-level counts for the dashboard."""
    total   = execute_one("SELECT COUNT(*) AS cnt FROM COMPLAINTS", {})
    open_c  = execute_one(
        "SELECT COUNT(*) AS cnt FROM COMPLAINTS WHERE status NOT IN ('Completed','Closed')", {}
    )
    closed  = execute_one(
        "SELECT COUNT(*) AS cnt FROM COMPLAINTS WHERE status IN ('Completed','Closed')", {}
    )
    pending = execute_one(
        "SELECT COUNT(*) AS cnt FROM COMPLAINTS WHERE status = 'Pending Approval'", {}
    )

    return jsonify({
        "total_complaints":   total["cnt"]   if total   else 0,
        "open_complaints":    open_c["cnt"]  if open_c  else 0,
        "closed_complaints":  closed["cnt"]  if closed  else 0,
        "pending_approval":   pending["cnt"] if pending else 0
    }), 200


@admin_bp.get("/category-breakdown")
@jwt_required()
@clerk_or_admin_required
def category_breakdown():
    rows = execute_query(
        """SELECT category, COUNT(*) AS complaint_count
           FROM COMPLAINTS
           GROUP BY category
           ORDER BY complaint_count DESC""", {}
    )
    return jsonify(rows), 200


@admin_bp.get("/status-breakdown")
@jwt_required()
@clerk_or_admin_required
def status_breakdown():
    rows = execute_query(
        """SELECT status, COUNT(*) AS count
           FROM COMPLAINTS
           GROUP BY status""", {}
    )
    return jsonify(rows), 200


@admin_bp.get("/avg-resolution-time")
@jwt_required()
@clerk_or_admin_required
def avg_resolution_time():
    """Average days from Submitted → Closed."""
    row = execute_one(
        """SELECT ROUND(AVG(
                  CAST(updated_at AS DATE) - CAST(created_at AS DATE)
               ), 2) AS avg_days
           FROM COMPLAINTS
           WHERE status = 'Closed'""", {}
    )
    return jsonify({"avg_resolution_days": row["avg_days"] if row else None}), 200


@admin_bp.get("/staff-performance")
@jwt_required()
@clerk_or_admin_required
def staff_performance():
    rows = execute_query(
        """SELECT u.user_id, u.full_name,
                  COUNT(a.assignment_id) AS total_assigned,
                  SUM(CASE WHEN a.progress_status = 'Completed' THEN 1 ELSE 0 END) AS completed
           FROM USERS u
           LEFT JOIN ASSIGNMENTS a ON u.user_id = a.staff_id
           WHERE u.role = 'Staff'
           GROUP BY u.user_id, u.full_name
           ORDER BY completed DESC""", {}
    )
    return jsonify(rows), 200


@admin_bp.get("/staff-list")
@jwt_required()
def staff_list():
    claims = get_jwt()
    if claims.get("role") not in ("Admin", "Clerk", "Staff"):
        return jsonify({"error": "Forbidden"}), 403
    rows = execute_query(
        "SELECT user_id, full_name, phone_number FROM USERS WHERE role = 'Staff' AND is_active = 1", {}
    )
    return jsonify(rows), 200

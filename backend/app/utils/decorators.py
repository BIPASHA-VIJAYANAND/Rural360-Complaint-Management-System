"""Role-based access control decorators."""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt


def roles_required(*allowed_roles):
    """
    Decorator factory: restrict endpoint to users whose JWT 'role'
    claim is in allowed_roles.

    Usage:
        @roles_required("Admin", "Clerk")
        def my_view(): ...
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            role   = claims.get("role", "")
            if role not in allowed_roles:
                return jsonify({"error": "Access forbidden: insufficient privileges"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


# Convenience shortcuts
def admin_required(fn):
    return roles_required("Admin")(fn)


def clerk_or_admin_required(fn):
    return roles_required("Admin", "Clerk")(fn)


def staff_or_above(fn):
    return roles_required("Admin", "Clerk", "Staff")(fn)

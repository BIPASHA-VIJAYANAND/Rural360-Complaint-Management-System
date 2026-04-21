"""Marshmallow schemas for request validation."""
from marshmallow import Schema, fields, validate, validates_schema, ValidationError
import re

VALID_ROLES    = ["Citizen", "Clerk", "Admin", "Staff"]
VALID_STATUSES = [
    "Submitted", "Under Review", "Pending Approval",
    "Approved", "Assigned", "In Progress", "Completed", "Closed"
]
VALID_PRIORITIES = ["Low", "Normal", "High", "Urgent"]

# Allowed status transitions per role
STATUS_TRANSITIONS = {
    "Citizen": {
        # Citizens cannot change status directly
    },
    "Clerk": {
        "Submitted":   ["Under Review"],
        "Under Review": ["Pending Approval"],
    },
    "Admin": {
        "Submitted":        ["Under Review", "Pending Approval", "Approved", "Closed"],
        "Under Review":     ["Pending Approval", "Approved", "Closed"],
        "Pending Approval": ["Approved", "Closed"],
        "Approved":         ["Assigned", "Closed"],
        "Assigned":         ["In Progress", "Completed", "Closed"],
        "In Progress":      ["Completed", "Closed"],
        "Completed":        ["Closed"],
    },
    "Staff": {
        "Assigned":    ["In Progress"],
        "In Progress": ["Completed"],
    },
}


class SendOTPSchema(Schema):
    email = fields.Email(required=True)


class VerifyOTPSchema(Schema):
    email    = fields.Email(required=True)
    otp_code = fields.Str(required=True, validate=validate.Length(equal=6))


class RegisterSchema(Schema):
    full_name = fields.Str(required=True, validate=validate.Length(min=2, max=150))
    email     = fields.Email(required=True)
    password  = fields.Str(required=True, validate=validate.Length(min=6))
    otp_code  = fields.Str(required=True, validate=validate.Length(equal=6))
    role      = fields.Str(load_default="Citizen",
                           validate=validate.OneOf(VALID_ROLES))


class LoginSchema(Schema):
    email    = fields.Email(required=True)
    password = fields.Str(required=True)


class ComplaintSchema(Schema):
    category     = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    description  = fields.Str(required=True, validate=validate.Length(min=20, max=2000))
    location_text = fields.Str(required=True, validate=validate.Length(min=3, max=300))
    priority     = fields.Str(load_default="Normal",
                              validate=validate.OneOf(VALID_PRIORITIES))


class StatusUpdateSchema(Schema):
    new_status = fields.Str(required=True, validate=validate.OneOf(VALID_STATUSES))
    remarks    = fields.Str(load_default="", validate=validate.Length(max=500))


class AssignStaffSchema(Schema):
    staff_id = fields.Int(required=True)
    deadline = fields.Date(required=True)


class FeedbackSchema(Schema):
    rating   = fields.Int(required=True, validate=validate.Range(min=1, max=5))
    comments = fields.Str(load_default="", validate=validate.Length(max=1000))

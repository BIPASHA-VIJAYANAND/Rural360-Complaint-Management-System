"""Email notification utility for complaint status updates."""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app


STATUS_LABELS = {
    "Submitted": "📝 Submitted",
    "Under Review": "🔍 Under Review",
    "Pending Approval": "⏳ Pending Approval",
    "Approved": "✅ Approved",
    "Assigned": "👤 Assigned to Staff",
    "In Progress": "🔧 In Progress",
    "Completed": "✔️ Completed",
    "Closed": "📁 Closed",
}


def send_status_update_email(citizen_email, citizen_name, complaint_id,
                              old_status, new_status, remarks=""):
    """
    Send an email notification to the citizen when their complaint status changes.
    Returns True on success, False on failure (never raises).
    """
    smtp_server = current_app.config.get("SMTP_SERVER")
    smtp_port   = current_app.config.get("SMTP_PORT")
    smtp_user   = current_app.config.get("SMTP_USER")
    smtp_pass   = current_app.config.get("SMTP_PASSWORD")
    smtp_from   = current_app.config.get("SMTP_FROM")

    if not smtp_server or not smtp_user or not smtp_pass:
        current_app.logger.warning("SMTP not configured — skipping status notification.")
        print(f"[NOTIFY] SMTP not configured. Would have emailed {citizen_email} about "
              f"complaint #{complaint_id}: {old_status} → {new_status}")
        return False

    old_label = STATUS_LABELS.get(old_status, old_status or "—")
    new_label = STATUS_LABELS.get(new_status, new_status)

    subject = f"Complaint #{complaint_id} — Status Updated to {new_status}"

    action_taken_html = ""
    if remarks:
        action_taken_html = f"""
                    <tr>
                        <td style="padding:10px 12px; background:#eef2f7; font-weight:600; width:140px; border:1px solid #eee; color: #1a3a6b;">Action Taken / Remarks</td>
                        <td style="padding:10px 12px; border:1px solid #eee; font-weight: 500;">{remarks}</td>
                    </tr>
        """

    body = f"""
    <html>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; background: #f4f4f4; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: #1a3a6b; color: #fff; padding: 20px 24px; text-align: center;">
                <h2 style="margin: 0; font-size: 18px;">Gram Panchayat Grievance Redressal Portal</h2>
                <p style="margin: 4px 0 0; font-size: 12px; color: #d6e4f7;">Complaint Status Update Notification</p>
            </div>

            <!-- Body -->
            <div style="padding: 24px;">
                <p style="font-size: 15px;">Dear <strong>{citizen_name}</strong>,</p>
                <p style="font-size: 14px; color: #555;">
                    This is to inform you that the status of your complaint has been updated.
                    Please find the details below:
                </p>

                <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
                    <tr>
                        <td style="padding:10px 12px; background:#f9f9f9; font-weight:600; width:140px; border:1px solid #eee;">Complaint ID</td>
                        <td style="padding:10px 12px; border:1px solid #eee; font-family: monospace; font-weight: 700;">#{complaint_id}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 12px; background:#f9f9f9; font-weight:600; width:140px; border:1px solid #eee;">Status Updated To</td>
                        <td style="padding:10px 12px; border:1px solid #eee;">
                            <span style="background: #1a3a6b; color: #fff; padding: 4px 10px; border-radius: 3px; font-weight: 600; font-size: 13px;">
                                {new_label}
                            </span>
                        </td>
                    </tr>
                    {action_taken_html}
                </table>

                <p style="font-size: 14px; color: #555;">
                    You can track the full progress of your complaint by logging into the 
                    Panchayat Mobile App.
                </p>

                <div style="background: #edf2fb; border-left: 4px solid #1a3a6b; padding: 10px 14px; margin: 16px 0; font-size: 13px; color: #1a3a6b; border-radius: 3px;">
                    <strong>Note:</strong> If you have any queries regarding this update,
                    please contact your local Panchayat office during working hours.
                </div>
            </div>

            <!-- Footer -->
            <div style="background: #f9f9f9; padding: 14px 24px; text-align: center; border-top: 1px solid #eee;">
                <p style="font-size: 11px; color: #999; margin: 0;">
                    This is an automated notification from the Panchayat Grievance Redressal System.<br>
                    &copy; 2026 Government of India. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
    """

    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_from or smtp_user
        msg['To'] = citizen_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))

        with smtplib.SMTP(smtp_server, int(smtp_port)) as server:
            server.set_debuglevel(0)
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)

        print(f"[NOTIFY] ✅ Status update email sent to {citizen_email} for complaint #{complaint_id}")
        current_app.logger.info(
            "Status notification sent to %s for complaint #%s: %s → %s",
            citizen_email, complaint_id, old_status, new_status
        )
        return True

    except smtplib.SMTPAuthenticationError as exc:
        current_app.logger.error("SMTP Auth failed for notification: %s", exc)
        print(f"[NOTIFY ERROR] Authentication failed: {exc}")
    except smtplib.SMTPException as exc:
        current_app.logger.error("SMTP error for notification: %s", exc)
        print(f"[NOTIFY ERROR] {exc}")
    except Exception as exc:
        current_app.logger.error("Notification email failed: %s", exc)
        print(f"[NOTIFY ERROR] Unexpected: {exc}")

    # Print to console in dev mode
    is_dev = current_app.config.get("FLASK_ENV") == "development" or current_app.debug
    if is_dev:
        print(f"\n{'='*60}")
        print(f"  [DEV NOTIFY] Complaint #{complaint_id}")
        print(f"  To: {citizen_email} ({citizen_name})")
        print(f"  Status: {old_status or '—'} → {new_status}")
        if remarks:
            print(f"  Remarks: {remarks}")
        print(f"{'='*60}\n")

    return False

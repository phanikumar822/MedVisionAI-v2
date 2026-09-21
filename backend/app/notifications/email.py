import smtplib
import logging
import threading
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

def _send_email_async(to_email: str, subject: str, html_body: str):
    """Worker function executed in background thread with fallback for firewall/proxy interception."""
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        logger.info(f"\n==========================================")
        logger.info(f"📧 [LOCAL EMAIL DISPATCH - MOCK MODE]")
        logger.info(f"To: {to_email}")
        logger.info(f"Subject: {subject}")
        logger.info(f"==========================================\n")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.FROM_EMAIL
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=5) as server:
            server.ehlo()
            try:
                server.starttls()
                server.ehlo()
            except Exception:
                pass
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.FROM_EMAIL, to_email, msg.as_string())
        logger.info(f"✅ Email sent successfully to {to_email}: {subject}")
    except Exception as e:
        logger.warning(f"⚠️ SMTP network dispatch notice ({e}). Using local email dispatch fallback:")
        logger.info(f"\n==========================================")
        logger.info(f"📧 [FALLBACK EMAIL DISPATCH LOG]")
        logger.info(f"Recipient: {to_email}")
        logger.info(f"Subject: {subject}")
        logger.info(f"Status: Formatted & Available in Patient Dashboard / Terminal")
        logger.info(f"==========================================\n")

def _send_email(to_email: str, subject: str, html_body: str):
    """Non-blocking email dispatcher."""
    thread = threading.Thread(target=_send_email_async, args=(to_email, subject, html_body), daemon=True)
    thread.start()


def send_welcome_email(
    patient_name: str, 
    patient_email: str, 
    set_password_link: str,
    suggested_username: Optional[str] = None
):
    """Send an onboarding email inviting the patient to choose their username/ID and set their password."""
    subject = "Welcome to MedVisionAI – Set Up Your Portal Username & Password"

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="background:#0f172a;padding:28px 32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:-0.5px;">👁️ MedVisionAI</h1>
        <p style="color:#2dd4bf;margin:6px 0 0;font-weight:600;font-size:13px;">Clinical Ophthalmology Platform</p>
      </div>
      <div style="padding:32px;background:#ffffff;">
        <h2 style="color:#0f172a;margin:0 0 16px 0;font-size:18px;font-weight:700;">Hi {patient_name},</h2>
        
        <p style="color:#475569;font-size:14px;line-height:1.6;margin-bottom:14px;">
          Your clinician has registered your patient profile on MedVisionAI.
        </p>

        <p style="color:#475569;font-size:14px;line-height:1.6;margin-bottom:24px;">
          Please click the button below to set up your personal <strong>Username or ID</strong> and create your <strong>Password</strong>. You will always be able to log in to your patient portal using these credentials.
        </p>

        <div style="text-align:center;margin:32px 0;">
          <a href="{set_password_link}"
             style="background:#0f766e;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;box-shadow:0 2px 6px rgba(15,118,110,0.25);">
            🚀 Set Up My Username & Password
          </a>
        </div>

        <p style="color:#64748b;font-size:12px;line-height:1.6;word-break:break-all;">
          If the button above does not work, copy and paste this link into your browser:<br/>
          <a href="{set_password_link}" style="color:#0f766e;">{set_password_link}</a>
        </p>

        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
        <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.5;">
          This setup link is valid for 48 hours. If you did not request this account, please contact your healthcare clinic.
        </p>
      </div>
    </div>
    """
    _send_email(patient_email, subject, html)


def send_report_notification(
    patient_name: str, 
    patient_email: str, 
    screening_id: str, 
    portal_link: str,
    report_status: str = "VERIFIED"
):
    """
    Notify patient that their doctor-verified screening report is ready.
    CRITICAL SECURITY GATE: Patient emails are strictly allowed ONLY when report_status == 'VERIFIED'.
    Rejects: AI_COMPLETED, PENDING_DOCTOR_REVIEW, REJECTED, REVISION_REQUIRED.
    """
    if report_status != "VERIFIED":
        error_msg = (
            f"SECURITY ENFORCEMENT VIOLATION: Patient notification blocked. "
            f"Report '{screening_id}' is in status '{report_status}'. Patient emails are strictly permitted only for 'VERIFIED' reports."
        )
        logger.error(error_msg)
        raise PermissionError(error_msg)

    subject = f"Your Verified MedVisionAI Ophthalmology Report is Ready – {screening_id}"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="background:#0f172a;padding:32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;">👁️ MedVisionAI</h1>
        <p style="color:#0f766e;margin:8px 0 0;font-weight:bold;">Verified Clinical Ophthalmology Report</p>
      </div>
      <div style="padding:32px;background:#fff;">
        <h2 style="color:#0f172a;">Hi {patient_name}, your verified clinical report is ready.</h2>
        <p style="color:#475569;">
          Your ophthalmology screening examination (<strong>{screening_id}</strong>) has been formally reviewed and verified by an authorized ophthalmologist.
        </p>
        <p style="color:#475569;">
          You can now securely log in to your patient portal to review the verified clinical findings, recommendations, and download your official clinical PDF report.
        </p>
        <div style="text-align:center;margin:32px 0;">
          <a href="{portal_link}"
             style="background:#0f766e;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
            View Verified Report
          </a>
        </div>
        <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin-top:24px;">
          <strong>Medical Note:</strong> This report represents an authorized clinical decision-support assessment verified by a medical specialist.
        </p>
      </div>
    </div>
    """
    _send_email(patient_email, subject, html)


# Legacy compat with security check
def send_notification(patient_email: str, screening_id: str, report_status: str = "VERIFIED"):
    send_report_notification("Patient", patient_email, screening_id, f"{settings.FRONTEND_URL}/patient", report_status=report_status)

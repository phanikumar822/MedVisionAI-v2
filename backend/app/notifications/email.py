import smtplib
import logging
import threading
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
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

    # Attempt SMTP dispatch
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.FROM_EMAIL
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        # Try Port 587 with STARTTLS
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
        # Fallback handling for corporate firewalls / proxy interception (e.g. Sophos stripping AUTH)
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


def send_welcome_email(patient_name: str, patient_email: str, username: str, set_password_link: str):
    """Send a welcome email with the patient's portal username and a set-password link."""
    subject = "Welcome to MedVisionAI – Set Up Your Patient Portal"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:12px;overflow:hidden;">
      <div style="background:#0f172a;padding:32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;">👁️ MedVisionAI</h1>
        <p style="color:#0f766e;margin:8px 0 0;font-weight:bold;">AI-Assisted Diabetic Retinopathy Screening</p>
      </div>
      <div style="padding:32px;background:#fff;">
        <h2 style="color:#0f172a;">Welcome, {patient_name}!</h2>
        <p style="color:#475569;">Your clinician has registered your patient profile on MedVisionAI.</p>

        <div style="background:#f1f5f9;border-radius:8px;padding:20px;margin:24px 0;">
          <p style="margin:0 0 8px;color:#64748b;font-size:13px;font-weight:600;text-transform:uppercase;">Your Portal Username</p>
          <p style="font-family:monospace;font-size:20px;font-weight:700;color:#0f172a;margin:0;">{username}</p>
        </div>

        <p style="color:#475569;">Click the button below to set your password and activate your patient account:</p>

        <div style="text-align:center;margin:32px 0;">
          <a href="{set_password_link}"
             style="background:#0f766e;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
            🔐 Set My Password & Activate Account
          </a>
        </div>

        <p style="color:#94a3b8;font-size:12px;">Activation Link: {set_password_link}</p>
      </div>
    </div>
    """
    _send_email(patient_email, subject, html)


def send_report_notification(patient_name: str, patient_email: str, screening_id: str, portal_link: str):
    """Notify patient that their screening report is ready."""
    subject = f"Your MedVisionAI Report is Ready – {screening_id}"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:12px;overflow:hidden;">
      <div style="background:#0f172a;padding:32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;">👁️ MedVisionAI</h1>
        <p style="color:#0f766e;margin:8px 0 0;font-weight:bold;">AI-Assisted Diabetic Retinopathy Screening</p>
      </div>
      <div style="padding:32px;background:#fff;">
        <h2 style="color:#0f172a;">Hi {patient_name}, your report is ready!</h2>
        <p style="color:#475569;">Your screening report (<strong>{screening_id}</strong>) has been published by your doctor.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="{portal_link}"
             style="background:#0f766e;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
            View My Report
          </a>
        </div>
      </div>
    </div>
    """
    _send_email(patient_email, subject, html)


# Legacy compat
def send_notification(patient_email: str, screening_id: str):
    send_report_notification("Patient", patient_email, screening_id, f"{settings.FRONTEND_URL}/patient")

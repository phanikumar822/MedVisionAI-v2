import smtplib
import logging
import threading
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings

logger = logging.getLogger(__name__)

def _send_email_async(to_email: str, subject: str, html_body: str):
    """Worker function executed in background thread."""
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        logger.info(f"[MOCK EMAIL] To: {to_email}")
        logger.info(f"[MOCK EMAIL] Subject: {subject}")
        logger.info(f"[MOCK EMAIL] Body (HTML): {html_body}")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.FROM_EMAIL
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=5) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.FROM_EMAIL, to_email, msg.as_string())
        logger.info(f"Email sent successfully to {to_email}: {subject}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")

def _send_email(to_email: str, subject: str, html_body: str):
    """Non-blocking email dispatcher."""
    thread = threading.Thread(target=_send_email_async, args=(to_email, subject, html_body), daemon=True)
    thread.start()



def send_welcome_email(patient_name: str, patient_email: str, username: str, set_password_link: str):
    """Send a welcome email with the patient's portal username and a set-password link."""
    subject = "Welcome to MedVisionAI – Set Up Your Patient Portal"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:12px;overflow:hidden;">
      <div style="background:#1e293b;padding:32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;">👁️ MedVisionAI</h1>
        <p style="color:#94a3b8;margin:8px 0 0;">AI-Assisted Diabetic Retinopathy Screening</p>
      </div>
      <div style="padding:32px;background:#fff;">
        <h2 style="color:#1e293b;">Welcome, {patient_name}!</h2>
        <p style="color:#475569;">Your doctor has registered you on the MedVisionAI Patient Portal.
        You can now securely view your screening results, download reports, and chat with our AI assistant.</p>

        <div style="background:#f1f5f9;border-radius:8px;padding:20px;margin:24px 0;">
          <p style="margin:0 0 8px;color:#64748b;font-size:13px;font-weight:600;text-transform:uppercase;">Your Portal Username</p>
          <p style="font-family:monospace;font-size:20px;font-weight:700;color:#1e293b;margin:0;">{username}</p>
        </div>

        <p style="color:#475569;">Click the button below to set your own password and activate your account.
        This link expires in <strong>48 hours</strong>.</p>

        <div style="text-align:center;margin:32px 0;">
          <a href="{set_password_link}"
             style="background:#2563eb;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
            🔐 Set My Password
          </a>
        </div>

        <p style="color:#94a3b8;font-size:12px;">If you did not expect this email, please ignore it.
        MedVisionAI is an AI-assisted screening tool and does not replace evaluation by a qualified healthcare professional.</p>
      </div>
    </div>
    """
    _send_email(patient_email, subject, html)


def send_report_notification(patient_name: str, patient_email: str, screening_id: str, portal_link: str):
    """Notify patient that their screening report is ready."""
    subject = f"Your MedVisionAI Report is Ready – {screening_id}"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:12px;overflow:hidden;">
      <div style="background:#1e293b;padding:32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;">👁️ MedVisionAI</h1>
        <p style="color:#94a3b8;margin:8px 0 0;">AI-Assisted Diabetic Retinopathy Screening</p>
      </div>
      <div style="padding:32px;background:#fff;">
        <h2 style="color:#1e293b;">Hi {patient_name}, your report is ready!</h2>
        <p style="color:#475569;">Your screening report (<strong>{screening_id}</strong>) has been reviewed and published by your doctor.</p>
        <p style="color:#475569;">Log in to your patient portal to:</p>
        <ul style="color:#475569;">
          <li>View your AI screening result</li>
          <li>Download your PDF report</li>
          <li>Ask our AI assistant about your result</li>
        </ul>
        <div style="text-align:center;margin:32px 0;">
          <a href="{portal_link}"
             style="background:#2563eb;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
            View My Report
          </a>
        </div>
        <p style="color:#94a3b8;font-size:12px;">MedVisionAI is an AI-assisted screening tool and does not replace evaluation by a qualified healthcare professional.</p>
      </div>
    </div>
    """
    _send_email(patient_email, subject, html)


# Legacy compat
def send_notification(patient_email: str, screening_id: str):
    send_report_notification("Patient", patient_email, screening_id, "http://localhost:5173/patient")

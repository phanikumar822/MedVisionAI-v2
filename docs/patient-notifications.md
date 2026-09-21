# MedVisionAI Patient Notifications & Delivery Gate

## Overview

A cornerstone safety mechanism of MedVisionAI is the **Verification-Gated Notification Pipeline**. Patients must never receive unverified AI predictions, tentative diagnoses, or alarmist probabilistic outputs. Notifications and report releases are mathematically and architecturally gated behind physician approval.

---

## The Verification Gate In Code

In `backend/app/notifications/email.py`, the notification dispatcher strictly validates the report state before initiating any email transaction:

```python
async def send_report_ready_email(
    to_email: str,
    patient_name: str,
    report_id: int,
    doctor_name: str,
    pdf_path: Optional[str] = None,
    report_status: str = "PENDING_DOCTOR_REVIEW"
) -> bool:
    # Strict Clinical Verification Gate
    if report_status != "VERIFIED":
        logger.error(
            f"[SECURITY VIOLATION] Attempted to dispatch report email to patient "
            f"{to_email} for report {report_id} with unverified status '{report_status}'!"
        )
        raise PermissionError(
            f"Patient notification blocked: Report status is '{report_status}'. "
            f"Only reports with status 'VERIFIED' may be released to patients."
        )
    ...
```

If any service, worker, or malicious API request attempts to trigger `send_report_ready_email` with status `PENDING_DOCTOR_REVIEW`, `DRAFT`, `ANALYZING`, or `REJECTED`, the transaction immediately aborts, throws a `PermissionError`, and writes a security violation record to `audit_logs`.

---

## Patient Email Specifications

### Sender Details
- **From**: `notifications@medvisionai.clinic` / `no-reply@medvision.health`
- **Subject**: `MedVisionAI: Your Verified Eye Examination Report is Ready`

### Email Template
```text
Hi [Patient Name],

Your eye examination report has been reviewed and verified by our medical specialist, Dr. [Doctor Name].

You can now view and download your full diagnostic report and personalized management plan by logging into the MedVisionAI Patient Portal:

Patient Portal: https://medvisionai.clinic/patient
Your Patient Access ID: [PATIENT_ACCESS_ID]

Summary of Clinical Review:
- Examination: [Disease Name] Screening
- Verification Status: Clinically Verified
- Reviewing Physician: Dr. [Doctor Name]
- Key Recommendation: [Doctor's clinical recommendation]

If you have any questions or require urgent care, please contact our clinic directly at support@medvisionai.clinic.

Warm regards,
The MedVisionAI Clinical Team
```

---

## Patient Portal Viewing Restrictions (`/patient`)

The patient dashboard (`frontend/src/pages/PatientDashboard.tsx`) queries `/api/v1/reports/my-reports`.
The backend endpoint enforces:
- Filtering results strictly where `report.status == "VERIFIED"`.
- All unverified, pending, or rejected reports are completely omitted from the patient's record view.
- Patients see:
  - Official Verified Diagnostic Report.
  - Reviewing Ophthalmologist's Name and Verification Date.
  - Doctor's Clinical Findings and Recommendations.
  - Download Button for the official, signed PDF report.
  - Educational guidance on their verified condition.

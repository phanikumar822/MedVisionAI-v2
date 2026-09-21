import pytest
from app.notifications.email import send_report_notification

def test_email_rejected_for_unverified_states():
    """Verify that email dispatch raises PermissionError for all non-VERIFIED states."""
    unverified_statuses = [
        "DRAFT",
        "UPLOADED",
        "ANALYZING",
        "AI_COMPLETED",
        "PENDING_DOCTOR_REVIEW",
        "REJECTED",
        "REVISION_REQUIRED"
    ]
    
    for status in unverified_statuses:
        with pytest.raises(PermissionError) as exc_info:
            send_report_notification(
                patient_name="Test Patient",
                patient_email="patient@example.com",
                screening_id="MV-TEST1234",
                portal_link="http://localhost:5173/patient",
                report_status=status
            )
        assert "SECURITY ENFORCEMENT VIOLATION" in str(exc_info.value)
        assert status in str(exc_info.value)

def test_email_allowed_for_verified_state():
    """Verify that email dispatch is permitted when report status is VERIFIED."""
    # Should execute without raising PermissionError
    try:
        send_report_notification(
            patient_name="Test Patient",
            patient_email="patient@example.com",
            screening_id="MV-TEST1234",
            portal_link="http://localhost:5173/patient",
            report_status="VERIFIED"
        )
    except PermissionError:
        pytest.fail("send_report_notification raised PermissionError unexpectedly for VERIFIED status!")

import pytest
import os
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.database.session import SessionLocal
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.screening import Screening
from app.models.report import Report, ReportStatus
from app.auth.security import create_access_token

client = TestClient(app)

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_full_doctor_verification_workflow(db_session):
    """
    End-to-end test of the clinical decision support state machine:
    1. Case creation sets status to PENDING_DOCTOR_REVIEW.
    2. Clinician cannot verify reports (RBAC enforcement).
    3. Patient cannot view or download unverified report.
    4. Doctor reviews case, verifies findings, and state transitions to VERIFIED.
    5. Patient can now view the verified report.
    """
    # 1. Ensure test users and patient exist
    clinician = db_session.query(User).filter(User.username == "dr.screening").first()
    doctor = db_session.query(User).filter(User.username == "dr.specialist").first()
    
    test_patient = db_session.query(Patient).first()
    if not test_patient:
        patient_user = User(username="test.patient", role=UserRole.PATIENT)
        db_session.add(patient_user)
        db_session.commit()
        db_session.refresh(patient_user)
        
        test_patient = Patient(
            first_name="Jane",
            last_name="Doe",
            patient_access_id="PT-TEST1",
            user_id=patient_user.id,
            email="test.jane@example.com"
        )
        db_session.add(test_patient)
        db_session.commit()
        db_session.refresh(test_patient)

    patient_user = db_session.query(User).filter(User.id == test_patient.user_id).first()

    clinician_token = create_access_token({"sub": clinician.username})
    doctor_token = create_access_token({"sub": doctor.username})
    patient_token = create_access_token({"sub": patient_user.username})

    # 2. Clinician screens a case (using Vision Assessment to test non-image flow)
    res = client.post(
        "/api/v1/screen/",
        data={
            "patient_id": test_patient.id,
            "disease_id": "vision_assessment",
            "modality": "Clinical Refraction Data",
            "eye": "OD"
        },
        headers={"Authorization": f"Bearer {clinician_token}"}
    )
    assert res.status_code == 200, res.text
    case_data = res.json()
    report_id = case_data["report_id"]
    assert case_data["status"] == "PENDING_DOCTOR_REVIEW"

    # 3. Clinician tries to verify report -> FORBIDDEN (403)
    res_clinician_verify = client.post(
        f"/api/v1/reports/{report_id}/verify",
        json={"doctor_findings": "Unauthorized clinician verification attempt", "doctor_notes": "Note"},
        headers={"Authorization": f"Bearer {clinician_token}"}
    )
    assert res_clinician_verify.status_code == 403

    # 4. Patient checks my-reports -> Unverified report must NOT be returned
    res_patient_reports = client.get(
        "/api/v1/reports/my-reports",
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    assert res_patient_reports.status_code == 200
    patient_report_ids = [r["id"] for r in res_patient_reports.json()]
    assert report_id not in patient_report_ids

    # 5. Doctor checks review queue -> Report is visible
    res_queue = client.get(
        "/api/v1/reports/queue",
        headers={"Authorization": f"Bearer {doctor_token}"}
    )
    assert res_queue.status_code == 200
    queue_report_ids = [r["report_id"] for r in res_queue.json()]
    assert report_id in queue_report_ids

    # 6. Doctor verifies the report
    res_doctor_verify = client.post(
        f"/api/v1/reports/{report_id}/verify",
        json={
            "doctor_findings": "Confirmed simple myopia and mild astigmatism with preserved macula.",
            "doctor_notes": "Prescribed corrective spectacle lenses. Review in 12 months."
        },
        headers={"Authorization": f"Bearer {doctor_token}"}
    )
    assert res_doctor_verify.status_code == 200
    assert res_doctor_verify.json()["report_status"] == "VERIFIED"

    # 7. Patient now checks my-reports -> Report is NOW visible!
    res_patient_verified = client.get(
        "/api/v1/reports/my-reports",
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    assert res_patient_verified.status_code == 200
    verified_report_ids = [r["id"] for r in res_patient_verified.json()]
    assert report_id in verified_report_ids

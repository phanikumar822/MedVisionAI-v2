from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.auth.deps import require_role
from app.auth.security import get_password_hash
from app.notifications.email import send_welcome_email
from app.core.config import settings
import uuid
import secrets
import re
from datetime import datetime, timedelta

router = APIRouter()

class CreatePatientRequest(BaseModel):
    first_name: str
    last_name: str
    email: str  # Required for welcome email
    phone: Optional[str] = None


def _generate_username(first_name: str, last_name: str, db: Session) -> str:
    """Generate a unique username like john.doe_k3m9"""
    base = f"{first_name.lower()}.{last_name.lower()}"
    # Remove any non-alphanumeric chars except dot
    base = re.sub(r"[^a-z0-9.]", "", base)
    # Try base first, then add random suffix until unique
    for _ in range(10):
        suffix = secrets.token_hex(2)  # 4 random hex chars e.g. 'a3f2'
        candidate = f"{base}_{suffix}"
        if not db.query(User).filter(User.username == candidate).first():
            return candidate
    # Ultimate fallback
    return f"{base}_{uuid.uuid4().hex[:6]}"


@router.post("/", status_code=201)
def create_patient(
    data: CreatePatientRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.HEALTHCARE_WORKER, UserRole.ADMIN]))
):
    # Auto-generate username from patient name
    username = _generate_username(data.first_name, data.last_name, db)

    # Generate a secure one-time password-reset token (48h expiry)
    reset_token = secrets.token_urlsafe(32)
    token_expires = datetime.utcnow() + timedelta(hours=48)

    # Create user account – NO password yet, patient sets it themselves
    user = User(
        username=username,
        hashed_password=None,
        role=UserRole.PATIENT,
        reset_token=reset_token,
        reset_token_expires=token_expires,
        require_password_change=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create patient profile
    patient_access_id = f"MV-PAT-{uuid.uuid4().hex[:6].upper()}"
    patient = Patient(
        user_id=user.id,
        patient_access_id=patient_access_id,
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email,
        phone=data.phone,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)

    # Send welcome email with username + set-password link
    full_name = f"{data.first_name} {data.last_name}"
    set_password_link = f"{settings.FRONTEND_URL}/set-password?token={reset_token}"
    send_welcome_email(full_name, data.email, username, set_password_link)

    return {
        "patient_id": patient.id,
        "patient_access_id": patient_access_id,
        "username": username,
        "email": data.email,
        "set_password_link": set_password_link,
        "message": f"Patient account created. Welcome email with set-password link sent to {data.email}.",
    }


@router.get("/")
def list_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.HEALTHCARE_WORKER, UserRole.ADMIN]))
):
    patients = db.query(Patient).all()
    return [
        {
            "id": p.id,
            "patient_access_id": p.patient_access_id,
            "name": f"{p.first_name} {p.last_name}",
            "email": p.email,
            "username": p.user.username if p.user else None,
            "portal_active": p.user.hashed_password is not None if p.user else False,
        }
        for p in patients
    ]


@router.delete("/{patient_id}")
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.HEALTHCARE_WORKER, UserRole.ADMIN]))
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    user_id = patient.user_id

    # Delete associated screenings and reports
    from app.models.screening import Screening
    from app.models.report import Report
    from app.rag.store import chroma_store

    screenings = db.query(Screening).filter(Screening.patient_id == patient_id).all()
    screening_ids = [s.id for s in screenings]

    if screening_ids:
        db.query(Report).filter(Report.screening_id.in_(screening_ids)).delete(synchronize_session=False)
        db.query(Screening).filter(Screening.id.in_(screening_ids)).delete(synchronize_session=False)

    # Delete patient vector embeddings from Chroma
    chroma_store.delete_patient_reports(patient_id)

    # Delete patient profile
    db.delete(patient)

    # Delete associated user account
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            db.delete(user)

    db.commit()
    return {"message": "Patient and all associated records deleted successfully"}


@router.get("/export/csv")
def export_patients_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.HEALTHCARE_WORKER, UserRole.ADMIN]))
):
    import csv
    import io
    from fastapi.responses import Response
    from app.models.screening import Screening

    patients = db.query(Patient).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # CSV Header
    writer.writerow([
        "Patient ID",
        "Patient Access Code",
        "Full Name",
        "Email",
        "Phone",
        "Portal Username",
        "Account Active",
        "Total Screenings",
        "Latest Screening ID",
        "Latest Prediction",
        "Latest Confidence",
        "Latest Risk Level",
        "Latest Recommendation"
    ])

    for p in patients:
        screenings = db.query(Screening).filter(Screening.patient_id == p.id).order_by(Screening.created_at.desc()).all()
        latest = screenings[0] if screenings else None

        writer.writerow([
            p.id,
            p.patient_access_id,
            f"{p.first_name} {p.last_name}",
            p.email or "",
            p.phone or "",
            p.user.username if p.user else "",
            "Yes" if (p.user and p.user.hashed_password) else "Pending Activation",
            len(screenings),
            latest.screening_id if latest else "N/A",
            latest.prediction if latest else "N/A",
            f"{latest.confidence * 100:.1f}%" if latest else "N/A",
            latest.risk_level if latest else "N/A",
            latest.recommendation if latest else "N/A"
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=MedVisionAI_Patients_Export.csv"}
    )

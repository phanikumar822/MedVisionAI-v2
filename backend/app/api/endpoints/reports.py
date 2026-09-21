from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.screening import Screening
from app.models.report import Report, ReportStatus
from app.models.patient import Patient
from app.auth.deps import get_current_user, require_role
from app.reports.pdf_generator import generate_pdf_report
from app.notifications.email import send_report_notification
from app.services.audit_service import log_audit_event
from app.core.config import settings

router = APIRouter()

def path_to_url(path: str | None) -> str | None:
    if not path:
        return None
    norm = path.replace("\\", "/")
    if norm.startswith("uploads/"):
        return f"http://localhost:8000/{norm}"
    return f"http://localhost:8000/uploads/{norm}"

@router.get("/queue")
def get_doctor_review_queue(
    status_filter: Optional[str] = None,
    disease_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.SPECIALIST, UserRole.ADMIN, UserRole.HEALTHCARE_WORKER]))
):
    """
    Retrieve clinical review queue for ophthalmologists.
    Filterable by review status and target disease.
    """
    query = db.query(Report).join(Screening)
    
    if status_filter:
        query = query.filter(Report.status == status_filter)
    else:
        # Default: cases pending doctor review
        query = query.filter(Report.status == ReportStatus.PENDING_DOCTOR_REVIEW)
        
    if disease_id:
        query = query.filter(Screening.disease_id == disease_id)

    reports = query.order_by(Report.created_at.desc()).all()

    queue = []
    for r in reports:
        p = db.query(Patient).filter(Patient.id == r.screening.patient_id).first()
        queue.append({
            "report_id": r.id,
            "screening_id": r.screening.screening_id,
            "patient_id": r.screening.patient_id,
            "patient_name": f"{p.first_name} {p.last_name}" if p else "Unknown",
            "patient_email": p.email if p else None,
            "disease_id": r.screening.disease_id,
            "disease_name": r.screening.disease_name,
            "modality": r.screening.modality,
            "eye": r.screening.eye,
            "prediction": r.screening.prediction,
            "severity_grade": r.screening.severity_grade,
            "confidence": r.screening.confidence,
            "risk_level": r.screening.risk_level,
            "recommendation": r.screening.recommendation,
            "ai_context": r.screening.ai_context,
            "status": r.status,
            "quality_score": r.screening.quality_score,
            "quality_status": r.screening.quality_status,
            "requires_human_review": r.screening.requires_human_review,
            "image_url": path_to_url(r.screening.image_path),
            "heatmap_url": path_to_url(r.screening.heatmap_path),
            "multi_model_results": r.screening.multi_model_results,
            "clinical_measurements": r.screening.clinical_measurements,
            "created_at": r.created_at,
            "report_version": r.report_version,
            "doctor_findings": r.doctor_findings,
            "doctor_notes": r.doctor_notes
        })
    return queue

@router.post("/{report_id}/verify")
def verify_report(
    report_id: int,
    doctor_findings: str = Body(..., embed=True),
    doctor_notes: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.SPECIALIST, UserRole.ADMIN]))
):
    """
    Doctor Verification Gate:
    Only an authorized ophthalmologist or admin can verify a report.
    Freezes model findings, records verification timestamp, generates verified PDF,
    sets status to VERIFIED, and triggers patient notification.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    screening = report.screening
    patient = db.query(Patient).filter(Patient.id == screening.patient_id).first()

    # 1. State transition
    report.status = ReportStatus.VERIFIED
    screening.status = ReportStatus.VERIFIED
    report.is_published = True
    report.verified_by_doctor_id = current_user.id
    report.verified_at = datetime.utcnow()
    report.doctor_findings = doctor_findings
    report.doctor_notes = doctor_notes or screening.recommendation
    report.doctor_action = "VERIFIED"
    report.report_version = (report.report_version or 1) + 1

    # 2. Re-generate verified PDF report with doctor verification stamp
    verified_pdf_path = generate_pdf_report(screening, patient, doctor=current_user, verified=True)
    report.pdf_path = verified_pdf_path

    db.commit()
    db.refresh(report)

    # 3. Push to RAG store
    try:
        from app.rag.store import chroma_store
        report_text = (
            f"Verified Screening ID: {screening.screening_id}. Disease: {screening.disease_name}. "
            f"AI Finding: {screening.prediction}. Doctor Finding: {report.doctor_findings}. "
            f"Management Notes: {report.doctor_notes}"
        )
        chroma_store.add_report(patient.id, screening.screening_id, report_text)
    except Exception as e:
        print(f"[RAG Store] Notice: {e}")

    # 4. Log audit event
    log_audit_event(
        db=db,
        action="REPORT_VERIFIED",
        user_id=current_user.id,
        role=current_user.role,
        case_id=screening.screening_id,
        report_id=report.id,
        details=f"Report formally verified by Dr. {current_user.username}. Doctor findings: '{doctor_findings}'."
    )

    # 5. Verification-gated email notification to patient
    if patient and patient.email:
        try:
            send_report_notification(
                patient_name=f"{patient.first_name} {patient.last_name}",
                patient_email=patient.email,
                screening_id=screening.screening_id,
                portal_link=f"{settings.FRONTEND_URL}/patient",
                report_status="VERIFIED"
            )
            log_audit_event(
                db=db,
                action="EMAIL_SENT",
                user_id=current_user.id,
                role="SYSTEM",
                case_id=screening.screening_id,
                report_id=report.id,
                details=f"Verified report notification dispatched to patient email: {patient.email}."
            )
        except Exception as e:
            print(f"[Email Dispatch Warning] {e}")

    return {
        "status": "success",
        "message": f"Report {screening.screening_id} successfully verified by Dr. {current_user.username}",
        "report_id": report.id,
        "report_status": report.status,
        "verified_at": report.verified_at
    }

@router.post("/{report_id}/reject")
def reject_report(
    report_id: int,
    rejection_reason: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.SPECIALIST, UserRole.ADMIN]))
):
    """Doctor rejects the screening case due to inadequate imaging or conflicting signs."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = ReportStatus.REJECTED
    report.screening.status = ReportStatus.REJECTED
    report.doctor_action = "REJECTED"
    report.doctor_notes = rejection_reason
    db.commit()

    log_audit_event(
        db=db,
        action="REPORT_REJECTED",
        user_id=current_user.id,
        role=current_user.role,
        case_id=report.screening.screening_id,
        report_id=report.id,
        details=f"Report rejected by Dr. {current_user.username}. Reason: '{rejection_reason}'."
    )

    return {"status": "success", "message": "Case rejected by doctor", "report_status": report.status}

@router.post("/{report_id}/request-revision")
def request_case_revision(
    report_id: int,
    revision_instructions: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.SPECIALIST, UserRole.ADMIN]))
):
    """Doctor requests clinical revision / re-scan from healthcare clinician."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = ReportStatus.REVISION_REQUIRED
    report.screening.status = ReportStatus.REVISION_REQUIRED
    report.doctor_action = "REVISION_REQUIRED"
    report.doctor_notes = revision_instructions
    db.commit()

    log_audit_event(
        db=db,
        action="REPORT_REVISION_REQUESTED",
        user_id=current_user.id,
        role=current_user.role,
        case_id=report.screening.screening_id,
        report_id=report.id,
        details=f"Revision requested by Dr. {current_user.username}. Instructions: '{revision_instructions}'."
    )

    return {"status": "success", "message": "Revision requested from clinician", "report_status": report.status}

@router.get("/{report_id}/download")
def download_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    # Patient authorization: can ONLY access verified reports belonging to them
    if current_user.role == UserRole.PATIENT:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or report.screening.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this report")
        if report.status != ReportStatus.VERIFIED or not report.is_published:
            raise HTTPException(status_code=403, detail="This screening examination is pending doctor verification.")

    log_audit_event(
        db=db,
        action="REPORT_DOWNLOADED",
        user_id=current_user.id,
        role=current_user.role,
        case_id=report.screening.screening_id,
        report_id=report.id,
        details=f"Report PDF downloaded by user '{current_user.username}' ({current_user.role})."
    )

    return FileResponse(
        report.pdf_path, 
        media_type="application/pdf", 
        filename=f"MedVisionAI_Verified_Report_{report.screening.screening_id}.pdf"
    )

@router.get("/my-reports")
def get_my_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.PATIENT]))
):
    """
    Patient Portal: Strictly returns verified clinical reports only.
    Unverified AI outputs are strictly hidden from patients.
    """
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
        
    # Filter strictly for VERIFIED and published reports
    reports = db.query(Report).join(Screening).filter(
        Screening.patient_id == patient.id,
        Report.status == ReportStatus.VERIFIED,
        Report.is_published == True
    ).order_by(Report.created_at.desc()).all()
    
    return [
        {
            "id": r.id,
            "screening_id": r.screening.screening_id,
            "disease_id": r.screening.disease_id,
            "disease_name": r.screening.disease_name,
            "modality": r.screening.modality,
            "eye": r.screening.eye,
            "prediction": r.screening.prediction,
            "severity_grade": r.screening.severity_grade,
            "confidence": r.screening.confidence,
            "risk_level": r.screening.risk_level,
            "doctor_findings": r.doctor_findings,
            "doctor_notes": r.doctor_notes,
            "verified_at": r.verified_at,
            "created_at": r.created_at,
            "pdf_path": r.pdf_path,
            "status": r.status
        } for r in reports
    ]

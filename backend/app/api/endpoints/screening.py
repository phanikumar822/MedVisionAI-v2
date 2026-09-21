import os
import uuid
import json
import shutil
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.screening import Screening
from app.models.report import Report, ReportStatus
from app.models.patient import Patient
from app.auth.deps import get_current_user, require_role
from app.rag.llm import generate_ai_clinical_context
from app.reports.pdf_generator import generate_pdf_report
from app.services.quality_gate import quality_gate
from app.services.modality_router import modality_router
from app.services.audit_service import log_audit_event
from app.models_engine.registry import model_registry, DISEASE_CATALOGUE

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def path_to_url(path: str | None) -> str | None:
    if not path:
        return None
    norm = path.replace("\\", "/")
    if norm.startswith("uploads/"):
        return f"http://localhost:8000/{norm}"
    return f"http://localhost:8000/uploads/{norm}"

@router.get("/stats")
def get_screening_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.now()
    today_start = datetime(now.year, now.month, now.day, 0, 0, 0)
    
    total = db.query(Screening).count()
    today_count = db.query(Screening).filter(Screening.created_at >= today_start).count()
    pending_review = db.query(Report).filter(Report.status == ReportStatus.PENDING_DOCTOR_REVIEW).count()
    verified_count = db.query(Report).filter(Report.status == ReportStatus.VERIFIED).count()
    
    return {
        "total_screenings": total,
        "screenings_today": today_count,
        "pending_doctor_review": pending_review,
        "verified_count": verified_count
    }

@router.post("/", response_model=dict)
def screen_case(
    patient_id: int = Form(...),
    disease_id: str = Form("diabetic_retinopathy"),
    modality: Optional[str] = Form(None),
    eye: str = Form("OD"),
    refraction_data: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.HEALTHCARE_WORKER, UserRole.SPECIALIST, UserRole.ADMIN]))
):
    # 1. Validate patient existence
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient ID {patient_id} not found.")

    disease_info = DISEASE_CATALOGUE.get(disease_id)
    if not disease_info:
        raise HTTPException(status_code=400, detail=f"Unsupported disease identifier: '{disease_id}'.")

    selected_modality = modality or disease_info.default_modality
    screening_id_str = f"MV-{uuid.uuid4().hex[:8].upper()}"

    # Log initial Case Creation event
    log_audit_event(
        db=db,
        action="CASE_CREATED",
        user_id=current_user.id,
        role=current_user.role,
        case_id=screening_id_str,
        details=f"Case created for patient '{patient.first_name} {patient.last_name}' (ID: {patient.id}) targeting disease '{disease_info.disease_name}'."
    )

    # 2. Handle Non-Imaging Modality: Vision Assessment
    if disease_id == "vision_assessment":
        adapter, err = modality_router.route(disease_id, selected_modality)
        if err or not adapter:
            raise HTTPException(status_code=400, detail=err)

        refraction_dict = {}
        if refraction_data:
            try:
                refraction_dict = json.loads(refraction_data)
            except Exception:
                pass
        else:
            refraction_dict = {"sphere": -1.50, "cylinder": -0.75, "axis": 90, "visual_acuity": "20/40", "age": 35}

        preprocessed = adapter.preprocess(refraction_dict)
        ai_res = adapter.predict(preprocessed)

        # Create screening record
        new_screening = Screening(
            screening_id=screening_id_str,
            patient_id=patient.id,
            healthcare_worker_id=current_user.id,
            disease_id=disease_id,
            disease_name=disease_info.disease_name,
            modality=selected_modality,
            eye=eye,
            model_id=adapter.get_metadata().model_id,
            model_version=adapter.get_metadata().model_version,
            status=ReportStatus.PENDING_DOCTOR_REVIEW,
            quality_score=100.0,
            quality_status="PASSED",
            uncertainty_score=ai_res.get("uncertainty_score", 0.0),
            requires_human_review=ai_res.get("requires_human_review", False),
            image_path="",
            heatmap_path="",
            prediction=ai_res["prediction"],
            severity_grade=ai_res.get("severity_grade"),
            probability_disease=ai_res.get("probability_disease", 0.90),
            probability_normal=ai_res.get("probability_normal", 0.10),
            confidence=ai_res.get("confidence", 0.95),
            risk_level=ai_res.get("risk_level", "LOW"),
            recommendation=ai_res.get("recommendation", ""),
            clinical_measurements=json.dumps(refraction_dict)
        )
        db.add(new_screening)
        db.commit()
        db.refresh(new_screening)

        # Create preliminary Report
        new_report = Report(
            screening_id=new_screening.id,
            status=ReportStatus.PENDING_DOCTOR_REVIEW,
            is_published=False,
            pdf_path=""
        )
        db.add(new_report)
        db.commit()
        db.refresh(new_report)

        pdf_path = generate_pdf_report(new_screening, patient, doctor=None, verified=False)
        new_report.pdf_path = pdf_path
        db.commit()

        log_audit_event(
            db=db,
            action="MODEL_COMPLETED",
            user_id=current_user.id,
            role=current_user.role,
            case_id=screening_id_str,
            report_id=new_report.id,
            model_id=adapter.get_metadata().model_id,
            model_version=adapter.get_metadata().model_version,
            details=f"Vision assessment completed: {ai_res['prediction']}."
        )

        return {
            "id": new_screening.id,
            "screening_id": new_screening.screening_id,
            "disease_id": new_screening.disease_id,
            "disease_name": new_screening.disease_name,
            "modality": new_screening.modality,
            "eye": new_screening.eye,
            "prediction": new_screening.prediction,
            "severity_grade": new_screening.severity_grade,
            "confidence": new_screening.confidence,
            "risk_level": new_screening.risk_level,
            "recommendation": new_screening.recommendation,
            "requires_human_review": new_screening.requires_human_review,
            "status": new_screening.status,
            "report_id": new_report.id
        }

    # 3. Handle Imaging Modalities (Fundus, OCT, Slit-Lamp)
    if not file:
        raise HTTPException(status_code=400, detail="Image scan upload is required for this examination.")

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file format. Uploaded file must be an image.")

    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    log_audit_event(
        db=db,
        action="IMAGE_UPLOADED",
        user_id=current_user.id,
        role=current_user.role,
        case_id=screening_id_str,
        details=f"Image scan uploaded ({file.filename}) and stored at {file_path}."
    )

    # 4. Image Quality Gating Check
    quality_res = quality_gate.evaluate(file_path)
    if not quality_res.passed:
        log_audit_event(
            db=db,
            action="QUALITY_CHECK_FAILED",
            user_id=current_user.id,
            role=current_user.role,
            case_id=screening_id_str,
            details=f"Quality check rejected: {quality_res.rejection_reason}"
        )
        raise HTTPException(
            status_code=400,
            detail={
                "result": "UNABLE TO ANALYZE",
                "reason": "Input image quality is insufficient for the selected model.",
                "details": quality_res.issues,
                "score": quality_res.score
            }
        )

    # 5. Route to Disease Model Adapter
    adapter, err = modality_router.route(disease_id, selected_modality)
    if err or not adapter:
        raise HTTPException(status_code=400, detail=err)

    log_audit_event(
        db=db,
        action="MODEL_STARTED",
        user_id=current_user.id,
        role=current_user.role,
        case_id=screening_id_str,
        model_id=adapter.get_metadata().model_id,
        model_version=adapter.get_metadata().model_version,
        details=f"Starting AI inference with primary adapter: {adapter.get_metadata().model_id}."
    )

    # Preprocess & Predict
    preprocessed_data = adapter.preprocess(file_path)
    ai_res = adapter.predict(preprocessed_data)
    heatmap_path = adapter.explain(file_path, ai_res)

    # Multi-Model Comparison (for DR, compare primary EfficientNet with secondary OPENEye-FM head)
    multi_model_data = {}
    if disease_id == "diabetic_retinopathy":
        sec_adapter = model_registry.get_adapter("openeye_fm_dr_head", mode="demo")
        if sec_adapter:
            sec_res = sec_adapter.predict(file_path)
            multi_model_data = {
                "primary_model": {
                    "model_id": adapter.get_metadata().model_id,
                    "model_version": adapter.get_metadata().model_version,
                    "prediction": ai_res["prediction"],
                    "confidence": ai_res["confidence"],
                    "status": adapter.get_metadata().status
                },
                "secondary_foundation_model": {
                    "model_id": sec_adapter.get_metadata().model_id,
                    "model_version": sec_adapter.get_metadata().model_version,
                    "prediction": sec_res["prediction"],
                    "confidence": sec_res["confidence"],
                    "status": sec_adapter.get_metadata().status
                },
                "consensus": ai_res["prediction"] == sec_res["prediction"]
            }

    # Generate Grok AI clinical context
    ai_context_text = generate_ai_clinical_context(
        prediction=ai_res.get("prediction", "NO DR"),
        confidence=ai_res.get("confidence", 0.0),
        risk_level=ai_res.get("risk_level", "LOW"),
        probability_dr=ai_res.get("probability_disease", 0.0),
        probability_no_dr=ai_res.get("probability_normal", 0.0)
    )

    # Save Screening Record
    new_screening = Screening(
        screening_id=screening_id_str,
        patient_id=patient.id,
        healthcare_worker_id=current_user.id,
        disease_id=disease_id,
        disease_name=disease_info.disease_name,
        modality=selected_modality,
        eye=eye,
        model_id=adapter.get_metadata().model_id,
        model_version=adapter.get_metadata().model_version,
        status=ReportStatus.PENDING_DOCTOR_REVIEW,
        quality_score=quality_res.score,
        quality_status="PASSED",
        uncertainty_score=ai_res.get("uncertainty_score", 0.0),
        requires_human_review=ai_res.get("requires_human_review", True),
        image_path=file_path,
        heatmap_path=heatmap_path,
        prediction=ai_res["prediction"],
        severity_grade=ai_res.get("severity_grade"),
        probability_disease=ai_res.get("probability_disease"),
        probability_normal=ai_res.get("probability_normal"),
        probability_dr=ai_res.get("probability_dr", ai_res.get("probability_disease")),
        probability_no_dr=ai_res.get("probability_no_dr", ai_res.get("probability_normal")),
        confidence=ai_res.get("confidence"),
        risk_level=ai_res.get("risk_level"),
        recommendation=ai_res.get("recommendation"),
        ai_context=ai_context_text,
        multi_model_results=json.dumps(multi_model_data) if multi_model_data else None
    )
    db.add(new_screening)
    db.commit()
    db.refresh(new_screening)

    # Create preliminary Report
    new_report = Report(
        screening_id=new_screening.id,
        status=ReportStatus.PENDING_DOCTOR_REVIEW,
        is_published=False,
        pdf_path=""
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    pdf_path = generate_pdf_report(new_screening, patient, doctor=None, verified=False)
    new_report.pdf_path = pdf_path
    db.commit()

    log_audit_event(
        db=db,
        action="MODEL_COMPLETED",
        user_id=current_user.id,
        role=current_user.role,
        case_id=screening_id_str,
        report_id=new_report.id,
        model_id=adapter.get_metadata().model_id,
        model_version=adapter.get_metadata().model_version,
        details=f"Inference completed: {ai_res['prediction']} with confidence {ai_res['confidence']*100:.1f}%. Case routed to Pending Doctor Review."
    )

    return {
        "id": new_screening.id,
        "screening_id": new_screening.screening_id,
        "disease_id": new_screening.disease_id,
        "disease_name": new_screening.disease_name,
        "modality": new_screening.modality,
        "eye": new_screening.eye,
        "prediction": new_screening.prediction,
        "severity_grade": new_screening.severity_grade,
        "probability_disease": new_screening.probability_disease,
        "probability_normal": new_screening.probability_normal,
        "probability_dr": new_screening.probability_dr,
        "probability_no_dr": new_screening.probability_no_dr,
        "confidence": new_screening.confidence,
        "risk_level": new_screening.risk_level,
        "recommendation": new_screening.recommendation,
        "ai_context": new_screening.ai_context,
        "quality_score": new_screening.quality_score,
        "quality_status": new_screening.quality_status,
        "uncertainty_score": new_screening.uncertainty_score,
        "requires_human_review": new_screening.requires_human_review,
        "status": new_screening.status,
        "report_id": new_report.id,
        "image_url": path_to_url(new_screening.image_path),
        "heatmap_url": path_to_url(new_screening.heatmap_path),
        "multi_model_results": multi_model_data
    }

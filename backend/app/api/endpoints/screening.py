from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.screening import Screening
from app.models.patient import Patient
from app.auth.deps import get_current_user, require_role
from app.services.inference import inference_service
import shutil
import os
import uuid

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
    current_user: User = Depends(require_role([UserRole.HEALTHCARE_WORKER, UserRole.ADMIN]))
):
    now = datetime.now()
    today_start = datetime(now.year, now.month, now.day, 0, 0, 0)
    
    total = db.query(Screening).count()
    today_count = db.query(Screening).filter(Screening.created_at >= today_start).count()
    dr_count = db.query(Screening).filter(Screening.prediction == "DR PRESENT").count()
    no_dr_count = db.query(Screening).filter(Screening.prediction == "NO DR").count()
    
    return {
        "total_screenings": total,
        "screenings_today": today_count,
        "dr_present_count": dr_count,
        "no_dr_count": no_dr_count
    }

@router.post("/", response_model=dict)
def screen_image(
    patient_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.HEALTHCARE_WORKER, UserRole.ADMIN]))
):
    # Validate patient
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Must be an image.")

    # Save file temporarily
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Run inference
        result = inference_service.predict(file_path)
        
        # Save screening record
        screening_id_str = f"MV-{uuid.uuid4().hex[:8].upper()}"
        
        new_screening = Screening(
            screening_id=screening_id_str,
            patient_id=patient.id,
            healthcare_worker_id=current_user.id,
            image_path=file_path,
            heatmap_path=result.get("heatmap_path"),
            prediction=result.get("prediction"),
            probability_dr=result.get("probability_dr"),
            probability_no_dr=result.get("probability_no_dr"),
            confidence=result.get("confidence"),
            risk_level=result.get("risk_level"),
            recommendation=result.get("recommendation")
        )
        db.add(new_screening)
        db.commit()
        db.refresh(new_screening)
        
        return {
            "id": new_screening.id,
            "screening_id": new_screening.screening_id,
            "prediction": new_screening.prediction,
            "probability_dr": new_screening.probability_dr,
            "probability_no_dr": new_screening.probability_no_dr,
            "confidence": new_screening.confidence,
            "risk_level": new_screening.risk_level,
            "recommendation": new_screening.recommendation,
            "image_url": path_to_url(new_screening.image_path),
            "heatmap_url": path_to_url(new_screening.heatmap_path)
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print("Screening exception:", e)
        raise HTTPException(status_code=500, detail="Inference failed")


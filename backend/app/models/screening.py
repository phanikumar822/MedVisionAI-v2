from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.session import Base

class Screening(Base):
    __tablename__ = "screenings"

    id = Column(Integer, primary_key=True, index=True)
    screening_id = Column(String, unique=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    healthcare_worker_id = Column(Integer, ForeignKey("users.id"))
    
    # Disease & Modality Routing
    disease_id = Column(String, default="diabetic_retinopathy", index=True)
    disease_name = Column(String, default="Diabetic Retinopathy")
    modality = Column(String, default="Fundus")
    eye = Column(String, default="OD")  # OD, OS, OU
    
    # Model Metadata Tracking
    model_id = Column(String, default="medvision_dr_efficientnet_b0")
    model_version = Column(String, default="1.2.0")
    checkpoint_hash = Column(String, nullable=True)
    
    # State Machine & Quality
    status = Column(String, default="PENDING_DOCTOR_REVIEW", index=True)
    quality_score = Column(Float, nullable=True, default=100.0)
    quality_status = Column(String, default="PASSED")  # PASSED, WARNING, REJECTED
    uncertainty_score = Column(Float, nullable=True, default=0.0)
    requires_human_review = Column(Boolean, default=True)

    # Scans & Overlays
    image_path = Column(String)
    heatmap_path = Column(String, nullable=True)
    
    # AI Predictions
    prediction = Column(String)
    severity_grade = Column(String, nullable=True)
    probability_dr = Column(Float, nullable=True)        # Legacy compat key
    probability_no_dr = Column(Float, nullable=True)     # Legacy compat key
    probability_disease = Column(Float, nullable=True)
    probability_normal = Column(Float, nullable=True)
    confidence = Column(Float)
    risk_level = Column(String)
    recommendation = Column(Text)
    ai_context = Column(Text, nullable=True)

    # Multi-Model & Quantitative Measurements (e.g. Refraction)
    multi_model_results = Column(Text, nullable=True)
    clinical_measurements = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="screenings")
    healthcare_worker = relationship("User", foreign_keys=[healthcare_worker_id])
    report = relationship("Report", back_populates="screening", uselist=False)

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.session import Base

class ReportStatus:
    DRAFT = "DRAFT"
    UPLOADED = "UPLOADED"
    ANALYZING = "ANALYZING"
    AI_COMPLETED = "AI_COMPLETED"
    PENDING_DOCTOR_REVIEW = "PENDING_DOCTOR_REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    REVISION_REQUIRED = "REVISION_REQUIRED"

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    screening_id = Column(Integer, ForeignKey("screenings.id"))
    pdf_path = Column(String)
    
    # State Machine & Verification Gate
    status = Column(String, default=ReportStatus.PENDING_DOCTOR_REVIEW, index=True)
    is_published = Column(Boolean, default=False)
    
    # Doctor Verification Metadata
    verified_by_doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    doctor_action = Column(String, nullable=True)  # VERIFIED, REJECTED, REVISION_REQUIRED
    doctor_findings = Column(Text, nullable=True)
    doctor_notes = Column(Text, nullable=True)
    report_version = Column(Integer, default=1)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    screening = relationship("Screening", back_populates="report")
    doctor = relationship("User", foreign_keys=[verified_by_doctor_id])

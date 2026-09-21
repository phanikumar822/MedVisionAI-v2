from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.database.session import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    role = Column(String, default="SYSTEM")
    action = Column(String, index=True)  # CASE_CREATED, IMAGE_UPLOADED, MODEL_STARTED, MODEL_COMPLETED, REPORT_CREATED, DOCTOR_REVIEWED, REPORT_VERIFIED, REPORT_REJECTED, REPORT_REVISION_REQUESTED, EMAIL_SENT, REPORT_DOWNLOADED
    case_id = Column(String, nullable=True, index=True)
    report_id = Column(Integer, nullable=True)
    model_id = Column(String, nullable=True)
    model_version = Column(String, nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.session import Base
import enum
from sqlalchemy import Enum

class ReferralStatus(str, enum.Enum):
    PENDING = "PENDING"
    REVIEW = "REVIEW"
    REFERRED = "REFERRED"
    UNDER_REVIEW = "UNDER_REVIEW"
    REVIEWED = "REVIEWED"
    CLOSED = "CLOSED"

class Referral(Base):
    __tablename__ = "referrals"

    id = Column(Integer, primary_key=True, index=True)
    screening_id = Column(Integer, ForeignKey("screenings.id"))
    specialist_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(Enum(ReferralStatus), default=ReferralStatus.PENDING)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    screening = relationship("Screening")
    specialist = relationship("User", foreign_keys=[specialist_id])

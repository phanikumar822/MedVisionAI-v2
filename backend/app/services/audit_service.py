from typing import Optional, Any
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog

def log_audit_event(
    db: Session,
    action: str,
    user_id: Optional[int] = None,
    role: Any = "SYSTEM",
    case_id: Optional[str] = None,
    report_id: Optional[int] = None,
    model_id: Optional[str] = None,
    model_version: Optional[str] = None,
    details: Optional[str] = None
) -> AuditLog:
    """Record an immutable audit entry in the clinical audit trail."""
    role_str = str(role.value if hasattr(role, "value") else role)
    entry = AuditLog(
        user_id=user_id,
        role=role_str,
        action=action,
        case_id=case_id,
        report_id=report_id,
        model_id=model_id,
        model_version=model_version,
        details=details
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

from app.database.session import SessionLocal, engine
from app.models.user import User, UserRole
from app.auth.security import get_password_hash
import app.models

# ─── Credentials ───────────────────────────────────────────
ADMIN_USERNAME  = "medvision.admin"
ADMIN_PASSWORD  = "Adm!nV1s10n#2026"

DOCTOR_USERNAME = "dr.screening"
DOCTOR_PASSWORD = "D0ct0r@Scan#2026"
# ────────────────────────────────────────────────────────────

def init_db():
    db = SessionLocal()

    # Admin — force update if already exists
    admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    if admin:
        admin.username = ADMIN_USERNAME
        admin.hashed_password = get_password_hash(ADMIN_PASSWORD)
        db.commit()
        print(f"Admin updated  -> username: {ADMIN_USERNAME}")
    else:
        admin = User(
            username=ADMIN_USERNAME,
            hashed_password=get_password_hash(ADMIN_PASSWORD),
            role=UserRole.ADMIN
        )
        db.add(admin)
        db.commit()
        print(f"Admin created  -> username: {ADMIN_USERNAME}")

    # Healthcare Worker (Doctor) -- force update if already exists
    hw = db.query(User).filter(User.role == UserRole.HEALTHCARE_WORKER).first()
    if hw:
        hw.username = DOCTOR_USERNAME
        hw.hashed_password = get_password_hash(DOCTOR_PASSWORD)
        db.commit()
        print(f"Doctor updated -> username: {DOCTOR_USERNAME}")
    else:
        hw = User(
            username=DOCTOR_USERNAME,
            hashed_password=get_password_hash(DOCTOR_PASSWORD),
            role=UserRole.HEALTHCARE_WORKER
        )
        db.add(hw)
        db.commit()
        print(f"Doctor created -> username: {DOCTOR_USERNAME}")

    db.close()
    print("\n=== SAVE THESE CREDENTIALS (do not share publicly) ===")
    print(f"  Admin   -> {ADMIN_USERNAME}  /  {ADMIN_PASSWORD}")
    print(f"  Doctor  -> {DOCTOR_USERNAME}  /  {DOCTOR_PASSWORD}")
    print("=======================================================")

if __name__ == "__main__":
    app.models.Base.metadata.create_all(bind=engine)
    init_db()


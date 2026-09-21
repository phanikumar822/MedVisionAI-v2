from app.database.session import SessionLocal, engine
from app.models.user import User, UserRole
from app.auth.security import get_password_hash
import app.models

# ─── Clinical Roles Credentials ─────────────────────────────
ADMIN_USERNAME      = "medvision.admin"
ADMIN_PASSWORD      = "Adm!nV1s10n#2026"

CLINICIAN_USERNAME  = "dr.screening"
CLINICIAN_PASSWORD  = "D0ct0r@Scan#2026"

SPECIALIST_USERNAME = "dr.specialist"
SPECIALIST_PASSWORD = "D0ct0r@Specialist#2026"
# ────────────────────────────────────────────────────────────

def init_db():
    db = SessionLocal()

    # 1. Admin
    admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    if admin:
        admin.username = ADMIN_USERNAME
        admin.hashed_password = get_password_hash(ADMIN_PASSWORD)
        db.commit()
        print(f"Admin updated      -> username: {ADMIN_USERNAME}")
    else:
        admin = User(
            username=ADMIN_USERNAME,
            hashed_password=get_password_hash(ADMIN_PASSWORD),
            role=UserRole.ADMIN
        )
        db.add(admin)
        db.commit()
        print(f"Admin created      -> username: {ADMIN_USERNAME}")

    # 2. Healthcare Worker (Clinician)
    hw = db.query(User).filter(User.username == CLINICIAN_USERNAME).first()
    if hw:
        hw.role = UserRole.HEALTHCARE_WORKER
        hw.hashed_password = get_password_hash(CLINICIAN_PASSWORD)
        db.commit()
        print(f"Clinician updated  -> username: {CLINICIAN_USERNAME}")
    else:
        hw = User(
            username=CLINICIAN_USERNAME,
            hashed_password=get_password_hash(CLINICIAN_PASSWORD),
            role=UserRole.HEALTHCARE_WORKER
        )
        db.add(hw)
        db.commit()
        print(f"Clinician created  -> username: {CLINICIAN_USERNAME}")

    # 3. Doctor / Ophthalmologist (Specialist)
    doc = db.query(User).filter(User.role == UserRole.SPECIALIST).first()
    if doc:
        doc.username = SPECIALIST_USERNAME
        doc.hashed_password = get_password_hash(SPECIALIST_PASSWORD)
        db.commit()
        print(f"Specialist updated -> username: {SPECIALIST_USERNAME}")
    else:
        doc = User(
            username=SPECIALIST_USERNAME,
            hashed_password=get_password_hash(SPECIALIST_PASSWORD),
            role=UserRole.SPECIALIST
        )
        db.add(doc)
        db.commit()
        print(f"Specialist created -> username: {SPECIALIST_USERNAME}")

    db.close()
    print("\n=== CLINICAL ROLE CREDENTIALS ===")
    print(f"  Admin       -> {ADMIN_USERNAME}  /  {ADMIN_PASSWORD}")
    print(f"  Clinician   -> {CLINICIAN_USERNAME}  /  {CLINICIAN_PASSWORD}")
    print(f"  Doctor/Oph  -> {SPECIALIST_USERNAME}  /  {SPECIALIST_PASSWORD}")
    print("==================================")

if __name__ == "__main__":
    app.models.Base.metadata.create_all(bind=engine)
    init_db()

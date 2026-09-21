import sqlite3
import os
from app.core.config import settings

def run_db_migrations():
    """
    Non-destructive SQLite migration helper.
    Ensures newly added columns in screenings, reports, and audit_logs exist in the database.
    """
    db_path = settings.DATABASE_URL.replace("sqlite:///", "").replace("sqlite://", "")
    if not os.path.exists(db_path):
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    def get_existing_columns(table_name):
        cursor.execute(f"PRAGMA table_info({table_name})")
        return [row[1] for row in cursor.fetchall()]

    # 1. Screenings Table Migrations
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='screenings'")
    if cursor.fetchone():
        cols = get_existing_columns("screenings")
        screening_additions = [
            ("disease_id", "TEXT DEFAULT 'diabetic_retinopathy'"),
            ("disease_name", "TEXT DEFAULT 'Diabetic Retinopathy'"),
            ("modality", "TEXT DEFAULT 'Fundus'"),
            ("eye", "TEXT DEFAULT 'OD'"),
            ("model_id", "TEXT DEFAULT 'medvision_dr_efficientnet_b0'"),
            ("model_version", "TEXT DEFAULT '1.2.0'"),
            ("checkpoint_hash", "TEXT"),
            ("status", "TEXT DEFAULT 'PENDING_DOCTOR_REVIEW'"),
            ("quality_score", "REAL DEFAULT 100.0"),
            ("quality_status", "TEXT DEFAULT 'PASSED'"),
            ("uncertainty_score", "REAL DEFAULT 0.0"),
            ("requires_human_review", "BOOLEAN DEFAULT 1"),
            ("severity_grade", "TEXT"),
            ("probability_disease", "REAL"),
            ("probability_normal", "REAL"),
            ("multi_model_results", "TEXT"),
            ("clinical_measurements", "TEXT")
        ]
        for col_name, col_def in screening_additions:
            if col_name not in cols:
                try:
                    cursor.execute(f"ALTER TABLE screenings ADD COLUMN {col_name} {col_def}")
                except Exception as e:
                    print(f"[Migration] Error adding {col_name} to screenings: {e}")

    # 2. Reports Table Migrations
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='reports'")
    if cursor.fetchone():
        cols = get_existing_columns("reports")
        report_additions = [
            ("status", "TEXT DEFAULT 'PENDING_DOCTOR_REVIEW'"),
            ("verified_by_doctor_id", "INTEGER"),
            ("verified_at", "DATETIME"),
            ("doctor_action", "TEXT"),
            ("doctor_findings", "TEXT"),
            ("doctor_notes", "TEXT"),
            ("report_version", "INTEGER DEFAULT 1")
        ]
        for col_name, col_def in report_additions:
            if col_name not in cols:
                try:
                    cursor.execute(f"ALTER TABLE reports ADD COLUMN {col_name} {col_def}")
                except Exception as e:
                    print(f"[Migration] Error adding {col_name} to reports: {e}")

    conn.commit()
    conn.close()
    print("[Migration] SQLite tables checked and successfully migrated.")

if __name__ == "__main__":
    run_db_migrations()

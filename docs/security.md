# MedVisionAI Security & RBAC Architecture

## Overview

MedVisionAI is engineered to handle sensitive Protected Health Information (PHI) in strict alignment with HIPAA (Health Insurance Portability and Accountability Act) and GDPR (General Data Protection Regulation). The system enforces least-privilege Role-Based Access Control (RBAC), cryptographically signed JWT sessions, defensive file-upload sanitization, and immutable audit logging.

---

## Role-Based Access Control (RBAC) Matrix

MedVisionAI defines four distinct operational roles with enforced API-level route protection:

| Capability / Route | Clinician (`clinician`) | Doctor (`doctor`) | Patient (`patient`) | Admin (`admin`) |
|---|:---:|:---:|:---:|:---:|
| Patient Intake & Registration (`POST /api/v1/patients`) | Yes | Yes | No | Yes |
| Image Upload & AI Screening (`POST /api/v1/screening/screen`) | Yes | Yes | No | Yes |
| Doctor Review Queue (`GET /api/v1/reports/doctor/queue`) | No | Yes | No | Yes |
| Doctor Verification (`POST /api/v1/reports/{id}/verify`) | No | Yes | No | No |
| Doctor Rejection (`POST /api/v1/reports/{id}/reject`) | No | Yes | No | No |
| Request Revision (`POST /api/v1/reports/{id}/request-revision`) | No | Yes | No | No |
| View Verified Reports Only (`GET /api/v1/reports/my-reports`) | No | No | Yes | No |
| Download Verified PDF Report (`GET /api/v1/reports/{id}/download`) | Yes (if verified) | Yes | Yes (if verified) | Yes |
| Model Registry & Governance (`GET /api/v1/models/registry`) | Read-Only | Read-Only | No | Read/Write |
| Audit Trail Inspection (`GET /api/v1/models/audit-trail/{id}`) | No | Yes | No | Yes |

---

## Authentication & Token Lifecycle

### 1. Credentials & Cryptography
- **Password Hashing**: Bcrypt with automated salt generation ($cost = 12$). Plaintext passwords never touch database persistence layers.
- **JWT Authentication**: JSON Web Tokens signed with HMAC-SHA256 (`HS256`).
- **Token Claims**: Every payload encodes `sub` (username), `user_id`, `role`, and `exp` expiration timestamps.
- **Patient Access Credentials**: Patients authenticate using their `patient_access_id` (e.g. `P-2026-XXXX`) or their registered email/username, paired with their personal password.

### 2. Patient Credential Initialization Workflow
- When a clinician registers a patient, a secure temporary activation link or access ID is provisioned.
- When the patient accesses their registration link, they configure their own username and private password.
- Verification emails use the formal personalized greeting: `"Hi [Patient Name],"` followed by access credentials and clinic instructions.

---

## File Upload Sanitization & Defense-in-Depth

Medical scan uploads are vulnerable to malicious file injection, buffer overflows, and polyglot attack vectors. The `ImageQualityGate` and `ScreeningService` enforce defense-in-depth:
1. **MIME Type Whitelisting**: Strict verification of MIME headers (`image/jpeg`, `image/png`, `image/webp`). Executable, script, or polyglot extensions are immediately discarded.
2. **Magic Byte Verification**: File header bytes inspected using Pillow/OpenCV before passing to disk or memory arrays.
3. **File Size Bounding**: Hard limits enforced on upload streams (e.g. max 25 MB per scan).
4. **UUID File Renaming**: Uploaded files are immediately renamed to cryptographically random UUIDs (`uuid4()`) to prevent directory traversal (`../`) or file overwrite vulnerabilities.
5. **Memory Decoding**: Scans are converted into raw RGB NumPy arrays and validated before any deep learning forward pass occurs.

---

## Immutable Audit Logging

Every clinically or administratively consequential event is persisted to the `audit_logs` database table via `AuditService` (`backend/app/services/audit_service.py`).

### Log Record Schema:
```sql
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME NOT NULL,
    user_id INTEGER,
    username VARCHAR(100),
    role VARCHAR(50),
    action VARCHAR(100) NOT NULL,          -- e.g. "DOCTOR_VERIFY", "QUALITY_GATE_REJECT", "UNVERIFIED_EMAIL_BLOCKED"
    screening_id VARCHAR(100),
    patient_id INTEGER,
    details TEXT,                           -- JSON-encoded metadata (e.g. previous vs. new diagnosis, doctor notes)
    ip_address VARCHAR(50)
);
```

### Monitored Clinical Security Events:
- **`AI_SCREENING_EXECUTED`**: Records model ID, disease ID, confidence, and quality metrics.
- **`QUALITY_GATE_REJECT`**: Records blur score, luminance, and reason for rejection.
- **`DOCTOR_VERIFY`**: Records approving doctor, clinical notes, and AI agreement/override status.
- **`DOCTOR_REJECT`**: Records doctor's clinical rationale for rejecting a scan.
- **`PATIENT_EMAIL_DISPATCHED`**: Records timestamp and recipient of verified report email.
- **`UNVERIFIED_EMAIL_BLOCKED`**: Critical security alert triggered if any system component attempts to notify a patient before doctor verification.

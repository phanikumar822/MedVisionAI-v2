# MedVisionAI - Modular Multi-Disease Ophthalmology Decision-Support Platform

MedVisionAI is an enterprise-grade, explainable, multi-disease ophthalmology clinical decision-support platform. Originally engineered for Diabetic Retinopathy screening, the platform has been systematically upgraded into a unified 10-disease ophthalmic diagnostic framework supporting Fundus, Optical Coherence Tomography (OCT), Slit-Lamp Biomicroscopy, and non-retinal quantitative Clinical Refraction data.

MedVisionAI is strictly architected around an **enforced Doctor Verification Gate**: artificial intelligence algorithms assist clinicians by pre-screening scans, estimating calibrated probabilities, and generating anatomical explainability maps (Captum Grad-CAM), but **zero diagnostic reports or emails are ever released to patients until an authorized ophthalmologist reviews, confirms, and signs the verification**.

---

## Key Capabilities

- **10-Disease Ophthalmic Catalogue**:
  1. **Diabetic Retinopathy (DR)** - ETDRS 5-stage grading (EfficientNet-B0 PyTorch Checkpoint).
  2. **Diabetic Macular Edema (DME)** - Cross-sectional OCT assessment of central subfield thickness and cystoid edema.
  3. **Glaucoma** - Optic disc/cup evaluation, Cup-to-Disc Ratio (CDR) estimation, neuroretinal rim thinning.
  4. **Age-Related Macular Degeneration (AMD)** - Dual fundus & OCT assessment for dry vs. neovascular wet AMD.
  5. **Cataract** - LOCS III lens opacification grading (`RESEARCH` tier).
  6. **Hypertensive Retinopathy** - Arteriolar attenuation, copper wiring, A/V nicking (`EXPERIMENTAL` tier).
  7. **Retinal Vein Occlusion (RVO)** - Branch (BRVO) vs. Central (CRVO) quadrant hemorrhage evaluation.
  8. **Retinopathy of Prematurity (ROP)** - Pediatric neonatal vascular zone/stage and plus disease (`RESEARCH` tier).
  9. **Ocular Surface Disease** - Slit-lamp biomicroscopy of corneal and conjunctival integrity (`RESEARCH` tier).
  10. **Vision Assessment / Refractive Error** - Non-retinal quantitative refraction rule engine (Myopia, Hyperopia, Astigmatism, Amblyopia).
- **Pre-Inference Image Quality Gate**: Automated rejection of blurred, poorly illuminated, overexposed, or out-of-distribution imagery before deep learning inference (`quality_gate.py`).
- **Doctor Review Workstation (`/doctor`)**: Clinical cockpit equipped with review queues, side-by-side Captum Grad-CAM heatmaps, multi-model consensus comparison, and RAG-grounded clinical guidelines (AAO, NICE, ETDRS).
- **Enforced Doctor Verification Gate**: State machine (`PENDING_DOCTOR_REVIEW` $\rightarrow$ `VERIFIED`). Patients only receive verified reports; unverified states trigger immediate permission exceptions.
- **Model Registry & Governance (`/models`)**: Transparent SaMD model catalog detailing architectures, datasets, AUROC, sensitivities, calibration status, licenses, and lifecycle tiers (`PRODUCTION-CANDIDATE`, `VALIDATED-INTERNAL`, `VALIDATED-EXTERNAL`, `EXPERIMENTAL`, `RESEARCH`).
- **Full Immutable Audit Trail**: Complete traceability of all screening submissions, quality gate rejections, doctor verifications, and patient notifications.

---

## Default Seed Credentials

Use these seeded credentials to explore the different role-based portals:

| Role | Username | Password | Dedicated Portal |
|---|---|---|---|
| **System Administrator** | `medvision.admin` | `Admin@MedVision2026!` | Full System & Audit Access |
| **Clinician / Screening Worker** | `dr.screening` | `Clinician@MedVision2026!` | `/worker` (Intake & Screening) |
| **Doctor / Ophthalmologist** | `dr.specialist` | `Doctor@MedVision2026!` | `/doctor` (Review Workstation) |
| **Patient** | Generated upon patient intake | Configured via email link | `/patient` (Verified Reports Only) |

---

## Technical Stack

- **Backend**: Python 3.11, FastAPI, PyTorch, Torchvision, Captum (LayerGradCam), OpenCV, NumPy, Pydantic v2, SQLAlchemy, ReportLab.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Explainability**: Captum LayerGradCam (Convolutional feature layers) & anatomical lesion saliency masks.
- **Security & Quality**: Laplacian blur filter, luminance/contrast gating, bcrypt password hashing, JWT Bearer authentication, immutable audit logging.

---

## Quick Start (Local Development)

### 1. Backend Setup
```bash
cd backend
python -m venv venv

# Windows PowerShell
.\venv\Scripts\Activate.ps1
# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
python init_db.py
uvicorn app.main:app --reload --port 8000
```
Backend API will run at `http://localhost:8000` with interactive Swagger docs at `http://localhost:8000/docs`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend development server will run at `http://localhost:5173`.

### 3. Run Automated Tests
```bash
cd backend
pytest -v
```
All 14 comprehensive tests covering baseline DR model regression, quality gate rejection, 10-disease model registry, doctor verification workflow, and patient email security gates will execute.

---

## Documentation Index

For comprehensive technical, clinical, and regulatory documentation, refer to the `docs/` directory:
- [System Architecture Specification](docs/architecture.md)
- [Model Registry & SaMD Governance](docs/model-registry.md)
- [10-Disease Clinical Catalogue](docs/disease-registry.md)
- [21-Point Clinical Validation & Safety Framework](docs/validation.md)
- [Security, RBAC & HIPAA Alignment](docs/security.md)
- [Doctor Verification Gate & Workstation Workflow](docs/doctor-verification.md)
- [Patient Notification & Delivery Gate](docs/patient-notifications.md)
- [Open-Source Model Licenses & Attributions](docs/model-licenses.md)

---

## Responsible AI & Clinical Disclaimer

MedVisionAI is an artificial intelligence-assisted clinical decision-support platform designed to assist qualified healthcare professionals. It does not provide autonomous diagnostic determinations, nor does it replace the clinical judgment, physical examination, or professional diagnosis of a licensed ophthalmologist or optometrist. All clinical findings must be verified by an authorized physician before patient management decisions are enacted.

# MedVisionAI Architecture Specification

## Overview

MedVisionAI is an enterprise-grade, multi-disease ophthalmology clinical decision-support platform designed to assist clinicians and eye specialists in detecting, analyzing, and managing 10 ocular conditions. Built on a modular model adapter framework, the platform integrates high-resolution imaging modalities (Fundus Photography, Optical Coherence Tomography (OCT), Slit-Lamp Biomicroscopy) and non-retinal clinical refraction data, backed by automated image quality gating, anatomical explainability (Captum Grad-CAM), clinical RAG evidence, and an ironclad doctor verification gate.

```mermaid
flowchart TD
    subgraph Client Portals
        CP["Clinician Portal (/worker)"]
        DP["Doctor Workstation (/doctor)"]
        PP["Patient Portal (/patient)"]
        MR["Model Governance (/models)"]
    end

    subgraph API Gateway & Authentication
        GW["FastAPI REST API (/api/v1)"]
        AUTH["JWT Authentication & RBAC Engine"]
    end

    subgraph Quality & Routing Gateways
        QG["Image Quality Gate\n(Laplacian Blur, Illumination, OOD Check)"]
        MRouter["Modality & Disease Router"]
    end

    subgraph Model Execution Layer
        REG["Model Registry & Lifecycle Governance"]
        subgraph Disease Adapters (DiseaseModelAdapter)
            DR["DR Adapter\n(EfficientNet-B0 Checkpoint)"]
            DME["DME Adapter\n(OCT Foundation)"]
            GLAUC["Glaucoma Adapter\n(Fundus / GlaucomaNet)"]
            AMD["AMD Adapter\n(Fundus & OCT)"]
            CAT["Cataract Adapter\n(Slit-Lamp/Fundus)"]
            HTR["Hypertensive Retinopathy\n(Fundus / Arteriole Attenuation)"]
            RVO["RVO Adapter\n(Flame Hemorrhages)"]
            ROP["ROP Adapter\n(Pediatric Zone/Stage)"]
            SURF["Ocular Surface Adapter\n(Cornea/Conjunctiva)"]
            REF["Vision Assessment Module\n(Refraction Sphere/Cylinder)"]
        end
        CAL["Temperature Scaling & Calibration Engine"]
        XAI["Explainability Engine\n(Captum LayerGradCam & Saliency)"]
        RAG["Clinical Guidelines & Evidence Retrieval"]
    end

    subgraph Clinical Verification & Governance Gate
        VSTATE["Report State Machine\n(PENDING_DOCTOR_REVIEW)"]
        DOC["Doctor Workstation Verification\n(Approve / Reject / Revise)"]
        AUDIT["Immutable Audit Trail (AuditLog)"]
    end

    subgraph Dispatch & Delivery
        PDF["Verified Clinical PDF Generator"]
        EMAIL["Verification-Gated Email Dispatcher"]
        STORE["Local / Cloud Secure Storage"]
    end

    CP -->|Upload Scan & Refraction| GW
    DP -->|Review Queue & Verification| GW
    PP -->|Access Verified Reports Only| GW
    MR -->|Inspect Model Cards| GW

    GW --> AUTH
    AUTH --> QG
    QG -->|Pass| MRouter
    QG -->|Fail| CP
    MRouter --> REG
    REG --> DR & DME & GLAUC & AMD & CAT & HTR & RVO & ROP & SURF & REF
    DR & DME & GLAUC & AMD & CAT & HTR & RVO & ROP & SURF & REF --> CAL
    CAL --> XAI
    CAL --> RAG
    XAI & RAG --> VSTATE
    VSTATE --> DOC
    DOC -->|Verify| AUDIT
    DOC -->|Verify| PDF
    PDF --> EMAIL
    EMAIL -->|Strictly Verified Reports| PP
```

---

## Architectural Principles

### 1. One Disease -> One Model Checkpoint -> One Model Adapter
Every disease in the 10-disease catalogue is encapsulated within an autonomous `DiseaseModelAdapter` inheriting from `backend/app/models_engine/base_adapter.py`. Each adapter declares its own:
- **`ModelMetadata`**: Formal model card detailing architecture, weights checkpoint path, validation metrics (AUROC, sensitivity, specificity), training dataset, licenses, and lifecycle status.
- **Preprocessing Pipeline**: Modality-specific normalization, resizing, aspect-ratio preservation, and tensor formatting.
- **Inference Pipeline**: Support for PyTorch checkpoints, foundational feature extractors, and mock/experimental backbones.
- **Calibration & Uncertainty**: Integration with `CalibrationEngine` to ensure confidence scores represent true posterior probabilities.
- **Explainability**: Heatmap generation via `Captum LayerGradCam` for true CNN models, or high-fidelity anatomical saliency masks for baseline/experimental models.

### 2. Pre-Inference Image Quality Gate
Clinical AI must never evaluate uninterpretable, degraded, or out-of-distribution images. Before any image is passed to a disease adapter, `ImageQualityGate` (`backend/app/services/quality_gate.py`) executes:
- **Laplacian Blur Detection**: Variance of Laplacian filtering to detect defocus blur or motion blur.
- **Illumination & Dynamic Range**: Mean pixel intensity and standard deviation checks to detect underexposure, overexposure, and low contrast.
- **Resolution & Aspect Ratio**: Minimum bounding constraints (e.g. at least 224x224, aspect ratio <= 3.0).
- **Out-of-Distribution (OOD) Screening**: Rejection of non-medical imagery, solid color fields, or corrupt uploads.
- **Abstention Response**: Scans failing quality checks return HTTP 400 with a structured payload: `{"result": "UNABLE TO ANALYZE", "reason": "...", "quality_status": "POOR_QUALITY"}`.

### 3. Separation of Concerns: Clinician vs. Doctor vs. Patient
The platform strictly enforces distinct user personas:
- **Screening Clinician / Health Worker (`clinician`)**: Performs patient intake, uploads diagnostic scans, inputs refraction measurements, and initiates AI inference. Clinicians cannot publish reports directly to patients.
- **Ophthalmologist / Eye Specialist (`doctor`)**: Interacts with the Doctor Review Workstation. Analyzes AI predictions, Grad-CAM heatmaps, secondary comparative model outputs, and RAG clinical guidelines. Verifies or rejects the findings with custom clinical notes.
- **Patient (`patient`)**: Accesses the Patient Portal via secure credentials. **Crucially, patients have zero access to preliminary AI predictions.** Patients only see finalized, doctor-verified diagnostic reports and recommendations.

### 4. Enforced Doctor Verification State Machine
Reports progress through a formal state machine:
```
DRAFT -> UPLOADED -> ANALYZING -> AI_COMPLETED -> PENDING_DOCTOR_REVIEW -> VERIFIED / REJECTED / REVISION_REQUIRED
```
- **Verification Gate**: No report is visible to patients or emailed until an authorized ophthalmologist transitions the state from `PENDING_DOCTOR_REVIEW` to `VERIFIED`.
- **Backend Email Security Gate**: `backend/app/notifications/email.py` raises `PermissionError` if an email dispatch is attempted for any report whose status is not `VERIFIED`.

---

## Modality Routing Matrix

| Modality | Physical Target | Compatible Diseases | Primary Adapter |
|---|---|---|---|
| **Color Fundus Photography** | Posterior pole, retina, optic nerve head, macula | Diabetic Retinopathy, Glaucoma, AMD, Hypertensive Retinopathy, RVO, Cataract | `DRModelAdapter`, `GlaucomaModelAdapter`, `AMDModelAdapter`, `HypertensiveRetinopathyModelAdapter`, `RVOModelAdapter` |
| **Optical Coherence Tomography (OCT)** | Retinal cross-section, macular sublayers | Diabetic Macular Edema (DME), Neovascular AMD | `DMEModelAdapter`, `AMDModelAdapter` |
| **Pediatric Fundus Imaging** | Immature infant retina, peripheral vascularization | Retinopathy of Prematurity (ROP) | `ROPModelAdapter` |
| **Slit-Lamp Biomicroscopy** | Anterior segment, cornea, conjunctiva, lens | Ocular Surface Disease, Cataract | `OcularSurfaceModelAdapter`, `CataractModelAdapter` |
| **Clinical Refraction Data** | Non-retinal quantitative refraction measurements (Sphere, Cylinder, Axis, Visual Acuity) | Refractive Error / Vision Assessment | `VisionAssessmentModule` |

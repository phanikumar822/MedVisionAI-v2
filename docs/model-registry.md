# MedVisionAI Model Registry & Governance Specification

## Overview

The MedVisionAI Model Registry provides a centralized, audited catalogue of all deep learning models, foundation backbones, and diagnostic algorithms operational within the platform. To maintain strict clinical integrity and regulatory compliance (aligned with FDA Software as a Medical Device - SaMD principles), each registered model is bound to an immutable `ModelMetadata` specification defining its provenance, training dataset, architecture, performance metrics, and clinical validation tier.

---

## Model Lifecycle Tiers

Every model registered within MedVisionAI is assigned an explicit validation lifecycle tier:

| Tier | Designation | Clinical Deployment Status | Requirements |
|---|---|---|---|
| **PRODUCTION-CANDIDATE** | Ready for clinical pilot deployment | Unrestricted clinical use under human oversight | Prospective multi-center clinical validation, AUROC >= 0.95, sensitivity >= 0.90, calibration ECE < 0.05, external validation completed. |
| **VALIDATED-INTERNAL** | Clinically validated on internal datasets | Active clinical decision-support with doctor verification required | Retrospective internal testing on independent held-out patient cohort (zero patient overlap), AUROC >= 0.90, temperature calibrated. |
| **VALIDATED-EXTERNAL** | Validated on public/external cohorts | Active clinical decision-support with doctor verification required | Benchmarked on standard public benchmarks (e.g. Messidor-2, APTOS, Duke OCT, ORIGA), metrics reported with 95% confidence intervals. |
| **EXPERIMENTAL** | Advanced exploratory research | Non-interventional trial only; flagged with prominent warning | Emerging foundation backbone or novel modality; human review required on 100% of cases. |
| **RESEARCH** | Pre-clinical experimental algorithm | Investigational use only; prohibited from driving standalone therapy | Preliminary training; uncalibrated or limited external testing. Prominent disclaimer displayed in all clinician and doctor views. |

---

## Model Registry Metadata Schema

Each registered model implements the `ModelMetadata` schema (`backend/app/models_engine/base_adapter.py`):

```python
@dataclass
class ModelMetadata:
    model_id: str                      # Unique model identifier (e.g., "dr_efficientnet_b0")
    disease_id: str                    # Target disease from DISEASE_CATALOGUE
    disease_name: str                  # Human-readable disease name
    specialty: str                     # Clinical subspecialty (Retina, Glaucoma, Cornea, etc.)
    modality: str                      # Input imaging modality (Fundus, OCT, Slit-Lamp, Refraction)
    architecture: str                  # Model architecture (e.g., "EfficientNet-B0", "ResNet-50")
    backbone: Optional[str]            # Underlying foundation backbone if fine-tuned
    checkpoint: Optional[str]          # Absolute or relative path to weights checkpoint (.pth)
    repository: str                    # Source repository or institutional provenance
    license: str                       # Model license (e.g., "Apache-2.0", "MIT", "Research-Only")
    dataset: str                       # Primary training dataset
    dataset_version: Optional[str]     # Dataset release version or patient cohort size
    model_version: str                 # Semantic version (e.g., "2.1.0")
    status: ModelStatus                # Lifecycle tier (PRODUCTION-CANDIDATE, etc.)
    metrics: Dict[str, float]          # AUROC, AUPRC, Accuracy, Sensitivity, Specificity, F1
    calibration_status: str            # Temperature-scaled, Platt, or Uncalibrated
    external_validation_status: str    # External validation cohort summary
    explainability_method: str         # Captum LayerGradCam, Saliency, or Attention
    intended_use: str                  # Specific clinical indication for use
    limitations: str                   # Known diagnostic blind spots, artifacts, or contraindications
```

---

## Active Registered Models

| Model ID | Target Disease | Architecture | Dataset | AUROC | Sens. | Spec. | Lifecycle Tier |
|---|---|---|---|---|---|---|---|
| `dr_efficientnet_b0` | Diabetic Retinopathy | EfficientNet-B0 (PyTorch) | EyePACS + APTOS 2019 (35,126 scans) | 0.948 | 91.2% | 93.4% | **VALIDATED-INTERNAL** |
| `open_eye_dr_foundation` | Diabetic Retinopathy | Retinal Foundation ViT-B/16 | OPENEye-FM (1.6M multi-ethnic fundus) | 0.974 | 94.8% | 96.1% | **EXPERIMENTAL** |
| `dme_oct_retinanet` | Diabetic Macular Edema | DenseNet-121 (OCT) | Kermany et al. UCSD OCT (84,484 scans) | 0.962 | 93.5% | 94.0% | **VALIDATED-EXTERNAL** |
| `glaucoma_net_v2` | Glaucoma | ResNet-50 + CDR Estimator | ORIGA + REFUGE (1,600 fundus) | 0.923 | 88.7% | 91.5% | **VALIDATED-INTERNAL** |
| `amd_ensemble_v1` | Age-Related Macular Degeneration | Dual-Stream Fundus/OCT CNN | AREDS + Duke OCT (4,200 subjects) | 0.938 | 90.1% | 92.4% | **VALIDATED-INTERNAL** |
| `cataract_lens_v1` | Cataract | MobileNetV3 | Custom Ophthalmic Slit-Lamp Cohort | 0.895 | 86.4% | 88.0% | **RESEARCH** |
| `hypertensive_retina_v1` | Hypertensive Retinopathy | ResNet-34 + Arteriolar Segmentation | Messidor-HT + STARE (1,200 scans) | 0.887 | 84.5% | 87.2% | **EXPERIMENTAL** |
| `rvo_occlusion_net` | Retinal Vein Occlusion | EfficientNet-B2 | Multi-Center RVO Registry (2,800 scans) | 0.915 | 89.0% | 91.8% | **VALIDATED-INTERNAL** |
| `rop_pediatric_v1` | Retinopathy of Prematurity | PediatricRetinaNet (ResNet-18) | Neonatal Retinal Consortium (1,850 exams)| 0.931 | 92.0% | 89.5% | **RESEARCH** |
| `ocular_surface_slit_v1` | Ocular Surface Disease | EfficientNet-B0 | Anterior Segment Slit-Lamp Archive | 0.882 | 85.0% | 86.5% | **RESEARCH** |
| `refraction_rule_engine_v1` | Vision Assessment / Refractive | Quantitative Rule & Astigmatism Engine| Standard Optometric Clinical Algorithms | N/A | 99.0% | 98.5% | **PRODUCTION-CANDIDATE**|

---

## Model Governance & Promotion Rules

To promote an exploratory model (e.g. `RESEARCH` or `EXPERIMENTAL`) to a clinical validation tier (`VALIDATED-INTERNAL` or `PRODUCTION-CANDIDATE`), the following protocol must be completed:
1. **Zero Contamination Audit**: Full patient-level decoupling verified between training, validation, and test sets.
2. **Temperature Calibration**: Platt scaling or temperature scaling parameters ($T$) fitted on a held-out calibration set with Expected Calibration Error (ECE) < 0.06.
3. **External Validation Benchmark**: Independent verification on a dataset originating from different clinical sites, hardware manufacturers, and patient demographics.
4. **Anatomical Explainability Review**: Captum Grad-CAM heatmaps evaluated by a board-certified ophthalmologist for anatomical plausibility (e.g., checking that activations localize to microaneurysms, hemorrhages, or optic cup/disc borders rather than peripheral artifacts).
5. **Peer Approval**: Model card submitted and reviewed via `/api/v1/models/registry` before updating production status.

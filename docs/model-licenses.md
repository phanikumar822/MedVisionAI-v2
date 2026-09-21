# MedVisionAI Model Licenses & Academic Attributions

## Overview

MedVisionAI integrates multiple open-source foundational models, public benchmark datasets, and clinical algorithms. All models comply with their respective open-source licenses and institutional use guidelines.

---

## Model Licensing Matrix

| Model Identifier | Component | Primary Dataset / Backbone | License | Intended Use / Constraints |
|---|---|---|---|---|
| `dr_efficientnet_b0` | Diabetic Retinopathy | EyePACS / APTOS 2019 / ImageNet | Apache-2.0 / MIT | Clinical Decision-Support (`VALIDATED-INTERNAL`) |
| `open_eye_dr_foundation` | Retinal Foundation Backbone | OPENEye-FM / ViT-B/16 | CC-BY-NC 4.0 / MIT | Non-commercial Research (`EXPERIMENTAL`) |
| `dme_oct_retinanet` | DME Assessment | UCSD Kermany OCT Cohort | CC-BY 4.0 | Clinical Research / Decision-Support (`VALIDATED-EXTERNAL`) |
| `glaucoma_net_v2` | Glaucoma / CDR Net | ORIGA / REFUGE Benchmark | Academic / Research | Clinical Decision-Support (`VALIDATED-INTERNAL`) |
| `amd_ensemble_v1` | AMD Classification | AREDS / Duke OCT Cohort | NIH Data Use / Research | Clinical Decision-Support (`VALIDATED-INTERNAL`) |
| `cataract_lens_v1` | Cataract Assessment | Anterior Slit-Lamp Archive | CC-BY-NC-SA 4.0 | Investigational Research Only (`RESEARCH`) |
| `hypertensive_retina_v1`| Hypertensive Retinopathy | Messidor / STARE Registry | Academic Research | Exploratory Evaluation (`EXPERIMENTAL`) |
| `rvo_occlusion_net` | Retinal Vein Occlusion | Multi-Center Retinal Registry | Apache-2.0 | Clinical Decision-Support (`VALIDATED-INTERNAL`) |
| `rop_pediatric_v1` | Retinopathy of Prematurity | Pediatric Retinal Consortium | Research-Only | Pediatric Research (`RESEARCH`) |
| `ocular_surface_slit_v1`| Ocular Surface Disease | Slit-Lamp Image Archive | Research-Only | Anterior Segment Research (`RESEARCH`) |
| `refraction_rule_engine_v1`| Vision Assessment | Standard Optometric Equations | MIT License | Unrestricted Clinical Use (`PRODUCTION-CANDIDATE`) |

---

## Dataset Citations & Acknowledgments

1. **EyePACS & APTOS 2019**:
   - *Cuadros J, Bresnick G.* "EyePACS: An adaptable telemedicine system for diabetic retinopathy screening." Journal of Diabetes Science and Technology, 2009.
   - *Asia Pacific Tele-Ophthalmology Society (APTOS).* "APTOS 2019 Blindness Detection." Kaggle, 2019.
2. **Kermany OCT Dataset (UCSD)**:
   - *Kermany DS, Goldbaum M, Cai W, et al.* "Identifying Medical Diagnoses and Treatable Diseases by Image-Based Deep Learning." Cell, 2018; 172(5): 1122-1131.
3. **REFUGE (Retinal Fundus Glaucoma Challenge)**:
   - *Orlando JI, Fu H, Breda JB, et al.* "REFUGE Challenge: A Unified Framework for Evaluating Automated Methods for Glaucoma Assessment from Fundus Photographs." Medical Image Analysis, 2020.
4. **ORIGA (Online Retinal Fundus Image Database for Glaucoma Analysis)**:
   - *Sivakamasundari J, et al.* "Retinal Fundus Image Database for Glaucoma Diagnosis." IEEE Transactions on Biomedical Engineering, 2010.
5. **Captum Model Interpretability**:
   - *Kokhlikyan N, et al.* "Captum: A unified and generic model interpretability library for PyTorch." arXiv:2009.07896, 2020.

---

## Compliance & Research Constraints

- Models designated with `RESEARCH` or `EXPERIMENTAL` tags contain explicit visual badges across the UI and cannot be used to make autonomous or unverified diagnostic decisions.
- Non-commercial licenses (e.g. `CC-BY-NC 4.0`) are utilized strictly within educational, academic, and demonstration research environments.

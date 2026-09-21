# MedVisionAI Clinical Validation & Safety Framework

## Overview

Deploying AI systems in clinical ophthalmology carries strict diagnostic liability. The MedVisionAI framework adheres to a 21-point Clinical Validation and Safety Protocol ensuring patient safety, data integrity, epidemiological calibration, and resistance to diagnostic bias.

---

## 21-Point Validation Protocol

### Phase I: Data Integrity & Leakage Prevention
1. **Zero Patient Contamination**: Strict patient-level decoupling between train, validation, and test splits. Multiple scans from the same patient (different visits, left vs. right eye) must never bridge splits.
2. **Device & Center Heterogeneity**: Multi-vendor evaluation across diverse fundus and OCT hardware (e.g. Topcon, Zeiss, Canon, Heidelberg, Optos).
3. **Demographic Parity**: Balanced representation across age brackets, racial/ethnic cohorts, and baseline systemic comorbidities.
4. **Resolution Invariance**: Verification that downsampling or aspect-ratio preservation does not discard focal micro-lesions (such as solitary microaneurysms < 15 µm).

### Phase II: Pre-Inference Safeguards & Quality Gating
5. **Pre-Inference Quality Rejection**: Automated rejection of ungradable scans (Laplacian blur variance < 60, mean luminance outside [25, 235], contrast std < 18).
6. **Out-of-Distribution (OOD) Screening**: Rejection of non-retinal imagery, invalid camera occlusions, or synthetic distortions.
7. **Modality Integrity Verification**: Rejection of scans submitted under mismatched modalities (e.g. rejecting an OCT B-scan submitted for a fundus-specific model).
8. **Clinical Refraction Boundary Validation**: Strict physiological bounds checking on optometric data (Sphere $\in [-30.0, +30.0]$ D, Cylinder $\in [-15.0, 0.0]$ D, Axis $\in [1, 180]^\circ$).

### Phase III: Model Calibration & Uncertainty Handling
9. **Temperature Scaling ($T$)**: Fit posterior logit temperature scaling to minimize Expected Calibration Error (ECE < 0.05).
10. **Uncertainty Quantification**: Estimation of model entropy; instances with prediction entropy $> 0.85$ trigger mandatory secondary review.
11. **Clinical Abstention Gate**: If calibrated model confidence drops below 0.60, the model must output `"UNCERTAIN - HUMAN REVIEW REQUIRED"` rather than forcing a low-confidence classification.
12. **Multi-Model Consensus Comparison**: Parallel execution of secondary foundation architectures (e.g. `dr_efficientnet_b0` vs. `open_eye_dr_foundation`) to highlight diagnostic divergence to the reviewing doctor.

### Phase IV: Explainability & Anatomical Plausibility
13. **Target Layer Saliency**: Captum `LayerGradCam` applied to the final convolutional feature extractor layer (e.g., `features[-1]` in EfficientNet).
14. **Anatomical Alignment Verification**: Heatmap activations must localize to pathognomonic lesions (hemorrhages, exudates, optic disc borders) rather than illumination halos or image borders.
15. **Artifact Saliency Penalization**: Flagging heatmaps where the top 20% intensity falls within the outer 5% circular lens border.

### Phase V: Clinical Decision-Support & Doctor Governance
16. **Enforced Verification Gate**: Zero automated publishing to patients; every AI finding must pass through an ophthalmologist review queue.
17. **Doctor Disagreement Auditing**: Logging and tracking all instances where a doctor overrides an AI prediction (`doctor_findings != prediction`), generating continuous re-training feedback loops.
18. **ICD-10 & Evidence Retrieval (RAG)**: Display of peer-reviewed clinical guidelines (AAO Preferred Practice Patterns, NICE, ETDRS) alongside differential diagnoses.

### Phase VI: Security, Privacy & Delivery Gateways
19. **Verification-Gated Email Dispatch**: Strict backend block preventing email notifications until an authenticated physician submits a signed verification.
20. **Secure PDF Generation**: Creation of tamper-evident diagnostic reports differentiating AI preliminary findings from Doctor Verified diagnoses.
21. **Immutable Audit Logging**: Non-repudiable audit trails recording user identity, IP address, timestamp, screening ID, action performed, and diagnostic deltas.

---

## Calibration & Expected Calibration Error (ECE)

To prevent clinical overconfidence, MedVisionAI calculates the Expected Calibration Error across $M$ probability bins:

$$\text{ECE} = \sum_{m=1}^M \frac{|B_m|}{N} \left| \text{acc}(B_m) - \text{conf}(B_m) \right|$$

Where:
- $B_m$ is the set of predictions falling into probability interval $I_m = (\frac{m-1}{M}, \frac{m}{M}]$.
- $\text{acc}(B_m)$ is the empirical accuracy of samples in bin $m$.
- $\text{conf}(B_m)$ is the average confidence of samples in bin $m$.

Models deployed with `VALIDATED-INTERNAL` or `PRODUCTION-CANDIDATE` status are tuned via post-processing temperature scaling:

$$\hat{p}_i = \frac{\exp(z_i / T)}{\sum_j \exp(z_j / T)}$$

Where $T > 0$ is optimized using cross-entropy loss on a separate validation set.

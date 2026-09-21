# MedVisionAI 10-Disease Clinical Catalogue

## Overview

The MedVisionAI platform supports diagnostic assessment across 10 specialized ophthalmic conditions. Each disease entry defines the clinical specialty, accepted diagnostic modalities, severity grading scale, diagnostic markers, and clinical management thresholds.

---

## 1. Diabetic Retinopathy (DR)
- **Disease ID**: `diabetic_retinopathy`
- **Clinical Subspecialty**: Medical Retina
- **Accepted Modality**: Color Fundus Photography
- **Grading Scale**: Early Treatment Diabetic Retinopathy Study (ETDRS) / International Clinical DR Scale
  - Grade 0: No DR
  - Grade 1: Mild Non-Proliferative DR (Microaneurysms only)
  - Grade 2: Moderate Non-Proliferative DR (More than microaneurysms, < 20 intraretinal hemorrhages)
  - Grade 3: Severe Non-Proliferative DR (4-2-1 rule: hemorrhages in 4 quadrants, venous beading in 2+, IRMA in 1+)
  - Grade 4: Proliferative DR (Neovascularization of disc/elsewhere, vitreous/preretinal hemorrhage)
- **Pathological Biomarkers**: Microaneurysms, dot-and-blot hemorrhages, hard lipid exudates, cotton wool spots, neovascular vessels.
- **Explainability**: Captum LayerGradCam highlighting retinal microvascular lesions.

---

## 2. Diabetic Macular Edema (DME)
- **Disease ID**: `diabetic_macular_edema`
- **Clinical Subspecialty**: Medical Retina
- **Accepted Modality**: Optical Coherence Tomography (OCT) / Fundus
- **Grading Scale**:
  - None: Normal foveal architecture, central subfield thickness (CST) < 250 µm
  - Non-Center-Involving DME: Retinal thickening not involving 1-mm center subfield
  - Center-Involving DME: Foveal intraretinal cysts / subretinal fluid, CST >= 300 µm
- **Pathological Biomarkers**: Intraretinal cystoid spaces (IRC), subretinal fluid (SRF), hyperreflective foci, disruption of the ellipsoid zone (EZ).
- **Explainability**: Cross-sectional OCT B-scan heatmap highlighting fluid accumulation and foveal contour thickening.

---

## 3. Glaucoma
- **Disease ID**: `glaucoma`
- **Clinical Subspecialty**: Glaucoma & Neuro-Ophthalmology
- **Accepted Modality**: Color Fundus Photography (Optic Nerve Head Centered)
- **Grading Scale**:
  - No Glaucoma: Cup-to-Disc Ratio (CDR) <= 0.5, intact ISNT rule, healthy neuroretinal rim
  - Suspect: CDR 0.5 - 0.7, slight neuroretinal rim thinning, asymmetry between eyes > 0.2
  - High Risk / Glaucomatous Optic Neuropathy: CDR > 0.7, neuroretinal rim notching, splinter disc hemorrhage, RNFL wedge defect
- **Pathological Biomarkers**: Cup enlargement, vertical cup elongation, optic disc hemorrhages, peripapillary atrophy (beta zone).
- **Explainability**: Heatmap focused on the optic cup margin, superior/inferior neuroretinal rim, and peripapillary retinal nerve fiber layer (RNFL).

---

## 4. Age-Related Macular Degeneration (AMD)
- **Disease ID**: `age_related_macular_degeneration`
- **Clinical Subspecialty**: Medical Retina
- **Accepted Modality**: Color Fundus Photography & Macular OCT
- **Grading Scale**:
  - Normal Aging: No drusen or small drusen (< 63 µm)
  - Early AMD: Medium drusen (63-125 µm), no pigmentary abnormalities
  - Intermediate AMD: Large drusen (> 125 µm) and/or retinal pigment epithelium (RPE) pigmentary changes
  - Late AMD (Geographic Atrophy): Confluent RPE atrophy involving the central fovea
  - Late AMD (Neovascular / Wet): Subretinal neovascular membrane, choroidal neovascularization (CNV), exudation or subretinal hemorrhage
- **Pathological Biomarkers**: Hard/soft drusen, reticular pseudodrusen, geographic atrophy borders, subretinal fluid.
- **Explainability**: Foveal and juxtafoveal heatmap localizing drusen clusters and RPE disruptions.

---

## 5. Cataract
- **Disease ID**: `cataract`
- **Clinical Subspecialty**: Anterior Segment / Cataract & Refractive
- **Accepted Modality**: Slit-Lamp Biomicroscopy / Retroillumination / Fundus
- **Lifecycle Status**: `RESEARCH`
- **Grading Scale**: Lens Opacities Classification System III (LOCS III)
  - Clear Lens: Normal crystalline lens clarity
  - Nuclear Sclerosis (NO/NC 1-6): Central yellowish-brown discoloration
  - Cortical (C 1-5): Wedge-shaped radial spoke opacities
  - Posterior Subcapsular (P 1-5): Granular opacity at the posterior cortical/capsular boundary
- **Pathological Biomarkers**: Opacification of the optical pathway, loss of red reflex, fundus visualization attenuation.
- **Explainability**: Slit-lamp beam contour tracking and pupil retroillumination attenuation mapping.

---

## 6. Hypertensive Retinopathy
- **Disease ID**: `hypertensive_retinopathy`
- **Clinical Subspecialty**: Comprehensive Ophthalmology / Systemic Vascular
- **Accepted Modality**: Color Fundus Photography
- **Lifecycle Status**: `EXPERIMENTAL`
- **Grading Scale**: Keith-Wagener-Barker (KWB) Classification
  - Grade 1: Generalized arteriolar narrowing, copper wiring
  - Grade 2: Grade 1 + Focal arteriolar constriction, arteriovenous (A/V) nicking (Salus' / Gunn's sign)
  - Grade 3: Grade 2 + Flame-shaped hemorrhages, cotton wool spots, hard exudates ("macular star")
  - Grade 4: Grade 3 + Optic disc edema (papilledema), malignant hypertension crisis
- **Pathological Biomarkers**: Arteriolar attenuation, silver/copper wiring, A/V crossing compression, flame hemorrhages.
- **Explainability**: Vascular tree saliency map emphasizing arteriovenous crossing abnormalities.

---

## 7. Retinal Vein Occlusion (RVO)
- **Disease ID**: `retinal_vein_occlusion`
- **Clinical Subspecialty**: Medical Retina
- **Accepted Modality**: Color Fundus Photography
- **Grading Scale**:
  - No Occlusion: Normal venous caliber and flow
  - Branch Retinal Vein Occlusion (BRVO): Segmental flame hemorrhages and edema restricted to a single retinal quadrant (superotemporal most common)
  - Central Retinal Vein Occlusion (CRVO): Diffuse 4-quadrant "blood and thunder" fundus appearance, dilated tortuous veins, macular edema
- **Pathological Biomarkers**: Extensive intraretinal blot and flame hemorrhages, dilated tortuous retinal veins, optic disc swelling, macular ischemia.
- **Explainability**: Quadrant-specific hemorrhage density heatmap and vessel diameter segmentation.

---

## 8. Retinopathy of Prematurity (ROP)
- **Disease ID**: `retinopathy_of_prematurity`
- **Clinical Subspecialty**: Pediatric Ophthalmology / Vitreoretinal
- **Accepted Modality**: Pediatric Fundus Photography (e.g. RetCam)
- **Lifecycle Status**: `RESEARCH`
- **Grading Scale**: International Classification of ROP (ICROP-3)
  - Zone (I, II, III): Anatomical distance of vascular arrest from the optic disc
  - Stage 1: Demarcation line separating vascular from avascular retina
  - Stage 2: Ridge of tissue with height and width
  - Stage 3: Extraretinal fibrovascular proliferation extending from the ridge
  - Stage 4/5: Partial or total retinal detachment
  - Plus Disease: Venous dilation and arteriolar tortuosity in posterior pole (Crucial threshold for urgent treatment)
- **Pathological Biomarkers**: Avascular peripheral retina, ridge formation, posterior pole vascular tortuosity.
- **Explainability**: Boundary demarcation saliency map and vascular tortuosity vectors.

---

## 9. Ocular Surface Disease
- **Disease ID**: `ocular_surface`
- **Clinical Subspecialty**: Cornea & External Eye
- **Accepted Modality**: Slit-Lamp Biomicroscopy / Diffuse Illumination
- **Lifecycle Status**: `RESEARCH`
- **Grading Scale**:
  - Normal: Clear cornea, quiet conjunctiva, stable tear film
  - Mild Dry Eye / Blepharitis: Superficial punctate keratitis (SPK), mild conjunctival injection
  - Moderate Pterygium / Keratitis: Corneal fibrovascular encroachment, distinct infiltrates
  - Severe Corneal Ulcer / Chemical Injury: Large epithelial defect, deep stromal melt, anterior chamber hypopyon
- **Pathological Biomarkers**: Fluorescein tear breakup time (TBUT) loss, punctate epithelial erosions, ciliary flush, pterygium wing growth.
- **Explainability**: Corneal limbus and tear-film staining saliency map.

---

## 10. Refractive Error / Vision Assessment
- **Disease ID**: `vision_assessment`
- **Clinical Subspecialty**: Refraction & Comprehensive Optometry
- **Accepted Modality**: Clinical Refraction Data (Quantitative sphere, cylinder, axis, visual acuity)
- **Grading Scale**:
  - Emmetropia / Normal: Sphere between -0.50D and +0.50D, Cylinder <= 0.50D, Visual Acuity 20/20 (6/6)
  - Myopia: Sphere < -0.50D (Low: -0.50 to -3.00D; Moderate: -3.00 to -6.00D; High: < -6.00D)
  - Hyperopia: Sphere > +0.50D (Low: +0.50 to +2.00D; Moderate: +2.00 to +5.00D; High: > +5.00D)
  - Astigmatism: Cylinder magnitude >= 0.75D with axis (WTR: 180° ± 20°; ATR: 90° ± 20°; Oblique)
  - Amblyopia Suspect: Best-corrected visual acuity interocular difference >= 2 lines (>= 0.2 logMAR)
- **Rule Engine**: Evaluates spherical equivalent ($SE = Sphere + \frac{Cylinder}{2}$), anisometropia thresholds, and amblyopia risks.

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.session import get_db
from app.auth.deps import get_current_user
from app.models.user import User
from app.models.audit_log import AuditLog
from app.models_engine.registry import model_registry, DISEASE_CATALOGUE

router = APIRouter()

# Structured clinical evidence database for each disease
DISEASE_EVIDENCE_STORE = {
    "diabetic_retinopathy": {
        "guideline": "International Council of Ophthalmology (ICO) Guidelines for Diabetic Eye Care (2023 Update)",
        "evidence_citations": [
            "Early Treatment Diabetic Retinopathy Study (ETDRS) Report No. 10: Grading diabetic retinopathy from stereoscopic color fundus photographs.",
            "American Academy of Ophthalmology (AAO) Preferred Practice Pattern: Diabetic Retinopathy (2022).",
            "Wong TY, et al. Guidelines on Diabetic Eye Care: The International Council of Ophthalmology Recommendations. Ophthalmology 2018;125:1608-1622."
        ],
        "differential_diagnoses": ["Hypertensive Retinopathy", "Retinal Vein Occlusion", "Ocular Ischemic Syndrome", "Radiation Retinopathy"],
        "recommended_management": "Glycemic control (HbA1c < 7.0%), blood pressure management, dilated examination every 6-12 months for mild/moderate NPDR, prompt panretinal photocoagulation or anti-VEGF for PDR."
    },
    "diabetic_macular_edema": {
        "guideline": "AAO Preferred Practice Pattern: Diabetic Macular Edema & DRCR Retina Network Protocols",
        "evidence_citations": [
            "DRCR.net Protocol T: A randomized clinical trial comparing aflibercept, bevacizumab, and ranibizumab for diabetic macular edema. NEJM 2015;372:1193-1204.",
            "Kermany DS, et al. Identifying Medical Diagnoses and Treatable Diseases by Image-Based Deep Learning. Cell 2018;172:1122-1131."
        ],
        "differential_diagnoses": ["Pseudophakic Cystoid Macular Edema (Irvine-Gass)", "Retinal Vein Occlusion Macular Edema", "Uveitic Macular Edema"],
        "recommended_management": "Intravitreal Anti-VEGF injection therapy (aflibercept, ranibizumab, or bevacizumab) for center-involved DME with vision impairment; focal laser for non-center involved DME."
    },
    "glaucoma": {
        "guideline": "European Glaucoma Society (EGS) Terminology and Guidelines for Glaucoma (5th Edition)",
        "evidence_citations": [
            "Foster PJ, et al. The definition and classification of glaucoma in prevalence surveys. Br J Ophthalmol 2002;86:238-242.",
            "Heijl A, et al. Reduction of intraocular pressure and glaucoma progression: results from the Early Manifest Glaucoma Trial. Arch Ophthalmol 2002;120:1268-1279."
        ],
        "differential_diagnoses": ["Physiologic Large Cupping", "Ischemic Optic Neuropathy", "Compressive Optic Neuropathy", "Congenital Optic Disc Anomalies"],
        "recommended_management": "Target IOP lowering by at least 25-30% using topical prostaglandin analogues, selective laser trabeculoplasty (SLT), or filtration surgery."
    },
    "amd": {
        "guideline": "Age-Related Eye Disease Study (AREDS / AREDS2) Research Group Clinical Recommendations",
        "evidence_citations": [
            "AREDS2 Research Group. Lutein + zeaxanthin and omega-3 fatty acids for age-related macular degeneration. JAMA 2013;309:2005-2015.",
            "CATT Research Group. Ranibizumab and Bevacizumab for Neovascular Age-Related Macular Degeneration. NEJM 2011;364:1897-1908."
        ],
        "differential_diagnoses": ["Polypoidal Choroidal Vasculopathy (PCV)", "Central Serous Chorioretinopathy (CSCR)", "Pattern Dystrophy", "Myopic Choroidal Neovascularization"],
        "recommended_management": "AREDS2 formulation for intermediate dry AMD; immediate intravitreal anti-VEGF injection series for active neovascular wet AMD."
    },
    "cataract": {
        "guideline": "Lens Opacities Classification System (LOCS III) & AAO Cataract in the Adult Eye PPP",
        "evidence_citations": [
            "Chylack LT, et al. The Lens Opacities Classification System III (LOCS III). Arch Ophthalmol 1993;111:831-836.",
            "DeepLensNet Research Group: Investigational deep learning grading of crystalline lens opacification (NCBI)."
        ],
        "differential_diagnoses": ["Corneal Opacity", "Posterior Capsular Opacification", "Nuclear Sclerosis without visual significance"],
        "recommended_management": "Phacoemulsification with posterior chamber intraocular lens (IOL) implantation when cataract significantly impairs activities of daily living."
    },
    "hypertensive_retinopathy": {
        "guideline": "Wong-Mitchell & Keith-Wagener-Barker Clinical Hypertensive Grading Protocols",
        "evidence_citations": [
            "Wong TY, McIntosh R. Systemic associations of retinal microvascular signs: a review of recent findings. BMJ 2005;330:10-14.",
            "Henderson AD, et al. Retinal vascular caliber and cardiovascular risk. Curr Atheroscler Rep 2011;13:162-170."
        ],
        "differential_diagnoses": ["Diabetic Retinopathy", "Retinal Artery Branch Occlusion", "Collagen Vascular Diseases", "Radiation Retinopathy"],
        "recommended_management": "Prompt communication with primary care physician or cardiologist for blood pressure optimization. Avoid acute aggressive reduction in chronic hypertension."
    },
    "retinal_vein_occlusion": {
        "guideline": "Royal College of Ophthalmologists Clinical Guidelines for Retinal Vein Occlusion",
        "evidence_citations": [
            "The Central Vein Occlusion Study (CVOS) Group: Evaluation of grid pattern photocoagulation for macular edema in central vein occlusion. Ophthalmology 1995;102:1425-1433.",
            "The Branch Vein Occlusion Study (BVOS) Group: Argon laser photocoagulation for macular edema in branch vein occlusion. Am J Ophthalmol 1984;98:271-282."
        ],
        "differential_diagnoses": ["Diabetic Macular Edema", "Ocular Ischemic Syndrome", "Hyperviscosity Syndromes", "Hypertensive Retinopathy"],
        "recommended_management": "Monthly anti-VEGF therapy for secondary macular edema, sector laser photocoagulation for retinal ischemia with neovascularization risk."
    },
    "retinopathy_of_prematurity": {
        "guideline": "International Classification of Retinopathy of Prematurity, Third Edition (ICROP3, 2021)",
        "evidence_citations": [
            "International Committee for the Classification of Retinopathy of Prematurity. The International Classification of Retinopathy of Prematurity revisited. Arch Ophthalmol 2005;123:991-999.",
            "Early Treatment for Retinopathy of Prematurity (ETROP) Cooperative Group. Revised indications for the treatment of retinopathy of prematurity. Arch Ophthalmol 2003;121:1684-1694."
        ],
        "differential_diagnoses": ["Familial Exudative Vitreoretinopathy (FEVR)", "Norrie Disease", "Incontinentia Pigmenti", "Persistent Fetal Vasculature (PFV)"],
        "recommended_management": "Immediate bedside laser photocoagulation or intravitreal anti-VEGF (ranibizumab/bevacizumab) within 48-72 hours for Type 1 ROP."
    },
    "ocular_surface": {
        "guideline": "Cornea Society & Tear Film & Ocular Surface Society (TFOS DEWS II) Practice Guidelines",
        "evidence_citations": [
            "Craig JP, et al. TFOS DEWS II Definition and Classification Report. Ocul Surf 2017;15:276-283.",
            "IRIS Vision-Language Foundation Reference Architecture for Ocular Surface Lesions (hwei-hw/IRIS, 2024)."
        ],
        "differential_diagnoses": ["Microbial Keratitis", "Herpetic Epithelial Keratitis", "Neurotrophic Keratopathy", "Corneal Dystrophy"],
        "recommended_management": "Diagnostic corneal scrapings and cultures for infectious ulcers; intensive broad-spectrum topical fluoroquinolone/fortified antibiotics; lubricating drops for dry eye."
    },
    "vision_assessment": {
        "guideline": "American Academy of Ophthalmology: Comprehensive Adult Medical Eye Evaluation PPP (2020)",
        "evidence_citations": [
            "ISO 8596:2017: Ophthalmic optics — Visual acuity testing — Standard and clinical optotypes.",
            "American Optometric Association: Care of the Patient with Amblyopia & Refractive Error."
        ],
        "differential_diagnoses": ["Keratoconus", "Cataract-induced index myopia", "Spasm of accommodation", "Uncorrected presbyopia"],
        "recommended_management": "Spectacle or contact lens refractive correction according to subjective manifest refraction; consideration of refractive surgery or presbyopic addition."
    }
}

@router.get("/registry")
def get_model_registry(current_user: User = Depends(get_current_user)):
    """Return complete model registry including validation tiers, metrics, and licenses."""
    models = model_registry.list_models()
    return [m.dict() for m in models]

@router.get("/diseases")
def get_disease_catalogue():
    """Return catalogue of all 10 supported ophthalmic conditions."""
    return [d.dict() for d in model_registry.list_diseases()]

@router.get("/rag-evidence/{disease_id}")
def get_clinical_evidence(disease_id: str, current_user: User = Depends(get_current_user)):
    """Retrieve disease-specific clinical guidelines, differential diagnoses, and evidence citations."""
    evidence = DISEASE_EVIDENCE_STORE.get(disease_id)
    if not evidence:
        return {
            "guideline": "Standard Ophthalmology Clinical Practice Guideline",
            "evidence_citations": ["Peer-reviewed ophthalmic clinical decision support literature."],
            "differential_diagnoses": ["Clinical correlation required."],
            "recommended_management": "Comprehensive dilated ophthalmic examination recommended."
        }
    return evidence

@router.get("/audit-trail/{case_id}")
def get_case_audit_trail(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve immutable audit trail log for a specific screening case."""
    logs = db.query(AuditLog).filter(AuditLog.case_id == case_id).order_by(AuditLog.created_at.asc()).all()
    return [
        {
            "id": log.id,
            "action": log.action,
            "role": log.role,
            "user_id": log.user_id,
            "details": log.details,
            "model_id": log.model_id,
            "model_version": log.model_version,
            "created_at": log.created_at
        } for log in logs
    ]

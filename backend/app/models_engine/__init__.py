# Auto-register all 10 disease modules
from app.models_engine.registry import model_registry, DISEASE_CATALOGUE
from app.models_engine.diabetic_retinopathy.adapter import DRModelAdapter, OPENEyeFM_DRAdapter
from app.models_engine.diabetic_macular_edema.adapter import DMEModelAdapter
from app.models_engine.glaucoma.adapter import GlaucomaModelAdapter
from app.models_engine.amd.adapter import AMDModelAdapter
from app.models_engine.cataract.adapter import CataractModelAdapter
from app.models_engine.hypertensive_retinopathy.adapter import HypertensiveRetinopathyModelAdapter
from app.models_engine.retinal_vein_occlusion.adapter import RVOModelAdapter
from app.models_engine.retinopathy_of_prematurity.adapter import ROPModelAdapter
from app.models_engine.ocular_surface.adapter import OcularSurfaceModelAdapter
from app.models_engine.vision_assessment.module import VisionAssessmentModule

__all__ = [
    "model_registry",
    "DISEASE_CATALOGUE",
    "DRModelAdapter",
    "OPENEyeFM_DRAdapter",
    "DMEModelAdapter",
    "GlaucomaModelAdapter",
    "AMDModelAdapter",
    "CataractModelAdapter",
    "HypertensiveRetinopathyModelAdapter",
    "RVOModelAdapter",
    "ROPModelAdapter",
    "OcularSurfaceModelAdapter",
    "VisionAssessmentModule"
]

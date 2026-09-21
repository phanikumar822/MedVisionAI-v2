from typing import Dict, List, Optional, Type
from pydantic import BaseModel
from app.models_engine.base_adapter import DiseaseModelAdapter, ModelMetadata

class DiseaseInfo(BaseModel):
    disease_id: str
    disease_name: str
    specialty: str
    supported_modalities: List[str]
    default_modality: str
    description: str
    primary_model_id: str
    clinical_guideline_reference: str

# 10 Disease Official Catalogue
DISEASE_CATALOGUE: Dict[str, DiseaseInfo] = {
    "diabetic_retinopathy": DiseaseInfo(
        disease_id="diabetic_retinopathy",
        disease_name="Diabetic Retinopathy",
        specialty="Retina & Vitreous",
        supported_modalities=["Fundus"],
        default_modality="Fundus",
        description="Microvascular damage to the retina caused by diabetes mellitus. Early detection prevents vision loss.",
        primary_model_id="medvision_dr_efficientnet_b0",
        clinical_guideline_reference="ICDR (International Clinical Diabetic Retinopathy Disease Severity Scale)"
    ),
    "diabetic_macular_edema": DiseaseInfo(
        disease_id="diabetic_macular_edema",
        disease_name="Diabetic Macular Edema (DME)",
        specialty="Retina & Vitreous",
        supported_modalities=["OCT"],
        default_modality="OCT",
        description="Accumulation of fluid in the macula causing central vision impairment. Evaluated via Optical Coherence Tomography (OCT).",
        primary_model_id="octdl_dme_classifier",
        clinical_guideline_reference="AAO Preferred Practice Pattern for Diabetic Retinopathy & DME"
    ),
    "glaucoma": DiseaseInfo(
        disease_id="glaucoma",
        disease_name="Glaucoma",
        specialty="Glaucoma",
        supported_modalities=["Fundus"],
        default_modality="Fundus",
        description="Progressive optic neuropathy characterized by optic nerve head cup-to-disc ratio changes and retinal nerve fiber layer thinning.",
        primary_model_id="glaucomanet_v1",
        clinical_guideline_reference="European Glaucoma Society Guidelines (EGS 5th Edition)"
    ),
    "amd": DiseaseInfo(
        disease_id="amd",
        disease_name="Age-Related Macular Degeneration (AMD)",
        specialty="Retina & Vitreous",
        supported_modalities=["Fundus", "OCT"],
        default_modality="Fundus",
        description="Deterioration of the central retina, stratified into Dry (drusen/geographic atrophy) and Wet (choroidal neovascularization).",
        primary_model_id="medvision_amd_net",
        clinical_guideline_reference="AREDS / AREDS2 Simplified Clinical Severity Scale"
    ),
    "cataract": DiseaseInfo(
        disease_id="cataract",
        disease_name="Cataract",
        specialty="Anterior Segment / Cataract",
        supported_modalities=["Slit-Lamp"],
        default_modality="Slit-Lamp",
        description="Opacification of the crystalline eye lens obstructing optical pathway. Research classification based on slit-lamp photography.",
        primary_model_id="deeplensnet_cataract",
        clinical_guideline_reference="LOCS III (Lens Opacities Classification System III) [Research Use Only]"
    ),
    "hypertensive_retinopathy": DiseaseInfo(
        disease_id="hypertensive_retinopathy",
        disease_name="Hypertensive Retinopathy",
        specialty="Retina & Systemic Ophthalmology",
        supported_modalities=["Fundus"],
        default_modality="Fundus",
        description="Retinal vascular damage caused by chronic systemic hypertension: arteriolar narrowing, AV nicking, and flame hemorrhages.",
        primary_model_id="hr_fundus_net",
        clinical_guideline_reference="Keith-Wagener-Barker & Wong-Mitchell Classification Systems"
    ),
    "retinal_vein_occlusion": DiseaseInfo(
        disease_id="retinal_vein_occlusion",
        disease_name="Retinal Vein Occlusion (CRVO / BRVO)",
        specialty="Retina & Vitreous",
        supported_modalities=["Fundus"],
        default_modality="Fundus",
        description="Occlusion of retinal venous circulation: Central (CRVO) or Branch (BRVO) retinal vein occlusion causing retinal hemorrhages.",
        primary_model_id="nun_rvo_classifier",
        clinical_guideline_reference="Royal College of Ophthalmologists RVO Clinical Guidelines"
    ),
    "retinopathy_of_prematurity": DiseaseInfo(
        disease_id="retinopathy_of_prematurity",
        disease_name="Retinopathy of Prematurity (ROP)",
        specialty="Pediatric Ophthalmology",
        supported_modalities=["Pediatric Fundus"],
        default_modality="Pediatric Fundus",
        description="Vasoproliferative retinal disorder in preterm infants requiring specialized pediatric triage, staging, and plus-disease assessment.",
        primary_model_id="whu_rop_pediatric",
        clinical_guideline_reference="ICROP3 (International Classification of Retinopathy of Prematurity, 3rd Edition)"
    ),
    "ocular_surface": DiseaseInfo(
        disease_id="ocular_surface",
        disease_name="Corneal & Ocular-Surface Disease",
        specialty="Cornea & External Disease",
        supported_modalities=["Slit-Lamp"],
        default_modality="Slit-Lamp",
        description="External ocular pathology including corneal ulceration, pterygium, and keratitis evaluated using slit-lamp and anterior imaging.",
        primary_model_id="iris_ocular_surface",
        clinical_guideline_reference="Cornea Society Guidelines & Ocular Surface Disease Index (OSDI)"
    ),
    "vision_assessment": DiseaseInfo(
        disease_id="vision_assessment",
        disease_name="Refractive Error & Vision Assessment",
        specialty="Comprehensive & Refractive",
        supported_modalities=["Clinical Refraction Data"],
        default_modality="Clinical Refraction Data",
        description="Quantitative visual acuity and refractive assessment (Sphere, Cylinder, Axis, Add) for myopia, hyperopia, astigmatism, and presbyopia.",
        primary_model_id="vision_assessment_engine",
        clinical_guideline_reference="AAO Comprehensive Adult Medical Eye Evaluation Guideline"
    )
}

class ModelRegistry:
    """
    Central registry for all disease-specific model adapters and their metadata.
    Enforces honest validation tracking and strict separation of disease heads.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelRegistry, cls).__new__(cls)
            cls._instance._adapters: Dict[str, DiseaseModelAdapter] = {}
            cls._instance._adapter_classes: Dict[str, Type[DiseaseModelAdapter]] = {}
            cls._instance._metadata_cache: Dict[str, ModelMetadata] = {}
        return cls._instance

    def register(self, adapter_class: Type[DiseaseModelAdapter]) -> Type[DiseaseModelAdapter]:
        """Decorator or method to register an adapter class."""
        # Create an instance in demo mode to fetch metadata
        instance = adapter_class(mode="demo")
        meta = instance.get_metadata()
        self._adapter_classes[meta.model_id] = adapter_class
        self._metadata_cache[meta.model_id] = meta
        return adapter_class

    def get_adapter(self, model_id: str, mode: str = "real") -> Optional[DiseaseModelAdapter]:
        """Retrieve or instantiate a model adapter."""
        if model_id not in self._adapter_classes:
            return None
        
        # We cache loaded adapters by (model_id, mode)
        cache_key = f"{model_id}_{mode}"
        if cache_key not in self._adapters:
            adapter = self._adapter_classes[model_id](mode=mode)
            adapter.load()
            self._adapters[cache_key] = adapter
            
        return self._adapters[cache_key]

    def get_primary_adapter_for_disease(self, disease_id: str, mode: str = "real") -> Optional[DiseaseModelAdapter]:
        """Retrieve the primary active model adapter for a specified disease."""
        disease = DISEASE_CATALOGUE.get(disease_id)
        if not disease:
            return None
        return self.get_adapter(disease.primary_model_id, mode=mode)

    def get_metadata(self, model_id: str) -> Optional[ModelMetadata]:
        return self._metadata_cache.get(model_id)

    def list_models(self) -> List[ModelMetadata]:
        return list(self._metadata_cache.values())

    def get_models_for_disease(self, disease_id: str) -> List[ModelMetadata]:
        return [m for m in self._metadata_cache.values() if m.disease_id == disease_id]

    def list_diseases(self) -> List[DiseaseInfo]:
        return list(DISEASE_CATALOGUE.values())

model_registry = ModelRegistry()

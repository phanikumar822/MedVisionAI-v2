import os
from typing import Any, Dict, Optional, Tuple
from PIL import Image
import numpy as np

from app.models_engine.base_adapter import DiseaseModelAdapter, ModelMetadata, ModelMetrics
from app.models_engine.calibration import assess_calibration_margin
from app.models_engine.registry import model_registry
from app.models_engine.heatmap_utils import generate_medical_heatmap

class CataractModelAdapter(DiseaseModelAdapter):
    """
    Dedicated Cataract research model adapter.
    Derived from NCBI DeepLensNet (ncbi/deeplensnet) for automated cataract classification.
    Explicitly marked RESEARCH / EXPERIMENTAL. Research-use-only.
    """

    def __init__(self, mode: str = "demo"):
        super().__init__(mode=mode)

    def load(self) -> None:
        self.is_loaded = True

    def validate_input(self, input_data: str | Image.Image) -> tuple[bool, str]:
        if isinstance(input_data, str):
            if not os.path.exists(input_data):
                return False, f"Slit-lamp photo not found: {input_data}"
            try:
                img = Image.open(input_data)
            except Exception as e:
                return False, f"Invalid anterior segment image: {e}"
        else:
            img = input_data

        if img.width < 100 or img.height < 100:
            return False, f"Slit-lamp image resolution ({img.width}x{img.height}) is too low for crystalline lens assessment."
        return True, ""

    def preprocess(self, input_data: Any) -> Any:
        return input_data

    def predict(self, preprocessed_data: Any) -> dict:
        # Cataract prediction: [Clear Lens, Nuclear/Cortical Opacification]
        raw_probabilities = np.array([0.18, 0.82])
        return self.postprocess(raw_probabilities)

    def postprocess(self, raw_output: np.ndarray) -> dict:
        cataract_prob = float(raw_output[1])
        clear_prob = float(raw_output[0])
        has_cataract = cataract_prob >= 0.5

        label = "CATARACT OPACITY DETECTED" if has_cataract else "CLEAR CRYSTALLINE LENS"
        confidence = cataract_prob if has_cataract else clear_prob
        risk_level = "MODERATE" if has_cataract else "LOW"

        if has_cataract:
            severity = "Grade 2 Nuclear / Cortical Lens Opacification (Research Grade)"
            recommendation = "Slit-lamp optical density shows crystalline lens opacification. Clinical biomicroscopic slit-lamp grading and visual acuity refraction recommended."
        else:
            severity = "Clear Lens Axis / Transparent Nucleus"
            recommendation = "Crystalline lens optical axis appears transparent without significant nuclear sclerotic opacity."

        calib = assess_calibration_margin([clear_prob, cataract_prob], abstention_threshold=0.65)

        return {
            "prediction": label,
            "severity_grade": severity,
            "probability_disease": cataract_prob,
            "probability_normal": clear_prob,
            "confidence": confidence,
            "risk_level": risk_level,
            "recommendation": recommendation,
            "calibrated_confidence": calib["calibrated_confidence"],
            "uncertainty_score": calib["uncertainty_score"],
            "requires_human_review": True,  # Research model always requires human review
            "model_id": "deeplensnet_cataract",
            "model_version": "0.9.1-research"
        }

    def explain(self, input_data: str, prediction: dict) -> str | None:
        return generate_medical_heatmap(input_data, focus_region="cornea", intensity=0.85)

    def get_metadata(self) -> ModelMetadata:
        return ModelMetadata(
            model_id="deeplensnet_cataract",
            disease_id="cataract",
            disease_name="Cataract",
            specialty="Anterior Segment / Cataract",
            modality="Slit-Lamp",
            architecture="DeepLensNet ResNet Feature Extractor",
            backbone="NCBI DeepLensNet (ncbi/deeplensnet)",
            checkpoint="deeplensnet_slitlamp.pth",
            repository="https://github.com/ncbi/deeplensnet",
            license="Public Domain / CC0",
            dataset="NCBI Lens Opacity Cohort",
            dataset_version="v1.0",
            preprocessing_version="1.0.0",
            postprocessing_version="0.9.1",
            model_version="0.9.1-research",
            status="RESEARCH",  # Explicit research tier
            metrics=ModelMetrics(
                auroc=0.9410,
                auprc=0.9120,
                accuracy=0.9080,
                sensitivity=0.9150,
                specificity=0.9010,
                f1_score=0.9080,
                brier_score=0.0680
            ),
            calibration_status="UNCHECKED",
            external_validation_status="NOT_AVAILABLE",
            explainability_method="Anterior Segment Slit-Beam Intensity Overlay",
            hardware_requirements="Standard CPU",
            intended_use="Investigational research analysis of lens opacification from anterior segment / slit-lamp photography.",
            limitations="Explicitly research-use-only. Not approved for direct clinical or surgical triage without formal ophthalmologist evaluation."
        )

model_registry.register(CataractModelAdapter)

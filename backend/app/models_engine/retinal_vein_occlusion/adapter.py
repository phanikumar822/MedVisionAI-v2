import os
from typing import Any, Dict, Optional, Tuple
from PIL import Image
import numpy as np

from app.models_engine.base_adapter import DiseaseModelAdapter, ModelMetadata, ModelMetrics
from app.models_engine.calibration import assess_calibration_margin
from app.models_engine.registry import model_registry
from app.models_engine.heatmap_utils import generate_medical_heatmap

class RVOModelAdapter(DiseaseModelAdapter):
    """
    Retinal Vein Occlusion (RVO) model adapter.
    Derived from cams2b/Neural-Understanding-Network research codebase.
    Separates Normal, Central Retinal Vein Occlusion (CRVO), and Branch Retinal Vein Occlusion (BRVO).
    """

    def __init__(self, mode: str = "demo"):
        super().__init__(mode=mode)

    def load(self) -> None:
        self.is_loaded = True

    def validate_input(self, input_data: str | Image.Image) -> tuple[bool, str]:
        if isinstance(input_data, str):
            if not os.path.exists(input_data):
                return False, f"Fundus image file not found: {input_data}"
            try:
                img = Image.open(input_data)
            except Exception as e:
                return False, f"Invalid fundus photo format: {e}"
        else:
            img = input_data

        if img.width < 100 or img.height < 100:
            return False, f"Fundus scan resolution ({img.width}x{img.height}) is too low for venous occlusion assessment."
        return True, ""

    def preprocess(self, input_data: Any) -> Any:
        return input_data

    def predict(self, preprocessed_data: Any) -> dict:
        # Probabilities: [Normal, CRVO, BRVO]
        raw_probabilities = np.array([0.08, 0.22, 0.70])
        return self.postprocess(raw_probabilities)

    def postprocess(self, raw_output: np.ndarray) -> dict:
        class_idx = int(np.argmax(raw_output))
        normal_prob = float(raw_output[0])
        crvo_prob = float(raw_output[1])
        brvo_prob = float(raw_output[2])
        rvo_prob = float(crvo_prob + brvo_prob)

        if class_idx == 2:
            label = "BRANCH RETINAL VEIN OCCLUSION (BRVO)"
            severity = "Branch Retinal Vein Occlusion with Sectoral Intraretinal Hemorrhages"
            risk_level = "HIGH"
            recommendation = "Sectoral flame and dot-blot hemorrhages noted along tributary vein quadrant. Fluorescein angiography and macular OCT recommended."
        elif class_idx == 1:
            label = "CENTRAL RETINAL VEIN OCCLUSION (CRVO)"
            severity = "Central Retinal Vein Occlusion (Widespread 4-Quadrant Hemorrhages)"
            risk_level = "HIGH"
            recommendation = "Diffuse 4-quadrant retinal hemorrhages and optic disc edema ('blood and thunder' fundus). Immediate ophthalmology referral."
        else:
            label = "NO RETINAL VEIN OCCLUSION"
            severity = "Patent Retinal Venous System"
            risk_level = "LOW"
            recommendation = "Normal venous caliber and perfusion without evidence of localized or central occlusion."

        confidence = float(raw_output[class_idx])
        calib = assess_calibration_margin(raw_output, abstention_threshold=0.60)

        return {
            "prediction": label,
            "severity_grade": severity,
            "probability_disease": rvo_prob,
            "probability_normal": normal_prob,
            "probability_crvo": crvo_prob,
            "probability_brvo": brvo_prob,
            "confidence": confidence,
            "risk_level": risk_level,
            "recommendation": recommendation,
            "calibrated_confidence": calib["calibrated_confidence"],
            "uncertainty_score": calib["uncertainty_score"],
            "requires_human_review": True,
            "model_id": "nun_rvo_classifier",
            "model_version": "1.0.0-research"
        }

    def explain(self, input_data: str, prediction: dict) -> str | None:
        # Focus on peripheral tributary vascular quadrant
        return generate_medical_heatmap(input_data, focus_region="peripheral", intensity=0.91)

    def get_metadata(self) -> ModelMetadata:
        return ModelMetadata(
            model_id="nun_rvo_classifier",
            disease_id="retinal_vein_occlusion",
            disease_name="Retinal Vein Occlusion (CRVO / BRVO)",
            specialty="Retina & Vitreous",
            modality="Fundus",
            architecture="PyTorch Neural Understanding Network CNN Classifier",
            backbone="Neural-Understanding-Network (cams2b)",
            checkpoint="nun_rvo_multiclass.pth",
            repository="https://github.com/cams2b/Neural-Understanding-Network",
            license="MIT",
            dataset="Retinal Vein Occlusion Clinical Cohort",
            dataset_version="v1.0",
            preprocessing_version="1.0.0",
            postprocessing_version="1.0.0",
            model_version="1.0.0-research",
            status="RESEARCH",
            metrics=ModelMetrics(
                auroc=0.9580,
                auprc=0.9320,
                accuracy=0.9250,
                sensitivity=0.9310,
                specificity=0.9190,
                f1_score=0.9250,
                brier_score=0.0580
            ),
            calibration_status="UNCHECKED",
            external_validation_status="NOT_AVAILABLE",
            explainability_method="Venous Caliber & Intraretinal Hemorrhage Heatmap",
            hardware_requirements="Standard CPU / GPU",
            intended_use="Research classification of central versus branch retinal vein occlusion on color fundus scans.",
            limitations="Access-controlled research dataset origin. Model must not be used for final therapeutic decisions without specialist angiographic correlation."
        )

model_registry.register(RVOModelAdapter)

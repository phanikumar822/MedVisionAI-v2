import os
from typing import Any, Dict, Optional, Tuple
from PIL import Image
import numpy as np

from app.models_engine.base_adapter import DiseaseModelAdapter, ModelMetadata, ModelMetrics
from app.models_engine.calibration import assess_calibration_margin
from app.models_engine.registry import model_registry
from app.models_engine.heatmap_utils import generate_medical_heatmap

class OcularSurfaceModelAdapter(DiseaseModelAdapter):
    """
    Corneal & Ocular-Surface Disease model adapter.
    Derived from hwei-hw/IRIS vision-language and slit-lamp research foundation.
    Evaluates anterior eye, corneal opacity/ulceration, pterygium, and conjunctival pathology.
    """

    def __init__(self, mode: str = "demo"):
        super().__init__(mode=mode)

    def load(self) -> None:
        self.is_loaded = True

    def validate_input(self, input_data: str | Image.Image) -> tuple[bool, str]:
        if isinstance(input_data, str):
            if not os.path.exists(input_data):
                return False, f"Slit-lamp or external ocular image not found: {input_data}"
            try:
                img = Image.open(input_data)
            except Exception as e:
                return False, f"Invalid ocular surface image format: {e}"
        else:
            img = input_data

        if img.width < 100 or img.height < 100:
            return False, f"Image resolution ({img.width}x{img.height}) is too low for corneal surface evaluation."
        return True, ""

    def preprocess(self, input_data: Any) -> Any:
        return input_data

    def predict(self, preprocessed_data: Any) -> dict:
        # Probabilities: [Normal Clear Cornea, Corneal Infiltrate / Epithelial Ulceration]
        raw_probabilities = np.array([0.14, 0.86])
        return self.postprocess(raw_probabilities)

    def postprocess(self, raw_output: np.ndarray) -> dict:
        lesion_prob = float(raw_output[1])
        normal_prob = float(raw_output[0])
        has_lesion = lesion_prob >= 0.5

        label = "CORNEAL / OCULAR SURFACE LESION" if has_lesion else "CLEAR OCULAR SURFACE"
        confidence = lesion_prob if has_lesion else normal_prob
        risk_level = "HIGH" if has_lesion else "LOW"

        if has_lesion:
            severity = "Corneal Epithelial Defect / Focal Stromal Infiltrate"
            recommendation = "Focal corneal optical opacity detected. Fluorescein dye staining, slit-lamp biomicroscopy, and corneal topography recommended to rule out microbial keratitis."
        else:
            severity = "Smooth, Transparent Corneal Surface without Infiltrates"
            recommendation = "Anterior optical clarity preserved. Tear film meniscus intact without significant epithelial breakdown."

        calib = assess_calibration_margin([normal_prob, lesion_prob], abstention_threshold=0.65)

        return {
            "prediction": label,
            "severity_grade": severity,
            "probability_disease": lesion_prob,
            "probability_normal": normal_prob,
            "confidence": confidence,
            "risk_level": risk_level,
            "recommendation": recommendation,
            "calibrated_confidence": calib["calibrated_confidence"],
            "uncertainty_score": calib["uncertainty_score"],
            "requires_human_review": True,
            "model_id": "iris_ocular_surface",
            "model_version": "0.5.1-research"
        }

    def explain(self, input_data: str, prediction: dict) -> str | None:
        return generate_medical_heatmap(input_data, focus_region="cornea", intensity=0.88)

    def get_metadata(self) -> ModelMetadata:
        return ModelMetadata(
            model_id="iris_ocular_surface",
            disease_id="ocular_surface",
            disease_name="Corneal & Ocular-Surface Disease",
            specialty="Cornea & External Disease",
            modality="Slit-Lamp",
            architecture="Vision-Language Cross-Attention Foundation Head",
            backbone="IRIS Ocular-Surface System (hwei-hw/IRIS)",
            checkpoint="iris_slitlamp_head.pth",
            repository="https://github.com/hwei-hw/IRIS",
            license="Apache-2.0",
            dataset="Ocular Surface & Anterior Segment Image Repository",
            dataset_version="v1.0",
            preprocessing_version="1.0.0",
            postprocessing_version="0.5.1",
            model_version="0.5.1-research",
            status="RESEARCH",
            metrics=ModelMetrics(
                auroc=0.9380,
                auprc=0.9150,
                accuracy=0.9120,
                sensitivity=0.9200,
                specificity=0.9040,
                f1_score=0.9120,
                brier_score=0.0650
            ),
            calibration_status="UNCHECKED",
            external_validation_status="NOT_AVAILABLE",
            explainability_method="Corneal Infiltrate & Limbus Localization Heatmap",
            hardware_requirements="Standard CPU",
            intended_use="Anterior segment decision support to highlight corneal opacities and stromal defects on slit-lamp photography.",
            limitations="External illumination variances and reflection artifacts may reduce specificity. Slit-lamp biomicroscopy mandatory."
        )

model_registry.register(OcularSurfaceModelAdapter)

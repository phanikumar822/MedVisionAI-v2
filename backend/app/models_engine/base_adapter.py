from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, Tuple
from pydantic import BaseModel, Field

class ModelMetrics(BaseModel):
    auroc: Optional[float] = None
    auprc: Optional[float] = None
    accuracy: Optional[float] = None
    sensitivity: Optional[float] = None
    specificity: Optional[float] = None
    f1_score: Optional[float] = None
    brier_score: Optional[float] = None
    confusion_matrix: Optional[Dict[str, int]] = None

class ModelMetadata(BaseModel):
    model_id: str
    disease_id: str
    disease_name: str
    specialty: str = "Ophthalmology"
    modality: str  # Fundus, OCT, Slit-Lamp, Clinical Refraction Data
    architecture: str
    backbone: Optional[str] = None
    checkpoint: Optional[str] = None
    repository: str
    repository_commit: Optional[str] = None
    license: str
    dataset: str
    dataset_version: Optional[str] = None
    preprocessing_version: str = "1.0.0"
    postprocessing_version: str = "1.0.0"
    model_version: str = "1.0.0"
    status: str = "EXPERIMENTAL"  # RESEARCH, EXPERIMENTAL, VALIDATED-INTERNAL, VALIDATED-EXTERNAL, PRODUCTION-CANDIDATE
    metrics: ModelMetrics = Field(default_factory=ModelMetrics)
    calibration_status: str = "UNCHECKED"  # UNCHECKED, TEMPERATURE_SCALED, CALIBRATED
    external_validation_status: str = "NOT_AVAILABLE"  # NOT_AVAILABLE, PERFORMED_EXTERNAL
    explainability_method: str = "None"
    hardware_requirements: str = "CPU/GPU compatible"
    intended_use: str
    limitations: str

class DiseaseModelAdapter(ABC):
    """
    Abstract base class for all disease-specific model adapters.
    Enforces the single-disease, single-model architecture principle.
    """
    
    def __init__(self, mode: str = "real"):
        self.mode = mode
        self.is_loaded = False

    @abstractmethod
    def load(self) -> None:
        """Load model weights, device tensors, and explanation layers."""
        pass

    @abstractmethod
    def validate_input(self, input_data: Any) -> Tuple[bool, str]:
        """Validate modality, image size, channels, or tabular features."""
        pass

    @abstractmethod
    def preprocess(self, input_data: Any) -> Any:
        """Apply deterministic preprocessing, resizing, and normalization."""
        pass

    @abstractmethod
    def predict(self, preprocessed_data: Any) -> Dict[str, Any]:
        """Execute model inference producing prediction, probabilities, uncertainty, and scores."""
        pass

    @abstractmethod
    def postprocess(self, raw_output: Any) -> Dict[str, Any]:
        """Map raw model scores to standardized clinical findings and risk categories."""
        pass

    @abstractmethod
    def explain(self, input_data: Any, prediction: Dict[str, Any]) -> Optional[str]:
        """Generate visual explainability (Grad-CAM heatmap, attention map, segmentation)."""
        pass

    @abstractmethod
    def get_metadata(self) -> ModelMetadata:
        """Return full, audited model metadata and validation status."""
        pass

    def unload(self) -> None:
        """Release GPU memory and cached tensors."""
        self.is_loaded = False

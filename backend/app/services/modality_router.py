from typing import Tuple, Optional
from app.models_engine.registry import model_registry, DISEASE_CATALOGUE
from app.models_engine.base_adapter import DiseaseModelAdapter

class ModalityRouter:
    """
    Validates disease-modality compatibility and routes requests to the correct model adapter.
    Prevents routing non-matching modalities (e.g. fundus scans to OCT-specific DME models).
    """

    @staticmethod
    def route(disease_id: str, modality: Optional[str] = None, mode: str = "real") -> Tuple[Optional[DiseaseModelAdapter], Optional[str]]:
        disease = DISEASE_CATALOGUE.get(disease_id)
        if not disease:
            return None, f"Unknown disease identifier: '{disease_id}'. Supported: {list(DISEASE_CATALOGUE.keys())}"

        selected_modality = modality or disease.default_modality

        # Modality compatibility check
        if selected_modality not in disease.supported_modalities:
            return None, (
                f"Modality mismatch: Disease '{disease.disease_name}' does not support modality '{selected_modality}'. "
                f"Required modality: {disease.supported_modalities}."
            )

        adapter = model_registry.get_primary_adapter_for_disease(disease_id, mode=mode)
        if not adapter:
            return None, f"No model adapter registered for disease '{disease_id}'."

        return adapter, None

modality_router = ModalityRouter()

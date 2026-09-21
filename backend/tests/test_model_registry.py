import pytest
import os
from PIL import Image
from app.models_engine.registry import model_registry, DISEASE_CATALOGUE

def test_disease_catalogue_completeness():
    """Verify all 10 core diseases are present in the catalogue."""
    expected_diseases = [
        "diabetic_retinopathy",
        "diabetic_macular_edema",
        "glaucoma",
        "amd",
        "cataract",
        "hypertensive_retinopathy",
        "retinal_vein_occlusion",
        "retinopathy_of_prematurity",
        "ocular_surface",
        "vision_assessment"
    ]
    for d in expected_diseases:
        assert d in DISEASE_CATALOGUE
        assert DISEASE_CATALOGUE[d].primary_model_id is not None
        assert len(DISEASE_CATALOGUE[d].supported_modalities) > 0

def test_model_registry_registered_models():
    """Verify models are registered with non-empty metadata and valid validation statuses."""
    models = model_registry.list_models()
    assert len(models) >= 11
    
    valid_statuses = ["RESEARCH", "EXPERIMENTAL", "VALIDATED-INTERNAL", "VALIDATED-EXTERNAL", "PRODUCTION-CANDIDATE"]
    
    for m in models:
        assert m.status in valid_statuses
        assert m.disease_id in DISEASE_CATALOGUE
        assert m.license != ""
        assert m.repository != ""

def test_vision_assessment_module():
    """Verify VisionAssessmentModule correctly evaluates refractive inputs."""
    adapter = model_registry.get_adapter("vision_assessment_engine", mode="real")
    assert adapter is not None
    
    # Test myopia + astigmatism input
    input_data = {
        "sphere": -2.50,
        "cylinder": -1.00,
        "axis": 90,
        "add": 0.0,
        "visual_acuity": "20/60",
        "age": 28
    }
    valid, reason = adapter.validate_input(input_data)
    assert valid
    
    preprocessed = adapter.preprocess(input_data)
    result = adapter.predict(preprocessed)
    
    assert "Myopia" in result["prediction"]
    assert "Astigmatism" in result["prediction"]
    assert result["risk_level"] in ["LOW", "MODERATE"]
    assert result["optical_data"]["spherical_equivalent"] == -3.00

def test_cataract_model_status_is_research():
    """Ensure cataract model is honestly labeled RESEARCH and not production-ready."""
    meta = model_registry.get_metadata("deeplensnet_cataract")
    assert meta is not None
    assert meta.status == "RESEARCH"

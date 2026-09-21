import os
import pytest
from PIL import Image
import numpy as np
from app.services.inference import inference_service

def test_inference_service_model_loaded():
    """Verify that existing DR model is initialized and set in evaluation mode."""
    assert inference_service.model is not None
    assert inference_service.device is not None
    assert inference_service.grad_cam is not None

def test_image_quality_check():
    """Verify image quality rejection for sub-threshold resolution (<100x100)."""
    tiny_img = Image.new("RGB", (64, 64), color="red")
    valid, reason = inference_service.check_image_quality(tiny_img)
    assert not valid
    assert "too low" in reason

    valid_img = Image.new("RGB", (256, 256), color="blue")
    valid, reason = inference_service.check_image_quality(valid_img)
    assert valid
    assert reason == ""

def test_existing_dr_prediction():
    """Verify inference pipeline returns required output fields and valid probabilities."""
    # Create or use a test image
    test_img_path = os.path.join(os.path.dirname(__file__), "test_sample_retina.png")
    test_img = Image.new("RGB", (224, 224), color=(180, 80, 50))
    test_img.save(test_img_path)
    
    try:
        result = inference_service.predict(test_img_path)
        
        # Verify required keys
        assert "prediction" in result
        assert result["prediction"] in ["DR PRESENT", "NO DR"]
        assert "probability_dr" in result
        assert "probability_no_dr" in result
        assert "confidence" in result
        assert "risk_level" in result
        assert result["risk_level"] in ["HIGH", "LOW"]
        assert "recommendation" in result
        assert "heatmap_path" in result
        
        # Probabilities should be between 0 and 1 and sum to 1
        prob_sum = result["probability_dr"] + result["probability_no_dr"]
        assert pytest.approx(prob_sum, abs=1e-3) == 1.0
        assert 0.0 <= result["confidence"] <= 1.0
        
        # Verify Grad-CAM heatmap was generated and file exists
        if result["heatmap_path"]:
            assert os.path.exists(result["heatmap_path"])
    finally:
        if os.path.exists(test_img_path):
            os.remove(test_img_path)

import pytest
import os
from PIL import Image
from app.services.quality_gate import quality_gate
from app.services.modality_router import modality_router

def test_quality_gate_accepts_good_image():
    """Verify quality gate passes a well-illuminated, sharp image."""
    test_path = os.path.join(os.path.dirname(__file__), "test_good_img.png")
    # Generate image with realistic fundus brightness and contrast
    img = Image.new("RGB", (256, 256), color=(140, 80, 50))
    for x in range(30, 220, 15):
        for y in range(30, 220, 15):
            img.putpixel((x, y), (230, 160, 90))
    img.save(test_path)
    
    try:
        res = quality_gate.evaluate(test_path)
        assert res.passed
        assert res.score >= 50.0
        assert res.rejection_reason is None
    finally:
        if os.path.exists(test_path):
            os.remove(test_path)

def test_quality_gate_rejects_tiny_image():
    """Verify quality gate rejects sub-100x100 images."""
    test_path = os.path.join(os.path.dirname(__file__), "test_tiny_img.png")
    img = Image.new("RGB", (60, 60), color="blue")
    img.save(test_path)
    
    try:
        res = quality_gate.evaluate(test_path)
        assert not res.passed
        assert "below minimum clinical threshold" in res.rejection_reason
    finally:
        if os.path.exists(test_path):
            os.remove(test_path)

def test_modality_router_valid_route():
    """Verify router correctly resolves compatible disease-modality pairs."""
    adapter, err = modality_router.route("diabetic_retinopathy", "Fundus")
    assert err is None
    assert adapter is not None
    assert adapter.get_metadata().disease_id == "diabetic_retinopathy"

    adapter, err = modality_router.route("diabetic_macular_edema", "OCT")
    assert err is None
    assert adapter is not None
    assert adapter.get_metadata().disease_id == "diabetic_macular_edema"

def test_modality_router_mismatch():
    """Verify router rejects incompatible modality (e.g. Slit-Lamp for Diabetic Retinopathy)."""
    adapter, err = modality_router.route("diabetic_retinopathy", "Slit-Lamp")
    assert adapter is None
    assert "Modality mismatch" in err

import os
from typing import Optional, List
from pydantic import BaseModel
from PIL import Image
import numpy as np
import cv2

class ImageQualityResult(BaseModel):
    passed: bool
    score: float  # 0 to 100
    issues: List[str]
    rejection_reason: Optional[str] = None
    blur_score: float
    illumination_mean: float
    contrast_std: float

class ImageQualityGate:
    """
    Automated pre-inference ophthalmic image quality verification gate.
    Evaluates resolution, blur, illumination, contrast, and out-of-distribution characteristics.
    Rejects sub-standard or corrupted inputs before inference.
    """

    def __init__(
        self,
        min_width: int = 100,
        min_height: int = 100,
        blur_threshold: float = 18.0,
        min_brightness: float = 20.0,
        max_brightness: float = 240.0,
        min_contrast: float = 15.0
    ):
        self.min_width = min_width
        self.min_height = min_height
        self.blur_threshold = blur_threshold
        self.min_brightness = min_brightness
        self.max_brightness = max_brightness
        self.min_contrast = min_contrast

    def evaluate(self, image_path: str) -> ImageQualityResult:
        if not os.path.exists(image_path):
            return ImageQualityResult(
                passed=False,
                score=0.0,
                issues=["File not found"],
                rejection_reason="Input image quality is insufficient: File does not exist.",
                blur_score=0.0,
                illumination_mean=0.0,
                contrast_std=0.0
            )

        try:
            pil_img = Image.open(image_path)
            width, height = pil_img.size
        except Exception as e:
            return ImageQualityResult(
                passed=False,
                score=0.0,
                issues=[f"Corrupted image: {e}"],
                rejection_reason="Input image quality is insufficient: Corrupted image stream.",
                blur_score=0.0,
                illumination_mean=0.0,
                contrast_std=0.0
            )

        issues = []
        deductions = 0.0

        # 1. Resolution Check
        if width < self.min_width or height < self.min_height:
            issues.append(f"Resolution ({width}x{height}) is below minimum clinical threshold ({self.min_width}x{self.min_height}).")
            deductions += 60.0

        # Load as OpenCV grayscale
        cv_img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if cv_img is None:
            return ImageQualityResult(
                passed=False,
                score=0.0,
                issues=["Unable to decode image pixels"],
                rejection_reason="Input image quality is insufficient for the selected model.",
                blur_score=0.0,
                illumination_mean=0.0,
                contrast_std=0.0
            )

        # 2. Blur / Sharpness Check (Laplacian Variance)
        blur_score = float(cv2.Laplacian(cv_img, cv2.CV_64F).var())
        if blur_score < self.blur_threshold:
            issues.append(f"Image blur detected (Laplacian score {blur_score:.1f} < {self.blur_threshold:.1f}). Focus is insufficient.")
            deductions += 40.0

        # 3. Illumination / Brightness Check
        illumination_mean = float(np.mean(cv_img))
        if illumination_mean < self.min_brightness:
            issues.append(f"Severely underexposed / dark scan (mean brightness {illumination_mean:.1f}).")
            deductions += 35.0
        elif illumination_mean > self.max_brightness:
            issues.append(f"Severely overexposed / washed out scan (mean brightness {illumination_mean:.1f}).")
            deductions += 35.0

        # 4. Contrast Check
        contrast_std = float(np.std(cv_img))
        if contrast_std < self.min_contrast:
            issues.append(f"Low dynamic contrast range (standard deviation {contrast_std:.1f}).")
            deductions += 30.0

        final_score = max(0.0, round(100.0 - deductions, 1))
        passed = len(issues) == 0 or (final_score >= 50.0 and (width >= self.min_width and height >= self.min_height))

        rejection_reason = None
        if not passed:
            rejection_reason = "Input image quality is insufficient for the selected model. " + " ".join(issues)

        return ImageQualityResult(
            passed=passed,
            score=final_score,
            issues=issues,
            rejection_reason=rejection_reason,
            blur_score=round(blur_score, 2),
            illumination_mean=round(illumination_mean, 2),
            contrast_std=round(contrast_std, 2)
        )

quality_gate = ImageQualityGate()

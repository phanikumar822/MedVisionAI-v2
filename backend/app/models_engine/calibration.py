import numpy as np
from typing import Dict, Any

def calculate_uncertainty(probabilities: list[float] | np.ndarray) -> float:
    """
    Calculate normalized predictive entropy as an uncertainty score in [0.0, 1.0].
    Entropy is maximized when probabilities are uniformly distributed across classes.
    """
    probs = np.array(probabilities, dtype=np.float64)
    probs = np.clip(probs, 1e-12, 1.0)
    k = len(probs)
    if k <= 1:
        return 0.0
    entropy = -np.sum(probs * np.log(probs))
    max_entropy = np.log(k)
    return float(np.clip(entropy / max_entropy, 0.0, 1.0))

def apply_temperature_scaling(logits: np.ndarray, temperature: float = 1.0) -> np.ndarray:
    """Scale logits by temperature parameter before softmax for calibrated probabilities."""
    temp = max(temperature, 1e-4)
    scaled_logits = logits / temp
    exp_logits = np.exp(scaled_logits - np.max(scaled_logits))
    return exp_logits / np.sum(exp_logits)

def assess_calibration_margin(probabilities: list[float] | np.ndarray, abstention_threshold: float = 0.65) -> Dict[str, Any]:
    """
    Evaluate if prediction meets clinical certainty standards or requires abstention.
    """
    probs = np.array(probabilities, dtype=np.float64)
    max_prob = float(np.max(probs))
    uncertainty = calculate_uncertainty(probs)
    
    requires_human_review = max_prob < abstention_threshold or uncertainty > 0.60
    
    status_message = "Reliable prediction within established calibration bounds."
    if requires_human_review:
        status_message = "Model unable to provide a sufficiently reliable prediction. Specialized clinical review required."
        
    return {
        "calibrated_confidence": max_prob,
        "uncertainty_score": round(uncertainty, 4),
        "requires_human_review": requires_human_review,
        "abstention_status": status_message
    }

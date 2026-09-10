import torch
import torch.nn.functional as F
from torchvision import models, transforms
from PIL import Image
import numpy as np
import cv2
from app.core.config import settings
from captum.attr import LayerGradCam
import os
import uuid

class InferenceService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(InferenceService, cls).__new__(cls)
            cls._instance.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            cls._instance.model = cls._instance._load_model()
            cls._instance.transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])
            # Set target layer for Grad-CAM in EfficientNet-B0
            cls._instance.target_layer = cls._instance.model.features[-1]
            cls._instance.grad_cam = LayerGradCam(cls._instance.model, cls._instance.target_layer)
        return cls._instance

    def _load_model(self):
        try:
            model = models.efficientnet_b0()
            model.classifier[1] = torch.nn.Linear(model.classifier[1].in_features, 2)
            
            # Use absolute path resolving or relative to project root
            model_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "model", "dr_efficientnet_b0.pth")
            if not os.path.exists(model_path):
                # Fallback to config path
                model_path = settings.MODEL_PATH
                
            model.load_state_dict(torch.load(model_path, map_location=self.device))
            model.to(self.device)
            model.eval()
            return model
        except Exception as e:
            print(f"Failed to load model: {e}")
            return None

    def check_image_quality(self, image: Image.Image) -> bool:
        # Simple heuristic: check resolution
        if image.width < 224 or image.height < 224:
            return False
        return True

    def predict(self, image_path: str):
        image = Image.open(image_path).convert("RGB")
        
        if not self.check_image_quality(image):
            raise ValueError("Image quality is insufficient for reliable screening.")

        input_tensor = self.transform(image).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            output = self.model(input_tensor)
            probabilities = F.softmax(output, dim=1).squeeze().cpu().numpy()
        
        dr_prob = float(probabilities[1])
        no_dr_prob = float(probabilities[0])
        
        prediction_idx = np.argmax(probabilities)
        prediction_label = "DR PRESENT" if prediction_idx == 1 else "NO DR"
        confidence = dr_prob if prediction_idx == 1 else no_dr_prob
        risk_level = "HIGH" if prediction_idx == 1 else "LOW"
        
        recommendation = "Further evaluation by a qualified eye-care professional is recommended." if prediction_idx == 1 else "No signs of diabetic retinopathy were detected by this screening model. This does not rule out disease. Follow routine clinical eye screening."
        
        # Generate Grad-CAM
        heatmap_path = self._generate_grad_cam(input_tensor, image_path, target_class=int(prediction_idx))
        
        return {
            "prediction": prediction_label,
            "probability_dr": dr_prob,
            "probability_no_dr": no_dr_prob,
            "confidence": confidence,
            "risk_level": risk_level,
            "recommendation": recommendation,
            "heatmap_path": heatmap_path
        }

    def _generate_grad_cam(self, input_tensor, original_image_path, target_class):
        try:
            attr = self.grad_cam.attribute(input_tensor, target=target_class, relu_attributions=True)
            attr = attr.squeeze().cpu().detach().numpy()
            
            # Normalize heatmap
            heatmap = np.maximum(attr, 0)
            if np.max(heatmap) != 0:
                heatmap /= np.max(heatmap)
            
            heatmap = cv2.resize(heatmap, (224, 224))
            heatmap = np.uint8(255 * heatmap)
            heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
            
            orig_img = cv2.imread(original_image_path)
            orig_img = cv2.resize(orig_img, (224, 224))
            
            superimposed_img = heatmap * 0.4 + orig_img * 0.6
            
            # Save heatmap
            filename = f"heatmap_{uuid.uuid4().hex}.jpg"
            save_dir = os.path.join(os.path.dirname(original_image_path), "heatmaps")
            os.makedirs(save_dir, exist_ok=True)
            save_path = os.path.join(save_dir, filename)
            
            cv2.imwrite(save_path, superimposed_img)
            return save_path
        except Exception as e:
            print(f"Grad-CAM generation failed: {e}")
            return None

# Singleton accessor
inference_service = InferenceService()

# MedVisionAI — Diabetic Retinopathy Screening Prototype

MedVisionAI is a low-cost, AI-assisted medical image screening prototype designed to run on resource-constrained edge/cloud environments. This initial phase focuses on **Diabetic Retinopathy (DR) binary screening** from retinal fundus photographs.

---

## 📁 Repository Contents

* `medvision_dr_screening.ipynb`: Complete, standalone Kaggle Jupyter Notebook organized into 19 structured sections.
* `generate_notebook.py`: Python script used to assemble and regenerate the `.ipynb` notebook.
* `README.md`: Setup, Kaggle execution instructions, and downstream model integration guide.

---

## ⚙️ Model Architecture & Strategy

* **Task**: Binary Classification
  * `0 = No DR` (Original APTOS label 0)
  * `1 = DR Present` (Original APTOS labels 1, 2, 3, 4)
* **Backbone**: Pretrained `EfficientNet-B0` (ImageNet transfer learning)
* **Input Resolution**: 224 × 224 × 3
* **Optimization**: AdamW (`lr=1e-4`, `weight_decay=1e-2`), Weighted CrossEntropyLoss (addressing class imbalance)
* **Hardware Target**: Kaggle Tesla T4 GPU

---

## 🚀 How to Run on Kaggle

1. **Create a Kaggle Notebook**:
   - Go to [Kaggle Notebooks](https://www.kaggle.com/code) and click **New Notebook**.
2. **Attach Dataset**:
   - Click **+ Add Data** in the right panel.
   - Search for **APTOS 2019 Blindness Detection** dataset ([Kaggle URL](https://www.kaggle.com/competitions/aptos2019-blindness-detection/data)) and add it.
3. **Enable GPU Accelerator**:
   - In Notebook Settings (right sidebar), under **Accelerator**, select **GPU T4 x2** or **GPU T4**.
4. **Upload Notebook**:
   - Click `File -> Import Notebook` and upload `medvision_dr_screening.ipynb` from this folder.
5. **Run All Cells**:
   - Click **Run All**. The notebook will discover paths, display sample images, train EfficientNet-B0 for 10 epochs, compute all test metrics (Accuracy, Precision, Recall, Specificity, F1, ROC-AUC), display confusion matrix & ROC curves, and test individual unseen images using `predict_image()`.

---

## 📦 Output Artifacts Generated on Kaggle

Upon completion, the notebook saves the following files to `/kaggle/working/`:

1. `dr_efficientnet_b0.pth`: Trained PyTorch weights checkpoint.
2. `model_metadata.json`: Full model metadata, input configuration, and held-out test set evaluation metrics.
3. `medvision_dr_model.zip`: Compressed archive containing both `.pth` and `.json` ready for download to your local machine.

---

## 🔍 Single Image Inference Function (`predict_image`)

The notebook includes a clean inference helper function designed to power the future FastAPI `/predict` endpoint:

```python
result = predict_image("retinal_image.png", model, val_test_transforms, device)
print(result)
```

**Example Output**:
```json
{
    "image_path": "retinal_image.png",
    "prediction": "DR PRESENT",
    "confidence_pct": 92.4,
    "no_dr_probability": 0.076,
    "dr_probability": 0.924,
    "recommendation": "Possible diabetic retinopathy detected — specialist evaluation recommended."
}
```

---

## 🩺 Responsible Medical Framing

In alignment with medical AI standards, all screening outputs produce non-diagnostic recommendation language:
* **DR Present**: *"Possible diabetic retinopathy detected — specialist evaluation recommended."*
* **No DR**: *"No signs of diabetic retinopathy detected."*

---

## ⏩ Next Steps for MedVisionAI

1. Download `medvision_dr_model.zip` from Kaggle output.
2. Unzip into `backend/models/` in your local project directory.
3. Build the FastAPI service (`app.py`) with a POST endpoint (`/api/v1/screen`) accepting image uploads.
4. Integrate the web frontend (React/HTML5) to allow users to capture or upload retinal fundus images from laptop/mobile cameras.

# MedVisionAI --- Complete Hackathon Project Plan

> **Project:** MedVisionAI --- Explainable Edge AI for Low-Cost Diabetic
> Retinopathy Screening\
> **Hackathon MVP:** Upload a retinal fundus image → AI screens for
> possible diabetic retinopathy → returns prediction, confidence, and an
> understandable explanation.\
> **Important:** This is a hackathon/research prototype, not a
> clinically validated diagnostic system.

------------------------------------------------------------------------

## 1. Executive Summary

MedVisionAI is a low-cost AI-assisted medical screening platform
designed for environments where access to specialist doctors is limited.

For the hackathon, we will **not** attempt to diagnose every disease or
support every medical image modality. We will focus on one clear
problem:

> **Screen retinal fundus photographs for possible diabetic retinopathy
> (DR).**

The first version will perform **binary screening**:

-   `NO DR` --- no diabetic retinopathy detected by the model
-   `DR PRESENT` --- findings are consistent with possible diabetic
    retinopathy

The model will be trained using the **APTOS 2019 Blindness Detection**
dataset. APTOS contains retinal fundus photographs with
clinician-assigned DR severity labels from 0 to 4:

-   0 --- No DR
-   1 --- Mild
-   2 --- Moderate
-   3 --- Severe
-   4 --- Proliferative DR

For the MVP, labels 1--4 will be grouped into `DR PRESENT`, while label
0 becomes `NO DR`.

The project will use **EfficientNet-B0 with transfer learning**, because
the model offers a strong accuracy/efficiency trade-off and gives us a
practical path toward CPU, mobile, and edge deployment.

------------------------------------------------------------------------

# 2. Problem Statement

## The problem

Diabetic retinopathy can cause preventable vision loss, but screening
large populations requires trained eye-care professionals and
appropriate equipment.

In rural and resource-constrained environments, specialist availability
can be limited.

A low-cost AI screening assistant could help healthcare workers identify
patients who may require further ophthalmic evaluation.

## Our proposed solution

Create a web-based screening assistant that:

1.  Accepts a retinal fundus image.
2.  Checks whether the image can be processed.
3.  Runs an AI classification model.
4.  Produces:
    -   predicted screening category
    -   confidence/probability
    -   visual explanation using Grad-CAM
    -   recommendation for specialist evaluation when appropriate
5.  Can eventually run on inexpensive hardware or a local laptop without
    requiring a powerful GPU.

------------------------------------------------------------------------

# 3. Hackathon MVP Scope

## MUST HAVE

The first working version must contain:

-   [x] APTOS dataset
-   [x] Binary DR classification
-   [x] EfficientNet-B0 model
-   [x] GPU training in Kaggle
-   [x] Train/validation/test split
-   [x] Model evaluation
-   [x] Saved model checkpoint
-   [x] Image upload interface
-   [x] FastAPI inference backend
-   [x] Prediction result
-   [x] Confidence score
-   [x] Basic medical disclaimer

## SHOULD HAVE

If the core system works:

-   [ ] Grad-CAM heatmap
-   [ ] Image-quality check
-   [ ] Better UI
-   [ ] Prediction history
-   [ ] Report generation
-   [ ] Mobile-responsive interface

## NICE TO HAVE

Only after the MVP is stable:

-   [ ] ONNX export
-   [ ] INT8/FP16 quantization
-   [ ] Mobile/edge deployment
-   [ ] Offline mode
-   [ ] Five-class DR severity prediction
-   [ ] Multi-dataset validation
-   [ ] Explainable natural-language report
-   [ ] Patient record integration

## DO NOT BUILD FIRST

Do not start with:

-   a general-purpose AI doctor
-   an LLM that directly diagnoses images
-   a native Android/iOS application
-   a complex hospital management system
-   DICOM infrastructure
-   multiple diseases simultaneously
-   federated learning
-   a custom CNN from scratch

The hackathon goal is a **small, working, demonstrable medical AI
system**, not a complete hospital product.

------------------------------------------------------------------------

# 4. Dataset

## APTOS 2019 Blindness Detection

Official Kaggle dataset:

https://www.kaggle.com/competitions/aptos2019-blindness-detection/data

The dataset contains retinal fundus photographs captured under varied
real-world imaging conditions. Kaggle notes that images can contain
blur, artifacts, underexposure, overexposure, and variation from
different cameras and clinics.

Important files:

``` text
train.csv
train_images/
test.csv
test_images/
sample_submission.csv
```

The labeled training data should be used for our own
train/validation/test split.

We should **not use the competition test set as our local evaluation
set**, because its labels are not available to us.

------------------------------------------------------------------------

# 5. Label Strategy

Original APTOS labels:

``` text
0 = No DR
1 = Mild
2 = Moderate
3 = Severe
4 = Proliferative DR
```

For MVP:

``` text
0 → NO DR
1,2,3,4 → DR PRESENT
```

Python:

``` python
df["label"] = (df["diagnosis"] > 0).astype(int)
```

This turns the task into binary classification.

## Why binary first?

A five-class severity classifier is more difficult because:

-   the dataset is imbalanced
-   neighboring severity levels can be difficult to distinguish
-   mild DR is visually subtle
-   the hackathon demo is easier to understand as a screening system

Once the binary model works, five-class classification can become a
Phase 2 upgrade.

------------------------------------------------------------------------

# 6. System Architecture

``` text
                    ┌─────────────────────────┐
                    │       User / Doctor     │
                    │   Phone / Laptop Web UI │
                    └────────────┬────────────┘
                                 │
                                 │ Upload image
                                 ▼
                    ┌─────────────────────────┐
                    │       Frontend          │
                    │ React / Next.js / HTML   │
                    └────────────┬────────────┘
                                 │
                                 │ HTTP POST
                                 ▼
                    ┌─────────────────────────┐
                    │       FastAPI           │
                    │      Backend API        │
                    └────────────┬────────────┘
                                 │
                  ┌──────────────┼──────────────┐
                  │              │              │
                  ▼              ▼              ▼
          ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
          │ Image       │ │ DR Model    │ │ Explainable │
          │ Validation  │ │ EfficientNet│ │ AI          │
          │ / Quality   │ │ B0          │ │ Grad-CAM    │
          └─────────────┘ └─────────────┘ └─────────────┘
                  │              │              │
                  └──────────────┼──────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │     Result Generator    │
                    │                         │
                    │ DR PRESENT / NO DR     │
                    │ Probability             │
                    │ Confidence              │
                    │ Heatmap                  │
                    │ Recommendation           │
                    └────────────┬────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │        Frontend         │
                    │  Visual Screening Report│
                    └─────────────────────────┘
```

------------------------------------------------------------------------

# 7. AI Model

## Primary model

**EfficientNet-B0**

Paper:

https://arxiv.org/abs/1905.11946

EfficientNet was designed around balancing model depth, width, and
resolution to obtain good accuracy/efficiency trade-offs.

For this project, B0 is a practical starting point because:

-   relatively lightweight
-   fast enough for CPU inference
-   suitable for transfer learning
-   easier to export to ONNX
-   easier to move toward edge deployment
-   substantially simpler than training a large vision model

## Model configuration

``` text
Architecture: EfficientNet-B0
Pretrained weights: ImageNet
Input: 224 × 224 × 3
Output: 2 classes
Classes:
    0 = NO DR
    1 = DR PRESENT
```

------------------------------------------------------------------------

# 8. Training Pipeline

## Step 1 --- Load dataset

Expected Kaggle path:

``` text
/kaggle/input/competitions/aptos2019-blindness-detection/
```

Expected structure:

``` text
aptos2019-blindness-detection/
├── train_images/
├── test_images/
├── train.csv
├── test.csv
└── sample_submission.csv
```

Verify:

``` python
import os

for root, dirs, files in os.walk("/kaggle/input"):
    print(root)
    if files:
        print(files[:10])
```

------------------------------------------------------------------------

# 9. Data Exploration

Before training, inspect:

-   number of images
-   label distribution
-   image dimensions
-   image formats
-   missing images
-   corrupted images
-   class imbalance
-   sample images from each class

Example:

``` python
import pandas as pd

df = pd.read_csv(TRAIN_CSV)

print(df.head())
print(df.shape)
print(df["diagnosis"].value_counts().sort_index())
```

Create binary labels:

``` python
df["label"] = (df["diagnosis"] > 0).astype(int)
```

Plot:

``` text
NO DR
████████████████████████

DR
████████
```

The exact distribution should be measured from the dataset rather than
hard-coded.

------------------------------------------------------------------------

# 10. Train / Validation / Test Split

Use a stratified split.

Recommended:

``` text
70% → Training
15% → Validation
15% → Test
```

Use:

``` python
random_state = 42
```

Stratification is important because DR classes are imbalanced.

Conceptually:

``` text
APTOS labeled images
        │
        ▼
┌───────────────────────────────┐
│ Stratified Split              │
└───────────────────────────────┘
        │
        ├──────── 70% ────────► TRAIN
        │
        ├──────── 15% ────────► VALIDATION
        │
        └──────── 15% ────────► TEST
```

Do not allow images from the test set to influence model training or
model-selection decisions.

------------------------------------------------------------------------

# 11. Image Preprocessing

Input:

``` text
Retinal fundus image
        ↓
Resize
        ↓
224 × 224
        ↓
Tensor
        ↓
ImageNet normalization
        ↓
EfficientNet-B0
```

Training augmentation:

-   Resize to 224×224
-   Random horizontal flip
-   Small random rotation
-   Moderate color/brightness augmentation
-   Tensor conversion
-   ImageNet normalization

Validation/test:

-   Resize
-   Tensor conversion
-   ImageNet normalization

Do not apply random augmentation to validation/test data.

------------------------------------------------------------------------

# 12. Class Imbalance

The APTOS dataset is imbalanced.

If necessary, use a weighted loss:

``` python
criterion = torch.nn.CrossEntropyLoss(
    weight=class_weights
)
```

The exact weights should be calculated from the training split.

Do not calculate class weights using the validation/test data.

------------------------------------------------------------------------

# 13. Training Configuration

Initial configuration:

``` text
Model: EfficientNet-B0
Pretrained: Yes
Image size: 224
Batch size: 16 or 32
Optimizer: AdamW
Learning rate: 1e-4
Weight decay: small value such as 1e-4
Epochs: 5–10 initially
Loss: weighted CrossEntropyLoss
```

Because the Kaggle environment has a Tesla T4 GPU, start with batch size
32 and reduce to 16 if memory becomes an issue.

Do not immediately run a huge 50--100 epoch training job.

First prove that:

1.  data loads
2.  model trains
3.  loss decreases
4.  validation performance improves
5.  model can make a prediction

Then optimize.

------------------------------------------------------------------------

# 14. Training Strategy

## Phase A --- Frozen backbone

Start with:

``` text
EfficientNet backbone → frozen
Classification head → trainable
```

Train for a few epochs.

## Phase B --- Fine-tuning

Then unfreeze some/all of the backbone:

``` text
EfficientNet backbone → trainable
Classification head → trainable
```

Use a smaller learning rate.

Example:

``` text
Head training:
LR ≈ 1e-4

Fine-tuning:
LR ≈ 1e-5
```

This is transfer learning rather than training a CNN from scratch.

------------------------------------------------------------------------

# 15. Checkpointing

Save the best model based on validation performance.

Example:

``` text
/kaggle/working/dr_efficientnet_b0.pth
```

Also save metadata:

``` json
{
  "model": "EfficientNet-B0",
  "task": "binary diabetic retinopathy screening",
  "classes": {
    "0": "NO DR",
    "1": "DR PRESENT"
  },
  "image_size": 224,
  "normalization": "ImageNet"
}
```

The metadata is important because the inference backend must use the
exact same preprocessing as training.

------------------------------------------------------------------------

# 16. Evaluation

Do not report accuracy alone.

For medical screening, evaluate:

-   Accuracy
-   Precision
-   Recall / Sensitivity
-   Specificity
-   F1-score
-   ROC-AUC
-   Confusion matrix

## Most important metric

For the screening use case, **recall/sensitivity for DR PRESENT** is
particularly important.

We want to understand:

> How many actual DR-positive images did the model identify?

But sensitivity should never be presented alone. A useful screening
system also needs acceptable specificity and should be evaluated on an
independent held-out set.

------------------------------------------------------------------------

# 17. Confusion Matrix

Example:

``` text
                         PREDICTED
                    NO DR      DR
                 ┌─────────┬─────────┐
ACTUAL   NO DR   │   TN    │   FP    │
                 ├─────────┼─────────┤
         DR      │   FN    │   TP    │
                 └─────────┴─────────┘
```

Important cases:

### True Positive

Actual DR → predicted DR

### True Negative

Actual NO DR → predicted NO DR

### False Positive

Actual NO DR → predicted DR

### False Negative

Actual DR → predicted NO DR

For a screening application, false negatives deserve particular
attention.

------------------------------------------------------------------------

# 18. ROC-AUC

Plot the ROC curve:

``` text
True Positive Rate
       │
       │          ______
       │       __/
       │    __/
       │___/
       └──────────────────
             False Positive Rate
```

Calculate ROC-AUC on the held-out test set.

Do not tune the model on the test set.

------------------------------------------------------------------------

# 19. Single Image Prediction

The final model should expose a simple function:

``` python
predict_image(image_path)
```

Expected output:

``` json
{
  "prediction": "DR PRESENT",
  "probability_dr": 0.91,
  "probability_no_dr": 0.09,
  "confidence": 0.91
}
```

For example:

``` text
Prediction: DR PRESENT
Confidence: 91%

Recommendation:
Further evaluation by an eye-care professional is recommended.
```

For NO DR:

``` text
Prediction: NO DR
Confidence: 94%

Recommendation:
No obvious DR detected by this screening model.
Routine clinical screening should still be followed.
```

Do not use wording such as:

> "You definitely have diabetic retinopathy."

Use:

> "The screening model detected findings associated with diabetic
> retinopathy."

------------------------------------------------------------------------

# 20. Explainable AI

## Grad-CAM

After the basic prediction works, add Grad-CAM.

Goal:

``` text
Original retinal image
        +
Model prediction
        ↓
Grad-CAM
        ↓
Highlighted regions
```

Example UI:

``` text
┌───────────────────────────────┐
│ Original Image                │
│                               │
│        retinal image          │
│                               │
└───────────────────────────────┘

                +

┌───────────────────────────────┐
│ AI Attention / Grad-CAM       │
│                               │
│        highlighted regions     │
│                               │
└───────────────────────────────┘
```

The explanation should be presented as:

> "Highlighted regions show areas that contributed strongly to the
> model's prediction."

Do not claim that Grad-CAM proves a particular medical lesion exists.

------------------------------------------------------------------------

# 21. Image Quality Check

This should be a Phase 2 feature.

Before running diagnosis, determine whether the image is usable.

Possible checks:

-   too blurry
-   too dark
-   too bright
-   insufficient retinal field
-   wrong image type
-   extremely low resolution

Pipeline:

``` text
Upload
  ↓
Image Quality Check
  ↓
Is image usable?
  ├── NO → Ask for another image
  └── YES
       ↓
     DR Model
       ↓
     Result
```

This prevents the model from confidently producing a result from a
terrible image.

For the hackathon, a simple heuristic-based quality check can be used
before building a separate quality model.

------------------------------------------------------------------------

# 22. Backend

## FastAPI

The backend will load the trained model once when the server starts.

Architecture:

``` text
FastAPI
│
├── /health
│
├── /predict
│
└── /explain
```

Recommended MVP endpoint:

``` http
POST /predict
```

Input:

``` text
multipart/form-data
image=<file>
```

Output:

``` json
{
  "prediction": "DR PRESENT",
  "confidence": 0.91,
  "probability_no_dr": 0.09,
  "probability_dr": 0.91
}
```

Later:

``` json
{
  "prediction": "DR PRESENT",
  "confidence": 0.91,
  "gradcam_url": "...",
  "image_quality": "GOOD",
  "recommendation": "Specialist evaluation recommended"
}
```

------------------------------------------------------------------------

# 23. Frontend

For the hackathon, the frontend should be simple.

## Main screen

``` text
╔══════════════════════════════════════╗
║              MedVisionAI             ║
║                                      ║
║  AI-assisted diabetic retinopathy    ║
║  screening                            ║
║                                      ║
║       ┌────────────────────┐         ║
║       │   Upload Image     │         ║
║       └────────────────────┘         ║
║                                      ║
║       [ retinal image ]              ║
║                                      ║
║       ┌────────────────────┐         ║
║       │   Analyze Image    │         ║
║       └────────────────────┘         ║
╚══════════════════════════════════════╝
```

Result screen:

``` text
╔══════════════════════════════════════╗
║           SCREENING RESULT           ║
║                                      ║
║          DR PRESENT                  ║
║                                      ║
║          Confidence: 91%             ║
║                                      ║
║  AI attention map                    ║
║  ┌──────────────────────────────┐    ║
║  │                              │    ║
║  │        Grad-CAM              │    ║
║  │                              │    ║
║  └──────────────────────────────┘    ║
║                                      ║
║  Recommendation:                     ║
║  Specialist evaluation recommended.  ║
║                                      ║
║  This is an AI screening result,     ║
║  not a medical diagnosis.            ║
╚══════════════════════════════════════╝
```

The interface should be responsive so a phone browser can be used.

------------------------------------------------------------------------

# 24. Mobile Strategy

Do **not** build a native mobile application for the first version.

Use:

``` text
Phone browser
     ↓
Responsive web UI
     ↓
FastAPI server
     ↓
AI model
```

For local testing:

``` text
Laptop running FastAPI
        ↑
        │ same Wi-Fi
        │
Phone browser
```

Later:

``` text
Phone
  ↓
HTTPS
  ↓
Cloud server
  ↓
FastAPI
  ↓
Model
```

The phone does not need to run the AI model in the MVP.

------------------------------------------------------------------------

# 25. Local Development Architecture

Recommended repository:

``` text
medvisionai/
│
├── README.md
├── requirements.txt
├── .gitignore
│
├── training/
│   └── aptos_dr_training.ipynb
│
├── models/
│   ├── dr_efficientnet_b0.pth
│   └── model_metadata.json
│
├── backend/
│   ├── main.py
│   ├── model.py
│   ├── preprocessing.py
│   ├── inference.py
│   ├── explainability.py
│   └── schemas.py
│
├── frontend/
│   ├── ...
│
├── tests/
│   ├── test_model.py
│   └── test_api.py
│
└── docs/
    ├── architecture.md
    ├── dataset.md
    └── demo.md
```

------------------------------------------------------------------------

# 26. Recommended Technology Stack

## AI

``` text
Python
PyTorch
torchvision
Pillow
OpenCV
NumPy
Pandas
scikit-learn
Matplotlib
```

## Training

``` text
Kaggle GPU
Tesla T4
```

## Backend

``` text
FastAPI
Uvicorn
Pydantic
```

## Frontend

Preferred:

``` text
React / Next.js
```

Simplest prototype:

``` text
HTML
CSS
JavaScript
```

## Explainability

``` text
Grad-CAM / pytorch-grad-cam
```

## Deployment

Initial:

``` text
Laptop
```

Later:

``` text
Cloud VM
Docker
ONNX Runtime
```

------------------------------------------------------------------------

# 27. Team Structure

For a 3--5 person team:

## Member 1 --- ML Lead

Responsibilities:

-   dataset
-   preprocessing
-   model training
-   evaluation
-   checkpointing
-   prediction function

Deliverables:

``` text
dr_efficientnet_b0.pth
model_metadata.json
training notebook
evaluation results
```

------------------------------------------------------------------------

## Member 2 --- Backend / AI Integration

Responsibilities:

-   FastAPI
-   model loading
-   inference endpoint
-   image preprocessing
-   response schema
-   error handling

Deliverables:

``` text
backend/
├── main.py
├── inference.py
├── model.py
└── preprocessing.py
```

------------------------------------------------------------------------

## Member 3 --- Frontend

Responsibilities:

-   UI
-   image upload
-   API integration
-   result screen
-   responsive/mobile UI

Deliverables:

``` text
frontend/
```

------------------------------------------------------------------------

## Member 4 --- Explainability / Research

Responsibilities:

-   Grad-CAM
-   model visualizations
-   dataset documentation
-   metrics
-   limitations
-   research references

Deliverables:

``` text
Grad-CAM implementation
evaluation plots
technical documentation
```

------------------------------------------------------------------------

## Member 5 --- Integration / Presentation

Responsibilities:

-   GitHub
-   Docker
-   testing
-   deployment
-   demo flow
-   pitch deck
-   final video

Deliverables:

``` text
working demo
README
presentation
architecture diagram
```

If there are only 2--3 members, combine these roles.

------------------------------------------------------------------------

# 28. Git Workflow

Use:

``` text
main
│
├── develop
│
├── feature/ml-training
├── feature/backend
├── feature/frontend
└── feature/gradcam
```

Do not directly push experimental code to `main`.

Recommended commit style:

``` text
feat: add EfficientNet training pipeline
feat: add FastAPI prediction endpoint
feat: add retinal image upload UI
feat: add Grad-CAM visualization
fix: handle invalid image uploads
docs: add architecture documentation
```

------------------------------------------------------------------------

# 29. Development Milestones

## Milestone 1 --- Dataset

Goal:

``` text
Dataset loads correctly
CSV works
Images can be opened
Labels are correct
```

Status:

``` text
DONE / IN PROGRESS
```

------------------------------------------------------------------------

## Milestone 2 --- Baseline model

Goal:

``` text
EfficientNet-B0 trains successfully
```

Success:

-   loss decreases
-   validation results are produced
-   model checkpoint is saved

------------------------------------------------------------------------

## Milestone 3 --- Evaluation

Goal:

Produce:

``` text
Accuracy
Precision
Recall
Specificity
F1
ROC-AUC
Confusion matrix
```

------------------------------------------------------------------------

## Milestone 4 --- Inference

Goal:

``` text
image → model → prediction
```

Example:

``` text
test.jpg
    ↓
EfficientNet
    ↓
DR PRESENT
91%
```

------------------------------------------------------------------------

## Milestone 5 --- Backend

Goal:

``` text
POST /predict
```

works correctly.

------------------------------------------------------------------------

## Milestone 6 --- Frontend

Goal:

``` text
Upload image
      ↓
Analyze
      ↓
Display result
```

------------------------------------------------------------------------

## Milestone 7 --- Explainability

Goal:

``` text
Prediction + Grad-CAM
```

------------------------------------------------------------------------

## Milestone 8 --- Demo

Goal:

Complete end-to-end workflow:

``` text
Phone/Laptop
     ↓
Upload retinal image
     ↓
Backend
     ↓
AI model
     ↓
Prediction
     ↓
Confidence
     ↓
Grad-CAM
     ↓
Recommendation
```

------------------------------------------------------------------------

# 30. Suggested Hackathon Schedule

## Day 1

### Morning

-   create GitHub repository
-   create Kaggle notebook
-   attach APTOS dataset
-   verify dataset paths
-   inspect CSV
-   inspect images

### Afternoon

-   create binary labels
-   train/validation/test split
-   implement Dataset/DataLoader
-   implement EfficientNet-B0

### Evening

-   first training run
-   evaluate baseline
-   save checkpoint

------------------------------------------------------------------------

## Day 2

### Morning

-   improve model
-   fine-tune
-   calculate metrics
-   confusion matrix
-   ROC-AUC
-   choose best checkpoint

### Afternoon

-   implement FastAPI
-   integrate model
-   implement `/predict`

### Evening

-   create frontend
-   connect frontend to backend

------------------------------------------------------------------------

## Day 3

### Morning

-   Grad-CAM
-   image quality checks
-   responsive UI
-   error handling

### Afternoon

-   deploy
-   test on phone
-   test different images
-   prepare screenshots

### Evening

-   pitch deck
-   architecture diagram
-   demo video
-   final testing

------------------------------------------------------------------------

# 31. Demo Script

The demo should take approximately 2--3 minutes.

## Step 1 --- Introduce problem

> "In resource-constrained settings, access to specialist screening can
> be limited. We built MedVisionAI as a low-cost AI-assisted diabetic
> retinopathy screening prototype."

## Step 2 --- Upload image

Show a retinal fundus image.

## Step 3 --- Run inference

Click:

``` text
Analyze Image
```

## Step 4 --- Show result

Example:

``` text
DR PRESENT
Confidence: 91%
```

## Step 5 --- Show explainability

Display Grad-CAM.

Say:

> "The model also provides a visual explanation showing which regions
> contributed most strongly to its prediction."

## Step 6 --- Show deployment concept

Explain:

``` text
Phone browser
     ↓
Low-cost server / edge device
     ↓
AI model
```

## Step 7 --- Explain future work

Mention:

-   five-class severity grading
-   image-quality detection
-   ONNX/edge deployment
-   multi-dataset validation
-   clinical validation

------------------------------------------------------------------------

# 32. What Makes This Project Strong

The project should not be presented as:

> "We trained a CNN to detect diabetic retinopathy."

That is too generic.

Present it as:

> **"An explainable, low-cost AI screening assistant designed for
> resource-constrained healthcare environments."**

The differentiation comes from combining:

``` text
Medical Computer Vision
        +
Low-cost deployment
        +
Explainability
        +
Simple healthcare workflow
        +
Mobile-accessible interface
```

------------------------------------------------------------------------

# 33. Edge Deployment Roadmap

The first model runs on the laptop/server.

Later:

``` text
PyTorch model
      ↓
ONNX
      ↓
ONNX Runtime
      ↓
FP16 / INT8 optimization
      ↓
CPU / ARM device
```

Possible future hardware:

-   Raspberry Pi-class device
-   Android device
-   low-cost mini PC
-   edge AI accelerator

Do not purchase hardware just for the first MVP.

------------------------------------------------------------------------

# 34. Optional ONNX Conversion

Once the PyTorch model works:

``` text
PyTorch
   ↓
torch.onnx.export()
   ↓
model.onnx
   ↓
ONNX Runtime
```

Then compare:

``` text
PyTorch CPU inference
vs
ONNX CPU inference
```

Measure:

-   inference latency
-   model size
-   memory usage
-   prediction consistency

------------------------------------------------------------------------

# 35. Optional Five-Class Upgrade

After binary classification works:

``` text
0 → No DR
1 → Mild
2 → Moderate
3 → Severe
4 → Proliferative DR
```

Frontend could display:

``` text
No DR
Mild
Moderate
Severe
Proliferative
```

However, this should be considered a second-stage objective.

The binary screening model is enough for the hackathon MVP.

------------------------------------------------------------------------

# 36. Optional LLM Integration

An LLM should **not** diagnose the retinal image.

Correct architecture:

``` text
Retinal Image
     ↓
Vision Model
     ↓
Structured Result
     ↓
LLM
     ↓
Plain-language explanation
```

Example structured input:

``` json
{
  "prediction": "DR PRESENT",
  "confidence": 0.91,
  "image_quality": "GOOD"
}
```

The LLM can convert this into:

> "The screening model detected findings associated with diabetic
> retinopathy. The image appears suitable for analysis. Further
> evaluation by an eye-care professional is recommended."

The LLM is only responsible for communication, not medical
classification.

------------------------------------------------------------------------

# 37. Security and Privacy

For the hackathon:

-   do not store uploaded patient images permanently unless necessary
-   avoid real patient identifiers
-   use synthetic/demo images
-   do not expose patient information in logs
-   validate file types
-   limit upload size
-   remove temporary images after processing where possible

Production systems would require much stronger privacy, security,
auditing, access control, and regulatory compliance.

------------------------------------------------------------------------

# 38. Medical Safety

The application must clearly state:

> **"This tool is an AI-assisted screening prototype and is not a
> medical diagnosis. Results should not replace evaluation by a
> qualified healthcare professional."**

Avoid:

``` text
"You have diabetic retinopathy."
```

Prefer:

``` text
"Possible diabetic retinopathy detected."
```

or:

``` text
"Screening model indicates findings associated with diabetic retinopathy."
```

The model must not be presented as clinically validated.

------------------------------------------------------------------------

# 39. Important Limitations

Document these honestly.

## Dataset limitation

APTOS is a specific dataset and may not represent every population,
camera, clinic, or imaging condition.

## Generalization

Good validation performance on APTOS does not guarantee equivalent
real-world clinical performance.

## Label noise

Kaggle notes that real-world images and labels can contain noise.

## Class imbalance

DR severity classes are not evenly distributed.

## Binary simplification

Our MVP combines all DR severity levels into one positive class.

## Clinical validation

The model has not undergone prospective clinical validation.

## Image quality

Poor images can produce unreliable predictions.

------------------------------------------------------------------------

# 40. Success Criteria

The project is considered a successful MVP if all of these work:

### AI

-   [ ] APTOS dataset loads
-   [ ] binary labels are created
-   [ ] stratified split works
-   [ ] EfficientNet-B0 trains
-   [ ] best checkpoint saved
-   [ ] test metrics generated
-   [ ] single-image prediction works

### Backend

-   [ ] FastAPI starts
-   [ ] `/health` works
-   [ ] `/predict` works
-   [ ] invalid files are rejected
-   [ ] model loads correctly

### Frontend

-   [ ] image upload works
-   [ ] API call works
-   [ ] prediction appears
-   [ ] confidence appears
-   [ ] disclaimer appears

### Explainability

-   [ ] Grad-CAM works on at least one example

### Demo

-   [ ] full pipeline works from upload to result
-   [ ] phone/browser demo works
-   [ ] no critical errors

------------------------------------------------------------------------

# 41. Definition of Done

The MVP is DONE when a teammate can clone the repository and run:

``` text
start backend
start frontend
open browser
upload retinal image
click Analyze
receive result
```

The complete flow should be:

``` text
                MEDVISIONAI
                     │
                     ▼
             Upload retinal image
                     │
                     ▼
              Image validation
                     │
                     ▼
              EfficientNet-B0
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
       NO DR               DR PRESENT
          │                     │
          └──────────┬──────────┘
                     ▼
                 Confidence
                     │
                     ▼
                  Grad-CAM
                     │
                     ▼
              Recommendation
                     │
                     ▼
             Medical disclaimer
```

------------------------------------------------------------------------

# 42. Immediate Next Steps

The team should follow this order exactly.

## NOW

1.  Confirm APTOS dataset path.
2.  Load `train.csv`.
3.  Check `diagnosis` distribution.
4.  Create binary `label`.
5.  Verify image loading.
6.  Create stratified 70/15/15 split.

## NEXT

7.  Implement EfficientNet-B0.
8.  Train baseline.
9.  Evaluate.
10. Save best model.

## THEN

11. Create `predict_image()`.
12. Build FastAPI.
13. Build frontend.
14. Connect frontend → API → model.
15. Add Grad-CAM.

## FINALLY

16. Test on phone.
17. Improve UI.
18. Prepare architecture diagram.
19. Prepare pitch.
20. Rehearse demo.

------------------------------------------------------------------------

# 43. Final Project Pitch

## One-line pitch

> **MedVisionAI is an explainable, low-cost AI screening assistant that
> helps identify patients who may be at risk of diabetic retinopathy
> using retinal fundus images.**

## 30-second pitch

> "Diabetic retinopathy can cause preventable vision loss, but screening
> is difficult when specialist access is limited. MedVisionAI uses a
> lightweight computer-vision model to screen retinal fundus photographs
> for possible diabetic retinopathy. Our system runs through a simple
> web interface, provides a probability-based screening result, and uses
> Grad-CAM to show which image regions influenced the prediction. The
> architecture is designed so the model can eventually run on low-cost
> edge hardware, making the approach suitable for resource-constrained
> environments."

------------------------------------------------------------------------

# 44. References

## Dataset

APTOS 2019 Blindness Detection --- Kaggle:

https://www.kaggle.com/competitions/aptos2019-blindness-detection/data

The APTOS dataset provides clinician-assigned DR severity labels from
0--4 and contains retinal fundus photographs captured under varied
imaging conditions.

## EfficientNet

Tan, M. and Le, Q. V. --- "EfficientNet: Rethinking Model Scaling for
Convolutional Neural Networks"

https://arxiv.org/abs/1905.11946

------------------------------------------------------------------------

# 45. Final Architecture Summary

``` text
                     ┌─────────────────────┐
                     │     RETINAL IMAGE   │
                     └──────────┬──────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │  IMAGE QUALITY      │
                     │  CHECK              │
                     └──────────┬──────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │  PREPROCESSING      │
                     │  224 × 224          │
                     │  NORMALIZATION      │
                     └──────────┬──────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │  EfficientNet-B0    │
                     │  TRANSFER LEARNING  │
                     └──────────┬──────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
              ┌───────────┐           ┌───────────┐
              │  NO DR    │           │ DR PRESENT│
              └─────┬─────┘           └─────┬─────┘
                    │                       │
                    └───────────┬───────────┘
                                ▼
                     ┌─────────────────────┐
                     │ CONFIDENCE /        │
                     │ PROBABILITY         │
                     └──────────┬──────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │     GRAD-CAM        │
                     │  EXPLANATION MAP    │
                     └──────────┬──────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │   SCREENING REPORT  │
                     │                     │
                     │ Prediction          │
                     │ Confidence          │
                     │ Explanation         │
                     │ Recommendation      │
                     │ Disclaimer          │
                     └─────────────────────┘
```

------------------------------------------------------------------------

# 46. Team Rule

**Do not overbuild.**

The priority order is:

``` text
WORKING MODEL
     ↓
CORRECT EVALUATION
     ↓
WORKING API
     ↓
WORKING UI
     ↓
EXPLAINABILITY
     ↓
EDGE OPTIMIZATION
     ↓
EXTRA FEATURES
```

A simple system that actually works end-to-end is much stronger in a
hackathon than a large architecture with unfinished components.

**Target:** A reliable 2--3 minute live demo showing retinal image
upload → AI screening → confidence → explanation → recommendation.

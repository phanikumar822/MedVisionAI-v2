# MedVisionAI Platform

An affordable, explainable, online, and edge-ready AI-assisted diabetic retinopathy screening platform designed to help healthcare workers and patients access preliminary screening information more easily.

## Features

- **AI-Assisted Screening**: Analyzes retinal fundus images using a trained PyTorch `EfficientNet-B0` model.
- **Explainable AI (Grad-CAM)**: Visualizes the regions contributing to the AI's prediction.
- **Secure Patient Portal**: Patients can securely log in to access their results.
- **Report-Grounded RAG Assistant**: A built-in chatbot helps patients understand their results using only their authorized report context, ensuring privacy and eliminating hallucinations.
- **Role-Based Access Control**: Different views and permissions for Patients, Healthcare Workers, Specialists, and Admins.
- **Automated PDF Reports**: Generates professional screening reports for download.

## Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy, PyTorch, Captum, ReportLab
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Vector Database**: ChromaDB (for patient-scoped RAG)
- **Database**: PostgreSQL (or SQLite for local dev)
- **Deployment**: Docker Compose

## Quick Start (Local Development)

### 1. Setup Backend
```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
pip install -r requirements.txt
python init_db.py
uvicorn app.main:app --reload
```

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

## Responsible AI Disclaimer
MedVisionAI is an AI-assisted screening tool intended to support preliminary assessment. It does not provide a definitive medical diagnosis or replace evaluation by a qualified healthcare professional.

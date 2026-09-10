from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.database.session import engine, Base
import app.models

# Create tables for dev. Use Alembic in prod.
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In prod, set this to FRONTEND_URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded retinal fundus images and Grad-CAM heatmaps
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME}

from app.api.api import api_router

app.include_router(api_router, prefix=settings.API_V1_STR)


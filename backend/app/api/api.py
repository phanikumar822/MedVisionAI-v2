from fastapi import APIRouter
from app.api.endpoints import auth, screening, reports, chat, patients

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(patients.router, prefix="/patients", tags=["patients"])
api_router.include_router(screening.router, prefix="/screen", tags=["screening"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])

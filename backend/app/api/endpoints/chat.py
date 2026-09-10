from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.auth.deps import get_current_user
from app.rag.store import chroma_store
from app.rag.llm import generate_rag_response

router = APIRouter()

class ChatMessage(BaseModel):
    role: str  # 'user' or 'model'
    parts: List[str]

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

@router.post("/")
def chat_with_assistant(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Only patients can access the assistant")
        
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
        
    # Retrieve relevant context using patient_id to strictly isolate data
    search_results = chroma_store.search_patient_reports(patient.id, request.message)
    
    context_chunks = []
    sources = []
    
    if search_results and "documents" in search_results and len(search_results["documents"]) > 0:
        docs = search_results["documents"][0]
        metas = search_results["metadatas"][0]
        for i, doc in enumerate(docs):
            context_chunks.append(doc)
            sources.append({"screening_id": metas[i].get("screening_id")})
            
    # Convert history to dict format for LLM
    history_dicts = [{"role": m.role, "parts": m.parts} for m in request.history] if request.history else []
    
    # Generate response with conversation history
    answer = generate_rag_response(request.message, context_chunks, history=history_dicts)
    
    return {
        "answer": answer,
        "sources": sources,
        "grounded": True if context_chunks else False
    }


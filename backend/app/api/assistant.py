from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.assistant import AssistantService
from app.services.sarvam_ai import get_sarvam_service

router = APIRouter(prefix="/api/assistant", tags=["Assistant"])

class ChatRequest(BaseModel):
    message: str
    language: str = "en"

class ChatResponse(BaseModel):
    response: str
    intent: str
    data: dict
    source: str

class TranslationRequest(BaseModel):
    text: str
    source_lang: str
    target_lang: str

class TranslationResponse(BaseModel):
    translated_text: str

class TTSRequest(BaseModel):
    text: str
    language: str = "te"

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    assistant = AssistantService(db)
    
    response_data = await assistant.process_message(
        message=request.message,
    )
    
    return ChatResponse(**response_data)

@router.post("/speech-to-text")
async def speech_to_text(file: UploadFile = File(...)):
    sarvam = get_sarvam_service()
    content = await file.read()
    transcript = await sarvam.speech_to_text(content)
    
    if transcript is None:
        raise HTTPException(status_code=500, detail="Speech to text failed")
        
    return {"transcript": transcript}

@router.post("/text-to-speech")
async def text_to_speech(request: TTSRequest):
    sarvam = get_sarvam_service()
    audio_bytes = await sarvam.text_to_speech(request.text, request.language)
    
    if not audio_bytes:
        raise HTTPException(status_code=500, detail="Text to speech failed")
        
    import base64
    return {"audio_base64": base64.b64encode(audio_bytes).decode("utf-8")}

@router.post("/translate", response_model=TranslationResponse)
async def translate(request: TranslationRequest):
    sarvam = get_sarvam_service()
    translated = await sarvam.translate(
        text=request.text, 
        source_lang=request.source_lang, 
        target_lang=request.target_lang
    )
    
    return TranslationResponse(translated_text=translated)

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List, Any
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.assistant import AssistantService
from app.services.sarvam_ai import get_sarvam_service

router = APIRouter(prefix="/api/assistant", tags=["Assistant"])

class ChatMessageItem(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: Optional[str] = None
    messages: Optional[List[ChatMessageItem]] = None
    language: Optional[str] = "en"

class ChatResponse(BaseModel):
    response: str
    content: Optional[str] = None
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
    language: Optional[str] = "te"

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    assistant = AssistantService(db)
    
    # Extract message from either 'message' or 'messages'
    user_msg = request.message
    if not user_msg and request.messages:
        for m in reversed(request.messages):
            if m.role == "user" and m.content:
                user_msg = m.content
                break
        if not user_msg and request.messages:
            user_msg = request.messages[-1].content
            
    if not user_msg or not user_msg.strip():
        user_msg = "Hello"
        
    response_data = await assistant.process_message(
        message=user_msg.strip(),
    )
    
    resp_text = response_data.get("response", "I could not find information for that.")
    return ChatResponse(
        response=resp_text,
        content=resp_text,
        intent=response_data.get("intent", "GENERAL"),
        data=response_data.get("data", {}),
        source=response_data.get("source", "system")
    )

@router.post("/speech-to-text")
async def speech_to_text(
    file: UploadFile = File(...),
    language: Optional[str] = Form("unknown")
):
    sarvam = get_sarvam_service()
    content = await file.read()
    filename = file.filename or "audio.wav"
    content_type = file.content_type or "audio/wav"
    transcript = await sarvam.speech_to_text(content, language=language or "te", filename=filename, content_type=content_type)
    
    if transcript is None:
        raise HTTPException(status_code=500, detail="Speech to text failed")
        
    return {"transcript": transcript}

@router.post("/text-to-speech")
async def text_to_speech(request: TTSRequest):
    sarvam = get_sarvam_service()
    audio_bytes = await sarvam.text_to_speech(request.text, request.language or "te")
    
    if not audio_bytes:
        raise HTTPException(status_code=500, detail="Text to speech failed")
        
    import base64
    return {
        "audio_base64": base64.b64encode(audio_bytes).decode("utf-8"),
        "mime_type": "audio/wav"
    }

@router.post("/translate", response_model=TranslationResponse)
async def translate(request: TranslationRequest):
    sarvam = get_sarvam_service()
    translated = await sarvam.translate(
        text=request.text, 
        source_lang=request.source_lang, 
        target_lang=request.target_lang
    )
    
    return TranslationResponse(translated_text=translated)

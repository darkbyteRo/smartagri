import httpx
import base64
import logging
from typing import Optional
from app.config import settings

logger = logging.getLogger(__name__)

class SarvamAIService:
    """Service for interacting with Sarvam AI APIs.
    
    Provides:
    - Text chat (Telugu/English) via Sarvam LLM
    - Text-to-Speech (Telugu)
    - Speech-to-Text (Telugu)
    - Translation (Telugu <-> English)
    
    Falls back gracefully when API is unavailable.
    """
    
    BASE_URL = "https://api.sarvam.ai"
    
    def __init__(self):
        # We assume get_settings exists, but looking at config.py, it's just `settings = Settings()`.
        # I'll modify this to import settings directly or we can stick to get_settings if provided.
        # Actually in config.py:
        # from pydantic_settings import BaseSettings
        # class Settings(BaseSettings): ...
        # settings = Settings()
        from app.config import settings
        self.api_key = settings.SARVAM_API_KEY
        self.enabled = bool(self.api_key and self.api_key != "your-sarvam-api-key")
        
        if not self.enabled:
            logger.warning("Sarvam AI API key not configured. AI assistant will use fallback mode.")
    
    def _get_headers(self) -> dict:
        return {
            "api-subscription-key": self.api_key,
            "Content-Type": "application/json"
        }
    
    async def chat(self, message: str, context: str = "", language: str = "en") -> str:
        """Send a chat message to Sarvam AI LLM.
        
        The context parameter should contain structured data from our backend
        (market prices, recommendations, etc.) so the LLM doesn't invent data.
        """
        if not self.enabled:
            return self._fallback_response(message, context)
        
        system_prompt = (
            "You are SmartAgri AI, a helpful agricultural market assistant for Telangana farmers. "
            "You help farmers understand market prices, find buyers, and make selling decisions. "
            "IMPORTANT: Only use the data provided in the context below. DO NOT invent prices, "
            "buyer information, or market data. If you don't have the data, say so clearly. "
            "Respond in the same language as the user's question. Support Telugu and English. "
            "Keep responses concise and farmer-friendly.\n\n"
            f"Context data from our system:\n{context}"
        )
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.BASE_URL}/v1/chat/completions",
                    headers=self._get_headers(),
                    json={
                        "model": "sarvam-105b-conversations",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": message}
                        ],
                        "max_tokens": 500,
                        "temperature": 0.7,
                    }
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"Sarvam AI chat failed: {e}")
            return self._fallback_response(message, context)
    
    async def translate(self, text: str, source_lang: str = "en", target_lang: str = "te") -> str:
        """Translate text between English and Telugu."""
        if not self.enabled:
            return text  # return original if API unavailable
        
        lang_map = {"en": "en-IN", "te": "te-IN"}
        
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    f"{self.BASE_URL}/translate",
                    headers=self._get_headers(),
                    json={
                        "input": text,
                        "source_language_code": lang_map.get(source_lang, source_lang),
                        "target_language_code": lang_map.get(target_lang, target_lang),
                        "model": "mayura:v1",
                    }
                )
                response.raise_for_status()
                return response.json().get("translated_text", text)
        except Exception as e:
            logger.error(f"Sarvam AI translation failed: {e}")
            return text
    
    async def text_to_speech(self, text: str, language: str = "te") -> Optional[bytes]:
        """Convert text to speech audio (Telugu or English)."""
        if not self.enabled:
            return None
        
        lang_map = {"en": "en-IN", "te": "te-IN", "hi": "hi-IN"}
        
        try:
            # Clean text of markdown asterisks or special formatting for speech synthesis
            clean_text = text.replace("**", "").replace("*", "").replace("#", "").strip()
            # Truncate text if very long to fit TTS length limits (under 500 chars)
            if len(clean_text) > 450:
                clean_text = clean_text[:450] + "..."

            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    f"{self.BASE_URL}/text-to-speech",
                    headers=self._get_headers(),
                    json={
                        "text": clean_text,
                        "language_code": lang_map.get(language, "te-IN"),
                        "model": "bulbul:v3",
                        "speaker": "kavya",
                        "pace": 1.0,
                        "sample_rate": 24000,
                        "enable_preprocessing": True,
                    }
                )
                response.raise_for_status()
                data = response.json()
                audio_b64 = data.get("audios", [None])[0]
                if audio_b64:
                    return base64.b64decode(audio_b64)
                return None
        except Exception as e:
            logger.error(f"Sarvam AI TTS failed: {e}")
            return None
    
    async def speech_to_text(self, audio_bytes: bytes, language: str = "te", filename: str = "audio.wav", content_type: str = "audio/wav") -> Optional[str]:
        """Convert speech audio to text (Telugu or English)."""
        if not self.enabled:
            return None
        
        lang_map = {"en": "en-IN", "te": "te-IN", "hi": "hi-IN"}
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                files = {"file": (filename, audio_bytes, content_type)}
                data = {
                    "model": "saaras:v3",
                    "language_code": lang_map.get(language, "te-IN"),
                }
                response = await client.post(
                    f"{self.BASE_URL}/speech-to-text",
                    headers={"api-subscription-key": self.api_key},
                    files=files,
                    data=data,
                )
                response.raise_for_status()
                return response.json().get("transcript", "")
        except Exception as e:
            logger.error(f"Sarvam AI STT failed: {e}")
            return None
    
    def _fallback_response(self, message: str, context: str) -> str:
        """Generate a natural response from context data when external LLM is unreachable."""
        msg_lower = message.lower()
        
        if context:
            return (
                "Here is the latest live information from our Telangana agricultural network:\n\n" + context[:1200]
            )
        
        if any(word in msg_lower for word in ['price', 'rate', 'dhara', 'ధర', 'ekkada', 'ఎక్కడ']):
            return (
                "To check current prices, please use the 'Compare Markets' feature "
                "on your dashboard. Select your crop and location to see prices across "
                "all Telangana markets. ధరలు చూడటానికి 'మార్కెట్ పోలిక' ఉపయోగించండి."
            )
        
        if any(word in msg_lower for word in ['sell', 'hold', 'ammali', 'అమ్మాలి']):
            return (
                "For sell/hold recommendations, use the 'Sell or Hold?' feature. "
                "Enter your crop, quantity, and location. అమ్మాలా లేదా ఆపాలా అనేది తెలుసుకోవటానికి "
                "'అమ్మాలా లేదా ఆపాలా?' ఫీచర్ ఉపయోగించండి."
            )
        
        return (
            "I'm SmartAgri AI assistant. I can help you with:\n"
            "• Market prices (మార్కెట్ ధరలు)\n"
            "• Best place to sell (ఎక్కడ అమ్మాలి)\n"
            "• Sell/Hold advice (అమ్మాలా / ఆపాలా)\n"
            "• Finding buyers (కొనుగోలుదారులు)\n\n"
            "Note: AI service is currently unavailable. Using basic mode. "
            "Please use the dashboard features for detailed information."
        )

# Singleton instance
_sarvam_service = None

def get_sarvam_service() -> SarvamAIService:
    global _sarvam_service
    if _sarvam_service is None:
        _sarvam_service = SarvamAIService()
    return _sarvam_service

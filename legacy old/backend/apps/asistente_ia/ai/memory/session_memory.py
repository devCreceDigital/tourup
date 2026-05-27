import json
import os
import redis
from datetime import datetime, timedelta
from django.conf import settings


class ConversationManager:
    """Gestiona conversaciones de sesiones en Redis con TTL 24h"""
    
    def __init__(self):
        self.redis_client = None
        enable_redis = bool(os.getenv("REDIS_URL") or os.getenv("REDIS_HOST"))
        if enable_redis:
            redis_kwargs = {
                "decode_responses": True,
                "socket_connect_timeout": 0.5,
                "socket_timeout": 0.5,
                "retry_on_timeout": False,
            }
            redis_url = getattr(settings, "REDIS_URL", "") or ""
            if redis_url:
                self.redis_client = redis.Redis.from_url(redis_url, **redis_kwargs)
            else:
                self.redis_client = redis.Redis(
                    host=settings.REDIS_HOST or 'localhost',
                    port=settings.REDIS_PORT or 6379,
                    db=settings.REDIS_DB or 0,
                    **redis_kwargs
                )
        self.ttl_seconds = 24 * 60 * 60  # 24 horas
        self._fallback_messages: dict[str, list[dict]] = {}
        self._fallback_intents: dict[str, dict] = {}
        self._fallback_lang: dict[str, str] = {}

    def _redis_ok(self) -> bool:
        if not self.redis_client:
            return False
        try:
            self.redis_client.ping()
            return True
        except Exception:
            return False
    
    def _get_key(self, session_token: str, suffix: str) -> str:
        """Genera clave Redis con prefijo"""
        return f"asistente_ia:session:{session_token}:{suffix}"
    
    def add_message(self, session_token: str, role: str, content: str) -> None:
        """Agrega mensaje a la conversación"""
        key = self._get_key(session_token, "messages")
        
        message = {
            "role": role,
            "content": content,
            "ts": datetime.utcnow().isoformat()
        }
        
        if self._redis_ok():
            self.redis_client.rpush(key, json.dumps(message))
            self.redis_client.expire(key, self.ttl_seconds)
            return

        self._fallback_messages.setdefault(session_token, []).append(message)
    
    def get_messages(self, session_token: str) -> list:
        """Obtiene todos los mensajes de la conversación"""
        if self._redis_ok():
            key = self._get_key(session_token, "messages")
            messages = self.redis_client.lrange(key, 0, -1)
            return [json.loads(msg) for msg in messages]

        return list(self._fallback_messages.get(session_token, []))
    
    def save_intent(self, session_token: str, intent_data: dict) -> None:
        """Guarda datos de intención"""
        if self._redis_ok():
            key = self._get_key(session_token, "intent")
            self.redis_client.setex(
                key,
                self.ttl_seconds,
                json.dumps(intent_data)
            )
            return

        self._fallback_intents[session_token] = intent_data
    
    def get_intent(self, session_token: str) -> dict:
        """Obtiene datos de intención"""
        if self._redis_ok():
            key = self._get_key(session_token, "intent")
            data = self.redis_client.get(key)
            return json.loads(data) if data else {}

        return self._fallback_intents.get(session_token, {})
    
    def set_language(self, session_token: str, language: str) -> None:
        """Establece idioma de la sesión"""
        if self._redis_ok():
            key = self._get_key(session_token, "lang")
            self.redis_client.setex(
                key,
                self.ttl_seconds,
                language
            )
            return

        self._fallback_lang[session_token] = language
    
    def get_language(self, session_token: str) -> str:
        """Obtiene idioma de la sesión"""
        if self._redis_ok():
            key = self._get_key(session_token, "lang")
            language = self.redis_client.get(key)
            return language or "es"

        return self._fallback_lang.get(session_token, "es")
    
    def is_session_active(self, session_token: str) -> bool:
        """Verifica si la sesión está activa"""
        if self._redis_ok():
            key = self._get_key(session_token, "messages")
            return self.redis_client.exists(key) > 0
        return bool(self._fallback_messages.get(session_token))
    
    def expire_session(self, session_token: str) -> None:
        """Expira manualmente una sesión"""
        if self._redis_ok():
            suffixes = ["messages", "intent", "lang"]
            for suffix in suffixes:
                key = self._get_key(session_token, suffix)
                self.redis_client.delete(key)
            return

        self._fallback_messages.pop(session_token, None)
        self._fallback_intents.pop(session_token, None)
        self._fallback_lang.pop(session_token, None)
    
    def get_session_info(self, session_token: str) -> dict:
        """Obtiene información completa de la sesión"""
        messages = self.get_messages(session_token)
        intent = self.get_intent(session_token)
        language = self.get_language(session_token)
        
        return {
            "messages_count": len(messages),
            "has_intent": bool(intent),
            "language": language,
            "is_active": self.is_session_active(session_token)
        }


# Instancia global
conversation_manager = ConversationManager()

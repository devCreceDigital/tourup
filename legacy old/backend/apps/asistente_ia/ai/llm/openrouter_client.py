import os
import json
import urllib.request
import logging
from typing import List, Dict, Any, Optional

try:
    from openai import OpenAI
except Exception:  # pragma: no cover - fallback for local envs without SDK
    class OpenAI:  # type: ignore[override]
        def __init__(self, *args, **kwargs):
            raise RuntimeError("OpenAI SDK no disponible")

logger = logging.getLogger(__name__)

class OpenRouterClient:
    def __init__(self):
        self.base_url = "https://openrouter.ai/api/v1"
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.models = {
            "main": "openai/gpt-4o-mini",                # respuestas ricas, turismo
            "fast": "openai/gpt-4o-mini",                # intents y tareas rápidas
            "reasoning": "openai/gpt-4o-mini",           # planificación compleja
            "fallback": "openai/gpt-oss-20b:free",       # fallback gratuito
        }
        self.INTENT_MODEL = self.models["fast"]
        self.CHAT_MODEL = self.models["main"]
        self.EMBEDDING_MODEL = "openai/text-embedding-3-small"

        if not self.api_key:
            self.client = None
            return

        try:
            self.client = OpenAI(
                base_url=self.base_url,
                api_key=self.api_key,
            )
        except Exception:
            self.client = None

    def _get_headers(self) -> dict:
        api_key = self.api_key or os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            raise RuntimeError("Falta la variable de entorno OPENROUTER_API_KEY")

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        app_url = os.getenv("OPENROUTER_APP_URL")
        app_title = os.getenv("OPENROUTER_APP_TITLE")
        if app_url:
            headers["HTTP-Referer"] = app_url
        if app_title:
            headers["X-Title"] = app_title

        return headers
        
    def select_model(self, task_type: str = "main") -> str:
        """Dynamic model routing based on task complexity."""
        return self.models.get(task_type, self.models["main"])

    def chat(self, messages: list, task_type: str = "main", temperature: float = 0.7, fallbacks: list = None) -> str:
        if self.client is not None:
            response = self.client.chat.completions.create(
                model=self.select_model(task_type),
                messages=messages,
                temperature=temperature,
            )
            return response.choices[0].message.content or ""

        url = f"{self.base_url}/chat/completions"
        
        primary_model = self.select_model(task_type)
        models_to_try = [primary_model]
        
        if fallbacks:
            models_to_try.extend(fallbacks)
        else:
            # Default fallback chain
            if task_type != "fallback":
                models_to_try.append(self.models["fallback"])
            
        last_error = None
        
        for current_model in models_to_try:
            data = {
                "model": current_model,
                "messages": messages,
                "temperature": temperature,
            }
            
            data_bytes = json.dumps(data).encode('utf-8')
            req = urllib.request.Request(url, data=data_bytes, headers=self._get_headers(), method="POST")
            
            try:
                with urllib.request.urlopen(req, timeout=20.0) as resp:
                    response_data = json.loads(resp.read().decode('utf-8'))
                    
                    # Token Logging
                    usage = response_data.get("usage", {})
                    if usage:
                        logger.info(f"[OpenRouter] Model: {current_model} | Prompt Tokens: {usage.get('prompt_tokens')} | Completion Tokens: {usage.get('completion_tokens')}")
                        print(f">>> [OpenRouter] Success with {current_model}. Tokens used: {usage.get('total_tokens')}")
                        
                    return response_data.get("choices", [{}])[0].get("message", {}).get("content", "")
            except Exception as e:
                print(f">>> [OpenRouter] Error with model {current_model}: {e}. Trying next...")
                last_error = e
                continue
                
        raise last_error or RuntimeError("OpenRouter falló con todos los modelos proporcionados.")

    def embed(self, text: str, model: str = "openai/text-embedding-3-small") -> list[float]:
        if not text:
            return []

        if self.client is not None:
            response = self.client.embeddings.create(model=model, input=text)
            return response.data[0].embedding
            
        url = f"{self.base_url}/embeddings"
        data = {
            "model": model,
            "input": text,
        }
        
        data_bytes = json.dumps(data).encode('utf-8')
        req = urllib.request.Request(url, data=data_bytes, headers=self._get_headers(), method="POST")
        
        try:
            with urllib.request.urlopen(req, timeout=15.0) as resp:
                response_data = json.loads(resp.read().decode('utf-8'))
                return response_data.get("data", [{}])[0].get("embedding", [])
        except Exception as e:
            print(f"Error en OpenRouter embed: {e}")
            raise e

    def extract_intent(self, messages: List[Dict[str, Any]], language: str = "es") -> Optional[str]:
        if self.client is None:
            return json.dumps({
                "confidence_score": 0.0,
                "fields_detected": 0,
                "needs_clarification": True,
                "clarification_question": {
                    "es": "¿Podrías contarme más sobre el viaje que estás buscando?",
                    "en": "Could you tell me more about the trip you're looking for?",
                    "pt": "Você poderia me contar mais sobre a viagem que está procurando?",
                }.get(language, "¿Podrías contarme más sobre el viaje que estás buscando?"),
            })

        prompt = (
            "Extrae la intención del usuario y responde SOLO en JSON válido con las claves: "
            "intent_type, destination, duration, group_type, group_size, budget_range, "
            "interests, departure_month, confidence_score, fields_detected, "
            "needs_clarification, clarification_question."
        )
        try:
            response = self.client.chat.completions.create(
                model=self.INTENT_MODEL,
                messages=[{"role": "system", "content": prompt}] + list(messages or []),
                temperature=0.2,
                response_format={"type": "json_object"},
            )
            return response.choices[0].message.content
        except Exception:
            return None

    def generate_response(
        self,
        messages: List[Dict[str, Any]],
        matches: Optional[List[Dict[str, Any]]] = None,
        language: str = "es",
    ):
        if self.client is None:
            fallback = {
                "es": "Lo siento, hubo un error al generar la respuesta.",
                "en": "Sorry, there was an error generating the response.",
                "pt": "Desculpe, ocorreu um erro ao gerar a resposta.",
            }
            yield fallback.get(language, fallback["es"])
            return

        system_prompt = "Eres un asistente de viajes útil y claro."
        if matches:
            system_prompt += f"\n\nCONTEXTO:\n{json.dumps(matches, ensure_ascii=False)}"

        try:
            stream = self.client.chat.completions.create(
                model=self.CHAT_MODEL,
                messages=[{"role": "system", "content": system_prompt}] + list(messages or []),
                temperature=0.7,
                stream=True,
            )
            for chunk in stream:
                content = chunk.choices[0].delta.content
                if content is not None:
                    yield content
        except Exception:
            yield "Lo siento, ocurrió un error al generar la respuesta."

    def generate_embedding(self, text: str) -> Optional[List[float]]:
        try:
            result = self.embed(text, model=self.EMBEDDING_MODEL)
            return result or None
        except Exception:
            return None

    def detect_language(self, text: str) -> str:
        if self.client is None:
            text = (text or "").lower()
            if any(token in text for token in ("hello", "trip", "travel")):
                return "en"
            if any(token in text for token in ("olá", "viagem", "praia")):
                return "pt"
            return "es"

        try:
            response = self.client.chat.completions.create(
                model=self.INTENT_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "Detecta el idioma y responde solo con: es, en o pt.",
                    },
                    {"role": "user", "content": text},
                ],
                temperature=0.0,
            )
            detected = (response.choices[0].message.content or "").strip().lower()
            return detected if detected in {"es", "en", "pt"} else "es"
        except Exception:
            return "es"

# 👇 ESTA ES LA INSTANCIA QUE IMPORTAS EN TODO EL PROYECTO
openrouter_client = OpenRouterClient()

"""
Streaming SSE para Hermes Agent → Django views.
Convierte la respuesta de OpenRouter en un generador de chunks
compatible con django.http.StreamingHttpResponse.
"""

import os
import json
import logging
import urllib.request
from typing import Generator

logger = logging.getLogger(__name__)

OPENROUTER_BASE = "https://openrouter.ai/api/v1"


def _build_headers() -> dict:
    api_key = os.getenv("OPENROUTER_API_KEY", "")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
    }
    if url := os.getenv("OPENROUTER_APP_URL"):
        headers["HTTP-Referer"] = url
    if title := os.getenv("OPENROUTER_APP_TITLE"):
        headers["X-Title"] = title
    return headers


def stream_chat(
    messages: list[dict],
    model: str = "anthropic/claude-sonnet-4-5",
    temperature: float = 0.75,
    max_tokens: int = 1500,
) -> Generator[str, None, None]:
    """
    Generador que hace streaming de la respuesta de OpenRouter token a token.
    Cada yield es un fragmento de texto (no el evento SSE completo —
    eso lo ensambla la Django view con format_sse()).

    Uso en views.py:
        from ai.llm.streaming import stream_chat, format_sse
        def my_view(request):
            def event_gen():
                for chunk in stream_chat(messages):
                    yield format_sse({"type": "text_chunk", "content": chunk})
            return StreamingHttpResponse(event_gen(), content_type="text/event-stream")
    """
    payload = json.dumps({
        "model": model,
        "messages": messages,
        "stream": True,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{OPENROUTER_BASE}/chat/completions",
        data=payload,
        headers=_build_headers(),
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            for raw_line in resp:
                line = raw_line.decode("utf-8").strip()

                if not line.startswith("data: "):
                    continue

                data_str = line[6:]
                if data_str == "[DONE]":
                    break

                try:
                    data = json.loads(data_str)
                    delta = data["choices"][0]["delta"]
                    if content := delta.get("content"):
                        yield content
                except (json.JSONDecodeError, KeyError, IndexError):
                    continue

    except Exception as e:
        logger.error(f"[Streaming] Error en stream_chat: {e}")
        yield f"\n[Error al conectar con el modelo: {e}]"


def format_sse(data: dict) -> str:
    """
    Formatea un dict como evento SSE para StreamingHttpResponse.
    Ejemplo: {"type": "text_chunk", "content": "Hola"} → "data: {...}\n\n"
    """
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


def stream_hermes_response(
    session_token: str,
    user_message: str,
    hermes_result: dict,
    messages_history: list[dict],
) -> Generator[str, None, None]:
    """
    Stream completo de Hermes al cliente frontend.
    Primero emite los metadatos (intent, matches), luego streamea la respuesta LLM.

    Yield cada línea como SSE string listo para StreamingHttpResponse.
    """
    # 1. Emitir intent detectado
    if intent := hermes_result.get("intent"):
        yield format_sse({"type": "intent", "data": intent.__dict__ if hasattr(intent, "__dict__") else intent})

    # 2. Emitir matches de viajes (RAG)
    matches = hermes_result.get("matches", [])
    if matches:
        matches_data = [
            m.__dict__ if hasattr(m, "__dict__") else m
            for m in matches[:3]
        ]
        yield format_sse({"type": "matches", "data": matches_data})

    # 3. Emitir tool results (hoteles, rutas, etc.)
    for tool_name, tool_data in (hermes_result.get("tool_results") or {}).items():
        yield format_sse({"type": "tool_result", "tool": tool_name, "data": tool_data})

        # Si el tool tiene map_update, emitirlo por separado
        if isinstance(tool_data, dict) and "map_update" in tool_data:
            yield format_sse({"type": "map_update", "data": tool_data["map_update"]})

    # 4. Stream de la respuesta final texto
    final_response = hermes_result.get("response", "")
    if final_response:
        # Si ya tenemos la respuesta completa, chunkearla en bloques de ~20 chars
        chunk_size = 20
        for i in range(0, len(final_response), chunk_size):
            yield format_sse({
                "type": "text_chunk",
                "data": {"content": final_response[i:i + chunk_size]},
            })
    else:
        # Fallback: streamear desde OpenRouter directamente
        for chunk in stream_chat(messages_history):
            yield format_sse({"type": "text_chunk", "data": {"content": chunk}})

    # 5. Señal de fin
    yield format_sse({"type": "done"})

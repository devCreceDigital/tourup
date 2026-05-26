"""
Observabilidad básica para el pipeline Hermes.
Registra métricas de cada nodo, tokens usados y errores.
"""
import logging
import json
from datetime import datetime

logger = logging.getLogger("hermes.pipeline")

def log_pipeline_start(session_token: str, user_message: str):
    logger.info(json.dumps({
        "event": "pipeline_start",
        "session": session_token[:8],
        "message_preview": user_message[:60],
        "ts": datetime.utcnow().isoformat(),
    }))

def log_node(agent_name: str, duration: float, success: bool = True, extra: dict = None):
    logger.info(json.dumps({
        "event": "node_complete",
        "agent": agent_name,
        "duration_s": round(duration, 3),
        "success": success,
        **(extra or {}),
        "ts": datetime.utcnow().isoformat(),
    }))

def log_tool(tool_name: str, duration: float, result_summary: str = ""):
    logger.info(json.dumps({
        "event": "tool_complete",
        "tool": tool_name,
        "duration_s": round(duration, 3),
        "summary": result_summary[:80],
        "ts": datetime.utcnow().isoformat(),
    }))

def log_llm_call(model: str, tokens: int, duration: float, task_type: str = "main"):
    logger.info(json.dumps({
        "event": "llm_call",
        "model": model,
        "tokens": tokens,
        "duration_s": round(duration, 3),
        "task_type": task_type,
        "ts": datetime.utcnow().isoformat(),
    }))

def log_pipeline_end(session_token: str, total_duration: float, metrics: dict):
    logger.info(json.dumps({
        "event": "pipeline_end",
        "session": session_token[:8],
        "total_s": round(total_duration, 3),
        "slowest_node": max(metrics, key=metrics.get) if metrics else None,
        "ts": datetime.utcnow().isoformat(),
    }))

def log_error(agent_name: str, error: str):
    logger.error(json.dumps({
        "event": "node_error",
        "agent": agent_name,
        "error": str(error)[:200],
        "ts": datetime.utcnow().isoformat(),
    }))

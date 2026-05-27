import time
from typing import Dict, Any, Iterator
from concurrent.futures import ThreadPoolExecutor
from apps.asistente_ia.ai.observability.logging import log_pipeline_start, log_node, log_pipeline_end, log_error

from apps.asistente_ia.ai.orchestrator.state_manager import OrchestratorState
from apps.asistente_ia.ai.agents.memory_agent import MemoryAgent
from apps.asistente_ia.ai.agents.intent_agent import IntentAgent
from apps.asistente_ia.ai.agents.rag_agent import RAGAgent
from apps.asistente_ia.ai.agents.tourism_agent import TourismAgent
from apps.asistente_ia.ai.agents.lead_agent import LeadAgent
from apps.asistente_ia.ai.agents.business_agent import BusinessRulesAgent
from apps.asistente_ia.ai.orchestrator.planner import PlannerAgent
from apps.asistente_ia.ai.orchestrator.router import ToolCallingAgent
from apps.asistente_ia.ai.agents.generator_agent import GeneratorAgent
from apps.asistente_ia.ai.agents.validator_agent import ValidatorAgent

_TOOL_LABELS: Dict[str, str] = {
    "buscar_hoteles":      "Buscando hoteles disponibles",
    "buscar_lugares":      "Buscando lugares de interés",
    "buscar_restaurantes": "Buscando restaurantes",
    "get_weather":         "Consultando el clima",
    "calculate_budget":    "Calculando presupuesto detallado",
    "generate_itinerary":  "Generando itinerario día a día",
    "buscar_vuelos":       "Buscando vuelos disponibles",
    "calcular_ruta":       "Calculando ruta entre destinos",
    "crear_lead":          "Registrando tu consulta",
    "buscar_viajes":       "Buscando viajes en catálogo",
}


def _tool_label(tool_name: str) -> str:
    return _TOOL_LABELS.get(tool_name, f"Ejecutando {tool_name}")


def _tool_result_summary(tool_result: dict) -> str:
    name   = tool_result.get("tool_name", "")
    result = tool_result.get("result", {})
    if not isinstance(result, dict):
        return "Completado"
    if name == "buscar_hoteles":
        count = len(result.get("hoteles", []))
        return f"{count} hoteles encontrados"
    if name == "buscar_vuelos":
        count = len(result.get("vuelos", []))
        return f"{count} vuelos encontrados"
    if name == "buscar_lugares":
        count = len(result.get("lugares", []))
        return f"{count} lugares encontrados"
    if name == "get_weather":
        temp = result.get("temperature") or result.get("temp")
        return f"Clima consultado{f': {temp}°C' if temp else ''}"
    if name == "calculate_budget":
        total = result.get("total") or result.get("total_soles")
        return f"Presupuesto calculado{f': S/. {total}' if total else ''}"
    if name == "generate_itinerary":
        days = result.get("days") or len(result.get("itinerary", []))
        return f"Itinerario generado{f': {days} días' if days else ''}"
    return "Completado"


class Hermes:
    """
    Multi-Agent Orchestrator for ToTem HUB (LangGraph Style).
    Manages the DAG execution of specialized agents passing a shared state.
    run() is a generator that yields pipeline_progress / tool_start / tool_done
    events during execution, then a final_result event at the end.
    """
    def __init__(self, intent_engine, rag_engine, conversation_manager, openrouter_client):
        self.intent_agent    = IntentAgent(intent_engine, openrouter_client)
        self.memory_agent    = MemoryAgent(conversation_manager)
        self.rag_agent       = RAGAgent(rag_engine, openrouter_client)
        self.travel_agent    = TourismAgent()
        self.lead_agent      = LeadAgent()
        self.business_agent  = BusinessRulesAgent()
        self.planner_agent   = PlannerAgent()
        self.tool_agent      = ToolCallingAgent()
        self.generator_agent = GeneratorAgent(openrouter_client)
        self.validator_agent = ValidatorAgent()

    def _run_node(self, agent, state: OrchestratorState) -> OrchestratorState:
        start_time = time.time()
        agent_name = agent.__class__.__name__
        print(f">>> [Hermes DAG] Executing node: {agent_name}...")
        try:
            state = agent.execute(state)
        except Exception as e:
            print(f">>> [Hermes DAG] ERROR in {agent_name}: {e}")
            state.is_valid = False
            state.error_message = str(e)
        state.record_metric(agent_name, time.time() - start_time)
        return state

    def run(
        self,
        session_token: str,
        user_message: str,
        language: str = "es",
        accumulated_intent: dict = None,
    ) -> Iterator[Dict[str, Any]]:
        """
        Generator — yields progress events as each pipeline stage completes,
        then yields a single 'final_result' event with the full output.

        Event shapes:
          {"type": "pipeline_progress", "step": int, "total": int,
           "agent": str, "label": str}
          {"type": "tool_start",  "tool_name": str, "label": str}
          {"type": "tool_done",   "tool_name": str, "summary": str}
          {"type": "final_result","data": {intent, matches, response, tool_results}}
        """
        print(">>> [Hermes Orchestrator] Starting pipeline...")
        total_start = time.time()
        log_pipeline_start(session_token, user_message)

        state = OrchestratorState(
            session_token=session_token,
            user_message=user_message,
            language=language,
            accumulated_intent=accumulated_intent or {},
        )

        # ── Step 1: Intent ───────────────────────────────────────────
        yield {"type": "pipeline_progress", "step": 1, "total": 5,
               "agent": "intent", "label": "Entendiendo tu solicitud..."}
        state = self._run_node(self.intent_agent, state)

        # ── Step 2: Memory + RAG (parallel) ─────────────────────────
        yield {"type": "pipeline_progress", "step": 2, "total": 5,
               "agent": "rag", "label": "Consultando base de destinos y viajes..."}
        print(">>> [Hermes DAG] Entering parallel block (Memory + RAG)...")
        with ThreadPoolExecutor(max_workers=2) as executor:
            future_memory = executor.submit(self._run_node, self.memory_agent, state)
            future_rag    = executor.submit(self._run_node, self.rag_agent,    state)
            state_m = future_memory.result()
            state_r = future_rag.result()
            if state_m:
                state.chat_history = state_m.chat_history
            if state_r:
                state.context_matches = state_r.context_matches
        print(">>> [Hermes DAG] Exiting parallel block.")

        # Internal agents — no user-facing step needed
        state = self._run_node(self.travel_agent,   state)
        state = self._run_node(self.lead_agent,     state)
        state = self._run_node(self.business_agent, state)

        # ── Step 3: Planner ──────────────────────────────────────────
        yield {"type": "pipeline_progress", "step": 3, "total": 5,
               "agent": "planner", "label": "Diseñando tu plan de viaje..."}
        state = self._run_node(self.planner_agent, state)

        # ── Step 4: Tools ────────────────────────────────────────────
        if state.tool_calls:
            for tool in state.tool_calls:
                tool_name = tool.get("name", "")
                yield {"type": "tool_start", "tool_name": tool_name,
                       "label": _tool_label(tool_name)}

            yield {"type": "pipeline_progress", "step": 4, "total": 5,
                   "agent": "tools", "label": "Ejecutando herramientas..."}
            state = self._run_node(self.tool_agent, state)

            for tr in state.tool_results:
                yield {"type": "tool_done", "tool_name": tr.get("tool_name"),
                       "summary": _tool_result_summary(tr)}
        else:
            yield {"type": "pipeline_progress", "step": 4, "total": 5,
                   "agent": "tools", "label": "Preparando respuesta..."}

        # ── Step 5: Generate + Validate ──────────────────────────────
        yield {"type": "pipeline_progress", "step": 5, "total": 5,
               "agent": "generator", "label": "Generando respuesta..."}
        state = self._run_node(self.generator_agent, state)
        state = self._run_node(self.validator_agent,  state)

        total_duration = time.time() - total_start
        log_pipeline_end(session_token, total_duration, state.metrics)
        state.record_metric("TotalPipeline", total_duration)
        print(f">>> [Hermes Orchestrator] Pipeline completed in {total_duration:.2f}s.")
        print(f">>> [Hermes Observability] Metrics: {state.metrics}")

        yield {"type": "final_result", "data": {
            "intent":       state.intent,
            "matches":      state.context_matches,
            "response":     state.final_response,
            "tool_results": state.tool_results,
        }}

"""
Validator Agent.
Cleans and sanitizes the final output before sending to the user.
Generates a data-driven fallback when the LLM returns an empty response.
"""
from apps.asistente_ia.ai.agents.base import BaseAgent
from apps.asistente_ia.ai.orchestrator.state_manager import OrchestratorState

class ValidatorAgent(BaseAgent):
    def execute(self, state: OrchestratorState) -> OrchestratorState:
        # Fallback: LLM devolvió respuesta vacía
        if not state.raw_response or not state.raw_response.strip():
            state.final_response = self._build_fallback(state)
            return state

        if not state.is_valid:
            state.final_response = state.raw_response
            return state

        response = state.raw_response.strip()
        if response.startswith("```json"):
            state.is_valid = False
            state.error_message = "LLM leaked JSON format"
            state.final_response = "Lo siento, tuve un problema procesando la información."
            return state

        state.final_response = response
        return state

    def _build_fallback(self, state: OrchestratorState) -> str:
        if not state.tool_results:
            return "Lo siento, no pude generar una respuesta en este momento. ¿Puedes reformular tu pregunta?"

        parts = []
        for tr in state.tool_results:
            tn = tr.get("tool_name", "")
            r = tr.get("result", {})
            if tn == "get_weather" and isinstance(r, dict):
                parts.append(
                    f"Clima en destino: {r.get('condition', '')}, {r.get('temperature', '')} "
                    f"(Mejor época: {r.get('best_time', '')})"
                )
            elif tn == "calculate_budget" and isinstance(r, dict):
                breakdown = r.get("breakdown", {})
                parts.append(
                    f"Presupuesto estimado ({r.get('category', 'moderado')}): "
                    f"S/{r.get('total_soles', 0):,} total — "
                    f"S/{r.get('per_person', 0):,} por persona\n"
                    f"  Hospedaje: S/{breakdown.get('hospedaje', 0):,} | "
                    f"Alimentación: S/{breakdown.get('alimentacion', 0):,} | "
                    f"Transporte: S/{breakdown.get('transporte', 0):,}"
                )
            elif tn == "generate_itinerary" and isinstance(r, list):
                days_txt = "\n".join([f"  Día {d['dia']}: {d['actividad']}" for d in r])
                parts.append(f"Itinerario sugerido:\n{days_txt}")

        if not parts:
            return "Lo siento, no pude generar una respuesta completa en este momento."

        return "Aquí tienes la información disponible:\n\n" + "\n\n".join(parts)

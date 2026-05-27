"""
Generator Agent.
Calls the LLM (OpenRouter) to generate the actual response.
"""
import json
from apps.asistente_ia.ai.agents.base import BaseAgent
from apps.asistente_ia.ai.orchestrator.state_manager import OrchestratorState

class GeneratorAgent(BaseAgent):
    def __init__(self, llm_client):
        self.llm = llm_client

    def _template_response(self, state: OrchestratorState) -> str | None:
        intent = state.intent
        if not intent:
            return None

        if intent.intent_type != "booking":
            return None

        plan = state.execution_plan or []
        if "ask_clarification" not in plan and "no_matches" not in plan:
            return None

        acc = state.accumulated_intent or {}
        destination = str(intent.destination or acc.get("destination") or "").strip()
        duration = str(intent.duration or acc.get("duration") or "").strip()
        budget = (intent.budget_range or acc.get("budget_range") or "").strip()
        interests = intent.interests or acc.get("interests") or []

        if not destination or destination.lower() in {"flexible"}:
            return (
                "Perfecto. Para recomendarte opciones reales de ToTem HUB necesito un detalle más.\n"
                "Elige una opción: ¿prefieres viajar dentro de Perú o por Sudamérica?\n"
                "Si quieres, dime también cuántos días y el tipo de experiencia (playa, aventura o cultura)."
            )

        if not duration:
            return (
                f"Buenísimo, apunto {destination}. Elige una opción: ¿cuánto tiempo quieres viajar?\n"
                "Así te muestro opciones que encajen bien con tu tiempo."
            )

        if not interests:
            return (
                f"Perfecto: {destination} por {duration}. Elige una opción: ¿qué estilo prefieres?\n"
                "Playa y relax / Aventura y naturaleza / Cultura e historia."
            )

        if not budget:
            return (
                f"Genial: {destination}, {duration} y enfoque en {', '.join(interests)}.\n"
                "Elige una opción: ¿qué presupuesto aproximado manejas? (Menos de S/500 / S/500–S/1500 / Más de S/1500)"
            )

        if "no_matches" in plan:
            if "perú" in destination.lower() or "peru" in destination.lower():
                ideas = "Cusco, Arequipa o Tarapoto"
            elif "sudam" in destination.lower():
                ideas = "Perú, Colombia o Argentina"
            else:
                ideas = "Perú o Colombia"
            return (
                f"Gracias. Ahora mismo no veo coincidencias exactas en nuestra base para {destination}.\n"
                f"Para avanzar rápido, elige una opción: ¿te interesa {ideas}?\n"
                "Con tu respuesta vuelvo a buscar y te muestro paquetes reales."
            )

        return None

    def execute(self, state: OrchestratorState) -> OrchestratorState:
        try:
            if not state.tool_results:
                templated = self._template_response(state)
                if templated:
                    state.raw_response = templated
                    return state

            # Prepare messages
            system_content = state.system_prompt
            if state.tool_results:
                tool_context = "\n\n== Datos consultados por herramientas ==\n"
                for tr in state.tool_results:
                    tn = tr.get("tool_name", "")
                    r = tr.get("result", {})
                    tool_context += f"[{tn}]: {json.dumps(r, ensure_ascii=False, default=str)}\n"
                tool_context += (
                    "\nUsa estos datos reales en tu respuesta. "
                    "Menciona el clima, presupuesto e itinerario de forma natural y atractiva."
                )
                system_content += tool_context

            messages = [{"role": "system", "content": system_content}]

            # Add history
            if state.chat_history:
                messages.extend(state.chat_history)
            else:
                messages.append({"role": "user", "content": state.user_message})
                
            # Route model dynamically based on intent
            task_type = "main"
            if state.intent:
                if state.intent.intent_type == "general_chat":
                    task_type = "fast" # Mistral for simple chat
                elif state.intent.intent_type in ["booking", "lead"]:
                    task_type = "main" # GPT-4o-mini for complex logic
                    
            state.raw_response = self.llm.chat(
                messages=messages,
                task_type=task_type,
                temperature=0.7,
                fallbacks=["anthropic/claude-3-haiku", "google/gemini-flash-1.5"]
            )
            
        except Exception as e:
            print(f">>> [GeneratorAgent] LLM generation failed: {e}")
            state.raw_response = f"Lo siento, hubo un error de conexión (Error IA: {e})"
            state.is_valid = False
            state.error_message = str(e)
            
        return state

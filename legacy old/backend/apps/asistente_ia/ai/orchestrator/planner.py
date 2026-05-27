"""
Planner Agent.
Defines the response strategy and builds the system prompt.
"""
import json
import re
from apps.asistente_ia.ai.agents.base import BaseAgent
from apps.asistente_ia.ai.orchestrator.state_manager import OrchestratorState

class PlannerAgent(BaseAgent):
    def execute(self, state: OrchestratorState) -> OrchestratorState:
        intent = state.intent
        last_assistant = ""
        if state.chat_history:
            for msg in reversed(state.chat_history):
                if msg.get("role") == "assistant" and msg.get("content"):
                    last_assistant = msg["content"]
                    break
        
        # 1. Build string representation of collected data
        collected = []
        if intent:
            if intent.destination: collected.append(f"destino: {intent.destination}")
            if intent.duration: collected.append(f"duración: {intent.duration}")
            if intent.group_type: collected.append(f"tipo de grupo: {intent.group_type}")
            if intent.group_size: collected.append(f"personas: {intent.group_size}")
            if intent.budget_range: collected.append(f"presupuesto: {intent.budget_range}")
            if intent.interests: collected.append(f"intereses: {', '.join(intent.interests)}")
            if intent.departure_month: collected.append(f"mes: {intent.departure_month}")
            
        collected_str = ", ".join(collected) if collected else "ninguno aún"

        base_prompt = (
            "Eres el asistente virtual experto de ToTem HUB, una plataforma B2B de viajes. "
            "TU OBJETIVO ES VENDER Y RETENER AL CLIENTE AQUÍ. "
            "NUNCA digas que no puedes hacer reservas, NUNCA mandes al usuario a buscar en Google, TripAdvisor, Booking.com u otras agencias. "
            "Si el usuario quiere reservar, dile que has guardado sus datos y que un agente experto de la agencia se pondrá en contacto con él inmediatamente para cerrar la reserva. "
            "Si tienes viajes en el contexto (matches), ofrécelos con entusiasmo y dile que puede hacer clic en 'Inscribirse' o 'Reservar' directamente en la pantalla.\n\n"
            f"Idioma detectado: {state.language}. Responde estrictamente en este idioma.\n\n"
        )

        # 2. Define execution plan and prompt
        if intent and intent.intent_type == "booking" and state.context_matches:
            state.execution_plan = ["present_matches", "ask_for_lead"]
            context_json = json.dumps(state.context_matches, ensure_ascii=False)
            state.system_prompt = base_prompt + (
                f"El usuario busca un viaje con estos datos: {collected_str}.\n"
                f"Hemos encontrado estos paquetes reales en la base de datos (RAG): {context_json}\n"
                "Tu tarea: Presenta las opciones de forma MUY atractiva y resumida. "
                "No inventes precios ni fechas que no estén en el JSON. "
                "Al final, haz SOLO 1 pregunta para avanzar (por ejemplo: elegir opción 1/2/3 o confirmar fechas)."
            )
            state.tool_calls.append({"name": "buscar_viajes", "parameters": {"intent": intent.intent_type}})
        elif intent and intent.intent_type == "booking" and intent.needs_clarification:
            state.execution_plan = ["ask_clarification"]
            clarification = intent.clarification_question or "¿A dónde te gustaría viajar o en qué fecha?"
            state.system_prompt = base_prompt + (
                f"Datos del viajero hasta ahora: {collected_str}.\n"
                "Para poder buscar el viaje perfecto en nuestra base de datos, necesitas más información.\n"
                "REGLAS: Sé MUY conversacional, no robótico. "
                "No repitas la misma pregunta que ya hiciste antes. "
                f"Último mensaje del asistente (para no repetir): {json.dumps(last_assistant, ensure_ascii=False)}\n"
                f"Integra ESTA pregunta en tu respuesta de forma natural: '{clarification}'. "
                "Haz máximo 1 pregunta."
            )
        elif intent and intent.intent_type == "booking" and not state.context_matches:
            state.execution_plan = ["no_matches"]
            state.system_prompt = base_prompt + (
                f"El usuario busca: {collected_str}.\n"
                "Lamentablemente, no encontramos paquetes exactos en nuestra base de datos en este momento.\n"
                "REGLAS: No inventes paquetes, precios, fechas, itinerarios ni nombres de tours. "
                "Si no hay coincidencias, tu trabajo es guiar al usuario a refinar su búsqueda con 1 a 2 preguntas máximo.\n"
                "Pide SOLO uno o dos datos clave (por ejemplo: duración aproximada y tipo de experiencia: playa/aventura/cultura). "
                "Si el usuario dijo 'Perú' o 'Sudamérica', ofrece alternativas dentro de esas regiones (sin inventar precios).\n"
                "Cierra invitando a elegir una opción concreta para poder buscar nuevamente."
            )
        else:
            # general_chat o cualquier otra cosa
            state.execution_plan = ["general_conversation"]
            state.system_prompt = base_prompt + (
                f"El usuario está conversando de forma general. (Datos recolectados hasta ahora: {collected_str}).\n"
                "Mantén una conversación MUY natural, amigable y fluida, estilo vendedor humano. "
                "REGLAS: No repitas la misma pregunta en mensajes consecutivos. "
                f"Último mensaje del asistente (para no repetir): {json.dumps(last_assistant, ensure_ascii=False)}\n"
                "Si el usuario está indeciso, ofrece 2-3 ideas concretas (sin precios inventados) y haz SOLO 1 pregunta al final."
            )

        # Enrichment tools: add when we know the destination
        if intent and intent.destination:
            acc = state.accumulated_intent or {}
            days = 3
            duration = getattr(intent, "duration", None) or acc.get("duration")
            if duration:
                match = re.search(r'(\d+)', str(duration))
                if match:
                    days = int(match.group(1))

            destination = intent.destination or acc.get("destination")
            existing_tool_names = {t["name"] for t in state.tool_calls}

            enrichment = []
            if "buscar_hoteles" not in existing_tool_names:
                enrichment.append({"name": "buscar_hoteles", "parameters": {"location": destination}})
            if "buscar_lugares" not in existing_tool_names:
                enrichment.append({"name": "buscar_lugares", "parameters": {"location": destination}})
            enrichment.append({"name": "get_weather", "parameters": {"city": destination}})

            group_size_raw = getattr(intent, "group_size", None) or acc.get("group_size")
            if group_size_raw:
                try:
                    group_size = int(re.sub(r'\D', '', str(group_size_raw)) or "20")
                except ValueError:
                    group_size = 20
                enrichment.append({"name": "calculate_budget", "parameters": {
                    "travelers": group_size, "days": days
                }})
                enrichment.append({"name": "generate_itinerary", "parameters": {
                    "destination": destination, "days": days
                }})

            state.tool_calls.extend(enrichment)
            import logging
            logging.getLogger(__name__).info(
                f"[PlannerAgent] Plan: {state.execution_plan} | "
                f"Tools: {[t['name'] for t in state.tool_calls]}"
            )

        return state

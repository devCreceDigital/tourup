"""
Tool Calling Agent — Router interno de Hermes.
Ejecuta tools según lo que el planner/generator solicite.
"""

import logging
from apps.asistente_ia.ai.agents.base import BaseAgent
from apps.asistente_ia.ai.orchestrator.state_manager import OrchestratorState
from apps.asistente_ia.ai.tools.google_places import google_places
from apps.asistente_ia.ai.tools.hotels_tool import hotels_tool
from apps.asistente_ia.ai.tools.flights_tool import flights_tool
from apps.asistente_ia.ai.tools.weather import get_weather
from apps.asistente_ia.ai.tools.budget import calculate_budget
from apps.asistente_ia.ai.tools.itinerary import generate_itinerary

logger = logging.getLogger(__name__)


class ToolCallingAgent(BaseAgent):

    TOOL_REGISTRY = {
        # Leads
        "crear_lead",
        "buscar_viajes",
        # Google Maps / Places
        "buscar_lugares",
        "buscar_hoteles",
        "buscar_restaurantes",
        "calcular_ruta",
        "detalle_lugar",
        # Vuelos
        "buscar_vuelos",
        # Enrichment
        "get_weather",
        "calculate_budget",
        "generate_itinerary",
    }

    def execute(self, state: OrchestratorState) -> OrchestratorState:
        if not state.tool_calls:
            return state

        logger.info(f"[ToolCallingAgent] Ejecutando {len(state.tool_calls)} tool(s)...")

        for tool in state.tool_calls:
            tool_name = tool.get("name")
            params = tool.get("parameters", {})

            try:
                result = self._dispatch(tool_name, params, state)
            except Exception as e:
                logger.error(f"[ToolCallingAgent] Error en tool '{tool_name}': {e}")
                result = {"error": str(e)}

            state.tool_results.append({"tool_name": tool_name, "result": result})

        return state

    def _dispatch(self, tool_name: str, params: dict, state: OrchestratorState) -> dict:
        """Despacha a la tool correcta según el nombre."""

        # ── Google Maps / Places ────────────────────────────────────
        if tool_name == "buscar_lugares":
            destination = params.get("location") or state.extracted_destination() or "Lima"
            lugares = google_places.buscar_lugares(
                query=params.get("query", "atracciones turísticas"),
                location=destination,
                radius_km=params.get("radius_km", 15),
                place_type=params.get("type", "tourist_attraction"),
            )
            markers = [{"lat": l["lat"], "lng": l["lng"], "label": l["nombre"], "type": "attraction"} for l in lugares]
            return {
                "lugares": lugares,
                "map_update": {"action": "show_places", "markers": markers,
                               "center": markers[0] if markers else None},
            }

        if tool_name == "buscar_hoteles":
            destination = params.get("location") or state.extracted_destination() or "Lima"
            return hotels_tool.search(
                destination=destination,
                radius_km=params.get("radius_km", 10),
                max_results=params.get("max_results", 5),
            )

        if tool_name == "buscar_restaurantes":
            destination = params.get("location") or state.extracted_destination() or "Lima"
            restaurantes = google_places.buscar_restaurantes(
                location=destination,
                tipo_cocina=params.get("tipo_cocina", ""),
                radius_km=params.get("radius_km", 5),
            )
            markers = [{"lat": r["lat"], "lng": r["lng"], "label": r["nombre"], "type": "restaurant"} for r in restaurantes]
            return {
                "restaurantes": restaurantes,
                "map_update": {"action": "show_places", "markers": markers},
            }

        if tool_name == "calcular_ruta":
            return google_places.calcular_ruta(
                origen=params.get("origen", "Lima"),
                destino=params.get("destino", "Cusco"),
                waypoints=params.get("waypoints"),
                modo=params.get("modo", "driving"),
            )

        if tool_name == "detalle_lugar":
            return google_places.detalle_lugar(params["place_id"])

        # ── Vuelos ──────────────────────────────────────────────────
        if tool_name == "buscar_vuelos":
            destination = params.get("destination") or state.extracted_destination() or "Cusco"
            return flights_tool.search(
                destination=destination,
                departure_date=params.get("departure_date"),
                passengers=params.get("passengers", 1),
                trip_type=params.get("trip_type", "ida_vuelta"),
            )

        # ── Enrichment tools ────────────────────────────────────────
        if tool_name == "get_weather":
            city = params.get("city") or state.extracted_destination() or "Lima"
            return get_weather(city)

        if tool_name == "calculate_budget":
            return calculate_budget(
                travelers=params.get("travelers", 1),
                days=params.get("days", 3),
                category=params.get("category", "moderado"),
            )

        if tool_name == "generate_itinerary":
            destination = params.get("destination") or state.extracted_destination() or "Lima"
            return generate_itinerary(
                destination=destination,
                days=params.get("days", 3),
            )

        # ── Leads internos ──────────────────────────────────────────
        if tool_name == "crear_lead":
            return self._crear_lead(params, state)

        if tool_name == "buscar_viajes":
            return {"status": "success", "data": "Búsqueda de viajes en catálogo Totem."}

        return {"error": f"Tool '{tool_name}' no reconocida"}

    def _crear_lead(self, params: dict, state: OrchestratorState) -> dict:
        score = params.get("score", 50)
        logger.info(f"[ToolCallingAgent] Creando lead con score={score}")
        return {
            "status": "success",
            "message": "Lead registrado en Totem HUB.",
            "lead_score": score,
        }

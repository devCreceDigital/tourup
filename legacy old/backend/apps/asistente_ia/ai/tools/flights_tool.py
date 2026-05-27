"""
Flights Tool para Hermes Agent.
Genera estimaciones realistas de vuelos desde Lima hacia destinos peruanos e internacionales.

Nota: No conecta con una API de vuelos real (Amadeus/Skyscanner requieren contratos).
Genera respuestas útiles y realistas para el chat basadas en rangos de precios conocidos.
Para producción: reemplazar _get_price_range() con llamada a Amadeus API.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional

logger = logging.getLogger(__name__)

# Rangos de precios aproximados desde Lima (PEN) — actualizados 2026
PRECIOS_DESDE_LIMA = {
    # Destinos nacionales
    "cusco": {"min": 180, "max": 450, "horas": "1h 20min", "aerolineas": ["LATAM", "Sky", "Star Perú"]},
    "arequipa": {"min": 150, "max": 380, "horas": "1h 15min", "aerolineas": ["LATAM", "Sky"]},
    "iquitos": {"min": 200, "max": 520, "horas": "1h 50min", "aerolineas": ["LATAM", "Star Perú"]},
    "trujillo": {"min": 120, "max": 280, "horas": "55min", "aerolineas": ["LATAM", "Sky"]},
    "piura": {"min": 130, "max": 300, "horas": "1h 05min", "aerolineas": ["LATAM", "Sky"]},
    "pucallpa": {"min": 180, "max": 400, "horas": "1h 00min", "aerolineas": ["LATAM", "Star Perú"]},
    "tacna": {"min": 160, "max": 350, "horas": "1h 30min", "aerolineas": ["LATAM"]},
    "juliaca": {"min": 170, "max": 420, "horas": "1h 25min", "aerolineas": ["LATAM", "Sky"]},
    "tarapoto": {"min": 160, "max": 380, "horas": "1h 10min", "aerolineas": ["LATAM", "Star Perú"]},
    # Internacionales
    "bogota": {"min": 350, "max": 900, "horas": "3h 30min", "aerolineas": ["LATAM", "Avianca", "Copa"]},
    "santiago": {"min": 300, "max": 800, "horas": "3h 45min", "aerolineas": ["LATAM", "Sky", "JetSMART"]},
    "buenos aires": {"min": 400, "max": 1100, "horas": "4h 00min", "aerolineas": ["LATAM", "Aerolíneas Argentinas"]},
    "cancun": {"min": 600, "max": 1500, "horas": "7h 30min", "aerolineas": ["LATAM", "Copa", "Aeromexico"]},
    "miami": {"min": 500, "max": 1300, "horas": "6h 00min", "aerolineas": ["LATAM", "American", "Spirit"]},
    "madrid": {"min": 900, "max": 2200, "horas": "12h 00min", "aerolineas": ["Iberia", "Air Europa", "LATAM"]},
    "tokio": {"min": 1200, "max": 3000, "horas": "18h 00min", "aerolineas": ["Japan Airlines", "ANA", "LATAM"]},
    "paris": {"min": 950, "max": 2400, "horas": "13h 00min", "aerolineas": ["Air France", "Iberia", "LATAM"]},
}


def _match_destination(destination: str) -> Optional[dict]:
    """Busca el destino en la tabla de precios (búsqueda fuzzy simple)."""
    dest_lower = destination.lower().strip()
    for key, data in PRECIOS_DESDE_LIMA.items():
        if key in dest_lower or dest_lower in key:
            return {"destino_key": key, **data}
    return None


def search_flights(
    destination: str,
    departure_date: Optional[str] = None,
    passengers: int = 1,
    trip_type: str = "ida_vuelta",
) -> dict:
    """
    Retorna estimaciones de vuelo desde Lima al destino indicado.

    Args:
        destination: ciudad de destino (ej. "Cusco", "Cancún")
        departure_date: fecha de salida en formato YYYY-MM-DD (opcional)
        passengers: número de pasajeros
        trip_type: "ida" | "ida_vuelta"

    Returns:
        dict con opciones de vuelo estimadas y recomendación
    """
    info = _match_destination(destination)

    if not info:
        logger.info(f"[FlightsTool] Destino '{destination}' no en tabla, usando estimación genérica")
        return {
            "disponible": False,
            "destino": destination,
            "mensaje": (
                f"Para vuelos a {destination} desde Lima, te recomiendo consultar directamente "
                f"en LATAM (latam.com), Sky Airline o la aerolínea de tu preferencia. "
                f"Los precios varían mucho según la temporada y anticipación de compra."
            ),
        }

    precio_min = info["min"] * passengers
    precio_max = info["max"] * passengers
    if trip_type == "ida_vuelta":
        precio_min = int(precio_min * 1.7)
        precio_max = int(precio_max * 1.8)

    # Simular opciones de vuelo
    opciones = []
    for i, aerolinea in enumerate(info["aerolineas"][:3]):
        variacion = 1 + (i * 0.12)
        opciones.append({
            "aerolinea": aerolinea,
            "precio_desde": int(precio_min * variacion / len(info["aerolineas"])),
            "duracion": info["horas"],
            "tipo": trip_type.replace("_", " ").title(),
            "clase": "Económica",
        })

    # Calcular fecha si no se proporcionó
    if not departure_date:
        departure_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")

    logger.info(f"[FlightsTool] Vuelos a '{destination}' para {passengers} pax: S/{precio_min}-{precio_max}")

    return {
        "disponible": True,
        "destino": destination,
        "origen": "Lima (LIM)",
        "fecha_salida": departure_date,
        "pasajeros": passengers,
        "tipo_viaje": trip_type,
        "rango_precio_total": {
            "min": precio_min,
            "max": precio_max,
            "moneda": "PEN",
        },
        "duracion_aproximada": info["horas"],
        "opciones": opciones,
        "nota": "Precios estimados. Varían según temporada y anticipación. Consultar en aerolínea.",
        "reservar_en": [f"https://www.{a.lower().replace(' ', '')}.com" for a in info["aerolineas"][:2]],
    }


def format_flights_for_chat(flights_result: dict) -> str:
    """Formatea la respuesta de vuelos para el chat."""
    if not flights_result.get("disponible"):
        return flights_result.get("mensaje", "No hay información de vuelos disponible.")

    destino = flights_result["destino"]
    rango = flights_result["rango_precio_total"]
    duracion = flights_result["duracion_aproximada"]
    pax = flights_result["pasajeros"]

    lines = [
        f"✈️ Vuelos Lima → {destino} ({pax} pasajero{'s' if pax > 1 else ''}):\n",
        f"⏱ Duración: ~{duracion}",
        f"💰 Precio estimado: S/{rango['min']:,} – S/{rango['max']:,} ({flights_result['tipo_viaje']})\n",
        "Aerolíneas disponibles:",
    ]
    for op in flights_result.get("opciones", []):
        lines.append(f"  • {op['aerolinea']} — desde S/{op['precio_desde']:,}")

    lines.append(f"\n_{flights_result['nota']}_")
    return "\n".join(lines)


class FlightsTool:
    search = staticmethod(search_flights)
    format_for_chat = staticmethod(format_flights_for_chat)


flights_tool = FlightsTool()

"""
Google Maps / Places tool para Hermes Agent.
Conecta con: Maps JavaScript API, Places API, Directions API, Geocoding API.
"""

import os
import json
import logging
import urllib.request
import urllib.parse
from typing import Optional

logger = logging.getLogger(__name__)

# ── Mock data fallback (cuando API no está disponible) ─────────────
MOCK_LUGARES = {
    "cusco": [
        {"place_id": "cusco_1", "nombre": "Plaza de Armas del Cusco", "direccion": "Plaza de Armas, Cusco", "rating": 4.8, "total_ratings": 12400, "lat": -13.5170, "lng": -71.9785, "foto_url": "https://images.unsplash.com/photo-1580502304784-8985b7eb7260?w=400", "tipos": ["tourist_attraction"], "abierto_ahora": True},
        {"place_id": "cusco_2", "nombre": "Sacsayhuamán", "direccion": "Sacsayhuamán, Cusco", "rating": 4.7, "total_ratings": 8900, "lat": -13.5088, "lng": -71.9819, "foto_url": "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=400", "tipos": ["tourist_attraction"], "abierto_ahora": True},
        {"place_id": "cusco_3", "nombre": "Qorikancha - Templo del Sol", "direccion": "Plazoleta Santo Domingo, Cusco", "rating": 4.6, "total_ratings": 7200, "lat": -13.5228, "lng": -71.9762, "foto_url": "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=400", "tipos": ["museum"], "abierto_ahora": True},
        {"place_id": "cusco_4", "nombre": "Mercado de San Pedro", "direccion": "Mercado Central, Cusco", "rating": 4.3, "total_ratings": 5100, "lat": -13.5238, "lng": -71.9748, "foto_url": "https://images.unsplash.com/photo-1571401835393-8c5f35328320?w=400", "tipos": ["market"], "abierto_ahora": True},
        {"place_id": "cusco_5", "nombre": "Barrio de San Blas", "direccion": "San Blas, Cusco", "rating": 4.5, "total_ratings": 3800, "lat": -13.5148, "lng": -71.9726, "foto_url": "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=400", "tipos": ["neighborhood"], "abierto_ahora": True},
    ],
    "machu picchu": [
        {"place_id": "mp_1", "nombre": "Ciudadela Inca de Machu Picchu", "direccion": "Machu Picchu, Cusco", "rating": 4.9, "total_ratings": 45000, "lat": -13.1631, "lng": -72.5450, "foto_url": "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=400", "tipos": ["tourist_attraction"], "abierto_ahora": True},
        {"place_id": "mp_2", "nombre": "Montaña Machu Picchu", "direccion": "Machu Picchu, Cusco", "rating": 4.8, "total_ratings": 12000, "lat": -13.1645, "lng": -72.5442, "foto_url": "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=400", "tipos": ["natural_feature"], "abierto_ahora": True},
        {"place_id": "mp_3", "nombre": "Puerta del Sol (Inti Punku)", "direccion": "Machu Picchu, Cusco", "rating": 4.7, "total_ratings": 6500, "lat": -13.1724, "lng": -72.5368, "foto_url": "https://images.unsplash.com/photo-1580502304784-8985b7eb7260?w=400", "tipos": ["tourist_attraction"], "abierto_ahora": True},
    ],
    "lima": [
        {"place_id": "lima_1", "nombre": "Miraflores", "direccion": "Miraflores, Lima", "rating": 4.6, "total_ratings": 18000, "lat": -12.1219, "lng": -77.0297, "foto_url": "https://images.unsplash.com/photo-1531968455001-5c5272a41129?w=400", "tipos": ["neighborhood"], "abierto_ahora": True},
        {"place_id": "lima_2", "nombre": "Huaca Pucllana", "direccion": "Miraflores, Lima", "rating": 4.6, "total_ratings": 9800, "lat": -12.1108, "lng": -77.0347, "foto_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", "tipos": ["tourist_attraction"], "abierto_ahora": True},
        {"place_id": "lima_3", "nombre": "Museo Larco", "direccion": "Av. Bolívar 1515, Pueblo Libre", "rating": 4.8, "total_ratings": 14200, "lat": -12.0731, "lng": -77.0636, "foto_url": "https://images.unsplash.com/photo-1571401835393-8c5f35328320?w=400", "tipos": ["museum"], "abierto_ahora": True},
        {"place_id": "lima_4", "nombre": "Barranco", "direccion": "Barranco, Lima", "rating": 4.7, "total_ratings": 11000, "lat": -12.1500, "lng": -77.0219, "foto_url": "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=400", "tipos": ["neighborhood"], "abierto_ahora": True},
        {"place_id": "lima_5", "nombre": "Larco Mar", "direccion": "Malecón de la Reserva 610, Miraflores", "rating": 4.5, "total_ratings": 22000, "lat": -12.1308, "lng": -77.0281, "foto_url": "https://images.unsplash.com/photo-1512813195386-6cf811ad3542?w=400", "tipos": ["shopping_mall"], "abierto_ahora": True},
    ],
    "arequipa": [
        {"place_id": "arq_1", "nombre": "Monasterio de Santa Catalina", "direccion": "C. Santa Catalina 301, Arequipa", "rating": 4.8, "total_ratings": 13500, "lat": -16.3969, "lng": -71.5372, "foto_url": "https://images.unsplash.com/photo-1568454537842-d933259bb258?w=400", "tipos": ["tourist_attraction"], "abierto_ahora": True},
        {"place_id": "arq_2", "nombre": "Plaza de Armas de Arequipa", "direccion": "Plaza de Armas, Arequipa", "rating": 4.7, "total_ratings": 9200, "lat": -16.3988, "lng": -71.5369, "foto_url": "https://images.unsplash.com/photo-1580502304784-8985b7eb7260?w=400", "tipos": ["tourist_attraction"], "abierto_ahora": True},
        {"place_id": "arq_3", "nombre": "Mirador de Yanahuara", "direccion": "Yanahuara, Arequipa", "rating": 4.6, "total_ratings": 7800, "lat": -16.3903, "lng": -71.5478, "foto_url": "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=400", "tipos": ["viewpoint"], "abierto_ahora": True},
    ],
    "paracas": [
        {"place_id": "par_1", "nombre": "Reserva Nacional de Paracas", "direccion": "Paracas, Ica", "rating": 4.7, "total_ratings": 8900, "lat": -13.7800, "lng": -76.2500, "foto_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400", "tipos": ["natural_feature"], "abierto_ahora": True},
        {"place_id": "par_2", "nombre": "Islas Ballestas", "direccion": "Paracas, Ica", "rating": 4.8, "total_ratings": 11200, "lat": -13.7452, "lng": -76.3965, "foto_url": "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400", "tipos": ["natural_feature"], "abierto_ahora": True},
    ],
    "iquitos": [
        {"place_id": "iqu_1", "nombre": "Reserva Nacional Pacaya Samiria", "direccion": "Loreto, Perú", "rating": 4.9, "total_ratings": 4200, "lat": -5.5000, "lng": -74.5000, "foto_url": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400", "tipos": ["natural_feature"], "abierto_ahora": True},
        {"place_id": "iqu_2", "nombre": "Malecón Tarapacá", "direccion": "Iquitos, Loreto", "rating": 4.3, "total_ratings": 3100, "lat": -3.7489, "lng": -73.2508, "foto_url": "https://images.unsplash.com/photo-1512813195386-6cf811ad3542?w=400", "tipos": ["tourist_attraction"], "abierto_ahora": True},
    ],
}

MOCK_COORDS = {
    "cusco":        {"lat": -13.5170, "lng": -71.9785, "formatted": "Cusco, Perú"},
    "machu picchu": {"lat": -13.1631, "lng": -72.5450, "formatted": "Machu Picchu, Cusco, Perú"},
    "lima":         {"lat": -12.0464, "lng": -77.0428, "formatted": "Lima, Perú"},
    "arequipa":     {"lat": -16.3988, "lng": -71.5369, "formatted": "Arequipa, Perú"},
    "paracas":      {"lat": -13.7800, "lng": -76.2500, "formatted": "Paracas, Ica, Perú"},
    "iquitos":      {"lat": -3.7489,  "lng": -73.2508, "formatted": "Iquitos, Loreto, Perú"},
    "trujillo":     {"lat": -8.1159,  "lng": -79.0300, "formatted": "Trujillo, La Libertad, Perú"},
    "puno":         {"lat": -15.8422, "lng": -70.0199, "formatted": "Puno, Perú"},
}

def _mock_lugares(location: str) -> list[dict]:
    """Retorna mock data para una ubicación."""
    loc = location.lower().strip()
    for key, lugares in MOCK_LUGARES.items():
        if key in loc or loc in key:
            return lugares
    # Fallback genérico
    return [
        {"place_id": f"gen_1", "nombre": f"Centro Histórico de {location}", "direccion": location,
         "rating": 4.5, "total_ratings": 1000, "lat": -12.0464, "lng": -77.0428,
         "foto_url": None, "tipos": ["tourist_attraction"], "abierto_ahora": True},
        {"place_id": f"gen_2", "nombre": f"Plaza Principal de {location}", "direccion": location,
         "rating": 4.4, "total_ratings": 800, "lat": -12.0500, "lng": -77.0450,
         "foto_url": None, "tipos": ["tourist_attraction"], "abierto_ahora": True},
    ]

def _mock_geocode(address: str) -> dict:
    """Retorna coordenadas mock para ciudades peruanas conocidas."""
    addr = address.lower().strip()
    for key, coords in MOCK_COORDS.items():
        if key in addr or addr in key:
            return coords
    return {"lat": -12.046374, "lng": -77.042793, "formatted": f"{address}, Perú"}


MAPS_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
PLACES_BASE = "https://maps.googleapis.com/maps/api/place"
GEOCODING_BASE = "https://maps.googleapis.com/maps/api/geocode"
DIRECTIONS_BASE = "https://maps.googleapis.com/maps/api/directions"


def _get(url: str, params: dict) -> dict:
    """Wrapper GET con urllib (sin dependencias extra)."""
    params["key"] = MAPS_KEY
    qs = urllib.parse.urlencode(params)
    full_url = f"{url}?{qs}"
    try:
        with urllib.request.urlopen(full_url, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        logger.error(f"[GooglePlaces] Error en {url}: {e}")
        return {}


def geocode(address: str) -> dict:
    """
    Convierte una ciudad o dirección a coordenadas lat/lng.
    Retorna: {"lat": float, "lng": float, "formatted": str}
    """
    data = _get(f"{GEOCODING_BASE}/json", {"address": address, "language": "es"})
    results = data.get("results", [])
    if results:
        loc = results[0]["geometry"]["location"]
        return {
            "lat": loc["lat"],
            "lng": loc["lng"],
            "formatted": results[0]["formatted_address"],
        }
    # Fallback: mock coords por ciudad conocida, luego Lima
    return _mock_geocode(address)


def buscar_lugares(
    query: str,
    location: str,
    radius_km: float = 15,
    place_type: str = "tourist_attraction",
) -> list[dict]:
    """
    Busca lugares turísticos en una ciudad usando Places Text Search.
    Retorna lista de lugares con coordenadas, rating e imágenes.

    place_type opciones: tourist_attraction | museum | park |
                         restaurant | hotel | point_of_interest
    """
    coords = geocode(location)
    location_str = f"{coords['lat']},{coords['lng']}"

    data = _get(
        f"{PLACES_BASE}/textsearch/json",
        {
            "query": query,
            "location": location_str,
            "radius": int(radius_km * 1000),
            "type": place_type,
            "language": "es",
        },
    )

    lugares = []
    for p in data.get("results", [])[:8]:
        foto_ref = None
        if p.get("photos"):
            foto_ref = p["photos"][0].get("photo_reference")

        lugares.append({
            "place_id": p.get("place_id"),
            "nombre": p.get("name"),
            "direccion": p.get("formatted_address") or p.get("vicinity"),
            "rating": p.get("rating"),
            "total_ratings": p.get("user_ratings_total"),
            "lat": p["geometry"]["location"]["lat"],
            "lng": p["geometry"]["location"]["lng"],
            "foto_url": foto_url(foto_ref) if foto_ref else None,
            "tipos": p.get("types", []),
            "abierto_ahora": p.get("opening_hours", {}).get("open_now"),
        })

    # Si la API no devolvió nada (sin billing o key inválida), usar mock
    if not lugares:
        logger.warning(f"[GooglePlaces] API sin resultados para '{location}', usando mock data")
        lugares = _mock_lugares(location)

    logger.info(f"[GooglePlaces] buscar_lugares '{query}' en '{location}': {len(lugares)} resultados")
    return lugares


def detalle_lugar(place_id: str) -> dict:
    """
    Obtiene detalles completos de un lugar: horarios, teléfono, web, fotos.
    """
    data = _get(
        f"{PLACES_BASE}/details/json",
        {
            "place_id": place_id,
            "fields": "name,rating,formatted_address,formatted_phone_number,website,opening_hours,photos,reviews,price_level,url",
            "language": "es",
        },
    )
    result = data.get("result", {})

    fotos = []
    for p in result.get("photos", [])[:4]:
        ref = p.get("photo_reference")
        if ref:
            fotos.append(foto_url(ref))

    reviews = []
    for r in result.get("reviews", [])[:3]:
        reviews.append({
            "autor": r.get("author_name"),
            "rating": r.get("rating"),
            "texto": r.get("text"),
            "tiempo": r.get("relative_time_description"),
        })

    return {
        "nombre": result.get("name"),
        "rating": result.get("rating"),
        "direccion": result.get("formatted_address"),
        "telefono": result.get("formatted_phone_number"),
        "web": result.get("website"),
        "google_maps_url": result.get("url"),
        "precio": result.get("price_level"),  # 0-4
        "horarios": result.get("opening_hours", {}).get("weekday_text", []),
        "fotos": fotos,
        "reviews": reviews,
    }


def buscar_hoteles(location: str, radius_km: float = 10) -> list[dict]:
    """
    Busca hoteles cercanos a una ubicación.
    Retorna lista con nombre, rating, coordenadas y foto.
    """
    coords = geocode(location)

    data = _get(
        f"{PLACES_BASE}/nearbysearch/json",
        {
            "location": f"{coords['lat']},{coords['lng']}",
            "radius": int(radius_km * 1000),
            "type": "hotel",
            "language": "es",
        },
    )

    hoteles = []
    for p in data.get("results", [])[:6]:
        foto_ref = None
        if p.get("photos"):
            foto_ref = p["photos"][0].get("photo_reference")

        hoteles.append({
            "place_id": p.get("place_id"),
            "nombre": p.get("name"),
            "rating": p.get("rating"),
            "lat": p["geometry"]["location"]["lat"],
            "lng": p["geometry"]["location"]["lng"],
            "foto_url": foto_url(foto_ref) if foto_ref else None,
            "precio_nivel": p.get("price_level"),
        })

    logger.info(f"[GooglePlaces] buscar_hoteles en '{location}': {len(hoteles)} hoteles")
    return hoteles


def buscar_restaurantes(location: str, tipo_cocina: str = "", radius_km: float = 5) -> list[dict]:
    """
    Busca restaurantes en una ubicación, con filtro opcional de tipo de cocina.
    """
    query = f"restaurante {tipo_cocina} {location}".strip()
    return buscar_lugares(query, location, radius_km=radius_km, place_type="restaurant")


def calcular_ruta(
    origen: str,
    destino: str,
    waypoints: Optional[list[str]] = None,
    modo: str = "driving",
) -> dict:
    """
    Calcula la ruta entre dos puntos.
    modo: driving | walking | transit | bicycling
    Retorna: distancia, duración, polyline encoded, pasos.
    """
    params = {
        "origin": origen,
        "destination": destino,
        "mode": modo,
        "language": "es",
    }
    if waypoints:
        params["waypoints"] = "|".join(waypoints)

    data = _get(f"{DIRECTIONS_BASE}/json", params)
    routes = data.get("routes", [])

    if not routes:
        return {"error": "No se encontró ruta entre los puntos indicados."}

    route = routes[0]
    leg = route["legs"][0]

    return {
        "distancia": leg["distance"]["text"],
        "duracion": leg["duration"]["text"],
        "origen": leg["start_address"],
        "destino": leg["end_address"],
        "polyline": route["overview_polyline"]["points"],
        "pasos": [s["html_instructions"] for s in leg["steps"][:8]],
        "map_update": {
            "action": "draw_route",
            "polyline": route["overview_polyline"]["points"],
            "origin_label": leg["start_address"],
            "destination_label": leg["end_address"],
        },
    }


def foto_url(photo_reference: str, max_width: int = 800) -> str:
    """Construye la URL de una foto de Google Places."""
    return (
        f"{PLACES_BASE}/photo"
        f"?maxwidth={max_width}"
        f"&photo_reference={photo_reference}"
        f"&key={MAPS_KEY}"
    )


def autocomplete_lugar(input_text: str, pais: str = "pe") -> list[str]:
    """
    Autocompleta nombres de ciudades/lugares (útil para el chat).
    Retorna lista de sugerencias de texto.
    """
    data = _get(
        f"{PLACES_BASE}/autocomplete/json",
        {
            "input": input_text,
            "types": "(cities)",
            "components": f"country:{pais}",
            "language": "es",
        },
    )
    return [
        p["description"]
        for p in data.get("predictions", [])[:5]
    ]


# ── Instancia global reutilizable ──────────────────────────────────
class GooglePlacesClient:
    """Wrapper con interfaz de clase para uso consistente con otros tools."""

    buscar_lugares = staticmethod(buscar_lugares)
    buscar_hoteles = staticmethod(buscar_hoteles)
    buscar_restaurantes = staticmethod(buscar_restaurantes)
    calcular_ruta = staticmethod(calcular_ruta)
    detalle_lugar = staticmethod(detalle_lugar)
    geocode = staticmethod(geocode)
    autocomplete_lugar = staticmethod(autocomplete_lugar)


google_places = GooglePlacesClient()

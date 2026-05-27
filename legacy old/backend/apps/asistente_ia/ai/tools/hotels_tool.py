"""
Hotels Tool — mock data para desarrollo sin billing de Google Maps.
"""
import logging
logger = logging.getLogger(__name__)

MOCK_HOTELS = {
    "cusco": [
        {"nombre": "Hotel Monasterio", "rating": 4.8, "precio_nivel": "Caro", "lat": -13.5170, "lng": -71.9785, "foto_url": None, "place_id": "mock_001"},
        {"nombre": "Hostal Qori Wasi", "rating": 4.2, "precio_nivel": "Economico", "lat": -13.5190, "lng": -71.9820, "foto_url": None, "place_id": "mock_002"},
        {"nombre": "Hotel Ruinas", "rating": 4.5, "precio_nivel": "Moderado", "lat": -13.5160, "lng": -71.9800, "foto_url": None, "place_id": "mock_003"},
    ],
    "lima": [
        {"nombre": "Hotel Miraflores Park", "rating": 4.7, "precio_nivel": "Caro", "lat": -12.1219, "lng": -77.0286, "foto_url": None, "place_id": "mock_010"},
        {"nombre": "Hostal El Patio", "rating": 4.1, "precio_nivel": "Economico", "lat": -12.1250, "lng": -77.0300, "foto_url": None, "place_id": "mock_011"},
    ],
    "arequipa": [
        {"nombre": "Casa Andina Premium", "rating": 4.6, "precio_nivel": "Moderado", "lat": -16.3989, "lng": -71.5369, "foto_url": None, "place_id": "mock_020"},
        {"nombre": "Hostal La Posada", "rating": 4.0, "precio_nivel": "Economico", "lat": -16.4000, "lng": -71.5380, "foto_url": None, "place_id": "mock_021"},
    ],
    "tarapoto": [
        {"nombre": "La Patarashca Hotel", "rating": 4.3, "precio_nivel": "Moderado", "lat": -6.4850, "lng": -76.3720, "foto_url": None, "place_id": "mock_030"},
    ],
    "paracas": [
        {"nombre": "Hotel Paracas", "rating": 4.5, "precio_nivel": "Caro", "lat": -13.8350, "lng": -76.2500, "foto_url": None, "place_id": "mock_040"},
    ],
}

def search_hotels(destination: str, radius_km: float = 10, max_results: int = 5, min_rating: float = 3.5) -> dict:
    dest_key = destination.lower().split(",")[0].strip()
    hoteles = MOCK_HOTELS.get(dest_key, [])
    hoteles = [h for h in hoteles if h["rating"] >= min_rating][:max_results]
    markers = [{"lat": h["lat"], "lng": h["lng"], "label": h["nombre"], "type": "hotel", "rating": h["rating"]} for h in hoteles]
    return {
        "hoteles": hoteles,
        "total": len(hoteles),
        "destino": destination,
        "map_update": {"action": "show_hotels", "markers": markers, "center": {"lat": markers[0]["lat"], "lng": markers[0]["lng"]} if markers else None},
    }

def get_hotel_detail(place_id: str) -> dict:
    return {"place_id": place_id, "detail": "Mock"}

class HotelsTool:
    search = staticmethod(search_hotels)
    detail = staticmethod(get_hotel_detail)

hotels_tool = HotelsTool()

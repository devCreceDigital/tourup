def get_weather(city: str) -> dict:
    mock_data = {
        "Cusco": {"temperature": "17°C", "condition": "Lluvia ligera", "best_time": "Mayo-Octubre"},
        "Lima": {"temperature": "22°C", "condition": "Nublado", "best_time": "Diciembre-Abril"},
        "Arequipa": {"temperature": "20°C", "condition": "Soleado", "best_time": "Todo el año"},
        "Tarapoto": {"temperature": "28°C", "condition": "Húmedo", "best_time": "Junio-Noviembre"},
        "Paracas": {"temperature": "24°C", "condition": "Soleado", "best_time": "Diciembre-Marzo"},
    }
    return mock_data.get(city, {"temperature": "Desconocido", "condition": "Sin datos", "best_time": "Consultar"})

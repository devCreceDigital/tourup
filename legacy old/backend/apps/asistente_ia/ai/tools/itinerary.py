"""
Tool: generate_itinerary
Devuelve lista de días con slots mañana/tarde/noche.
"""

ACTIVIDADES = {
    "cusco": {
        "mañana": ["Visita Plaza de Armas y Catedral", "Tour Sacsayhuamán", "Mercado de San Pedro", "Barrio de San Blas"],
        "tarde":  ["Museo Inca", "Qorikancha - Templo del Sol", "Paseo por el centro histórico", "Pisac y Valle Sagrado"],
        "noche":  ["Cena en restaurante de cocina novoandina", "Show de danzas folklóricas", "Pisco sour en La Bodega 138"],
    },
    "machu picchu": {
        "mañana": ["Ingreso temprano a la ciudadela inca", "Sube la Montaña Machu Picchu", "Recorrido por los templos"],
        "tarde":  ["Puerta del Sol (Inti Punku)", "Museo de sitio Manuel Chávez Ballón", "Aguas Calientes"],
        "noche":  ["Cena en Aguas Calientes", "Descanso en hotel de montaña"],
    },
    "lima": {
        "mañana": ["Tour Miraflores y Larco Mar", "Huaca Pucllana", "Parque Kennedy", "Museo Larco"],
        "tarde":  ["Barranco y Puente de los Suspiros", "MALI Museo de Arte de Lima", "Circuito Mágico del Agua"],
        "noche":  ["Cena en La Mar Cebichería", "Paseo nocturno en Barranco", "Malecón de Miraflores"],
    },
    "arequipa": {
        "mañana": ["Monasterio de Santa Catalina", "Plaza de Armas de Arequipa", "Mercado San Camilo"],
        "tarde":  ["Mirador de Yanahuara", "Casa del Moral", "Barrio Yanahuara"],
        "noche":  ["Cena con vista al volcán Misti", "Paseo nocturno por el centro histórico"],
    },
    "paracas": {
        "mañana": ["Tour Islas Ballestas", "Reserva Nacional de Paracas", "Playa La Mina"],
        "tarde":  ["Centro de Interpretación de Paracas", "Atardecer en El Chaco", "Playa Roja"],
        "noche":  ["Cena de mariscos frescos", "Noche de estrellas en el desierto"],
    },
    "iquitos": {
        "mañana": ["Reserva Nacional Pacaya Samiria", "Comunidades nativas del Amazonas", "Avistamiento de delfines rosados"],
        "tarde":  ["Malecón Tarapacá", "Mercado de Belén", "Paseo en bote por el río"],
        "noche":  ["Cena de cocina amazónica", "Observación de caímanes nocturnos"],
    },
}

DEFAULT_ACTIVIDADES = {
    "mañana": ["Exploración del centro histórico", "Visita al mercado local", "Tour cultural matutino", "Caminata por el destino"],
    "tarde":  ["Visita a museos y sitios arqueológicos", "Recorrido por barrios típicos", "Compras de artesanías locales"],
    "noche":  ["Cena de gastronomía local", "Paseo nocturno por la plaza principal", "Espectáculo cultural"],
}


def generate_itinerary(destination: str, days: int, travelers: int = 1, category: str = "moderado") -> list:
    """Genera itinerario con slots mañana/tarde/noche. Retorna lista directa de días."""
    days = int(days)
    dest_key = destination.lower().strip()

    # Buscar coincidencia parcial
    actividades = DEFAULT_ACTIVIDADES
    for city, acts in ACTIVIDADES.items():
        if city in dest_key or dest_key in city:
            actividades = acts
            break

    itinerary = []
    for dia_num in range(1, days + 1):
        idx = dia_num - 1
        itinerary.append({
            "dia": dia_num,
            "destino": destination,
            "slots": {
                "mañana": actividades["mañana"][idx % len(actividades["mañana"])],
                "tarde":  actividades["tarde"][idx % len(actividades["tarde"])],
                "noche":  actividades["noche"][idx % len(actividades["noche"])],
            }
        })

    return itinerary

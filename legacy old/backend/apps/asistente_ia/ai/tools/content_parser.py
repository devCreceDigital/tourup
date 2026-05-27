"""
Content Parser Tool — extrae texto y metadatos de URLs sociales.
TikTok, Instagram, YouTube y blogs genéricos.
"""
import re
import json
import urllib.request
import urllib.parse
import logging

logger = logging.getLogger(__name__)

PERU_DESTINATIONS = [
    "Lima", "Cusco", "Arequipa", "Machu Picchu", "Tarapoto", "Paracas",
    "Iquitos", "Trujillo", "Huaraz", "Puno", "Nazca", "Chiclayo",
    "Mancora", "Piura", "Cajamarca", "Ayacucho", "Valle Sagrado",
]

VIBE_KEYWORDS = {
    "aventura": ["trekking", "hiking", "aventura", "selva", "montaña", "escalada", "rafting"],
    "foodie": ["comida", "restaurante", "gastronomia", "ceviche", "chicha", "pisco", "mercado"],
    "cultura": ["museo", "historia", "inca", "colonial", "arqueologia", "templo", "ruinas"],
    "relax": ["playa", "descanso", "hotel", "spa", "tranquilo", "naturaleza", "laguna"],
    "lujo": ["luxury", "premium", "5 estrellas", "boutique", "exclusivo"],
    "economico": ["barato", "económico", "mochilero", "low cost", "hostal", "presupuesto"],
}

def extract_from_url(url: str) -> dict:
    """
    Extrae texto y metadatos de una URL social o blog.
    Intenta scraping básico sin APIs externas.
    """
    url = url.strip()
    platform = _detect_platform(url)

    try:
        raw_text = _fetch_page_text(url)
    except Exception as e:
        logger.warning(f"[ContentParser] No se pudo fetchear {url}: {e}")
        raw_text = ""

    destinations = _extract_destinations(raw_text + " " + url)
    vibes = _extract_vibes(raw_text)
    duration = _extract_duration(raw_text)

    return {
        "url": url,
        "platform": platform,
        "raw_text": raw_text[:500] if raw_text else "",
        "candidate_destinations": destinations,
        "vibe_tags": vibes,
        "duration_hint": duration,
        "confidence": 0.7 if destinations else 0.3,
    }

def extract_from_text(text: str) -> dict:
    """
    Extrae información de un texto libre del usuario.
    """
    destinations = _extract_destinations(text)
    vibes = _extract_vibes(text)
    duration = _extract_duration(text)

    return {
        "url": None,
        "platform": "text",
        "raw_text": text[:500],
        "candidate_destinations": destinations,
        "vibe_tags": vibes,
        "duration_hint": duration,
        "confidence": 0.9 if destinations else 0.5,
    }

def parse_content_sources(inputs: list) -> dict:
    """
    Procesa lista de URLs y/o texto libre.
    Devuelve content_profile consolidado.
    """
    all_destinations = []
    all_vibes = []
    all_durations = []
    sources = []

    for item in inputs:
        if item.startswith("http"):
            result = extract_from_url(item)
        else:
            result = extract_from_text(item)
        sources.append(result)
        all_destinations.extend(result["candidate_destinations"])
        all_vibes.extend(result["vibe_tags"])
        if result["duration_hint"]:
            all_durations.append(result["duration_hint"])

    # Deduplicate preserving order
    seen = set()
    unique_destinations = [d for d in all_destinations if not (d in seen or seen.add(d))]
    unique_vibes = list(set(all_vibes))

    return {
        "sources": sources,
        "candidate_destinations": unique_destinations,
        "vibe_tags": unique_vibes,
        "duration_hint": all_durations[0] if all_durations else None,
        "primary_destination": unique_destinations[0] if unique_destinations else None,
    }

def _detect_platform(url: str) -> str:
    if "tiktok.com" in url: return "tiktok"
    if "instagram.com" in url: return "instagram"
    if "youtube.com" in url or "youtu.be" in url: return "youtube"
    if "facebook.com" in url: return "facebook"
    return "web"

def _fetch_page_text(url: str) -> str:
    headers = {"User-Agent": "Mozilla/5.0 (compatible; TotemBot/1.0)"}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=8) as resp:
        html = resp.read().decode("utf-8", errors="ignore")
    # Strip HTML tags
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"\s+", " ", text)
    return text[:2000]

def _extract_destinations(text: str) -> list:
    text_lower = text.lower()
    found = []
    for dest in PERU_DESTINATIONS:
        if dest.lower() in text_lower:
            found.append(dest)
    return found

def _extract_vibes(text: str) -> list:
    text_lower = text.lower()
    found = []
    for vibe, keywords in VIBE_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            found.append(vibe)
    return found

def _extract_duration(text: str) -> str | None:
    patterns = [
        r"(\d+)\s*días?",
        r"(\d+)\s*noches?",
        r"(\d+)\s*semanas?",
        r"(\d+)\s*days?",
    ]
    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            num = int(match.group(1))
            if "semana" in pattern:
                num = num * 7
            return f"{num} días"
    return None

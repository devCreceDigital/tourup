from dataclasses import dataclass
from datetime import date
from typing import Callable, List

from django.db import connection

from apps.asistente_ia.ai.llm.openrouter_client import openrouter_client


@dataclass
class MatchResult:
    trip_id: str
    company_id: str
    itinerary_id: str
    agency_name: str
    agency_rating: float | None
    trip_name: str
    duration_days: int
    next_departure: str
    price_from: float
    currency: str
    available_seats: int
    match_score: float
    semantic_score: float
    highlights: list[str]


def availability_score(seats: int, group_size: int | None) -> float:
    if group_size and seats >= group_size:
        return 1.0
    if seats > 5:
        return 0.8
    if seats > 0:
        return 0.5
    return 0.0


def plan_score(company_plan: str) -> float:
    return {"premium": 1.0, "standard": 0.7, "basic": 0.4}.get(company_plan, 0.5)


def final_match_score(semantic: float, availability: float, plan: float) -> float:
    value = (semantic * 0.60) + (availability * 0.25) + (plan * 0.15)
    return max(0.0, min(1.0, value))


def build_query_text(intent) -> str:
    parts = []
    if getattr(intent, "destination", None):
        parts.append(f"Destino: {intent.destination}")
    if getattr(intent, "duration", None):
        parts.append(f"Duración: {intent.duration}")
    if getattr(intent, "group_type", None):
        parts.append(f"Grupo: {intent.group_type}")
    if getattr(intent, "budget_range", None):
        parts.append(f"Presupuesto: {intent.budget_range}")
    if getattr(intent, "interests", None):
        parts.append(f"Intereses: {', '.join(intent.interests)}")
    if getattr(intent, "departure_month", None):
        parts.append(f"Período: {intent.departure_month}")
    return ". ".join(parts)


class RAGEngine:
    def _normalize_row(self, row):
        """
        Soporta formato actual (8 columnas) y formato legacy usado en tests (7 columnas).
        """
        if len(row) >= 8:
            return {
                "trip_id": row[0],
                "company_id": row[1],
                "trip_name": row[2],
                "available_seats": row[3],
                "next_departure": row[4],
                "itinerary_id": row[5],
                "agency_name": row[6],
                "semantic_score": row[7],
            }
        if len(row) == 7:
            return {
                "trip_id": row[0],
                "company_id": "",
                "trip_name": row[1],
                "available_seats": row[2],
                "next_departure": row[3],
                "itinerary_id": row[4],
                "agency_name": row[5],
                "semantic_score": row[6],
            }
        raise ValueError("Formato de fila no soportado en RAGEngine")

    def search_matches(
        self,
        intent,
        embed_fn: Callable[[str], list[float]] | None = None,
        limit: int = 3,
    ) -> List[MatchResult]:
        query_text = build_query_text(intent)
        if embed_fn is None:
            embed_fn = openrouter_client.generate_embedding
        query_vector = embed_fn(query_text) if embed_fn else []
        if not query_vector:
            return []

        # Hybrid Search approach: Vector similarity + Metadata filtering
        sql = """
        SELECT
          v.id::text AS trip_id,
          v.tenant_id::text AS company_id,
          COALESCE(v.nombre, '') AS trip_name,
          COALESCE(v.cupo_maximo, 0) AS available_seats,
          v.fecha_inicio AS next_departure,
          COALESCE(v.itinerario_id::text, '') AS itinerary_id,
          COALESCE(t.nombre, 'Agencia') AS agency_name,
          COALESCE(1 - (v.embedding <=> %s::vector), 0) AS semantic_score
        FROM viajes v
        LEFT JOIN tenants t ON t.id = v.tenant_id
        WHERE v.status = 'publicado'

          AND v.embedding IS NOT NULL
        """
        
        params = [str(query_vector)]
        
        # SQL Metadata Filtering based on Intent
        if getattr(intent, "destination", None):
            sql += " AND v.nombre ILIKE %s"
            dest_param = f"%{intent.destination}%"
            params.append(dest_param)
            
        sql += " ORDER BY v.embedding <=> %s::vector LIMIT 20"
        params.append(str(query_vector))
        
        results: list[MatchResult] = []
        try:
            with connection.cursor() as cursor:
                # Format vector literal for PostgreSQL
                formatted_params = []
                for p in params:
                    if p.startswith("[") and p.endswith("]"):
                        # Ensure proper vector format
                        formatted_params.append(p)
                    else:
                        formatted_params.append(p)
                        
                cursor.execute(sql, formatted_params)
                rows = cursor.fetchall()

            for row in rows:
                parsed = self._normalize_row(row)
                seats = int(parsed["available_seats"] or 0)
                semantic = float(parsed["semantic_score"] or 0.0)
                availability = availability_score(seats, getattr(intent, "group_size", None))
                score = final_match_score(semantic, availability, plan_score("standard"))
                if score < 0.50:
                    continue
                next_departure = ""
                if isinstance(parsed["next_departure"], date):
                    next_departure = parsed["next_departure"].isoformat()
                elif parsed["next_departure"]:
                    next_departure = str(parsed["next_departure"])

                results.append(
                    MatchResult(
                        trip_id=parsed["trip_id"],
                        company_id=parsed["company_id"],
                        itinerary_id=parsed["itinerary_id"],
                        agency_name=parsed["agency_name"],
                        agency_rating=None,
                        trip_name=parsed["trip_name"],
                        duration_days=0,
                        next_departure=next_departure,
                        price_from=0.0,
                        currency="USD",
                        available_seats=seats,
                        match_score=score,
                        semantic_score=semantic,
                        highlights=[f"Destino sugerido: {getattr(intent, 'destination', '')}".strip()],
                    )
                )
        except Exception:
            return []

        results.sort(key=lambda x: x.match_score, reverse=True)
        return results[:limit]


rag_engine = RAGEngine()

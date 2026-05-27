#!/usr/bin/env python
"""
Genera embeddings para todos los viajes publicados y los persiste en pgvector.
Uso: python manage.py shell -c "from apps.asistente_ia.scripts.embed_batch import main; main()"
"""
import time
from django.db import connection
from apps.asistente_ia.ai.llm.openrouter_client import openrouter_client


def build_viaje_text(viaje: dict) -> str:
    parts = []
    if viaje.get("nombre"):
        parts.append(f"Viaje: {viaje['nombre']}")
    if viaje.get("codigo"):
        parts.append(f"Codigo: {viaje['codigo']}")
    if viaje.get("fecha_inicio") and viaje.get("fecha_fin"):
        parts.append(f"Fechas: {viaje['fecha_inicio']} a {viaje['fecha_fin']}")
    if viaje.get("cupo_maximo"):
        parts.append(f"Cupo maximo: {viaje['cupo_maximo']} personas")
    if viaje.get("descripcion"):
        parts.append(viaje["descripcion"][:300])
    return " | ".join(parts)


def process_viajes(limit: int = 100) -> None:
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT id, tenant_id, nombre, codigo, fecha_inicio, fecha_fin,
                   cupo_maximo, configuracion
            FROM viajes
            WHERE status = 'publicado'
              AND (embedding IS NULL OR embedding::text = '[]')
            LIMIT %s
        """, [limit])
        rows = cursor.fetchall()

    total = len(rows)
    print(f"[embed_batch] {total} viaje(s) sin embedding encontrados.")

    if total == 0:
        print("[embed_batch] Nada que procesar. ¿Hay viajes con status='publicado'?")
        return

    processed = 0
    errors = 0

    for i, row in enumerate(rows):
        viaje = {
            "id": str(row[0]),
            "tenant_id": str(row[1]) if row[1] else None,
            "nombre": row[2] or "",
            "codigo": row[3] or "",
            "fecha_inicio": str(row[4]) if row[4] else "",
            "fecha_fin": str(row[5]) if row[5] else "",
            "cupo_maximo": row[6],
            "descripcion": (row[7] or {}).get("descripcion_corta", "") if isinstance(row[7], dict) else "",
        }

        text = build_viaje_text(viaje)
        print(f"  [{i+1}/{total}] Procesando: {viaje['nombre'][:50]}")

        try:
            # CORRECTO: el método se llama embed(), no generate_embedding()
            vector = openrouter_client.embed(text)

            if not vector:
                print(f"    → SKIP: embedding vacío para '{viaje['nombre']}'")
                errors += 1
                continue

            # pgvector espera el vector como string '[0.1,0.2,...]'
            vector_str = "[" + ",".join(str(round(v, 8)) for v in vector) + "]"

            with connection.cursor() as cursor:
                cursor.execute(
                    "UPDATE viajes SET embedding = %s::vector WHERE id = %s::uuid",
                    [vector_str, viaje["id"]],
                )

            # Log opcional (tabla puede no existir en todos los entornos)
            try:
                with connection.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO asistente_ia_embeddings_log
                            (id, entity_type, entity_id, model_used, dims, created_at)
                        VALUES
                            (gen_random_uuid(), 'viaje', %s::uuid,
                             'openai/text-embedding-3-small', %s, NOW())
                        ON CONFLICT DO NOTHING
                    """, [viaje["id"], len(vector)])
            except Exception:
                pass  # La tabla de log es opcional

            processed += 1
            print(f"    → OK ({len(vector)} dims)")

        except Exception as e:
            print(f"    → ERROR: {e}")
            errors += 1

        # Pausa para no saturar la API de embeddings
        time.sleep(0.25)

    print(f"\n[embed_batch] Completado: {processed} OK, {errors} errores de {total} total.")


def main():
    process_viajes()


if __name__ == "__main__":
    main()

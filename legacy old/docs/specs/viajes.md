# SPEC: Módulo Viajes

> Spec-Driven Development — Fuente de verdad para implementación
> Módulo: `apps/viajes` (backend)
> Fase: MVP Core (P0)

## Endpoints base MVP

```bash
GET    /api/viajes/                 # Listado de viajes
GET    /api/viajes/{id}/            # Detalle de viaje
POST   /api/viajes/{id}/publicar/   # Publicar viaje (solo admin)
```

## Reglas de publicación

- Solo rol `admin` puede publicar.
- Si el viaje ya está en estado `publicado`, la respuesta mantiene `200` con detalle informativo.
- Al publicar, el estado pasa de `borrador` a `publicado`.

## Respuesta esperada al publicar

```json
{
  "id": "uuid",
  "estado": "publicado"
}
```

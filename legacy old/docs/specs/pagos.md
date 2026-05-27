# SPEC: Módulo Pagos

> Spec-Driven Development — Fuente de verdad para implementación
> Módulo: `apps/pagos` (backend)
> Fase: MVP Core (P0)

## Endpoints MVP

```bash
GET  /api/inscripciones/{inscripcion_id}/pagos/
POST /api/inscripciones/{inscripcion_id}/pagos/manual/
GET  /api/pagos/{id}/
```

## Reglas de negocio

- Solo `admin` puede crear pagos manuales.
- `monto` debe ser mayor a `0`.
- `metodo_pago` es obligatorio.
- `estado` permitido para carga manual: `pendiente` o `acreditado`.
- `alumno` solo puede consultar pagos de sus propias inscripciones.

## Request ejemplo (alta manual)

```json
{
  "monto": 150.0,
  "metodo_pago": "efectivo",
  "referencia_externa": "REC-0001",
  "estado": "pendiente",
  "metadata": {
    "origen": "backoffice_admin"
  }
}
```

## Response ejemplo

```json
{
  "id": "uuid",
  "inscripcion": "uuid",
  "cuota": null,
  "monto": "150.00",
  "metodo_pago": "efectivo",
  "referencia_externa": "REC-0001",
  "estado": "pendiente",
  "fecha_pago": null,
  "created_at": "2026-05-03T10:00:00Z"
}
```

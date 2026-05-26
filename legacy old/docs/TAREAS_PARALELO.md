# TAREAS PENDIENTES — Trabajo en paralelo

## Objetivo

Dividir el trabajo del MVP para que dos personas avancen al mismo tiempo:

- **Hacker 1:** Frontend
- **Hacker 2:** Backend

## Reglas de coordinación

- Commits en español con formato: `feat: ...`, `fix: ...`, `chore: ...`
- No tocar archivos críticos sin alineación previa:
  - `backend/core/permissions.py`
  - `backend/apps/usuarios/authentication.py`
  - `frontend/middleware.ts`
  - `frontend/types/index.ts`
- Toda API nueva debe quedar documentada (request/response + errores).
- Cada tarea cerrada debe incluir validación mínima (check/lint/test o prueba manual).

## Hacker 1 — Frontend (Next.js + TS)

### Sprint A (base UI + rutas)

- [ ] Crear layout base backoffice (topbar + sidebar + tabs).
- [ ] Crear página `app/admin/page.tsx` con dashboard placeholder.
- [ ] Crear página `app/viajes/page.tsx` (listado mock).
- [ ] Crear página `app/viajes/[id]/page.tsx` (detalle con tabs).
- [ ] Crear `frontend/lib/api.ts` para cliente API centralizado.
- [ ] Crear `frontend/lib/mockData.ts` para trabajar sin backend completo.

### Sprint B (inscripciones)

- [ ] Crear `app/viajes/[id]/inscripciones/page.tsx`.
- [ ] Implementar `TablaInscritos` con paginación y búsqueda.
- [ ] Implementar `FiltrosInscritos` (estado, pago, documentos).
- [ ] Implementar `DrawerDetalleInscripcion`.
- [ ] Integrar endpoint `GET /api/viajes/{id}/inscripciones/`.

### Sprint C (portal viajero + landing)

- [ ] Crear `app/viajes/[slug]/inscribirse/page.tsx` (wizard 5 pasos).
- [ ] Crear `app/mi-viaje/[id]/page.tsx` (pagos + documentos).
- [ ] Integrar estados visuales (verde/amarillo/rojo) según diseño.
- [ ] Integrar endpoint público `POST /api/public/viajes/{slug}/inscribirse/`.

## Hacker 2 — Backend (Django + DRF)

### Sprint A (base API)

- [ ] Dejar proyecto Django estable con apps de dominio registradas.
- [ ] Configurar DRF base (filtros, búsqueda, ordering, paginación).
- [ ] Crear estructura base de `urls.py` por app.
- [ ] Agregar `healthcheck` en `/health/`.
- [ ] Definir `.env.example` para entorno backend.

### Sprint B (módulo inscripciones)

- [ ] Modelar `Inscripcion` y `DatosSalud` con `managed=False`.
- [ ] Crear serializers de listado/detalle/público.
- [ ] Implementar `GET /api/viajes/{viaje_id}/inscripciones/`.
- [ ] Implementar `POST /api/public/viajes/{slug}/inscribirse/`.
- [ ] Implementar `GET /api/mis-inscripciones/`.
- [ ] Validar reglas: no duplicados, viaje publicado, salud obligatoria.

### Sprint C (viajes, pagos, documentos)

- [ ] Endpoint publicar viaje `POST /api/viajes/{id}/publicar/`.
- [ ] Base de cuotas y pagos manuales (`apps/pagos`).
- [ ] Base de documentos (`apps/documentos`) aprobar/rechazar.
- [ ] Conectar permisos RBAC por rol en viewsets.
- [ ] Agregar tests críticos de inscripciones y pagos.

## Dependencias entre ambos

- Backend entrega primero contrato de:
  - `GET /api/viajes/{id}/inscripciones/`
  - `POST /api/public/viajes/{slug}/inscribirse/`
  - `GET /api/mis-inscripciones/`
- Frontend consume esos endpoints y reporta gaps de payload/errores.

## Checklist de cierre semanal

- [ ] PR Front abierto y enlazado a tareas completadas.
- [ ] PR Backend abierto y enlazado a tareas completadas.
- [ ] Ambas ramas sin errores de arranque local.
- [ ] Documentación actualizada en `docs/specs/`.

# PLAN DE TRABAJO — Backend y Frontend

## Objetivo

Dividir el trabajo del MVP Core en paralelo para avanzar sin bloqueos entre dos roles:

- Dev 1: Backend (Django + DRF)
- Dev 2: Frontend (Next.js + React + TypeScript)

## Reglas de coordinación

- Commits en español con prefijo `feat:`, `fix:`, `chore:`.
- Contrato API acordado antes de implementar pantallas conectadas.
- No modificar archivos críticos sin coordinación:
  - `backend/core/permissions.py`
  - `backend/apps/usuarios/authentication.py`
  - `frontend/middleware.ts`
  - `frontend/types/index.ts`

## Sprint 0 (base técnica)

### Backend

- Crear proyecto Django en `backend/`.
- Registrar apps de dominio: `usuarios`, `catalogo`, `itinerarios`, `viajes`, `inscripciones`, `pagos`, `documentos`, `notificaciones`.
- Configurar DRF base (paginación, filtros, auth JWT Supabase).
- Definir modelos iniciales con `managed=False` y UUID.

### Frontend

- Inicializar Next.js 15 en `frontend/` con TypeScript y Tailwind.
- Crear layout base de backoffice (topbar, sidebar, tabs).
- Configurar `lib/api.ts` y `lib/mockData.ts`.
- Definir rutas base: `app/admin`, `app/viajes`, `app/viajes/[id]`, `app/viajes/[slug]/inscribirse`.

## Sprint 1 (módulos prioritarios)

### Backend (Dev 1)

- `apps/viajes`: CRUD y endpoint de publicación.
- `apps/inscripciones`: listado, detalle, alta pública por slug.
- `apps/pagos`: estructura de plan/cuotas + endpoint de pago manual.
- `apps/documentos`: subir/listar/aprobar/rechazar.

### Frontend (Dev 2)

- Tab de inscripciones admin con filtros y paginación.
- Wizard de inscripción pública en 5 pasos.
- Vista "Mi viaje" con estado de pagos y documentos.
- UI de estados visuales (verde/amarillo/rojo) usando tokens definidos.

## Dependencias entre roles

- Backend entrega primero:
  - `GET /api/viajes/{id}/inscripciones/`
  - `POST /api/public/viajes/{slug}/inscribirse/`
  - `GET /api/mis-inscripciones/`
- Frontend desbloquea backend con feedback de payloads reales y validaciones UX.

## Definition of Done compartida

- Endpoint con permisos RBAC y paginación cuando aplique.
- Pantalla conectada al endpoint (o mock equivalente si falta endpoint).
- Casos de error visibles (validación, auth, permisos).
- Commit documentado en español.

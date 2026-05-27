# AGENTS.md — Totem HUB
> Guía operativa para agentes de IA (Claude Code, Copilot, Codex, etc.)
> Leer completo antes de generar cualquier código.

---

## 🧭 Qué es este proyecto

**Totem HUB** es una plataforma SaaS B2B que digitaliza la gestión operativa de agencias de viajes grupales (escolares, universitarios, corporativos). Tres vistas: Backoffice Admin, Panel Responsable de Grupo y Portal Viajero.

- **Stack Backend:** Django + DRF (Python), Modular Monolith
- **Stack Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Base de datos:** Supabase (PostgreSQL), `managed=False` en modelos Django
- **Auth:** Supabase Auth + JWT
- **Pagos:** MercadoPago (principal), Niubiz (futuro)
- **Email:** Resend (MVP)
- **Docs fuente de verdad:** `docs/MASTER_PROMPT.md`, `docs/specs/`

---

## 📁 Estructura del repo

```
totem-mvp1/
├── AGENTS.md                  ← ESTE ARCHIVO (leer primero)
├── CONTEXT.md                 ← Arquitectura y decisiones técnicas
├── docs/
│   ├── MASTER_PROMPT.md       ← Fuente de verdad del producto
│   └── specs/                 ← Specs SDD por módulo
│       ├── catalogo.md
│       ├── viajes.md
│       ├── inscripciones.md
│       ├── pagos.md
│       ├── documentos.md
│       ├── notificaciones.md
│       └── rooming.md
├── backend/
│   ├── apps/                  ← Una app Django por dominio
│   │   ├── usuarios/
│   │   ├── catalogo/
│   │   ├── itinerarios/
│   │   ├── viajes/
│   │   ├── inscripciones/
│   │   ├── pagos/
│   │   ├── documentos/
│   │   └── notificaciones/
│   ├── core/                  ← Utilidades compartidas (NO modificar sin revisar)
│   └── totem_backend/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── types/
└── docker-compose.yml
```

---

## ⚙️ Entorno de desarrollo

### Levantar el proyecto

```bash
# Levantar todo (backend + frontend + DB)
docker-compose up --build

# Solo backend
cd backend && python manage.py runserver

# Solo frontend
cd frontend && pnpm dev
```

### Variables de entorno requeridas

```bash
# backend/.env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
DATABASE_URL=
RESEND_API_KEY=
MERCADOPAGO_ACCESS_TOKEN=

# frontend/.env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Tests

```bash
# Backend - tests críticos (pagos + inscripciones)
cd backend && python manage.py test apps.pagos apps.inscripciones

# Todos los tests
cd backend && python manage.py test

# Frontend
cd frontend && pnpm test
```

### Linting

```bash
cd frontend && pnpm lint
cd backend && flake8 apps/ core/
```

---

## 📐 Reglas de arquitectura — NO romper

### Backend (Django)

1. **Modular Monolith:** Una Django app por dominio en `backend/apps/`. No mezclar lógica entre apps salvo imports directos. No crear buses de eventos ni abstracciones intermedias.
2. **`managed=False` en todos los modelos.** Las tablas viven en Supabase. Nunca usar `python manage.py migrate` para crear tablas nuevas — usar scripts en `scripts/`.
3. **UUID como PK** en todos los modelos: `id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)`
4. **Auth siempre via Supabase JWT.** Validar en `apps/usuarios/authentication.py`. Nunca usar Django sessions o `request.user` nativo.
5. **Permisos RBAC** en `core/permissions.py`. Aplicar en cada ViewSet. Roles válidos: `admin`, `viajero`.
6. **JSONField** para configuraciones flexibles (no crear columnas para cada parámetro de config).
7. **Paginación** en todos los endpoints de listado usando `core/pagination.py`.
8. Auditoría de acciones críticas (pagos, documentos) usando el patrón `VoucherAuditoria`.

### Frontend (Next.js)

1. **App Router** con Server Components donde sea posible. Solo Client Components cuando se necesite interactividad.
2. **Tipos TypeScript estrictos** definidos en `frontend/types/index.ts`. No usar `any`.
3. **Estados visuales consistentes:** Verde=completo, Amarillo=pendiente, Rojo=faltante/vencido.
4. **Mobile-first y responsive.**
5. **Protección de rutas** en `middleware.ts` basado en rol JWT.
6. **Datos mock** en `lib/mockData.ts` para desarrollo sin backend activo.
7. **Cliente API centralizado** en `lib/api.ts`. No hacer fetch directamente en componentes.
8. **Lucide React** para iconos. **Recharts** para gráficos. No introducir otras librerías de iconos/charts.
9. **Design tokens** definidos en `docs/CONTEXT.md § Design System`. Usar siempre los colores y radios definidos, no valores hardcodeados.
10. Componentes reutilizables en `components/ui/`. Revisar si ya existe antes de crear uno nuevo.

### General

- **Commits en español**, descriptivos: `feat: agregar endpoint de pago manual`, `fix: validación cuota vencida`
- **Variables de entorno** siempre en `.env`. Nunca hardcodear keys, URLs o tokens.
- **No over-engineering:** no crear abstracciones hasta que se necesiten 3+ veces.
- Equipo de 3 devs → priorizar velocidad y legibilidad sobre elegancia arquitectónica.

---

## 🚫 Archivos que NO debes modificar sin aprobación explícita

| Archivo/Directorio | Razón |
|---|---|
| `backend/core/permissions.py` | RBAC crítico para seguridad |
| `backend/apps/usuarios/authentication.py` | Validación JWT Supabase |
| `frontend/middleware.ts` | Protección de rutas |
| `frontend/types/index.ts` | Tipos globales — coordinar cambios |
| `docs/MASTER_PROMPT.md` | Fuente de verdad del producto |
| `docker-compose.yml` | Config de infraestructura |

---

## 🔗 Patrones de referencia

Cuando generes código nuevo, consulta estos archivos como referencia de patrón:

- **ViewSet nuevo:** copiar estructura de `apps/viajes/views.py`
- **Serializer nuevo:** copiar estructura de `apps/viajes/serializers.py`
- **Componente admin:** seguir estructura de `components/admin/`
- **Página con tabs:** seguir patrón de `app/viajes/[id]/page.tsx`
- **Formulario frontend:** seguir `components/admin/CrearViajeWizard.tsx`

---

## 📋 Convenciones de naming

| Elemento | Convención | Ejemplo |
|---|---|---|
| Modelos Django | PascalCase | `PlanPago`, `CuotaPago` |
| Endpoints API | snake_case plural | `/api/planes-pago/` |
| Componentes React | PascalCase | `TablaInscritos` |
| Hooks | camelCase con `use` | `useViajeData` |
| Tipos TS | PascalCase | `EstadoPago`, `Viajero` |
| Variables TS | camelCase | `fechaVencimiento` |
| Commits | feat/fix/chore + español | `feat: módulo rooming drag-and-drop` |

---

## 📌 Estado actual del MVP

**Fase activa: MVP Core (Meses 1-3)**

Módulos P0 en desarrollo:
- [x] Catálogo (destinos, actividades, alojamientos, complementos)
- [x] Itinerarios
- [ ] Viajes (tarifas, complementos, habitaciones, landing)
- [ ] Inscripciones online
- [ ] Pagos online (MercadoPago)
- [ ] Documentación (subida + revisión)
- [ ] Panel admin (KPIs, tabla inscritos)
- [ ] Notificaciones automáticas

Ver roadmap completo en `docs/MASTER_PROMPT.md § 10. ROADMAP`.

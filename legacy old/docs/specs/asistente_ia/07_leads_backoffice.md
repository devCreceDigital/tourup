# Spec 07 — Panel de Leads (Backoffice Agencia)

> SSD: Nueva sección mínima en el backoffice existente. Solo accesible para rol `admin`.

---

## Ruta protegida

```
/backoffice/asistente-ia/leads
→ app/(backoffice)/asistente-ia/leads/page.tsx
Auth: JWT requerido, rol = "admin"
```

---

## Vista 1 — Tabla de leads

```
┌──────────────────────────────────────────────────────────┐
│  Leads de Asistente IA              [Filtro: Todos ▾]    │
├─────────────┬─────────────┬────────┬──────────┬─────────┤
│  Viajero    │  Destino    │  Match │  Estado  │  Fecha  │
├─────────────┼─────────────┼────────┼──────────┼─────────┤
│  [nombre]   │  [destino]  │  94%   │  Nuevo   │  2h     │
│  [nombre]   │  [destino]  │  88%   │  Cont.   │  ayer   │
└─────────────┴─────────────┴────────┴──────────┴─────────┘
```

Filtros: `Todos` | `Nuevo` | `Contactado` | `Convertido`

---

## Vista 2 — Detalle del lead (modal)

```
Nuevo lead de Asistente IA
──────────────────────────────────────────
👤 [Nombre]  ·  [email]
📅 Recibido: [fecha hora]

INTENCIÓN DETECTADA
   Destino:     [valor]      Duración:    [valor]
   Grupo:       [tipo] · [N] personas
   Período:     [valor]      Presupuesto: [valor]
   Intereses:   [lista]

VIAJE CONSULTADO
   [Nombre itinerario] · Match [N]%
   Salida [fecha] · [N] plazas disponibles

MENSAJE DEL VIAJERO
   "[texto libre del viajero]"

[Responder al viajero]     [Marcar como contactado]
──────────────────────────────────────────
```

`[Responder al viajero]` abre el cliente de email del admin con el email pre-rellenado.

---

## Contratos TypeScript

```typescript
// types/asistente_ia.ts — agregar a frontend/types/index.ts
type LeadStatus = "new" | "contacted" | "converted" | "closed"

type LeadRecord = {
  id:             string
  traveler_name:  string
  traveler_email: string
  traveler_msg:   string | null
  intent_data:    {
    destination:    string | null
    duration:       string | null
    group_type:     string | null
    group_size:     number | null
    budget_range:   string | null
    interests:      string[]
    departure_month: string | null
  }
  trip_name:      string
  match_score:    number
  status:         LeadStatus
  created_at:     string   // ISO 8601
}

// components/asistente-ia/LeadsTable.tsx
interface LeadsTableProps {
  leads:          LeadRecord[]
  onSelectLead:   (lead: LeadRecord) => void
  statusFilter:   LeadStatus | "all"
  onFilterChange: (s: LeadStatus | "all") => void
}

// components/asistente-ia/LeadDetailModal.tsx
interface LeadDetailModalProps {
  lead:            LeadRecord | null
  isOpen:          boolean
  onClose:         () => void
  onMarkContacted: (leadId: string) => void
}
```

---

## Endpoints del backoffice (backend)

```python
# apps/asistente_ia/urls.py — agregar
path("agency/leads/",              AgencyLeadsListView.as_view(),   name="agency-leads-list"),
path("agency/leads/<uuid:pk>/",    AgencyLeadDetailView.as_view(),  name="agency-lead-detail"),
path("agency/leads/<uuid:pk>/status/", LeadStatusUpdateView.as_view(), name="lead-status-update"),
```

**GET `/api/asistente-ia/agency/leads/`**
- Requiere JWT con rol `admin`
- Filtra automáticamente por `company_id` del admin autenticado (multi-tenant)
- Query param: `?status=new|contacted|converted|all`
- Paginado con `core/pagination.py` (25 por página)

**PATCH `/api/asistente-ia/agency/leads/{id}/status/`**
- Body: `{"status": "contacted"}`
- Solo el admin de la agencia dueña puede actualizar

---

## Badge en sidebar

```typescript
// Polling cada 60s para el conteo de leads nuevos
const { data } = useSWR(
  "/api/asistente-ia/agency/leads/?status=new&page_size=1",
  fetcher,
  { refreshInterval: 60_000 }
)
// Mostrar badge numérico en el ítem del sidebar si count > 0
```

---

## Email de notificación (LeadNotifier)

Enviado en `POST /api/asistente-ia/leads/` al crear el lead:

```
Asunto: "Nuevo lead de Asistente IA — [nombre viajero]"
Destinatario: email del admin de la agencia
Proveedor: Resend (ya configurado en el proyecto)
```

En MVP: envío síncrono. En v1.5: mover a tarea asíncrona (Celery).

---

## Criterios de aceptación

- [ ] Solo admins ven los leads de su propia agencia (aislamiento multi-tenant)
- [ ] Filtro por estado funciona sin recargar página
- [ ] PATCH de estado actualiza la fila en tabla inmediatamente (optimistic update)
- [ ] Badge del sidebar muestra conteo de leads nuevos (polling 60s)
- [ ] Email llega a la agencia en < 30 segundos tras crear el lead
- [ ] Paginación activa: 25 leads por página

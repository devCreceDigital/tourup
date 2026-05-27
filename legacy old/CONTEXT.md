# CONTEXT.md — Arquitectura y Decisiones Técnicas
> Referencia rápida para agentes de IA sobre el sistema completo.
> Para el PRD completo ver `docs/MASTER_PROMPT.md`.

---

## 1. Decisión Arquitectónica

**Patrón:** Modular Monolith (Monolito Modular con Django apps)
**Por qué:** Equipo de 3 devs + MVP en validación. Microservicios introducen complejidad innecesaria ahora. Cada módulo ya está aislado para extracción futura (Fase 4+).

**Regla clave:** apps se comunican por imports directos Python. Sin buses de eventos, sin colas, sin REST entre módulos internos.

---

## 2. Stack completo

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS |
| Backend | Django + DRF (Python), Modular Monolith |
| Base de datos | Supabase (PostgreSQL), `managed=False` |
| Auth | Supabase Auth + JWT |
| Storage | Supabase Storage / AWS S3 |
| Pagos | MercadoPago (activo), Niubiz (futuro) |
| Email | Resend (MVP) → SendGrid/SES (futuro) |
| Charts | Recharts |
| Icons | Lucide React |
| Infra | Docker + docker-compose |

---

## 3. Módulos del sistema (Bounded Contexts)

| App Django | Dominio | Estado |
|---|---|---|
| `apps/usuarios` | Auth, perfiles, roles RBAC | 📋 Pendiente |
| `apps/catalogo` | Destinos, actividades, alojamientos, complementos | 📋 Pendiente |
| `apps/itinerarios` | Itinerarios día a día, versiones, eventos | 📋 Pendiente |
| `apps/viajes` | Viajes, tarifas, habitaciones, docs requeridos, landing | 📋 Pendiente |
| `apps/inscripciones` | Registro viajeros, datos salud | 📋 Pendiente|
| `apps/pagos` | Cuotas, pagos online/manual, pasarela | 📋 Pendiente |
| `apps/documentos` | Subida, revisión, aprobación/rechazo | 📋 Pendiente |
| `apps/notificaciones` | Plantillas, campañas, automáticas | 📋 Pendiente |

---

## 4. Roles y permisos RBAC

| Rol | Alias en código | Capacidades |
|---|---|---|
| `admin` | Admin de Agencia | CRUD completo, aprobación docs, pagos manuales, campañas, reportes |
| `profesor` | Responsable de Grupo | Solo lectura de su grupo, exportar PDF, sin datos de salud |
| `alumno` | Viajero | Ver su inscripción, pagar cuotas, subir documentos, ver itinerario |

Implementación: `core/permissions.py` → clases `IsAdmin`, `IsProfesor`, `IsAlumnoOwner`

---

## 5. Modelos de datos actuales

```python
# Implementados (managed=False, tablas en Supabase)

Viaje:           id(UUID), nombre, estado, fecha_inicio, cupos, responsable, configuracion(JSON), created_at
Reserva:         id(UUID), codigo(unique), cliente, viaje(FK), pax, monto, estado, created_at
Viajero:         id(UUID), nombre, grupo, pago, documentos, created_at
Perfil:          id(UUID→auth.users), email, nombre, rol, created_at
VoucherAuditoria: id(UUID), reserva(FK), accion, archivo_path, archivo_nombre, mime_type, file_size, actor_user_id, actor_email, created_at
```

```python
# Pendientes de implementar — ver docs/specs/ para detalle completo

# CATÁLOGO
Destino, Actividad, Alojamiento, Complemento

# ITINERARIOS
Itinerario, DiaItinerario, EventoItinerario

# VIAJES (ampliación)
ViajeComplemento, ViajeHabitacion, ViajeDocumentoRequerido, ViajeLandingContenido

# INSCRIPCIONES
Inscripcion, DatosSalud

# PAGOS
PlanPago, Cuota, PagoCuota, PagoComplemento

# DOCUMENTACIÓN
DocumentoViajero

# ROOMING (Fase 2)
Habitacion, AsignacionHabitacion

# NOTIFICACIONES
PlantillaEmail, CampañaNotificacion, NotificacionAutomatica

# WALLET/MECENAS (Fase 3)
WalletViajero, MovimientoWallet, Donacion, ProductoTienda
```

---

## 6. Endpoints API actuales

```
# Implementados
GET/POST    /api/viajes/
GET/PUT/DEL /api/viajes/{id}/
GET/POST    /api/reservas/
GET/PUT/DEL /api/reservas/{id}/
GET/POST    /api/viajeros/
GET/PUT/DEL /api/viajeros/{id}/
GET/POST    /api/perfiles/
GET/PUT/DEL /api/perfiles/{id}/
GET/POST    /api/auditoria/
GET         /api/admin/users
GET/PUT     /api/admin/users/{id}
GET         /api/admin/security/summary
```

Ver `docs/MASTER_PROMPT.md § 3.4` para endpoints pendientes por módulo.

---

## 7. Tipos TypeScript globales

Definidos en `frontend/types/index.ts`. Los más usados:

```typescript
type EstadoPago       = "pendiente" | "parcial" | "completo"
type EstadoDocumentos = "completo" | "incompleto" | "faltante" | "pendiente"
type EstadoViaje      = "borrador" | "confirmado" | "publicado" | "en_operacion" | "cerrado" | "cancelado"
type EstadoInscripcion = "pre_inscrito" | "pendiente_pago" | "confirmado" | "cancelado"
type EstadoCuota      = "pendiente" | "pagada" | "vencida"
type AppRole          = "admin" | "profesor" | "alumno"

type Viaje, Viajero, Reserva, Cuota, DocumentoViajero, Perfil
type Itinerario, DiaItinerario, EventoItinerario
type DashboardKPIs
```

---

## 8. Design System

### Colores

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-primary` | `#5B4FE8` | Botones, tabs activos, enlaces |
| `--color-accent` | `#00D4C8` | Badges activos, CTAs secundarios |
| `--color-dark-navy` | `#1E1B4B` | Sidebar, headers de sección |
| `--color-banner` | `#2D2D6E` | Trip banner |
| `--color-bg` | `#F4F5F7` | Fondo general |
| `--color-bg-card` | `#FFFFFF` | Cards |
| `--color-border` | `#E0E4EF` | Bordes |
| `--color-text` | `#1A1A2E` | Texto principal |
| `--color-success` | `#1A8A4A` | Completo / aprobado |
| `--color-warning` | `#F59E0B` | Pendiente / parcial |
| `--color-danger` | `#EF4444` | Faltante / rechazado / vencido |

### Componentes UI base

```
Badge:   píldora, padding 3px 10px, border-radius 10px
Button:  padding 7px 14px, border-radius 6px, font-weight 600
Card:    bg white, border 1px #E0E4EF, border-radius 8px
Table:   header bg #F5F6FB, rows hover #FAFBFF
Input:   border 1px #D0D4E4, border-radius 6px, padding 7px 12px
```

### Layout Backoffice

```
Topbar (blanco, border-bottom)
  └── Sidebar 72px (#1E1B4B) + Contenido principal
        └── Trip Banner (#2D2D6E)
              └── Nav Tabs (Viaje, Config, Descripción, Tarifas, Inscripciones, Pagos, Docs, Rooming)
                    └── Contenido del tab activo
```

---

## 9. Flujos clave

**Admin crea viaje:** Login → Viajes → Crear → Itinerario base → Nombre/fechas/slug → Habitaciones → Plan de pagos → Complementos → Docs requeridos → Landing → Publicar

**Viajero se inscribe:** URL pública → Navegar itinerario → Inscribirme → Crear cuenta → Datos personales + salud → Habitación → Plan de pagos → Pagar cuota inicial → Email confirmación → Área privada

**Gestión documental:** Viajero sube → Estado "en revisión" → Admin previsualiza → Aprueba o rechaza (con motivo) → Notificación al viajero → Dashboard muestra % completitud


---

## 10. KPIs de éxito (Q1)

- 50 agencias activas
- 150 viajes creados/mes
- 3,000 inscripciones/mes
- Tasa conversión landing→inscripción: 15%
- Tiempo creación viaje: < 2h
- NPS: 35

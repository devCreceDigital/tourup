# 🧭 TOTEM HUB — Prompt Maestro del Proyecto

> **Documento de referencia integral para desarrollo Backend y Frontend**
> Versión: 2.0 | Fecha: Mayo 2026 | Product Manager: Juan Ayquipa Abarca

---

## 1. VISIÓN DEL PRODUCTO

ToThem HUB (también referido como "Totem Hub" o "Grupista") es una **plataforma SaaS B2B** que digitaliza de extremo a extremo la gestión operativa y comercial de agencias que organizan **viajes grupales** (escolares, universitarios, corporativos, deportivos y de bienestar).

### Problema que resuelve

Las agencias de viajes grupales operan con herramientas fragmentadas: Excel para presupuestos, emails para inscripciones, transferencias bancarias manuales, PDFs estáticos para itinerarios y llamadas para recordatorios. Esto genera:

- **Ineficiencia operativa:** 60-70% del tiempo en tareas administrativas repetitivas.
- **Errores humanos:** Asignación incorrecta de habitaciones, pérdida de documentos.
- **Experiencia de usuario deficiente:** Sin visibilidad en tiempo real.
- **Escalabilidad limitada:** Imposible gestionar más de 5-8 viajes simultáneos.

### Solución

Centralizar toda la operación en una plataforma web con **tres vistas diferenciadas**:

1. **Backoffice de agencia (Admin):** Catálogos, itinerarios, viajes, inscripciones, pagos, documentos, rooming, transporte.
2. **Panel del responsable de grupo:** Vista consolidada de inscritos, pagos, documentación, rooming.
3. **Portal del viajero:** Inscripción online, pago digital fraccionado, subida de documentos, itinerario.

### Mercado objetivo

Agencias especializadas en viajes grupales en España y Latinoamérica con facturación anual entre €200K-€5M, gestionando 15-100 viajes/año con grupos de 20-150 participantes.

---

## 2. USER PERSONAS

### 2.1 Admin de Agencia — "Laura"

| Campo | Detalle |
|-------|---------|
| Edad | 32 años |
| Rol | Responsable de operaciones en agencia de viajes grupales escolares |
| Contexto | Gestiona 25-35 viajes escolares/año (grupos de 40-80 estudiantes). Usa Excel, Google Forms, emails y llamadas. Dedica 15-20 horas semanales a tareas administrativas. |
| Jobs to be Done | Crear itinerarios reutilizables en <30 min. Publicar viajes con landing + inscripción online en <1h. Controlar pagos, documentación y ocupación en tiempo real. Generar listados automáticos para proveedores en <5 min. Enviar recordatorios masivos. |
| Frustraciones | "Pierdo 2h diarias consolidando pagos." "Siempre hay algún documento perdido." "Debo buscar info en 5 archivos distintos." |
| Métricas éxito | Reducir tiempo operativo de 40h a 15h por viaje. Cero errores en rooming y documentación. Responder consultas en <2 min. |

### 2.2 Responsable de Grupo — "Miguel"

| Campo | Detalle |
|-------|---------|
| Edad | 45 años |
| Rol | Profesor de secundaria, coordinador de viaje de estudios |
| Contexto | Coordina viaje de fin de curso. No es experto en logística turística. Depende de la agencia para obtener información. |
| Jobs to be Done | Ver listado actualizado de inscritos y pagos. Identificar alumnos con documentación pendiente. Revisar rooming list. Acceder a itinerario desde móvil. |
| Frustraciones | "Cada vez que un padre pregunta por pagos debo llamar a la agencia." "Me entero de problemas de documentación el día antes." |
| Métricas éxito | Responder consultas en tiempo real. Identificar issues con 15+ días de antelación. Validar rooming sin reuniones presenciales. |

### 2.3 Viajero — "Carla"

| Campo | Detalle |
|-------|---------|
| Edad | 17 años |
| Rol | Estudiante de bachillerato |
| Contexto | Nativa digital, espera experiencia fluida similar a e-commerce. Sus padres exigen transparencia en pagos. |
| Jobs to be Done | Inscribirse en <10 min desde móvil. Pagar cuotas online. Subir documentos desde el teléfono. Ver itinerario, rooming y detalles. |
| Métricas éxito | Completar inscripción + pago en <15 min. Confirmación instantánea. Cero fricción en documentos. |

### 2.4 Mecenas — Padre/Familiar (Fase futura)

Persona que desea colaborar económicamente con el viaje del menor. Dona dinero o compra productos donde parte del importe beneficia al viajero.

---

## 3. ARQUITECTURA TÉCNICA

### 3.0 Decisión Arquitectónica: Modular Monolith

**Patrón elegido:** Modular Monolith (Monolito Modular)
**Equipo:** 3 desarrolladores
**Razón:** Con un equipo de 3 personas y un MVP en validación, la Hexagonal o microservicios introducen complejidad innecesaria (ports, adapters, buses de eventos). Django ya provee un sistema de apps que funciona como monolito modular de forma natural. Cada módulo de dominio vive en su propia Django app con modelos, serializers, views y URLs independientes, pero comparten la misma base de datos y se comunican por imports directos.

**Principios:**
- Una Django app por dominio funcional (catálogo, viajes, pagos, etc.)
- Cada app es autónoma: sus propios models, serializers, views, urls
- Comunicación entre apps por imports directos (sin buses ni eventos)
- Un solo proyecto Django, un solo deploy, una sola base de datos
- Si en el futuro (Fase 4+, equipo de 8+) se necesita extraer un módulo a microservicio, ya está aislado

**Evolución planificada:**
- MVP (ahora): Modular Monolith con Django apps
- Fase 4+ (equipo 8+): Evaluar extracción a microservicios si hay cuellos de botella reales

### 3.1 Stack Tecnológico

| Capa | Tecnología | Notas |
|------|-----------|-------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS | SSR para landing públicas |
| **Backend** | Django + Django REST Framework (Python) | Modular Monolith: una app Django por dominio |
| **Base de datos** | Supabase (PostgreSQL) | Multi-tenant, managed = False en modelos |
| **Autenticación** | Supabase Auth + JWT | Con middleware de roles |
| **Almacenamiento** | Supabase Storage / AWS S3 | Para documentos e imágenes |
| **Pasarelas de pago** | MercadoPago, Niubiz (futuro: Stripe, PayPal) | Para mercado peruano/latam |
| **Email transaccional** | Resend (MVP), luego SendGrid/AWS SES | Confirmaciones y recordatorios |
| **Notificaciones** | Telegram/WhatsApp (futuro) | Para responsables y viajeros |
| **Infraestructura** | Docker + docker-compose | Containerizado |
| **Charts** | Recharts | Dashboards y visualizaciones |
| **Icons** | Lucide React | Iconografía consistente |

### 3.2 Estructura del Proyecto

```
totem-mvp1/
├── backend/
│   ├── apps/                          # ← MODULAR MONOLITH: una app por dominio
│   │   ├── usuarios/                  # Auth, perfiles, roles
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   ├── urls.py
│   │   │   └── authentication.py      # Validación JWT Supabase
│   │   ├── catalogo/                  # Destinos, actividades, alojamientos, complementos
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   ├── itinerarios/               # Itinerarios, días, eventos
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   ├── viajes/                    # Viajes, tarifas, config, landing
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   ├── inscripciones/             # Registro de viajeros, datos salud
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   ├── pagos/                     # Cuotas, pagos online/manuales, pasarela
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   ├── documentos/                # Subida, validación, checklist
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   └── notificaciones/            # Plantillas, campañas, automáticas
│   │       ├── models.py
│   │       ├── serializers.py
│   │       ├── views.py
│   │       └── urls.py
│   ├── core/                          # Utilidades compartidas
│   │   ├── permissions.py             # Permisos RBAC reutilizables
│   │   ├── pagination.py              # Paginación estándar
│   │   ├── mixins.py                  # Mixins comunes (audit, soft-delete)
│   │   └── utils.py                   # Helpers generales
│   ├── totem_backend/
│   │   ├── settings.py                # INSTALLED_APPS incluye todas las apps
│   │   └── urls.py                    # Incluye urls de cada app con prefijo
│   └── manage.py
├── frontend/
│   ├── app/
│   │   ├── page.tsx           # Landing pública del viaje
│   │   ├── login/page.tsx     # Login con Supabase Auth
│   │   ├── registro/page.tsx  # Registro de viajeros
│   │   ├── admin/page.tsx     # Dashboard admin (backoffice agencia)
│   │   └── viajes/
│   │       ├── page.tsx       # Listado de viajes
│   │       └── [id]/page.tsx  # Detalle de viaje
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AIAssistant.tsx       # Agente IA asistente
│   │   │   └── CrearViajeWizard.tsx  # Wizard de creación de viaje
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── ui/
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Table.tsx
│   │   └── FormularioContacto.tsx
│   ├── lib/
│   │   ├── api.ts             # Cliente API
│   │   ├── mockData.ts        # Datos simulados
│   │   ├── auth/
│   │   │   └── roles.ts       # Gestión de roles RBAC
│   │   └── supabase/
│   │       ├── client.ts      # Cliente Supabase (browser)
│   │       ├── server.ts      # Cliente Supabase (server)
│   │       ├── env.ts         # Variables de entorno
│   │       └── middleware.ts  # Middleware auth
│   ├── middleware.ts          # Next.js middleware (protección de rutas)
│   └── types/
│       └── index.ts           # Tipos TypeScript globales
├── scripts/
│   ├── create-tables.js       # Crear tablas en Supabase
│   ├── create-admin.js        # Crear usuario admin
│   ├── check-db.js            # Verificar conexión DB
│   ├── test-insert.js         # Test de inserción
│   └── read-pdf.js            # Lector de PDFs
├── docker-compose.yml
├── Dockerfile
└── package.json
```

### 3.3 Modelos de Datos (Backend)

```python
# MODELOS ACTUALES (managed=False → tablas en Supabase)

class Viaje:
    id: UUID (PK, auto)
    nombre: CharField(255)
    estado: CharField(50) # borrador | confirmado | publicado | en_operacion | cerrado | cancelado
    fecha_inicio: DateField (nullable)
    cupos: IntegerField (default=0)
    responsable: CharField(255, nullable)
    configuracion: JSONField (nullable)  # Config flexible del viaje
    created_at: DateTimeField (auto)

class Reserva:
    id: UUID (PK, auto)
    codigo: CharField(50, unique)
    cliente: CharField(255)
    viaje: FK → Viaje (nullable)
    pax: IntegerField (default=1)
    monto: DecimalField(10,2)
    estado: CharField(50)  # cotizacion | confirmada | cancelada
    created_at: DateTimeField (auto)

class Viajero:
    id: UUID (PK, auto)
    nombre: CharField(255)
    grupo: CharField(255)
    pago: CharField(50)       # pendiente | parcial | completo
    documentos: CharField(50) # pendiente | incompleto | completo | faltante
    created_at: DateTimeField (auto)

class Perfil:
    id: UUID (PK)  # Linked to Supabase auth.users
    email: EmailField (nullable)
    nombre: CharField(255, nullable)
    rol: CharField(50)  # admin | viajero
    created_at: DateTimeField (auto)

class VoucherAuditoria:
    id: UUID (PK, auto)
    reserva: FK → Reserva (nullable)
    accion: CharField(50)         # upload | delete
    archivo_path: CharField(500)
    archivo_nombre: CharField(255)
    mime_type: CharField(100, nullable)
    file_size: BigIntegerField (nullable)
    actor_user_id: UUIDField (nullable)
    actor_email: EmailField (nullable)
    created_at: DateTimeField (auto)
```

#### Modelos a implementar (PRD completo)

```
# CATÁLOGO
Destino: nombre, país, descripción, coordenadas_gps, url_video, enlaces, imágenes[], estado
Actividad: nombre, descripción, categoría, localización, proveedor, destinos[], imágenes[], horarios
Alojamiento: nombre, tipo, categoría, destino, contacto, dirección, imágenes[], estado
Complemento: nombre, tipo(seguro|menú|actividad_extra|producto), descripción, proveedor, documentos[]

# ITINERARIOS
Itinerario: nombre, descripción, versión, destinos[]
DiaItinerario: itinerario, numero_dia, título, resumen, alojamiento_pernocta
EventoItinerario: dia, tipo(texto_libre|actividad_catalogo), actividad_id, hora_inicio, hora_fin, descripción

# VIAJES (ampliación)
ViajeComplemento: viaje, complemento, precio_unitario, nombre_override, obligatorio, estado
ViajeHabitacion: viaje, tipo, cupo, suplemento_precio
ViajeDocumentoRequerido: viaje, nombre, tipo, obligatorio, fecha_limite, modo_validacion
ViajeLandingContenido: viaje, titulo_comercial, descripcion_breve, descripcion_larga, imagenes[], faqs[]

# INSCRIPCIONES (ampliación)
Inscripcion: viajero, viaje, datos_personales{}, datos_salud{}, tipo_habitacion, estado, fecha
DatosSalud: alergias, tratamientos, dieta_especial, movilidad_reducida, contacto_emergencia

# PAGOS (ampliación)
PlanPago: viaje, moneda
Cuota: plan_pago, nombre, monto, fecha_vencimiento, obligatoria
PagoCuota: inscripcion, cuota, monto_pagado, metodo_pago, referencia, estado, fecha
PagoComplemento: inscripcion, complemento, monto, estado

# DOCUMENTACIÓN
DocumentoViajero: inscripcion, documento_requerido, archivo_url, estado(pendiente|en_revision|aprobado|rechazado), motivo_rechazo

# ROOMING
Habitacion: alojamiento, codigo, tipo, capacidad, genero_permitido, estado
AsignacionHabitacion: habitacion, inscripcion, confirmada

# TRANSPORTE (Fase 3)
Ruta: viaje, etiqueta, tipo_vehiculo, fecha_hora_salida, fecha_hora_llegada
Asiento: ruta, numero, piso, tipo(ventana|pasillo|central), estado
AsignacionAsiento: asiento, inscripcion

# COMUNICACIÓN
PlantillaEmail: nombre, asunto, cuerpo_html, variables[], categoría
CampañaNotificacion: viaje, plantilla, segmento, estado_envio, fecha_programada
NotificacionAutomatica: evento_trigger, plantilla, activa

# WALLET / MECENAS (Fase 3)
WalletViajero: inscripcion, saldo
MovimientoWallet: wallet, tipo, monto, origen, fecha
Donacion: viajero, mecenas_nombre, mecenas_email, monto, mensaje, publica, fecha
ProductoTienda: nombre, descripcion, proveedor, valor_nominal
ProductoTiendaViaje: producto, viaje, precio_venta, beneficio_viajero, comision_agencia

# REPORTES
ExportacionPersonalizada: viaje, origen_datos, campos_seleccionados[], filtros{}, formato
```

### 3.4 API REST (Endpoints actuales)

```
# Router DRF
GET/POST    /api/viajes/              # Listar/Crear viajes
GET/PUT/DEL /api/viajes/{id}/         # Detalle/Editar/Eliminar viaje
GET/POST    /api/reservas/            # Listar/Crear reservas
GET/PUT/DEL /api/reservas/{id}/       # Detalle/Editar/Eliminar reserva
GET/POST    /api/viajeros/            # Listar/Crear viajeros
GET/PUT/DEL /api/viajeros/{id}/       # Detalle/Editar/Eliminar viajero
GET/POST    /api/perfiles/            # Listar/Crear perfiles
GET/PUT/DEL /api/perfiles/{id}/       # Detalle/Editar/Eliminar perfil
GET/POST    /api/auditoria/           # Listar/Crear auditoría
GET/PUT/DEL /api/auditoria/{id}/      # Detalle/Editar/Eliminar auditoría

# Vistas custom
GET         /api/admin/users          # Listar usuarios (admin)
GET/PUT     /api/admin/users/{id}     # Detalle usuario (admin)
GET         /api/admin/security/summary # Resumen seguridad
```

#### Endpoints a implementar (por módulo)

```
# CATÁLOGO
/api/destinos/              CRUD + filtros por país, estado
/api/actividades/           CRUD + filtros por destino, categoría
/api/alojamientos/          CRUD + filtros por destino, tipo
/api/complementos/          CRUD + filtros por tipo

# ITINERARIOS
/api/itinerarios/           CRUD + clonar
/api/itinerarios/{id}/dias/ CRUD días + eventos

# VIAJES (ampliación)
/api/viajes/{id}/tarifas/           Plan de pagos y cuotas
/api/viajes/{id}/complementos/     Complementos activados con precio
/api/viajes/{id}/habitaciones/     Tipos de habitación
/api/viajes/{id}/documentos-req/   Documentos requeridos
/api/viajes/{id}/landing/          Contenido landing pública
/api/viajes/{id}/publicar/         POST → cambiar estado a publicado
/api/viajes/{id}/dashboard/        GET → KPIs del viaje

# INSCRIPCIONES
/api/viajes/{id}/inscripciones/    Listar inscritos + acciones masivas
/api/inscripciones/{id}/           Detalle inscripción
/api/inscripciones/{id}/salud/     Datos de salud

# PAGOS
/api/inscripciones/{id}/pagos/     Pagos del viajero
/api/inscripciones/{id}/pagar/     Iniciar pago online (pasarela)
/api/pagos/manuales/               Registrar pago manual (admin)
/api/viajes/{id}/resumen-pagos/    Resumen financiero del viaje

# DOCUMENTACIÓN
/api/inscripciones/{id}/documentos/     Documentos del viajero
/api/documentos/{id}/aprobar/           POST → aprobar
/api/documentos/{id}/rechazar/          POST → rechazar con motivo
/api/viajes/{id}/docs-pendientes/       Listado de pendientes

# ROOMING
/api/viajes/{id}/habitaciones/          Inventario de habitaciones
/api/viajes/{id}/rooming/               Asignaciones
/api/viajes/{id}/rooming/auto/          POST → autoasignación
/api/viajes/{id}/rooming/exportar-pdf/  GET → PDF para hotel

# NOTIFICACIONES
/api/plantillas-email/                  CRUD plantillas
/api/viajes/{id}/campanas/              Crear/enviar campañas
/api/viajes/{id}/recordatorios/         Recordatorios automáticos

# LANDING PÚBLICA (sin auth)
/api/public/viajes/{slug}/              GET → info del viaje
/api/public/viajes/{slug}/inscribirse/  POST → nueva inscripción
```

### 3.5 Autenticación y Roles (RBAC)

```typescript
// Roles del sistema
type AppRole = "admin" | "viajero";

// Permisos por rol:
// admin (Admin de Agencia):
//   - CRUD completo en todos los módulos
//   - Gestión de usuarios y perfiles
//   - Configuración de viajes, tarifas, complementos
//   - Aprobación/rechazo de documentos
//   - Registro de pagos manuales
//   - Envío de campañas de notificaciones
//   - Exportaciones y reportes
//   - Gestión de rooming

// profesor (Responsable de Grupo):
//   - Vista de solo lectura de inscritos de su grupo
//   - Ver estado de pagos y documentos (sin datos de salud)
//   - Exportar listado en PDF
//   - Recibir alertas de vencimientos
//   - Ajustar notificaciones de su grupo

// alumno (Viajero):
//   - Ver su inscripción y datos personales
//   - Pagar cuotas online
//   - Subir documentos
//   - Contratar complementos opcionales
//   - Ver itinerario y rooming asignado
```

---

## 4. SISTEMA DE DISEÑO (Design Tokens)

### 4.1 Paleta de Colores

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-primary` | `#5B4FE8` (violeta índigo) | Botones, tabs activos, enlaces, badges activos |
| `--color-accent` | `#00D4C8` (teal/turquesa) | Badges activos, highlights, CTAs secundarios |
| `--color-dark-navy` | `#1E1B4B` | Sidebar, headers de sección |
| `--color-banner` | `#2D2D6E` | Trip banner, headers de viaje |
| `--color-bg` | `#F4F5F7` (gris claro) | Fondo general del contenido |
| `--color-bg-card` | `#FFFFFF` | Fondo de cards |
| `--color-border` | `#E0E4EF` | Bordes de cards y separadores |
| `--color-text` | `#1A1A2E` | Texto principal |
| `--color-text-secondary` | `#6B7280` | Texto secundario, labels |
| `--color-text-muted` | `#888888` | Labels terciarios |
| `--color-success` | `#1A8A4A` (bg: `#E3F9EC`) | Estado completo, aprobado, al corriente |
| `--color-warning` | `#F59E0B` (bg: `#FFF3E0`) | Estado pendiente, parcial |
| `--color-danger` | `#EF4444` (bg: `#FDE2E2`) | Estado faltante, rechazado, moroso, vencido |
| `--color-info` | `#1A56DB` (bg: `#E3F0FF`) | Información, badges informativos |

### 4.2 Tipografía

| Elemento | Fuente | Tamaño | Peso |
|----------|--------|--------|------|
| Base | Inter / 'Segoe UI', sans-serif | 13-14px | 400 |
| Títulos de página | Inter | 17-20px | 700 |
| Headers de card | Inter | 14px | 700 |
| Labels | Inter | 12-13px | 400-600 |
| Badges | Inter | 11px | 600-700 |
| Botones | Inter | 12px | 600 |

### 4.3 Espaciado y Bordes

| Token | Valor |
|-------|-------|
| `--radius-card` | 8px |
| `--radius-btn` | 6px |
| `--radius-badge` | 10px |
| `--radius-lg` | 12px |
| `--shadow-card` | `0 2px 8px rgba(0,0,0,0.08)` |
| `--shadow-lg` | `0 4px 28px rgba(0,0,0,0.14)` |

### 4.4 Componentes UI Base

```
Badge:     Píldora con padding 3px 10px, border-radius 10px
           Variantes: green, purple, gray, orange, blue
Button:    Padding 7px 14px, border-radius 6px, font-weight 600
           Variantes: primary, white, outline, teal, danger, sm
Card:      bg white, border 1px #E0E4EF, border-radius 8px
           Header: padding 14px 18px, border-bottom, bold
           Body: padding 18px
Table:     Header bg #F5F6FB, uppercase, letter-spacing 0.5px
           Rows: hover bg #FAFBFF, border-bottom 1px #F0F2F5
Input:     border 1px #D0D4E4, border-radius 6px, padding 7px 12px
Toggle:    width 44px, height 24px, border-radius 12px
```

### 4.5 Layout del Backoffice

```
┌──────────────────────────────────────────────────────────────┐
│ TOPBAR (#FFFFFF, border-bottom)                              │
│ [Logo totem]                              [🔔] [👤 Admin]  │
├────────┬─────────────────────────────────────────────────────┤
│SIDEBAR │ CONTENIDO PRINCIPAL                                 │
│#1E1B4B │                                                     │
│ 72px   │ ┌─ TRIP BANNER (#2D2D6E) ─────────────────────┐   │
│        │ │ 🧭 Nombre del Viaje     [Exportar] [Ver]    │   │
│ 🧭     │ └─────────────────────────────────────────────┘   │
│Viajes  │                                                     │
│ 💳     │ ┌─ NAV TABS ──────────────────────────────────┐   │
│Pagos   │ │ 🏠 │ ⚙️Config │ 📝Descrip │ ⏱Tarifas │ ...│   │
│ 📊     │ └─────────────────────────────────────────────┘   │
│Data    │                                                     │
│ ➕     │ [CONTENIDO DEL TAB ACTIVO]                         │
│Widgets │                                                     │
│ ⚙️     │                                                     │
│Ajustes │                                                     │
└────────┴─────────────────────────────────────────────────────┘
```

---

## 5. ALCANCE MVP 1 (Fase actual)

### 5.1 Objetivo del MVP

Mostrar la metodología de Totem Travels para gestionar viajes ("sistema operacional"). Entregar una landing page del viaje, el itinerario y el sistema de documentos.

### 5.2 Funcionalidades incluidas en MVP 1

| Módulo | Funcionalidades | Prioridad |
|--------|----------------|-----------|
| **Catálogo** | CRUD destinos, actividades, alojamientos, complementos | P0 |
| **Itinerarios** | Construcción de itinerarios día a día, clonar, versionar | P0 |
| **Viajes** | Crear viaje desde itinerario, config tarifas, complementos, habitaciones, docs requeridos | P0 |
| **Landing pública** | URL única por viaje, contenido comercial, itinerario visual, CTA inscripción | P0 |
| **Inscripción online** | Registro/login, formulario datos personales y salud, selección habitación | P0 |
| **Pagos online** | Pago de cuotas con pasarela (MercadoPago), confirmación inmediata | P0 |
| **Pagos manuales** | Registro de transferencias y pagos offline por admin | P0 |
| **Documentación** | Subida por viajero, revisión/aprobación por admin, seguimiento pendientes | P0 |
| **Panel admin** | Dashboard KPIs, tabla inscritos, filtros, exportaciones | P0 |
| **Notificaciones** | Confirmaciones automáticas (inscripción, pago, documento) | P0 |

### 5.3 Excluido del MVP 1

- Rooming automatizado (solo asignación manual básica)
- Transporte y asientos
- Mecenas / tienda / wallet
- Reportes avanzados
- App móvil nativa
- Integraciones CRM/contabilidad
- Panel del responsable de grupo (solo vista básica de lectura)

### 5.4 Agentes IA del MVP

**Agente Creador:**
- Guía al admin para crear viajes con preguntas: ¿Destino? ¿Cuántos días? ¿Tipo de viaje?
- Recomienda talleres de la red inclusiva de Totem para enriquecer experiencias.
- Asiste en la creación de itinerarios según tipo (aventura, escolar, etc.).

**Agente Gestión:**
- Brinda "paz mental" con notificaciones por correo (API Resend), luego Telegram/WhatsApp.
- Alerta sobre fechas límites y viajeros con documentación/pagos pendientes.
- Crea mensajes automáticos para alertar viajeros.
- Permite al responsable de grupo ajustar notificaciones y agregar correos.

---

## 6. MÓDULOS FUNCIONALES COMPLETOS (PRD)

### 6.1 Módulo Catálogo y Programas

**Destinos:** Fichas reusables con nombre, país, descripción, GPS, video, imágenes (carrusel ordenable), estado activo/inactivo.

**Actividades:** Catálogo por destino, categorizadas (cultural, deportiva, gastronómica, naturaleza), con horarios y duración.

**Alojamientos:** Fichas de hoteles/hostales/albergues con tipo, categoría (estrellas), datos de contacto, galería.

**Complementos:** Seguros, menús, extras sin precio (se define por viaje). Documentos adjuntos (pólizas, cartas).

**Itinerarios:** Día a día con destinos, alojamientos nocturnos y eventos. Clonables y versionables.

### 6.2 Módulo Viajes

**Creación:** Nombre, código, slug URL, fechas, itinerario base, responsable, estados (borrador→confirmado→publicado→en_operación→cerrado→cancelado).

**Tarifas:** Moneda, cuotas con nombre/monto/vencimiento, obligatorias u opcionales.

**Complementos activos:** Seleccionar del catálogo, asignar precio por viaje, obligatorio u opcional.

**Habitaciones:** Tipos (individual, doble, triple, cuádruple), cupos, suplementos.

**Documentos requeridos:** Checklist con nombre, tipo, obligatoriedad, fecha límite.

**Landing pública:** Título comercial, descripciones, carrusel imágenes, bloques de contenido, CTA inscripción. URL: `totemhub.com/viajes/{slug}`.

### 6.3 Módulo Inscripciones

**Inscripción online:** Desde landing, crear cuenta (email/social), formulario datos personales + salud (alergias, tratamientos, dieta, movilidad, contacto emergencia), selección habitación, confirmación por email.

**Gestión admin:** Tabla con nombre, documento, edad, estado inscripción/pago/documentos. Filtros, búsqueda, exportar Excel/CSV, acciones masivas.

**Vista responsable:** Solo lectura de su grupo, alertas visuales de vencidos, exportar PDF (sin datos de salud).

### 6.4 Módulo Pagos

**Pago online cuotas:** Vista plan de pagos, seleccionar cuota(s), pagar con pasarela, confirmación inmediata + email con recibo.

**Pago complementos:** Catálogo con descripción y precio, añadir al carrito, pagar junto con cuota o independiente.

**Pagos manuales:** Formulario admin con viajero, monto, método, referencia, comprobante adjunto.

**Control de estado:** Listado con estados (al corriente, parcial, moroso). Filtros por estado/cuota/complemento. Exportar Excel. Envío masivo de recordatorios.

### 6.5 Módulo Documentación

**Subida viajero:** Listado con estados (pendiente→en_revisión→aprobado→rechazado). Upload desde web/móvil (PDF, JPG, PNG). Resubir si rechazado.

**Revisión admin:** Vista previa in-platform. Aprobar/rechazar con motivo. Indicador % completitud. Notificación automática al viajero.

**Seguimiento:** Dashboard con contadores. Listado pendientes con countdown (verde/amarillo/rojo). Recordatorio masivo/individual.

### 6.6 Módulo Rooming (Fase 2)

**Configuración:** Habitaciones por alojamiento con código, tipo, capacidad, género, estado.

**Asignación:** Drag-and-drop, validación capacidad/género/edad, autoasignación, mover entre habitaciones.

**Exportación:** PDF personalizable con logo para hotel. Campos seleccionables. Envío directo por email.

### 6.7 Módulo Transporte (Fase 3)

Rutas, layout gráfico de asientos, asignación manual/auto, exportación para conductor.

### 6.8 Módulo Notificaciones

**Plantillas:** Nombre, asunto, cuerpo HTML con variables ({nombre}, {viaje}, {monto_pendiente}, etc.). Previsualización.

**Campañas:** Seleccionar viaje + segmento + plantilla. Programar envío. Tracking de estado.

**Automáticas:** Triggers por evento (inscripción, pago, documento aprobado/rechazado, recordatorio 3 días antes de vencimiento).

### 6.9 Módulo Mecenas/Wallet (Fase 3)

Página pública por viajero para donaciones y tienda. Wallet virtual con saldo aplicable a cuotas. Sistema de comisiones transparente.

### 6.10 Módulo Reportes (Fase 2)

Exportaciones PDF personalizadas (campos seleccionables, filtros, logo agencia). Dashboard KPIs del viaje (inscritos, pagos, documentación, rooming, alertas).

---

## 7. FLUJOS PRINCIPALES

### 7.1 Flujo Admin: Crear Viaje

```
1. Login → Backoffice
2. Viajes → Crear nuevo viaje
3. Seleccionar itinerario base
4. Definir nombre, fechas, código, slug, responsable
5. Configurar tipos de habitación y cupos
6. Definir plan de pagos (cuotas y vencimientos)
7. Activar complementos con precios
8. Definir documentos requeridos
9. Configurar contenido de landing
10. Previsualizar landing
11. Publicar viaje → genera URL pública
12. Sistema notifica a responsables asignados
```

### 7.2 Flujo Viajero: Inscripción y Pago

```
1. Abrir URL pública del viaje
2. Navegar itinerario, alojamientos, precios
3. Clic "Inscribirme"
4. Crear cuenta o iniciar sesión
5. Completar datos personales y de salud
6. Seleccionar tipo de habitación
7. Ver plan de pagos y complementos
8. Seleccionar complementos opcionales
9. Confirmar inscripción
10. Ver total a pagar (cuota inicial + complementos)
11. Pagar con tarjeta vía pasarela
12. Confirmación inmediata + email
13. Acceso a área privada (pagos, documentos pendientes)
```

### 7.3 Flujo Admin: Gestión Documental

```
1. Viajero sube documento desde web/móvil
2. Estado cambia a "En revisión"
3. Admin ve notificación de nuevo documento
4. Admin abre vista previa in-platform
5. Admin aprueba o rechaza (con motivo)
6. Viajero recibe notificación del resultado
7. Si rechazado: viajero resubmite
8. Dashboard muestra % completitud
```

---

## 8. TIPOS TypeScript (Frontend)

```typescript
// === ESTADOS ===
export type EstadoPago = "pendiente" | "parcial" | "completo";
export type EstadoDocumentos = "completo" | "incompleto" | "faltante" | "pendiente";
export type EstadoDocumentoItem = "pendiente" | "subido" | "en_revision" | "aprobado" | "rechazado";
export type EstadoViaje = "borrador" | "confirmado" | "publicado" | "en_operacion" | "cerrado" | "cancelado";
export type EstadoInscripcion = "pre_inscrito" | "pendiente_pago" | "confirmado" | "cancelado";
export type EstadoCuota = "pendiente" | "pagada" | "vencida";

// === ENTIDADES CORE ===
export type Viaje = {
  id: string;
  nombre: string;
  estado: EstadoViaje;
  fecha_inicio: string;
  fecha_fin?: string;
  cupos: number;
  responsable: string;
  slug?: string;
  codigo?: string;
  itinerario_id?: string;
  configuracion?: Record<string, any>;
  created_at?: string;
};

export type Viajero = {
  id: string;
  nombre: string;
  grupo: string;
  pago: EstadoPago;
  documentos: EstadoDocumentos;
  email?: string;
  telefono?: string;
  documento_identidad?: string;
  fecha_nacimiento?: string;
  datos_salud?: DatosSalud;
};

export type DatosSalud = {
  alergias?: string;
  tratamientos?: string;
  dieta_especial?: string;
  movilidad_reducida?: boolean;
  contacto_emergencia: { nombre: string; telefono: string; relacion: string };
};

export type Reserva = {
  id: string;
  codigo: string;
  cliente: string;
  viaje_id: string | null;
  pax: number;
  monto: number;
  estado: string;
  created_at?: string;
};

export type Cuota = {
  id: string;
  nombre: string;
  monto: number;
  fecha_vencimiento: string;
  obligatoria: boolean;
  estado: EstadoCuota;
};

export type DocumentoViajero = {
  id: string;
  nombre: string;
  tipo: string;
  estado: EstadoDocumentoItem;
  archivo_url?: string;
  motivo_rechazo?: string;
  fecha_subida?: string;
};

export type AppRole = "admin" | "viajero";

export type Perfil = {
  id: string;
  email: string;
  nombre: string;
  rol: AppRole;
};

// === ITINERARIO ===
export type Itinerario = {
  id: string;
  nombre: string;
  descripcion?: string;
  version: number;
  dias: DiaItinerario[];
};

export type DiaItinerario = {
  numero: number;
  titulo: string;
  resumen?: string;
  alojamiento?: string;
  eventos: EventoItinerario[];
};

export type EventoItinerario = {
  tipo: "texto_libre" | "actividad_catalogo";
  descripcion: string;
  hora_inicio?: string;
  hora_fin?: string;
  actividad_id?: string;
};

// === KPIs ===
export type DashboardKPIs = {
  viajes_activos: number;
  inscritos_total: number;
  pagos_pendientes: number;
  documentos_faltantes: number;
  recaudado: number;
  recaudado_esperado: number;
  pct_docs_completos: number;
  pct_pagos_al_corriente: number;
};
```

---

## 9. MÉTRICAS DE ÉXITO

### KPIs de Producto

| Métrica | Objetivo Q1 | Objetivo Q4 |
|---------|:-----------:|:-----------:|
| Agencias activas | 50 | 150 |
| Viajes creados/mes | 150 | 450 |
| Inscripciones/mes | 3,000 | 9,000 |
| Tasa conversión landing→inscripción | 15% | 20% |
| Tiempo creación de viaje | 2 horas | 45 minutos |
| NPS | 35 | 45 |
| Retención MRR | 80% | 85% |

### Métricas de Usabilidad

- Tiempo de inscripción: < 10 minutos
- Tasa de abandono en pago: < 20%
- Tiempo de subida de documento: < 2 minutos
- Aprobación documentos al primer intento: > 70%
- Generación rooming list: < 5 minutos

### Señales de PMF Temprano

- La agencia migra un segundo y tercer grupo al sistema.
- Operaciones pide más automatización dentro de la plataforma en vez de volver a Excel.
- Viajeros completan inscripción y pago sin ayuda humana.
- La agencia acepta pagar setup o suscripción anual.
- Se activan módulos adyacentes (docs, rooming, wallet).

---

## 10. ROADMAP DE DESARROLLO

| Fase | Periodo | Funcionalidades principales |
|------|---------|----------------------------|
| **MVP Core** | Meses 1-3 | Catálogo, itinerarios, viajes, landing, inscripción, pagos online, documentos, panel admin, notificaciones automáticas |
| **Operaciones Avanzadas** | Meses 4-6 | Rooming completo, complementos pagos, campañas masivas, dashboard viaje, panel responsable, exportaciones, pagos manuales |
| **Financiación Social** | Meses 7-9 | Mecenas/tienda, wallet, transporte/asientos, reportes financieros, más pasarelas |
| **Optimización** | Meses 10-12 | App móvil nativa, push notifications, integraciones CRM/contabilidad, marketplace, IA para itinerarios y rooming. **Evaluar** migración de módulos críticos a microservicios si el equipo crece a 8+ devs |

---

## 11. SEGURIDAD Y COMPLIANCE

- **Autenticación:** Supabase Auth + JWT con refresh tokens. 2FA opcional (futuro).
- **Autorización:** RBAC con roles: super_admin, admin, responsable, viajero.
- **GDPR:** Consentimientos explícitos, derecho al olvido, portabilidad, encriptación de datos sensibles.
- **PCI-DSS:** No almacenar datos de tarjetas. Delegación total a pasarelas certificadas.
- **Backups:** Diarios automáticos (Supabase), retención 30 días, snapshots semanales 6 meses.
- **Rate limiting:** Protección DDoS en API.
- **Almacenamiento:** Encriptación at-rest para documentos de viajeros.

---

## 12. REGLAS DE DESARROLLO

### Frontend

1. Usar Next.js App Router con Server Components donde sea posible.
2. Tailwind CSS para estilos, siguiendo design tokens definidos.
3. Componentes reutilizables en `components/ui/`.
4. Tipos TypeScript estrictos (`types/index.ts`).
5. Estados visuales consistentes: Verde=completo, Amarillo=pendiente, Rojo=faltante.
6. Responsive (mobile-first).
7. Protección de rutas con middleware.ts basado en rol.
8. Datos mock en `lib/mockData.ts` para desarrollo sin backend.
9. Cliente API centralizado en `lib/api.ts`.
10. Lucide React para iconos. Recharts para gráficos.

### Backend

1. Django REST Framework con ViewSets y Serializers.
2. Modelos con `managed = False` (tablas viven en Supabase).
3. Autenticación via Supabase JWT validado en `apps/usuarios/authentication.py`.
4. **Modular Monolith:** una Django app por dominio funcional (`apps/catalogo`, `apps/viajes`, etc.).
5. Comunicación entre apps por imports directos — sin buses de eventos ni abstracciones.
6. UUID como primary keys en todos los modelos.
7. JSONField para configuraciones flexibles.
8. Utilidades compartidas en `core/` (permissions, pagination, mixins).
9. Auditoría de acciones críticas (VoucherAuditoria pattern).
10. Filtros y paginación en todos los endpoints de listado.
11. Permisos por rol en cada ViewSet (usando `core/permissions.py`).
12. Manejo de errores consistente con códigos HTTP estándar.

### General

- **Equipo actual: 3 desarrolladores.** Priorizar velocidad de entrega sobre abstracciones.
- Código limpio, modular y legible.
- Commits descriptivos en español.
- Docker para desarrollo local consistente.
- Variables de entorno en `.env` (nunca hardcoded).
- Tests para flujos críticos (pagos, inscripciones).
- Evitar over-engineering: no crear abstracciones hasta que se necesiten 3+ veces.

---

## 13. DEPENDENCIAS EXTERNAS

| Servicio | Uso | Criticidad |
|----------|-----|-----------|
| Supabase | Auth + DB + Storage | Crítica |
| MercadoPago | Pasarela de pagos (Perú/LATAM) | Crítica |
| Resend | Email transaccional (MVP) | Crítica |
| Cloudflare/CloudFront | CDN para landing | Media |
| Telegram/WhatsApp API | Notificaciones alternativas | Media (futuro) |
| Google Analytics / Mixpanel | Product analytics | Baja (futuro) |

---

## 14. GLOSARIO

| Término | Definición |
|---------|-----------|
| **Viaje** | Salida comercial concreta con fechas, tarifas y viajeros |
| **Itinerario** | Plantilla reutilizable de programa día a día |
| **Inscripción** | Registro de un viajero a un viaje específico |
| **Cuota** | Fracción del pago total con vencimiento |
| **Complemento** | Servicio adicional opcional (seguro, menú, actividad extra) |
| **Rooming list** | Distribución de viajeros en habitaciones de hotel |
| **Responsable** | Profesor/coordinador que supervisa un grupo de viajeros |
| **Mecenas** | Persona que dona dinero para ayudar a financiar el viaje de un viajero |
| **Wallet** | Monedero virtual del viajero donde se acreditan donaciones |
| **Landing** | Página pública del viaje con info comercial y botón de inscripción |
| **Slug** | Identificador URL-friendly del viaje (ej: `viaje-cusco-2026`) |
| **Bounded Context** | Módulo de dominio funcional implementado como Django app independiente (patrón Modular Monolith) |
| **Multi-tenant** | Arquitectura donde múltiples agencias comparten la misma plataforma |

---

> **Este documento es la fuente de verdad para todo el equipo de desarrollo.**
> Cualquier decisión técnica o funcional debe alinearse con lo aquí descrito.
> Actualizarlo cuando se tomen decisiones que modifiquen el alcance o la arquitectura.

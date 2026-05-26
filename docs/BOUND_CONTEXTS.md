# Bounded Contexts

## identity

Perfiles, roles, invitaciones y autenticacion de usuario. No gestiona tenants ni permisos de negocio fuera de identidad.

## tenancy

Ciclo de vida de agencias, preferencias, onboarding y resolucion de tenant.

## catalog

Destinos, actividades, alojamientos y complementos. Soporta alcance global y alcance tenant.

## itineraries

Itinerarios, dias, eventos, versionado y clonado.

## trips

Viajes, landing publica, operaciones, publicacion y archivado.

## enrollments

Inscripciones publicas y manuales, confirmacion, cancelacion, datos de salud y exportaciones.

## payments

Pagos de viajeros, cuotas, conciliacion e idempotencia de operaciones financieras.

## subscriptions

Planes SaaS, suscripciones de tenant y billing de plataforma.

## documents

Documentos de viajero, storage, revision, aprobacion, rechazo y auditoria de PII.

## notifications

Notificaciones internas, email y eventos derivados de dominio.

## assistant

Sesiones IA, mensajes, leads, matching y planes de viaje.

## support

Tickets de soporte, respuestas y escalamiento.

## platform

Superadmin, metricas globales y gobierno de tenants.

## audit

Auditoria durable, outbox y cumplimiento.


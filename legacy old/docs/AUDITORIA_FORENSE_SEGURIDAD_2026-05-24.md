# Auditoria Forense de Seguridad y Arquitectura

Proyecto: Totem HUB / totem-mvp1  
Fecha: 2026-05-24  
Alcance: auditoria estatica del arbol del proyecto en `/opt/totem-mvp1`  
Modo de trabajo: lectura local, sin uso de git, sin modificaciones de codigo fuente  

## 0. Alcance Real Auditado

Esta auditoria cubre los siguientes frentes del repositorio:

- Backend Django y DRF: apps de usuarios, tenancy, viajes, itinerarios, inscripciones, pagos, documentos, notificaciones, catalogo, planes, asistente IA, soporte, superadmin y audit.
- Frontend Next.js: layouts, proxy, login, cliente API, entorno, rutas publicas, rutas dashboard, tipos TypeScript y patrones de fetch.
- Infraestructura: `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml`.
- SQL/RLS: scripts de politicas RLS disponibles bajo `scripts/`.
- Contraste contra reglas declaradas en `AGENTS.md`.

Limitaciones declaradas:

- No se ejecuto bateria completa de tests.
- No se ejecuto analisis dinamico de trafico real.
- No se inspecciono una base de datos viva para confirmar si los scripts RLS estan aplicados.
- Donde no hay evidencia explicita en el codigo, el dictamen asume fallo, conforme a la regla Zero-Trust indicada.

## 1. Informe de Autopsia Arquitectonica

### 1.1 Dictamen ejecutivo

El sistema esta en estado de MVP funcional, pero no en estado de SaaS B2B seguro. La arquitectura actual no resiste una auditoria empresarial porque el aislamiento multi-tenant, la integridad de pagos, la gestion de sesion y la configuracion de despliegue dependen de convenciones fragiles y no de garantias duras.

El defecto raiz es sistemico: muchas rutas privadas filtran por tenant solo si el tenant fue resuelto correctamente. Cuando el tenant falta, varias consultas quedan globales. En un SaaS multi-tenant esto es una condicion bloqueante absoluta.

### 1.2 Nivel de madurez observado

Madurez de producto: MVP temprano.  
Madurez de seguridad: baja.  
Madurez multi-tenant: insuficiente.  
Madurez transaccional/financiera: insuficiente.  
Madurez de despliegue: local/dev, no produccion.  
Madurez TypeScript: parcial, con escapes `any` y modelos monetarios inseguros.  

### 1.3 Fallas estructurales dominantes

1. Aislamiento tenant fail-open.
2. RLS existe como script, pero no hay evidencia de aplicacion obligatoria ni de contexto DB transaccional seguro.
3. Uso de identidad por query param o header en flujos criticos.
4. Pagos e inscripciones sin idempotencia fuerte.
5. Tokens y roles persistidos en `localStorage` y cookies no HttpOnly.
6. Endpoints publicos de asistente IA demasiado amplios.
7. Defaults de desarrollo en infraestructura.
8. Divergencia entre reglas de `AGENTS.md` y modelos `managed=True`.

## 2. Vulnerabilidades de Destruccion de Negocio

### BLOQUEANTE 1: Aislamiento multi-tenant fail-open

#### Vector de Falla

El sistema permite que rutas privadas operen sin tenant obligatorio. El patron repetido es:

- resolver tenant de manera opcional;
- filtrar queryset solo si hay tenant;
- permitir acceso cuando no se detecta tenant;
- confiar en capas posteriores inconsistentes.

En SaaS multi-tenant, una consulta sin tenant en datos privados es vulnerabilidad critica, no deuda tecnica.

#### Zona Cero

- `backend/core/permissions.py:63`: si `request.tenant_id` falta, el permiso retorna `True`.
- `backend/core/permissions.py:65`: si el objeto no tiene `tenant_id`, el permiso retorna `True`.
- `backend/apps/viajes/views.py:110`: `get_queryset` filtra por tenant solo si `tenant_id` existe.
- `backend/apps/viajes/views.py:216`: `Viaje.objects.all()` en operaciones.
- `backend/apps/pagos/views.py:77`: pagos filtran por tenant solo si existe.
- `backend/apps/documentos/views.py:79`: documentos por inscripcion sin filtro tenant.
- `backend/apps/itinerarios/views.py:68`: itinerarios devuelven todos los registros.
- `backend/apps/catalogo/views.py:66`: destinos globales sin tenant.
- `backend/apps/notificaciones/views.py:100`: notificaciones usan inscripciones globales.
- `backend/apps/tenancy/middleware.py:32`: acepta `X-Tenant-ID` desde header.
- `backend/apps/usuarios/authentication.py:45`: mismatch tenant solo falla si ambos valores existen.

#### Prueba de Concepto

1. Un usuario autenticado llama una ruta privada donde el tenant no fue resuelto.
2. El permiso de aislamiento no bloquea porque el tenant ausente es tratado como permitido.
3. El ViewSet entra a `get_queryset`.
4. Como `tenant_id` es `None`, no aplica filtro.
5. La respuesta puede incluir datos de multiples tenants.

#### Impacto

- Fuga de datos entre agencias.
- Acceso a inscripciones, viajes, pagos, documentos y notificaciones de otro tenant.
- Incumplimiento contractual y regulatorio.
- Incapacidad de certificar aislamiento SaaS.

#### Refactorizacion Zero-Patch

La solucion debe ser estructural:

- Todo endpoint privado debe exigir contexto tenant antes de ejecutar cualquier query.
- El permiso tenant debe ser fail-closed.
- Los objetos se deben resolver con `id + tenant_id`, nunca solo con `id`.
- Se debe eliminar `perfil_id` como fuente de identidad desde query params.
- El header `X-Tenant-ID` solo puede aceptarse si esta firmado o si coincide con tenant derivado del JWT y perfil persistido.
- Los endpoints superadmin deben estar aislados en permisos y querysets separados.
- Toda tabla tenant-scoped debe tener indice compuesto por tenant y clave natural usada.

### BLOQUEANTE 2: RLS no opera como garantia dura

#### Vector de Falla

El repositorio contiene un script RLS, pero la aplicacion todavia depende de DRF para roles y puede aplicar contexto DB vacio. Bajo Zero-Trust, un script presente no equivale a seguridad aplicada.

#### Zona Cero

- `scripts/04_rls_policies.sql:34`: RLS para `viajes`.
- `scripts/04_rls_policies.sql:45`: RLS para `inscripciones`.
- `scripts/04_rls_policies.sql:70`: RLS para `documentos`.
- `scripts/04_rls_policies.sql:97`: RLS para `cuotas`.
- `scripts/04_rls_policies.sql:122`: RLS para `pagos`.
- `scripts/04_rls_policies.sql:149`: RLS para `perfiles`.
- `scripts/04_rls_policies.sql:160`: permisos por rol siguen en DRF.
- `backend/apps/tenancy/db_context.py:19`: `set_config(..., false)` usa alcance de sesion.
- `backend/apps/tenancy/db_context.py:40`: permite aplicar tenant vacio.
- `backend/totem_backend/settings.py:341`: rutas exentas incluyen superficies sensibles.

#### Prueba de Concepto

1. Request entra por ruta exenta o sin tenant resuelto.
2. La app puede ejecutar queries antes o despues de contexto incompleto.
3. El contexto RLS no esta garantizado por transaccion.
4. Si la politica no esta aplicada en DB real, no hay barrera inferior.

#### Impacto

- RLS no puede considerarse control compensatorio.
- El aislamiento depende de que todos los desarrolladores recuerden filtrar cada consulta.
- Cualquier nueva ruta puede introducir fuga tenant.

#### Refactorizacion Zero-Patch

- RLS debe aplicarse como migracion operativa obligatoria y verificable.
- `current_tenant_id()` nulo debe causar cero filas o error en rutas privadas.
- El contexto DB debe establecerse con alcance transaccional para cada request.
- Debe existir test automatizado que intente leer datos de tenant B desde tenant A y falle.
- Las rutas exentas deben limitarse a healthchecks y publicos explicitamente no tenant-scoped.

### BLOQUEANTE 3: Autenticacion y resolucion de tenant mezclan fuentes no confiables

#### Vector de Falla

El backend permite resolver identidad y tenant desde fuentes heterogeneas: JWT, perfil por email, query params, header y fallback. Esto destruye la propiedad de autoridad unica.

#### Zona Cero

- `backend/apps/usuarios/authentication.py:34`: decode no verificado para inspeccion de payload.
- `backend/apps/usuarios/authentication.py:67`: JWKS remoto sin cache por request.
- `backend/apps/usuarios/authentication.py:98`: tenant se recupera por raw SQL segun perfil.
- `backend/apps/usuarios/authentication.py:141`: log parcial de token.
- `backend/apps/usuarios/authentication.py:177`: log de usuario y tenant.
- `backend/apps/viajes/views.py:28`: `perfil_id` por query param.
- `backend/apps/inscripciones/views.py:35`: `perfil_id` por query param.
- `backend/apps/pagos/views.py:22`: `perfil_id` por query param.
- `backend/apps/documentos/views.py:25`: `perfil_id` por query param.
- `backend/apps/notificaciones/views.py:22`: `perfil_id` por query param.

#### Prueba de Concepto

1. Usuario autenticado llama endpoint con `perfil_id` de otra cuenta.
2. La vista intenta resolver perfil desde query param.
3. El tenant resultante puede cambiar el alcance de consultas o acciones.
4. El backend pierde integridad de identidad.

#### Impacto

- Suplantacion parcial de perfil.
- Confusion de tenant.
- Logs sensibles.
- Riesgo de bypass de RBAC.

#### Refactorizacion Zero-Patch

- El JWT validado es la unica entrada de identidad.
- El perfil se obtiene por subject interno o email verificado y debe coincidir con claims esperados.
- `perfil_id` debe desaparecer de endpoints privados.
- El tenant request debe derivarse de perfil autenticado o de ruta publica firmada.
- JWKS debe cachearse con expiracion y fallback seguro.
- Logs nunca deben incluir prefijos de tokens.

### BLOQUEANTE 4: Inscripciones publicas duplicables y cross-tenant

#### Vector de Falla

El flujo de inscripcion publica busca viajes por slug sin tenant, crea preinscripciones con viajero nulo y no tiene idempotencia fuerte.

#### Zona Cero

- `backend/apps/inscripciones/views.py:294`: `Viaje` por `slug` sin tenant.
- `backend/apps/inscripciones/views.py:333`: crea preinscripcion con PII.
- `backend/apps/inscripciones/views.py:368`: `update_or_create` sin bloqueo transaccional.
- `backend/apps/inscripciones/models.py:38`: unicidad solo `viajero, viaje`; `viajero` puede ser nulo.

#### Prueba de Concepto

1. Tenant A y tenant B publican el mismo slug.
2. Un viajero usa URL publica con ese slug.
3. Backend resuelve el primer viaje coincidente.
4. Dos submits simultaneos crean duplicados si `viajero` es nulo.

#### Impacto

- Inscripciones asignadas a agencia equivocada.
- Duplicacion de registros.
- PII en registros inconsistentes.
- Facturacion y rooming contaminados.

#### Refactorizacion Zero-Patch

- El identificador publico debe incluir tenant o dominio de agencia.
- Constraint unico por `tenant_id`, `viaje_id`, email normalizado y documento.
- Transaccion atomica con lock o insert idempotente.
- Retorno idempotente para la misma solicitud.
- Validacion runtime de payload con esquema estricto.

### BLOQUEANTE 5: Pagos manuales y cambios de estado no son seguros

#### Vector de Falla

El sistema permite crear y modificar pagos por ids globales sin tenant obligatorio ni idempotencia.

#### Zona Cero

- `backend/apps/pagos/views.py:127`: pago manual busca inscripcion por id sin tenant.
- `backend/apps/pagos/views.py:137`: detail queryset global.
- `backend/apps/pagos/views.py:145`: cuotas por viaje sin tenant.
- `backend/apps/pagos/views.py:158`: cuotas detail global.
- `backend/apps/pagos/views.py:169`: `Pago.objects.all()`.
- `backend/apps/pagos/serializers.py:49`: crea pago verificado sin referencia idempotente.
- `backend/apps/pagos/utils.py:31`: convierte `Decimal` a `float`.

#### Prueba de Concepto

1. Admin de tenant A conoce un UUID de inscripcion de tenant B.
2. Crea pago manual sobre esa inscripcion.
3. Backend no exige tenant en la busqueda.
4. El pago queda verificado para recurso ajeno.
5. Repetir la misma solicitud crea otro pago.

#### Impacto

- Corrupcion contable.
- Conciliacion imposible.
- Manipulacion de deuda de viajeros.
- Posible fraude interno.

#### Refactorizacion Zero-Patch

- Cada pago debe tener idempotency key unica.
- Cada pago externo debe tener referencia proveedor unica.
- Crear pago debe bloquear inscripcion y cuota con `select_for_update`.
- El estado de pago debe ser maquina de estados cerrada.
- Todo monto debe mantenerse como `Decimal` en backend y string decimal o minor units en frontend.

### BLOQUEANTE 6: Renovacion de suscripciones y gateways no son ACID

#### Vector de Falla

La renovacion de planes no bloquea la suscripcion antes de cobrar. El gateway mock es aleatorio y la conversion monetaria usa float.

#### Zona Cero

- `backend/apps/planes/services.py:76`: gateway mock usa exito aleatorio.
- `backend/apps/planes/services.py:80`: monto convertido a float.
- `backend/apps/planes/services.py:97`: cambio de plan en transaccion sin lock sobre objeto fresco.
- `backend/apps/planes/services.py:207`: renovacion en transaccion sin lock previo.
- `backend/apps/planes/services.py:232`: llamada gateway antes de persistir intento de pago.
- `backend/apps/planes/services.py:239`: intento de pago se crea despues del cobro.

#### Prueba de Concepto

1. Dos workers ejecutan renovacion del mismo tenant.
2. Ambos pasan cooldown antes de que uno actualice `last_payment_attempt_at`.
3. Ambos llaman gateway.
4. Se generan cobros duplicados o estados divergentes.

#### Impacto

- Doble cargo.
- Suscripciones inconsistentes.
- Imposibilidad de auditoria financiera.

#### Refactorizacion Zero-Patch

- Lock pesimista de suscripcion antes de evaluar renovacion.
- Crear intento de pago pendiente antes de llamar gateway.
- Idempotency key por tenant y periodo.
- Confirmacion transaccional posterior.
- Reintentos gobernados por estado persistido, no por memoria ni azar.

### BLOQUEANTE 7: Webhooks de pago aceptan eventos no firmados

#### Vector de Falla

Si falta secreto de webhook, el sistema construye eventos desde payload sin verificar firma.

#### Zona Cero

- `backend/apps/planes/views.py:420`: si Stripe no esta configurado retorna 200.
- `backend/apps/planes/views.py:424`: lee `STRIPE_WEBHOOK_SECRET`.
- `backend/apps/planes/views.py:435`: sin secret usa `Event.construct_from`.
- `backend/apps/planes/views.py:452`: actualiza suscripcion por tenant sin registrar event id unico.

#### Prueba de Concepto

1. Atacante envia evento falso.
2. Entorno sin `STRIPE_WEBHOOK_SECRET` acepta payload.
3. La suscripcion cambia estado.
4. No hay tabla idempotente de eventos procesados.

#### Impacto

- Activacion fraudulenta.
- Cancelacion falsa.
- Corrupcion de historial de billing.

#### Refactorizacion Zero-Patch

- Webhook sin secret debe fallar.
- Cada evento debe persistirse con `provider`, `event_id`, `received_at`, `processed_at`.
- Procesamiento idempotente por constraint unica.
- Eventos desconocidos deben registrarse y no mutar estado.

### BLOQUEANTE 8: Documentos, salud y exportaciones exponen PII

#### Vector de Falla

Los documentos y datos de salud se acceden por UUID global o por viaje sin comprobar tenant mediante join completo.

#### Zona Cero

- `backend/apps/documentos/views.py:79`: documentos por inscripcion sin tenant.
- `backend/apps/documentos/views.py:95`: obtiene inscripcion por id sin tenant.
- `backend/apps/documentos/views.py:110`: detail queryset global.
- `backend/apps/documentos/views.py:121`: aprobar documento por id global.
- `backend/apps/documentos/views.py:144`: rechazar documento por id global.
- `backend/apps/inscripciones/views.py:422`: datos de salud por inscripcion id.
- `backend/apps/inscripciones/views.py:461`: exportacion por viaje sin tenant.

#### Prueba de Concepto

1. Usuario autenticado obtiene UUID de documento o inscripcion.
2. Llama endpoint de detalle, aprobacion, rechazo o salud.
3. Si tenant no esta presente o la query no lo exige, accede o modifica PII.

#### Impacto

- Fuga de documentos personales.
- Fuga de informacion medica.
- Riesgo legal severo.

#### Refactorizacion Zero-Patch

- Resolver documentos mediante join `documento -> inscripcion -> viaje -> tenant`.
- Resolver salud mediante `inscripcion -> viaje -> tenant`.
- Exportaciones solo por tenant validado.
- Auditoria obligatoria de cada lectura y cambio de documentos.

### BLOQUEANTE 9: Frontend conserva tokens y roles en cliente

#### Vector de Falla

El frontend guarda bearer tokens en `localStorage`, usa cookie creada por JavaScript y decide rutas por roles persistidos en cliente.

#### Zona Cero

- `frontend/proxy.ts:18`: si faltan env vars de Supabase, deja pasar.
- `frontend/proxy.ts:43`: rol desde `user_metadata`.
- `frontend/app/(auth)/login/page.tsx:54`: token en `localStorage`.
- `frontend/app/(auth)/login/page.tsx:56`: cookie creada por cliente.
- `frontend/app/(auth)/login/page.tsx:65`: rol y datos de perfil en `localStorage`.
- `frontend/lib/api.ts:1051`: lee token de `localStorage`.
- `frontend/lib/api.ts:1077`: escribe cookie no HttpOnly desde cliente.
- `frontend/app/(dashboard)/layout.tsx:63`: layout decide auth desde cliente.
- `frontend/app/(superadmin)/layout.tsx:28`: superadmin gateado por `localStorage`.

#### Prueba de Concepto

1. XSS, extension o script de terceros lee `localStorage`.
2. Extrae `totem_token`.
3. Reutiliza bearer token contra backend.
4. Modifica `totem_rol` local para abrir UI privilegiada.
5. Si backend falla tenant/RBAC, el impacto se vuelve total.

#### Impacto

- Robo de sesion.
- Escalada visual de permisos.
- Aumento del impacto de cualquier XSS.
- Inconsistencia entre server auth y client auth.

#### Refactorizacion Zero-Patch

- Sesion solo en cookie HttpOnly, Secure, SameSite.
- Emision y rotacion de sesion desde servidor.
- Roles nunca en `localStorage`.
- Proxy debe fallar cerrado si faltan env vars.
- `user_metadata` no puede ser fuente de autoridad RBAC.

### BLOQUEANTE 10: API publica de asistente IA expone superficie excesiva

#### Vector de Falla

Varias rutas del asistente IA son `AllowAny`, crean leads, devuelven estadisticas y generan PDF por token sin validar publicacion.

#### Zona Cero

- `backend/apps/asistente_ia/views.py:178`: mensajes `AllowAny`.
- `backend/apps/asistente_ia/views.py:378`: lead `AllowAny`.
- `backend/apps/asistente_ia/views.py:481`: guardar plan `AllowAny`.
- `backend/apps/asistente_ia/views.py:542`: stats `AllowAny`.
- `backend/apps/asistente_ia/views.py:607`: listar viajes `AllowAny`.
- `backend/apps/asistente_ia/views.py:643`: PDF por `share_token` sin exigir `is_public=True`.
- `backend/apps/asistente_ia/views.py:682`: tenant hardcodeado.

#### Prueba de Concepto

1. Usuario anonimo llama stats.
2. Usuario anonimo lista viajes.
3. Usuario con share token accede a PDF aunque el plan no sea publico.
4. Usuario crea lead contra tenant hardcodeado o inconsistente.

#### Impacto

- Fuga de inteligencia comercial.
- Spam de leads.
- Datos publicos y privados mezclados.
- Tenant contamination.

#### Refactorizacion Zero-Patch

- Separar API publica de API admin.
- Share tokens firmados, expirables y scopeados.
- PDF solo si `is_public=True`.
- Leads con rate limit, validacion captcha o antifraude.
- Tenant derivado de dominio publico, no hardcodeado.

### BLOQUEANTE 11: Administracion de tenants y planes mezcla alcances

#### Vector de Falla

Hay endpoints donde admins no superadmin pueden interactuar con datos globales o tenants arbitrarios.

#### Zona Cero

- `backend/apps/tenancy/views.py:31`: `TenantViewSet` parte de todos los tenants.
- `backend/apps/tenancy/views.py:75`: onboarding recibe `tenant_id` por URL.
- `backend/apps/tenancy/views.py:123`: preferencias por `tenant_id` arbitrario.
- `backend/apps/planes/views.py:98`: `PlanViewSet` global.
- `backend/apps/planes/views.py:136`: crea suscripcion con tenant posiblemente nulo.

#### Prueba de Concepto

1. Admin autenticado accede a ruta de tenant con id de otra agencia.
2. Backend no demuestra verificacion fuerte de pertenencia.
3. Configuracion o preferencias pueden leerse o modificarse fuera de alcance.

#### Impacto

- Toma parcial de configuracion de agencia.
- Cambios de plan indebidos.
- Fuga de metadatos de tenants.

#### Refactorizacion Zero-Patch

- Superadmin y admin tenant deben tener ViewSets separados.
- Admin tenant nunca envia `tenant_id` en URL para su propia config.
- El tenant se toma del contexto autenticado.
- Superadmin requiere permiso separado y auditoria reforzada.

### BLOQUEANTE 12: Infraestructura con defaults de desarrollo

#### Vector de Falla

Docker y compose contienen defaults inseguros, procesos root y comandos no aptos para produccion.

#### Zona Cero

- `backend/Dockerfile:1`: imagen sin usuario no privilegiado.
- `frontend/Dockerfile:1`: imagen sin usuario no privilegiado.
- `backend/Dockerfile:12`: dependencias de build quedan en imagen final.
- `frontend/Dockerfile:9`: instala dependencias en imagen unica.
- `docker-compose.yml:8`: password default de Postgres.
- `docker-compose.yml:41`: password default de pgAdmin.
- `docker-compose.yml:59`: backend usa `runserver`.
- `docker-compose.yml:65`: `DEBUG=True`.
- `docker-compose.yml:72`: JWT secret default.
- `docker-compose.yml:104`: frontend ejecuta `npm install` y build al arrancar.

#### Prueba de Concepto

1. Compose se usa en servidor o entorno accesible.
2. Postgres y pgAdmin quedan expuestos por puertos.
3. Credenciales default permiten acceso.
4. Backend corre en modo desarrollo.

#### Impacto

- Compromiso total de DB.
- Ejecucion como root dentro del contenedor.
- Builds no reproducibles.
- Shutdown no controlado.

#### Refactorizacion Zero-Patch

- Compose local y produccion separados.
- Imagen backend multi-stage con usuario no root.
- Imagen frontend multi-stage con output standalone.
- Secrets obligatorios sin defaults.
- Gunicorn con workers, timeout, graceful timeout y healthcheck.
- No ejecutar install/build en runtime.

## 3. Deuda Arquitectonica y Cuellos de Botella

### 3.1 Consultas globales e iteracion en memoria

#### Deficiencia

Hay endpoints que cargan todos los registros y filtran en Python.

#### Evidencia

- `backend/apps/viajes/views.py:216`: `Viaje.objects.all()`.
- `backend/apps/viajes/views.py:229`: iteracion sobre operaciones JSON.
- `backend/apps/viajes/views.py:239`: filtrado en memoria.
- `backend/apps/viajes/views.py:295`: paginacion posterior al filtrado en memoria.

#### Impacto a Escala

Con 10 millones de viajes, la ruta puede provocar:

- table scans;
- alto consumo de memoria;
- latencia no acotada;
- bloqueo del worker;
- degradacion global del backend.

#### Solucion Estructural

- Normalizar operaciones si son entidad consultable.
- Indices por `tenant_id`, `fecha`, `estado`.
- Filtrado y paginacion en SQL.
- Limitar payload JSON de listados.

### 3.2 N+1 en superadmin

#### Deficiencia

El listado de tenants calcula conteos por tenant dentro del loop.

#### Evidencia

- `backend/apps/superadmin/views.py:60`: carga tenants.
- `backend/apps/superadmin/views.py:63`: construye lista de ids.
- `backend/apps/superadmin/views.py:69`: cuenta viajes por tenant dentro del loop.
- `backend/apps/superadmin/views.py:70`: cuenta viajes publicados por tenant dentro del loop.

#### Impacto a Escala

Con 1000 tenants, el endpoint dispara miles de queries de conteo. Con tablas grandes, los conteos se vuelven caros y afectan todo el pool.

#### Solucion Estructural

- Agregaciones con `annotate`.
- Subqueries agrupadas por tenant.
- Cache de metricas no criticas.
- Paginacion obligatoria de tenants.

### 3.3 Catalogo sin tenant

#### Deficiencia

Catalogo opera como global aunque el producto es SaaS B2B.

#### Evidencia

- `backend/apps/catalogo/views.py:66`: destinos globales.
- `backend/apps/catalogo/views.py:82`: actividades globales.
- `backend/apps/catalogo/views.py:98`: alojamientos globales.
- `backend/apps/catalogo/views.py:114`: complementos globales.

#### Impacto a Escala

Si cada agencia personaliza catalogo, los datos se mezclan. Si el catalogo es realmente global, debe estar modelado explicitamente como global y separado de recursos tenant-owned.

#### Solucion Estructural

- Definir si catalogo es global, tenant-owned o mixto.
- Si es mixto: `scope = global | tenant`, `tenant_id nullable` con constraints.
- Permisos diferenciados para lectura global y escritura tenant.

### 3.4 Notificaciones globales

#### Deficiencia

El centro de notificaciones consulta inscripciones, documentos, viajes y pagos de forma global.

#### Evidencia

- `backend/apps/notificaciones/views.py:100`: inscripciones globales.
- `backend/apps/notificaciones/views.py:118`: documentos pendientes globales.
- `backend/apps/notificaciones/views.py:151`: viajes globales.
- `backend/apps/notificaciones/views.py:176`: pagos globales.

#### Impacto a Escala

Ademas de fuga tenant, el endpoint acumula queries costosas y genera ruido operativo entre agencias.

#### Solucion Estructural

- Notificaciones materializadas por tenant.
- Query siempre por tenant.
- Cache key debe incluir tenant y rol.

### 3.5 Frontend con mock API por defecto

#### Deficiencia

El frontend usa mock salvo que se configure explicitamente `"false"`.

#### Evidencia

- `frontend/lib/env.ts:21`: `NEXT_PUBLIC_USE_MOCK_API !== "false"`.
- `frontend/lib/api.ts:1031`: `fetchDjango` retorna `mockFetch` si `USE_MOCK`.

#### Impacto a Escala

Un entorno mal configurado puede mostrar datos falsos o permitir QA falso. En produccion esto es inaceptable.

#### Solucion Estructural

- Mock solo bajo `NODE_ENV=development` y flag explicito.
- En produccion, ausencia de API real debe abortar build o runtime.

### 3.6 Fetch directo fuera del cliente centralizado

#### Deficiencia

Varios componentes y paginas hacen `fetch` directo.

#### Evidencia principal

- `frontend/app/(auth)/login/page.tsx:60`: fetch directo al backend.
- `frontend/app/(public)/viajes/[slug]/page.tsx:36`: fetch directo a `localhost`.
- `frontend/components/asistente-ia/ChatDiscovery.tsx`: fetch directo detectado por busqueda estatica.
- `frontend/hooks/useChatSession.ts`: fetch directo detectado por busqueda estatica.

#### Impacto a Escala

- Headers inconsistentes.
- Errores no normalizados.
- Base URLs divergentes.
- Bypass de auth central.

#### Solucion Estructural

- Cliente API unico.
- Separar cliente server-side y browser-side.
- Contratos tipados.
- Validacion runtime en bordes.

### 3.7 Dinero como `number` y conversiones a `float`

#### Deficiencia

Montos financieros usan `number` en frontend y `float` en serializacion/utilidades.

#### Evidencia

- `frontend/types/index.ts:43`: precio de plan como number.
- `frontend/types/index.ts:115`: cuota como number.
- `frontend/types/index.ts:126`: pago como number.
- `backend/apps/viajes/serializers.py:102`: precio base a float.
- `backend/apps/viajes/serializers.py:120`: precio base a float.
- `backend/apps/pagos/utils.py:31`: monto pagado a float.
- `backend/apps/planes/services.py:80`: monto a float.

#### Impacto a Escala

Errores de redondeo, discrepancias de conciliacion, fallas de auditoria financiera.

#### Solucion Estructural

- Backend: `Decimal` hasta el borde.
- API: string decimal o minor units.
- Frontend: tipo monetario propio.
- Prohibir `toFixed` como logica de negocio.

### 3.8 TypeScript no estricto en bordes criticos

#### Deficiencia

Hay `any` en componentes de layout, API y formularios.

#### Evidencia

- `frontend/app/(dashboard)/layout.tsx:27`: `any[]`.
- `frontend/lib/api.ts:1064`: `window as any`.
- `frontend/lib/api.ts:1078`: `window as any`.
- `frontend/lib/api.ts:1082`: `window as any`.
- `frontend/app/(public)/onboarding/page.tsx:122`: `catch (e: any)`.

#### Impacto a Escala

Los bordes de auth, sesion y errores pierden tipo fuerte justo donde mas se necesita.

#### Solucion Estructural

- Tipos explicitos para sesion cacheada.
- Tipos de error desconocido con narrowing.
- Prohibir `any` con ESLint.
- Validacion de runtime con Zod o equivalente en entradas externas.

### 3.9 Divergencia de estados y roles entre frontend y backend

#### Deficiencia

Frontend y backend no comparten vocabulario cerrado de roles y estados.

#### Evidencia

- `frontend/types/index.ts:6`: roles frontend `superadmin | admin | viajero`.
- Backend usa tambien `usuario`, `profesor`, `alumno`, `staff`, `coordinador`, `docente` en varios flujos.
- `frontend/types/index.ts:128`: estados de pago frontend incluyen `acreditado`, `reembolsado`.
- Backend usa estados como `verificado`, `rechazado`, `pendiente`.

#### Impacto a Escala

UI puede mostrar estado incorrecto, permitir acciones equivocadas o esconder datos validos.

#### Solucion Estructural

- Contrato unico de enums.
- Generacion o sincronizacion de tipos desde backend.
- Validacion de compatibilidad en CI.

### 3.10 Modelos `managed=True` violan AGENTS.md

#### Deficiencia

`AGENTS.md` exige `managed=False` en todos los modelos porque las tablas viven en Supabase. Hay modelos que no cumplen.

#### Evidencia

- `backend/apps/tenancy/models.py:58`: `TenantConfig managed=True`.
- `backend/apps/planes/models.py:74`: `Subscription managed=True`.
- `backend/apps/planes/models.py:135`: `SubscriptionHistory managed=True`.
- `backend/apps/planes/models.py:166`: `PaymentAttempt managed=True`.
- `backend/apps/usuarios/models.py:62`: `InvitacionUsuario managed=True`.
- `backend/apps/asistente_ia/models.py:112`: `AsistenteTripPlan managed=True`.

#### Impacto a Escala

Django puede intentar gestionar tablas que, por contrato, pertenecen a Supabase. Esto rompe gobernanza de schema.

#### Solucion Estructural

- Inventario completo de modelos.
- Alinear `managed=False`.
- Crear scripts SQL versionados para tablas faltantes.
- Prohibir migraciones Django productivas para schema Supabase.

### 3.11 Desalineacion de schema tenant

#### Deficiencia

El modelo Django de Tenant usa nombres en espanol, mientras partes del sistema y scripts usan nombres en ingles.

#### Evidencia

- `backend/apps/tenancy/models.py:6`: campo `nombre`.
- `backend/apps/tenancy/models.py:7`: campo `dominio`.
- `backend/apps/tenancy/models.py:14`: estados `activo`, `cancelado`, `suspendido`.
- `backend/apps/tenancy/middleware.py:119`: consulta `domain__iexact`.

#### Impacto a Escala

Resolucion de tenant por host puede fallar. Si falla, rutas privadas pueden continuar sin tenant y activar el fallo fail-open.

#### Solucion Estructural

- Unificar contrato de columnas.
- Tests de resolucion por dominio.
- Fallar cerrado si dominio no resuelve tenant.

### 3.12 Auditoria no duradera

#### Deficiencia

El middleware de auditoria usa thread daemon por evento.

#### Evidencia

- `backend/apps/audit/middleware.py:73`: crea thread daemon para log de auditoria.

#### Impacto a Escala

Eventos criticos pueden perderse si el proceso muere antes de persistir. En pagos y documentos, esto rompe trazabilidad.

#### Solucion Estructural

- Auditoria critica dentro de transaccion o outbox persistente.
- Worker de procesamiento con reintentos.
- Nunca depender de daemon thread para eventos regulatorios.

## 4. Dictamen de Despliegue y Compliance

### 4.1 Resultado

El sistema no pasa una auditoria de grado empresarial.

Estado: NO APTO PARA PRODUCCION MULTI-TENANT.

### 4.2 Bloqueos antes de merge a produccion

- [ ] Ninguna ruta privada puede ejecutar query sin tenant validado.
- [ ] `TenantIsolationPermission` debe ser fail-closed.
- [ ] Todo object lookup privado debe filtrar por tenant.
- [ ] `perfil_id` debe eliminarse como fuente de identidad.
- [ ] `X-Tenant-ID` no puede aceptarse como autoridad directa.
- [ ] RLS debe estar aplicado en DB real y verificado por tests.
- [ ] DB context debe ser transaccional y obligatorio.
- [ ] Las rutas exentas de tenancy deben reducirse al minimo.
- [ ] Tokens no deben persistirse en `localStorage`.
- [ ] Roles no deben persistirse en `localStorage`.
- [ ] Cookies de sesion deben ser HttpOnly, Secure y server-issued.
- [ ] Proxy debe fallar cerrado si faltan env vars criticas.
- [ ] `user_metadata` no debe usarse para RBAC.
- [ ] Pagos deben tener idempotency key obligatoria.
- [ ] Webhooks deben rechazar eventos sin firma.
- [ ] Eventos de proveedor deben registrarse con constraint unico.
- [ ] Montos financieros no pueden convertirse a float.
- [ ] Inscripciones publicas deben ser tenant-scoped.
- [ ] Inscripciones deben tener constraint unico compatible con viajero nulo.
- [ ] Documentos y salud deben resolverse por join tenant.
- [ ] Exportaciones deben validar tenant.
- [ ] Asistente IA debe separar endpoints publicos y privados.
- [ ] Share tokens deben tener scope, expiracion y validacion de `is_public`.
- [ ] Tenant hardcodeado debe eliminarse.
- [ ] Docker debe ejecutar procesos como usuario no root.
- [ ] Compose productivo no puede tener secrets default.
- [ ] Backend productivo no puede usar `runserver`.
- [ ] Frontend no puede instalar dependencias ni compilar en runtime.
- [ ] Mock API debe estar prohibida por defecto en produccion.
- [ ] Todos los modelos deben cumplir la regla `managed=False` o documentar excepcion aprobada.
- [ ] Enums de roles y estados deben unificarse entre backend y frontend.
- [ ] `any` debe eliminarse de bordes de auth, API y formularios criticos.

### 4.3 Tests minimos exigidos

- Test: usuario tenant A no puede listar viajes tenant B.
- Test: usuario tenant A no puede leer pago tenant B.
- Test: usuario tenant A no puede aprobar documento tenant B.
- Test: request sin tenant a endpoint privado devuelve 403.
- Test: `X-Tenant-ID` ajeno no cambia tenant efectivo.
- Test: `perfil_id` por query no altera identidad.
- Test: dos inscripciones simultaneas generan un solo registro.
- Test: dos pagos simultaneos con misma idempotency key generan un solo pago.
- Test: webhook repetido se procesa una sola vez.
- Test: webhook sin firma se rechaza.
- Test: monto decimal conserva precision exacta.
- Test: frontend no compila produccion con mock API activa.
- Test: middleware/proxy bloquea sin env vars criticas.
- Test: rutas admin/superadmin no dependen de `localStorage`.

## 5. Plan de Reconstruccion Recomendado

### Fase 1: Cierre de fuga tenant

Objetivo: impedir fugas de datos entre agencias.

Acciones:

1. Reescribir permiso tenant a fail-closed.
2. Crear mixins tenant-scoped para DRF.
3. Reemplazar todos los `objects.all()` en rutas privadas.
4. Reemplazar todos los `get_object_or_404(Model, id=...)` por resolucion tenant-scoped.
5. Eliminar `perfil_id` en query params.
6. Corregir resolucion de tenant por dominio.
7. Crear tests cross-tenant para todos los modulos P0.

### Fase 2: Endurecimiento de auth

Objetivo: una sola fuente de identidad y sesiones no robables desde JS.

Acciones:

1. Mover sesion a cookie HttpOnly emitida por servidor.
2. Eliminar token y rol de `localStorage`.
3. Hacer que proxy falle cerrado.
4. Rechazar `user_metadata` como RBAC.
5. Cachear JWKS de forma segura.
6. Eliminar logs de token.

### Fase 3: Pagos e inscripciones ACID

Objetivo: evitar duplicados, carreras y corrupcion financiera.

Acciones:

1. Agregar idempotency key a pagos.
2. Agregar event store de webhooks.
3. Usar locks transaccionales.
4. Modelar dinero como decimal/string o minor units.
5. Agregar constraints unicas reales.
6. Rehacer renovacion de suscripciones con estado persistente.

### Fase 4: PII y documentos

Objetivo: proteger documentos, salud y exportaciones.

Acciones:

1. Todas las queries por join tenant.
2. Auditoria durable de lecturas y cambios.
3. Exportaciones con permisos estrictos.
4. Rate limits y trazabilidad para acciones sensibles.

### Fase 5: Infraestructura productiva

Objetivo: eliminar configuracion dev en runtime productivo.

Acciones:

1. Docker multi-stage.
2. Usuario no root.
3. Secrets sin defaults.
4. Gunicorn configurado.
5. Healthchecks y graceful shutdown.
6. Separar compose local de manifiestos productivos.

## 6. Conclusion Final

Totem HUB tiene base funcional de producto, pero no tiene todavia una base segura de SaaS multi-tenant. El riesgo no esta concentrado en un endpoint aislado: se repite en permisos, querysets, auth, frontend, pagos e infraestructura.

La decision tecnica correcta es bloquear produccion hasta reconstruir el perimetro tenant, la sesion, la idempotencia financiera y el despliegue. Cualquier avance funcional encima del estado actual aumenta superficie de ataque y deuda de correccion.


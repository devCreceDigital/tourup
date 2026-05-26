# SPEC: Módulo Inscripciones
> Spec-Driven Development — Fuente de verdad para implementación
> Módulo: `apps/inscripciones` (backend) + `app/viajes/[id]/inscripciones/` (frontend)
> Fase: MVP Core (P0)
> Última actualización: Mayo 2026

---

## 1. Problema que resuelve

Las agencias actualmente reciben inscripciones por email o formularios de Google. El admin consolida manualmente los datos en Excel. Los viajeros no tienen visibilidad de su estado. Los responsables de grupo tienen que llamar a la agencia para saber quién está inscrito.

**Objetivo:** Digitalizar el ciclo completo inscripción → confirmación → seguimiento para los tres actores (admin, responsable, viajero).

---

## 2. Actores y casos de uso

| Actor | Caso de uso | Prioridad |
|---|---|---|
| Viajero (alumno) | Inscribirse a un viaje desde la landing pública | P0 |
| Viajero | Ver su estado de inscripción, pagos y documentos | P0 |
| Admin | Ver y gestionar tabla completa de inscritos | P0 |
| Admin | Filtrar por estado pago/documentos, buscar por nombre | P0 |
| Admin | Exportar listado a Excel/CSV | P0 |
| Admin | Acciones masivas (enviar recordatorio, cambiar estado) | P1 |
| Responsable (profesor) | Ver listado de su grupo (solo lectura, sin datos de salud) | P1 |
| Responsable | Exportar PDF del grupo | P1 |

---

## 3. Modelos de datos

```python
# backend/apps/inscripciones/models.py

class Inscripcion(models.Model):
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    viajero         = models.ForeignKey('usuarios.Perfil', on_delete=models.PROTECT, related_name='inscripciones')
    viaje           = models.ForeignKey('viajes.Viaje', on_delete=models.PROTECT, related_name='inscripciones')
    datos_personales = models.JSONField(default=dict)   # nombre, dni, email, telefono, fecha_nacimiento
    tipo_habitacion = models.CharField(max_length=50, blank=True)  # individual | doble | triple | cuadruple
    estado          = models.CharField(max_length=50, default='pre_inscrito')
    # Estados: pre_inscrito | pendiente_pago | confirmado | cancelado
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'inscripciones'
        unique_together = [('viajero', 'viaje')]

class DatosSalud(models.Model):
    id                  = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    inscripcion         = models.OneToOneField(Inscripcion, on_delete=models.CASCADE, related_name='datos_salud')
    alergias            = models.TextField(blank=True)
    tratamientos        = models.TextField(blank=True)
    dieta_especial      = models.CharField(max_length=100, blank=True)
    movilidad_reducida  = models.BooleanField(default=False)
    contacto_emergencia = models.JSONField(default=dict)  # {nombre, telefono, relacion}

    class Meta:
        managed = False
        db_table = 'datos_salud'
```

---

## 4. API Endpoints

### 4.1 Endpoints requeridos

```
# Admin — gestión completa
GET    /api/viajes/{viaje_id}/inscripciones/          Listar inscritos del viaje (con filtros)
POST   /api/viajes/{viaje_id}/inscripciones/          Crear inscripción manual (admin)
GET    /api/inscripciones/{id}/                       Detalle inscripción
PUT    /api/inscripciones/{id}/                       Editar inscripción
DELETE /api/inscripciones/{id}/                       Cancelar inscripción
GET    /api/inscripciones/{id}/salud/                 Ver datos de salud (solo admin)
PUT    /api/inscripciones/{id}/salud/                 Actualizar datos de salud
GET    /api/viajes/{viaje_id}/inscripciones/exportar/ Exportar Excel/CSV
GET    /api/inscripciones/{id}/resumen/               Resumen extendido para panel lateral
POST   /api/viajes/{viaje_id}/inscripciones/acciones-masivas/  Recordatorio / cambio estado masivo

# Viajero — self-service
GET    /api/mis-inscripciones/                        Ver mis inscripciones
GET    /api/mis-inscripciones/{id}/                   Detalle de mi inscripción

# Pública — sin auth
POST   /api/public/viajes/{slug}/inscribirse/         Nueva inscripción desde landing
```

### 4.2 Parámetros de filtro (listado admin)

```
?estado=confirmado|pre_inscrito|pendiente_pago|cancelado
?pago=pendiente|parcial|completo
?documentos=completo|incompleto|faltante|pendiente
?buscar=nombre_o_email
?ordering=created_at|-created_at|nombre
?page=1&page_size=20
```

### 4.3 Respuesta del listado (schema)

```json
{
  "count": 45,
  "next": "...",
  "results": [
    {
      "id": "uuid",
      "viajero": { "id": "uuid", "nombre": "Carla López", "email": "carla@email.com" },
      "estado": "confirmado",
      "tipo_habitacion": "doble",
      "pago_estado": "parcial",       // calculado desde app pagos
      "documentos_estado": "incompleto", // calculado desde app documentos
      "docs_estado": "incompleto", // alias temporal de compatibilidad
      "created_at": "2026-03-15T10:30:00Z"
    }
  ]
}
```

### 4.4 Exportación

```bash
GET /api/viajes/{viaje_id}/inscripciones/exportar/?formato=csv
GET /api/viajes/{viaje_id}/inscripciones/exportar/?formato=json
```

- `csv`: descarga archivo.
- `json`: retorna `count` y `results` con el mismo shape del listado.
- Respeta filtros de listado (`estado`, `buscar`, `ordering`, `pago`, `documentos`).

### 4.5 Resumen de inscripción (schema)

```json
{
  "id": "uuid",
  "estado": "pre_inscrito",
  "viajero": "uuid",
  "viajero_nombre": "Carla López",
  "viajero_email": "carla@email.com",
  "viaje": "uuid",
  "viaje_nombre": "Cusco 2026",
  "tipo_habitacion": "doble",
  "created_at": "2026-03-15T10:30:00Z",
  "updated_at": "2026-03-16T10:30:00Z",
  "pago_estado": "pendiente",
  "documentos_estado": "pendiente",
  "docs_estado": "pendiente",
  "datos_personales_completitud": 80,
  "datos_salud_completitud": 60
}
```

---

## 5. Serializers

```python
# backend/apps/inscripciones/serializers.py

class DatosSaludSerializer(serializers.ModelSerializer):
    class Meta:
        model = DatosSalud
        fields = ['alergias', 'tratamientos', 'dieta_especial', 'movilidad_reducida', 'contacto_emergencia']

class InscripcionListSerializer(serializers.ModelSerializer):
    """Serializer para tabla de inscritos (admin). Incluye estados calculados."""
    viajero_nombre = serializers.CharField(source='viajero.nombre', read_only=True)
    viajero_email  = serializers.CharField(source='viajero.email', read_only=True)
    pago_estado    = serializers.SerializerMethodField()
    docs_estado    = serializers.SerializerMethodField()

    def get_pago_estado(self, obj):
        from apps.pagos.utils import calcular_estado_pago
        return calcular_estado_pago(obj)

    def get_docs_estado(self, obj):
        from apps.documentos.utils import calcular_estado_docs
        return calcular_estado_docs(obj)

class InscripcionDetailSerializer(serializers.ModelSerializer):
    """Serializer detalle. datos_salud solo visible para admin."""
    datos_salud = DatosSaludSerializer(read_only=True)

class InscripcionPublicaSerializer(serializers.ModelSerializer):
    """Serializer para inscripción desde landing pública. Sin auth."""
    class Meta:
        fields = ['datos_personales', 'tipo_habitacion']
        # viajero se crea/obtiene automáticamente del token de nueva cuenta
```

---

## 6. Vistas (Views)

```python
# backend/apps/inscripciones/views.py

class InscripcionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminOrOwner]
    pagination_class   = StandardPagination
    filter_backends    = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields   = ['estado']
    search_fields      = ['viajero__nombre', 'viajero__email']
    ordering_fields    = ['created_at', 'viajero__nombre']

    def get_queryset(self):
        viaje_id = self.kwargs.get('viaje_id')
        qs = Inscripcion.objects.select_related('viajero', 'datos_salud')
        if viaje_id:
            qs = qs.filter(viaje_id=viaje_id)
        # Si es profesor, filtrar solo su grupo
        if self.request.user.rol == 'profesor':
            qs = qs.filter(viaje__responsable=self.request.user)
        return qs

    @action(detail=False, methods=['get'])
    def exportar(self, request, viaje_id=None):
        """Exporta inscritos a Excel. Admin only."""
        # Implementar con openpyxl
        pass

class InscripcionPublicaView(generics.CreateAPIView):
    """Inscripción desde landing. No requiere auth previa."""
    permission_classes = [AllowAny]
    serializer_class   = InscripcionPublicaSerializer

    def perform_create(self, serializer):
        viaje = get_object_or_404(Viaje, slug=self.kwargs['slug'], estado='publicado')
        # 1. Crear/obtener cuenta Supabase del viajero
        # 2. Crear inscripción en estado pre_inscrito
        # 3. Disparar notificación de confirmación (apps.notificaciones)
        serializer.save(viaje=viaje, estado='pre_inscrito')
```

---

## 7. Frontend — Componentes requeridos

### 7.1 Tab Inscripciones (backoffice admin)

**Ruta:** `app/viajes/[id]/inscripciones/page.tsx`

**Componentes:**
- `TablaInscritos` — tabla paginada con columnas: Nombre, Estado inscripción, Pago, Documentos, Habitación, Acciones
- `FiltrosInscritos` — dropdowns de estado, pago, documentos + buscador
- `BotonExportar` — dispara GET a `/exportar/`
- `AccionesMasivas` — checkbox + acciones sobre seleccionados (recordatorio, cambiar estado)
- `DrawerDetalleInscripcion` — panel lateral con datos completos del viajero

**Colores de estado:**
```tsx
const estadoPagoBadge = {
  completo:  { bg: '#E3F9EC', text: '#1A8A4A', label: 'Al corriente' },
  parcial:   { bg: '#FFF3E0', text: '#F59E0B', label: 'Parcial' },
  pendiente: { bg: '#FDE2E2', text: '#EF4444', label: 'Pendiente' },
}
```

### 7.2 Portal viajero — Mi inscripción

**Ruta:** `app/mi-viaje/[id]/page.tsx`

**Secciones:**
- Resumen del viaje (nombre, fechas, estado inscripción)
- Plan de pagos con estado de cada cuota (→ botón Pagar)
- Checklist de documentos con estado (→ botón Subir)
- Datos de mi habitación (una vez asignada)

### 7.3 Landing pública — Formulario inscripción

**Ruta:** `app/viajes/[slug]/inscribirse/page.tsx`

**Steps del wizard:**
1. Crear cuenta (email + contraseña) o login
2. Datos personales (nombre, DNI, email, teléfono, fecha nacimiento)
3. Datos de salud (alergias, tratamientos, dieta, movilidad, contacto emergencia)
4. Selección de habitación (según tipos disponibles en el viaje)
5. Resumen + confirmación
6. Pago de cuota inicial (→ redirige a módulo pagos)

---

## 8. Validaciones de negocio

| Regla | Dónde validar |
|---|---|
| Un viajero no puede inscribirse dos veces al mismo viaje | Serializer (`unique_together`) + mensaje de error claro |
| Solo se puede inscribir a viajes en estado `publicado` | View `perform_create` |
| El tipo de habitación debe existir en el viaje | Serializer field validation |
| Datos de salud: contacto emergencia es obligatorio | Serializer |
| Admin no puede crear inscripción si viaje está `cancelado` | View |

---

## 9. Notificaciones automáticas disparadas

| Evento | Plantilla | Receptor |
|---|---|---|
| Inscripción creada | `inscripcion_confirmada` | Viajero |
| Estado cambia a `confirmado` | `inscripcion_aprobada` | Viajero |
| Estado cambia a `cancelado` | `inscripcion_cancelada` | Viajero |

Implementar en `apps/notificaciones` — llamar desde `signals.py` o desde el `perform_create` de la view.

---

## 10. Criterios de aceptación (Definition of Done)

- [ ] Viajero puede completar inscripción desde landing en < 10 minutos
- [ ] Admin ve tabla de inscritos con filtros y paginación funcionando
- [ ] Exportación a Excel con todos los campos (sin datos de salud para rol profesor)
- [ ] Email de confirmación enviado al completar inscripción
- [ ] Datos de salud visibles solo para admin (no para profesor ni otros viajeros)
- [ ] Inscripción duplicada devuelve error 400 con mensaje claro
- [ ] Todos los campos requeridos validados en frontend y backend
- [ ] Tests escritos para: crear inscripción, inscripción duplicada, exportar, permisos por rol

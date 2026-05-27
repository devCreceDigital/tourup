# SPEC: Módulo Documentos
> Spec-Driven Development — Fuente de verdad para implementación
> Módulo: `apps/documentos` (backend)
> Fase: MVP Core (P0)
> Última actualización: Mayo 2026

---

## 1. Objetivo

Permitir al viajero subir documentos de su inscripción y al admin revisarlos (aprobar/rechazar) con trazabilidad simple en MVP.

---

## 2. Estados

### 2.1 Estado por documento (`DocumentoViajero.estado`)
- `pendiente`
- `subido`
- `en_revision`
- `aprobado`
- `rechazado`

### 2.2 Estado agregado por inscripción (`documentos_estado`)
- `pendiente`: no hay documentos cargados.
- `incompleto`: hay carga parcial o en revisión.
- `faltante`: existe al menos un documento rechazado.
- `completo`: todos los documentos de la inscripción están aprobados.

---

## 3. Modelo

```python
class DocumentoViajero(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    inscripcion = models.ForeignKey("inscripciones.Inscripcion", related_name="documentos", on_delete=models.PROTECT)
    nombre = models.CharField(max_length=150)
    tipo = models.CharField(max_length=80, blank=True)
    archivo_url = models.URLField(max_length=500, blank=True)
    estado = models.CharField(max_length=30, default="pendiente")
    obligatorio = models.BooleanField(default=True)
    motivo_rechazo = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    fecha_revision = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = "documentos_viajero"
```

---

## 4. Endpoints

```bash
GET  /api/inscripciones/{inscripcion_id}/documentos/
POST /api/inscripciones/{inscripcion_id}/documentos/
GET  /api/documentos/{id}/
POST /api/documentos/{id}/aprobar/
POST /api/documentos/{id}/rechazar/
```

### 4.1 Listar documentos de inscripción

- Método: `GET`
- Ruta: `/api/inscripciones/{inscripcion_id}/documentos/`
- Permisos:
  - `admin`, `profesor`: pueden listar cualquier inscripción.
  - `alumno`: solo su propia inscripción.

Respuesta ejemplo:

```json
[
  {
    "id": "uuid",
    "inscripcion": "uuid",
    "nombre": "DNI",
    "tipo": "dni",
    "archivo_url": "https://files.example/dni.pdf",
    "estado": "en_revision",
    "obligatorio": true,
    "motivo_rechazo": "",
    "metadata": {},
    "fecha_revision": null,
    "created_at": "2026-05-03T10:30:00Z",
    "updated_at": "2026-05-03T10:30:00Z"
  }
]
```

### 4.2 Subir documento

- Método: `POST`
- Ruta: `/api/inscripciones/{inscripcion_id}/documentos/`
- Permisos:
  - `admin`: permitido.
  - `alumno`: solo en su propia inscripción.
  - `profesor`: denegado.

Request ejemplo:

```json
{
  "nombre": "Pasaporte",
  "tipo": "pasaporte",
  "archivo_url": "https://files.example/pasaporte.pdf",
  "obligatorio": true,
  "metadata": {
    "origen": "portal_viajero"
  }
}
```

Reglas:
- `archivo_url` es obligatorio.
- Al crear se guarda en estado `en_revision`.

### 4.3 Aprobar documento

- Método: `POST`
- Ruta: `/api/documentos/{id}/aprobar/`
- Permiso: solo `admin`.
- Efecto:
  - `estado = aprobado`
  - `motivo_rechazo = ""`
  - `fecha_revision = now`

### 4.4 Rechazar documento

- Método: `POST`
- Ruta: `/api/documentos/{id}/rechazar/`
- Permiso: solo `admin`.

Request ejemplo:

```json
{
  "motivo_rechazo": "Documento ilegible. Subir nuevamente."
}
```

Reglas:
- `motivo_rechazo` obligatorio.
- Efecto:
  - `estado = rechazado`
  - `fecha_revision = now`

---

## 5. Integración con Inscripciones

- `InscripcionListSerializer` y `InscripcionResumenSerializer` calculan:
  - `docs_estado`
  - `documentos_estado` (alias)
- Fuente de cálculo: `apps.documentos.utils.calcular_estado_docs(inscripcion)`.
- El filtro `?documentos=` del listado de inscripciones soporta:
  - `completo`
  - `incompleto`
  - `faltante`
  - `pendiente`

---

## 6. Criterios de aceptación

- [ ] Alumno sube documento y queda en `en_revision`.
- [ ] Admin puede aprobar/rechazar con motivo en rechazo.
- [ ] Profesor no puede subir ni aprobar/rechazar.
- [ ] `documentos_estado` se refleja en listado/resumen de inscripciones.
- [ ] Filtro `?documentos=` retorna resultados consistentes con estado calculado.

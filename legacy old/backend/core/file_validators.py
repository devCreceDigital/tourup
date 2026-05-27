import os
from django.core.exceptions import ValidationError

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp"}

MAX_FILE_SIZE_MB = 10
MAX_FILE_SIZE    = MAX_FILE_SIZE_MB * 1024 * 1024

# Magic bytes → MIME type
_MAGIC_SIGNATURES = [
    (b"\x25\x50\x44\x46", "application/pdf"),   # PDF
    (b"\xff\xd8\xff",      "image/jpeg"),         # JPEG
    (b"\x89\x50\x4e\x47", "image/png"),           # PNG
    (b"\x47\x49\x46\x38", "image/gif"),           # GIF87a / GIF89a
    (b"\x52\x49\x46\x46", "image/webp"),          # WEBP (RIFF…WEBP)
]


def _detect_mime(file_obj) -> str | None:
    header = file_obj.read(12)
    file_obj.seek(0)
    for sig, mime in _MAGIC_SIGNATURES:
        if header.startswith(sig):
            if mime == "image/webp":
                # Confirmar que sea WEBP y no solo RIFF genérico
                return mime if header[8:12] == b"WEBP" else None
            return mime
    return None


def validate_file_extension(value):
    ext = os.path.splitext(value.name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(
            f"Extensión '{ext}' no permitida. Extensiones válidas: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )


def validate_file_size(value):
    if value.size > MAX_FILE_SIZE:
        raise ValidationError(
            f"El archivo supera el límite de {MAX_FILE_SIZE_MB} MB "
            f"(tamaño actual: {value.size / (1024*1024):.1f} MB)."
        )


def validate_file_mime(value):
    mime = _detect_mime(value)
    if mime is None:
        raise ValidationError(
            "Tipo de archivo no reconocido. Solo se permiten: PDF, JPEG, PNG, GIF, WEBP."
        )


def validate_upload(value):
    """Validador completo: extensión + tamaño + magic bytes MIME."""
    validate_file_extension(value)
    validate_file_size(value)
    validate_file_mime(value)


def validate_upload_url(url: str) -> str:
    """Valida la extensión de una URL de archivo (uploads vía Supabase/S3).

    No puede verificar tamaño ni magic bytes porque el archivo ya está en storage.
    Raises ValidationError si la extensión no está permitida.
    """
    from urllib.parse import urlparse
    path = urlparse(url).path
    # Strip query params that could be part of signed URLs
    ext = os.path.splitext(path.split("?")[0])[1].lower()
    if not ext:
        raise ValidationError("La URL no contiene una extensión de archivo reconocible.")
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(
            f"Extensión '{ext}' no permitida. Extensiones válidas: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

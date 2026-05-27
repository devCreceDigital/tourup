from rest_framework.throttling import SimpleRateThrottle, UserRateThrottle


class BurstRateThrottle(UserRateThrottle):
    """60 requests/minuto por usuario — protege contra ráfagas."""
    scope = "burst"


class SustainedRateThrottle(UserRateThrottle):
    """1000 requests/hora por usuario — límite sostenido."""
    scope = "sustained"


class LoginRateThrottle(SimpleRateThrottle):
    """10 intentos de login por minuto por IP — anti brute-force."""
    scope = "login"

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }


class InscripcionRateThrottle(UserRateThrottle):
    """20 inscripciones por hora por usuario."""
    scope = "inscripcion"


class UploadRateThrottle(UserRateThrottle):
    """30 uploads por hora por usuario."""
    scope = "upload"


class PagoRateThrottle(UserRateThrottle):
    """30 intentos de pago por hora por usuario."""
    scope = "pago"


class AnonRateThrottle(SimpleRateThrottle):
    """100 requests/minuto para anónimos."""
    scope = "anon"

    def get_cache_key(self, request, view):
        if request.user and getattr(request.user, "is_authenticated", False):
            return None  # authenticated users use their own throttle
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }

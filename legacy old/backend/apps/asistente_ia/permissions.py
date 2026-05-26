from rest_framework.throttling import AnonRateThrottle
from django.conf import settings
import hashlib


class AsistenteIARateThrottle(AnonRateThrottle):
    """Rate limiting específico para el módulo Asistente IA"""
    
    scope = 'asistente_ia'
    
    def get_cache_key(self, request, view):
        """Genera clave de caché basada en IP hasheada"""
        if settings.DEBUG:
            # En desarrollo local evitamos bloqueos por throttle para acelerar pruebas.
            return None

        ident = self.get_ident(request)
        
        # Hashear la IP para privacidad
        ip_hash = hashlib.sha256(ident.encode('utf-8')).hexdigest()[:16]
        
        # Determinar el scope según el endpoint
        if hasattr(view, 'throttle_scope'):
            scope = view.throttle_scope
        else:
            scope = self.scope
            
        return f"asistente_ia:ratelimit:{ip_hash}:{scope}"


class SessionRateThrottle(AsistenteIARateThrottle):
    """5 sesiones por hora por IP"""
    scope = 'sessions'
    rate = '5/hour'

    def get_rate(self):
        if settings.DEBUG:
            return '100/hour'
        return super().get_rate()


class MessageRateThrottle(AsistenteIARateThrottle):
    """10 mensajes por hora por IP"""
    scope = 'messages'
    rate = '10/hour'

    def get_rate(self):
        if settings.DEBUG:
            return '500/hour'
        return super().get_rate()


class LeadRateThrottle(AsistenteIARateThrottle):
    """3 leads por hora por IP"""
    scope = 'leads'
    rate = '3/hour'

    def get_rate(self):
        if settings.DEBUG:
            return '100/hour'
        return super().get_rate()

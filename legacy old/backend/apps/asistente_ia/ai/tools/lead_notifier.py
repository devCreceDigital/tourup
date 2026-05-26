import json
import os
from urllib import request as urllib_request

from django.db import connection


class LeadNotifier:
    """Envia notificaciones de lead a la agencia via Resend."""

    def __init__(self):
        self.api_key = os.getenv("RESEND_API_KEY", "")
        self.from_email = os.getenv("RESEND_FROM_EMAIL", "noreply@totemhub.com")

    def _get_company_admin_email(self, company_id):
        # Tabla companies es externa al modulo; usamos SQL directo para no acoplar models.
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT email FROM companies WHERE id = %s LIMIT 1",
                [str(company_id)],
            )
            row = cursor.fetchone()
            return row[0] if row else None

    def _build_html(self, lead):
        intent = lead.intent_data or {}
        trip = str(lead.matched_trip_id) if lead.matched_trip_id else "No especificado"
        msg = lead.traveler_msg or "Sin mensaje adicional."
        return f"""
        <h2>Nuevo lead de Asistente IA</h2>
        <p><strong>Viajero:</strong> {lead.traveler_name} ({lead.traveler_email})</p>
        <p><strong>Viaje consultado:</strong> {trip}</p>
        <p><strong>Match score:</strong> {lead.match_score}</p>
        <p><strong>Intención detectada:</strong></p>
        <pre>{json.dumps(intent, ensure_ascii=False, indent=2)}</pre>
        <p><strong>Mensaje:</strong> {msg}</p>
        """

    def send(self, lead):
        to_email = self._get_company_admin_email(lead.company_id)
        if not to_email:
            return False

        if not self.api_key:
            # En local sin credenciales, no rompemos flujo del endpoint.
            return False

        payload = {
            "from": self.from_email,
            "to": [to_email],
            "subject": f"Nuevo lead de Asistente IA — {lead.traveler_name}",
            "html": self._build_html(lead),
        }

        req = urllib_request.Request(
            url="https://api.resend.com/emails",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib_request.urlopen(req, timeout=15):
                return True
        except Exception:
            return False


lead_notifier = LeadNotifier()

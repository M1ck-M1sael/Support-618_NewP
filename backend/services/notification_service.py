"""
Support-618 - Notification Service (StackTON)
Integración asíncrona con AWS SES (Email) y AWS SNS (SMS)
Incluye control de costos/cuotas para SMS y validación estricta de preferencias JSONB.
"""

import asyncio
import logging
import time
from typing import Optional, Dict
from collections import defaultdict

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from backend.core.config import settings
from backend.models import User, Ticket, TicketPriority

logger = logging.getLogger("notifications.service")

# Clientes Boto3 para SES y SNS
ses_client = boto3.client(
    "ses",
    region_name=settings.AWS_REGION,
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
)

sns_client = boto3.client(
    "sns",
    region_name=settings.AWS_REGION,
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
)


class SMSCostGuard:
    """
    Protección Anti-Spam y Control de Costos para AWS SNS.
    Registra timestamps de SMS despachados por usuario en una ventana deslizante de 24 horas.
    En un entorno distribuido multi-instancia, esto se respalda en Redis con TTL (INCR + EXPIRE).
    """
    def __init__(self, max_per_day: int = 3):
        self.max_per_day = max_per_day
        # user_id -> lista de timestamps
        self._history: Dict[str, list] = defaultdict(list)

    def can_send(self, user_id: str) -> bool:
        now = time.time()
        one_day_ago = now - 86400

        # Limpiar registros más antiguos a 24h
        valid_timestamps = [ts for ts in self._history[user_id] if ts > one_day_ago]
        self._history[user_id] = valid_timestamps

        return len(valid_timestamps) < self.max_per_day

    def record_send(self, user_id: str):
        self._history[user_id].append(time.time())


sms_cost_guard = SMSCostGuard(max_per_day=settings.SNS_MAX_SMS_PER_USER_DAY)


# --------------------------------------------------------------------------
# PLANTILLAS DE NOTIFICACIÓN
# --------------------------------------------------------------------------

class NotificationTemplates:
    @staticmethod
    def ticket_created_email(ticket_number: str, title: str, client_name: str) -> str:
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; }}
                .container {{ max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 32px; }}
                .badge {{ display: inline-block; background: #3b82f6; color: white; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 13px; }}
                .btn {{ display: inline-block; background: #6366f1; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 20px; }}
                .footer {{ margin-top: 32px; border-top: 1px solid #334155; padding-top: 16px; font-size: 12px; color: #94a3b8; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div style="font-weight: bold; color: #818cf8; font-size: 18px; margin-bottom: 12px;">StackTON Support-618</div>
                <h2 style="margin: 0 0 16px 0;">Hemos recibido tu solicitud de soporte</h2>
                <p>Hola <strong>{client_name}</strong>,</p>
                <p>Tu ticket ha sido registrado en nuestra cola de atención con el código:</p>
                <div style="margin: 18px 0;"><span class="badge">{ticket_number}</span> - {title}</div>
                <p>Uno de nuestros ingenieros de soporte comenzará a revisar tu caso en breve.</p>
                <a href="{settings.FRONTEND_URL}/tickets/{ticket_number}" class="btn">Ver estado en Customer Portal</a>
                <div class="footer">
                    StackTON Systems S.A. de C.V. &bull; Mesa de Ayuda y Operaciones
                </div>
            </div>
        </body>
        </html>
        """

    @staticmethod
    def agent_reply_email(ticket_number: str, agent_name: str, client_name: str, message_snippet: str) -> str:
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; }}
                .container {{ max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 32px; }}
                .message-box {{ background: #0f172a; border-left: 4px solid #6366f1; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0; font-style: italic; }}
                .btn {{ display: inline-block; background: #6366f1; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; }}
                .footer {{ margin-top: 32px; border-top: 1px solid #334155; padding-top: 16px; font-size: 12px; color: #94a3b8; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div style="font-weight: bold; color: #818cf8; font-size: 18px; margin-bottom: 12px;">StackTON Support-618</div>
                <h3 style="margin: 0 0 16px 0;">Nueva respuesta en tu Ticket {ticket_number}</h3>
                <p>Hola <strong>{client_name}</strong>,</p>
                <p>El especialista <strong>{agent_name}</strong> ha respondido a tu consulta:</p>
                <div class="message-box">"{message_snippet}"</div>
                <a href="{settings.FRONTEND_URL}/tickets/{ticket_number}" class="btn">Responder en el Portal</a>
                <div class="footer">
                    Puedes responder directamente entrando a tu portal de autoservicio.
                </div>
            </div>
        </body>
        </html>
        """

    @staticmethod
    def critical_incident_sms(ticket_number: str) -> str:
        """SMS conciso (<=140 caracteres) para evitar cobro de múltiples segmentos en AWS SNS."""
        return f"[StackTON 618] ALERTA: Ticket critico {ticket_number} generado. Ingeniero en guardia asignado."


# --------------------------------------------------------------------------
# SERVICIO DE DESPACHO
# --------------------------------------------------------------------------

class NotificationService:
    @staticmethod
    async def send_email_notification(
        user: User, 
        subject: str, 
        body_html: str
    ) -> bool:
        """
        Envío asíncrono con AWS SES validando preferencias del usuario.
        """
        # Verificación de preferencias de usuario (JSONB)
        prefs = user.notification_preferences or {}
        if not prefs.get("email_notifications", True):
            logger.info(f"Email omitido para {user.email}: el usuario desactivó notificaciones por correo.")
            return False

        def _ses_send():
            return ses_client.send_email(
                Source=settings.AWS_SES_SENDER_EMAIL,
                Destination={"ToAddresses": [user.email]},
                Message={
                    "Subject": {"Data": subject, "Charset": "UTF-8"},
                    "Body": {"Html": {"Data": body_html, "Charset": "UTF-8"}},
                },
            )

        try:
            response = await asyncio.to_thread(_ses_send)
            message_id = response.get("MessageId")
            logger.info(f"Email SES despachado con éxito a {user.email} [MessageId: {message_id}]")
            return True
        except (BotoCoreError, ClientError) as e:
            logger.error(f"Fallo al enviar correo SES a {user.email}: {str(e)}")
            return False

    @staticmethod
    async def send_sms_alert(
        user: User, 
        message: str,
        priority: TicketPriority = TicketPriority.URGENT
    ) -> bool:
        """
        Envío asíncrono con AWS SNS sujeto a validación de:
        1. Teléfono configurado.
        2. Preferencia de usuario activa (`sms_critical_alerts`).
        3. Prioridad crítica (exclusivo para URGENT para mitigar costos).
        4. Cuota diaria (SMSCostGuard).
        """
        if not user.phone_number:
            logger.debug(f"SMS omitido para {user.email}: no tiene número telefónico configurado.")
            return False

        # Solo despachar SMS en incidentes de máxima prioridad
        if priority != TicketPriority.URGENT:
            logger.debug(f"SMS omitido para {user.email}: la prioridad '{priority.value}' no califica para alerta SMS.")
            return False

        # Validación en preferencias JSONB
        prefs = user.notification_preferences or {}
        if not prefs.get("sms_critical_alerts", False):
            logger.info(f"SMS omitido para {user.email}: el cliente tiene desactivadas las alertas SMS.")
            return False

        user_id_str = str(user.id)
        if not sms_cost_guard.can_send(user_id_str):
            logger.warning(
                f"RATE LIMIT EXCEEDED: SMS bloqueado para usuario {user.email}. "
                f"Límite máximo de {settings.SNS_MAX_SMS_PER_USER_DAY} SMS/24h alcanzado."
            )
            return False

        def _sns_send():
            return sns_client.publish(
                PhoneNumber=user.phone_number,
                Message=message,
                MessageAttributes={
                    "AWS.SNS.SMS.SMSType": {
                        "DataType": "String",
                        "StringValue": "Transactional"
                    }
                }
            )

        try:
            response = await asyncio.to_thread(_sns_send)
            sms_cost_guard.record_send(user_id_str)
            logger.info(f"SMS SNS despachado con éxito a {user.phone_number} [MessageId: {response.get('MessageId')}]")
            return True
        except (BotoCoreError, ClientError) as e:
            logger.error(f"Fallo al enviar SMS SNS a {user.phone_number}: {str(e)}")
            return False

"""
Support-618 - Stripe Integration Service (StackTON)
Manejo Asíncrono no bloqueante (I/O) de la API oficial de Stripe.
Usa asyncio.to_thread para evitar bloquear el Event Loop de FastAPI.
"""

import asyncio
from typing import Optional, Dict, Any
import stripe
from fastapi import HTTPException, status

from backend.core.config import settings
from backend.models import User

# Configuración de clave secreta del SDK de Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeService:
    @staticmethod
    async def create_customer(user: User) -> str:
        """
        Registra al usuario en Stripe para asociar suscripciones y métodos de pago.
        Ejecución asíncrona no bloqueante mediante asyncio.to_thread.
        """
        def _sync_create():
            return stripe.Customer.create(
                email=user.email,
                name=user.full_name,
                metadata={
                    "user_id": str(user.id),
                    "company_name": user.company_name or "Individual",
                    "role": user.role.value
                }
            )

        try:
            customer = await asyncio.to_thread(_sync_create)
            return customer.id
        except stripe.error.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Error al comunicar con la pasarela de pagos: {str(e.user_message or e)}"
            )

    @staticmethod
    async def create_customer_portal_session(
        customer_id: str, 
        return_url: Optional[str] = None
    ) -> str:
        """
        Genera una URL temporal y firmada del Stripe Customer Portal de manera no bloqueante.
        Permite al cliente actualizar tarjetas, consultar facturas o cancelar planes.
        """
        if not customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El usuario no tiene una cuenta de facturación vinculada en Stripe"
            )

        destination_return_url = return_url or f"{settings.FRONTEND_URL}/billing"

        def _sync_portal():
            return stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=destination_return_url,
            )

        try:
            portal_session = await asyncio.to_thread(_sync_portal)
            return portal_session.url
        except stripe.error.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Error al generar sesión del portal de facturación: {str(e.user_message or e)}"
            )

    @staticmethod
    async def create_checkout_session(
        user: User,
        price_id: str,
        mode: str = "subscription",
        success_url: Optional[str] = None,
        cancel_url: Optional[str] = None,
        extra_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, str]:
        """
        Genera una sesión de Stripe Checkout para contratación de soporte o suscripción.
        Ejecución asíncrona no bloqueante.
        """
        if not user.stripe_customer_id:
            customer_id = await StripeService.create_customer(user)
        else:
            customer_id = user.stripe_customer_id

        final_success_url = (
            success_url or f"{settings.FRONTEND_URL}/billing/success?session_id={{CHECKOUT_SESSION_ID}}"
        )
        final_cancel_url = cancel_url or f"{settings.FRONTEND_URL}/billing"

        metadata = {
            "user_id": str(user.id),
            "email": user.email,
            **(extra_metadata or {})
        }

        def _sync_checkout():
            return stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=["card"],
                line_items=[
                    {
                        "price": price_id,
                        "quantity": 1,
                    },
                ],
                mode=mode,
                success_url=final_success_url,
                cancel_url=final_cancel_url,
                metadata=metadata,
                customer_update={
                    "name": "auto",
                    "address": "auto"
                }
            )

        try:
            checkout_session = await asyncio.to_thread(_sync_checkout)
            return {
                "checkout_url": checkout_session.url,
                "session_id": checkout_session.id
            }
        except stripe.error.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Error al iniciar checkout en Stripe: {str(e.user_message or e)}"
            )

    @staticmethod
    def verify_webhook_signature(payload: bytes, sig_header: str) -> stripe.Event:
        """
        Valida criptográficamente la firma del webhook con el STRIPE_WEBHOOK_SECRET.
        Operación en memoria CPU-bound rápida (HMAC SHA-256).
        """
        try:
            event = stripe.Webhook.construct_event(
                payload=payload,
                sig_header=sig_header,
                secret=settings.STRIPE_WEBHOOK_SECRET
            )
            return event
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payload de webhook inválido"
            )
        except stripe.error.SignatureVerificationError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Firma criptográfica del webhook no coincide"
            )

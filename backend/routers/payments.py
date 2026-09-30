"""
Support-618 - Payments & Billing Router (StackTON)
Endpoints asíncronos y seguros para Stripe Customer Portal, Checkout Sessions y Webhooks.
"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.deps import get_current_user, get_db
from backend.models import User
from backend.schemas.payment import (
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    PortalSessionResponse,
    WebhookResponse,
)
from backend.services.stripe_service import StripeService

logger = logging.getLogger("payments.router")

router = APIRouter(prefix="/payments", tags=["Payments & Stripe Billing"])


@router.post(
    "/portal",
    response_model=PortalSessionResponse,
    summary="Generar URL del Stripe Customer Portal",
    description="Crea una sesión firmada para que el usuario gestione sus métodos de pago, planes y descargue facturas.",
)
async def create_portal_session(
    return_url: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retorna la URL hacia donde el frontend debe redirigir al usuario.
    Si el usuario no tiene stripe_customer_id, se crea de forma asíncrona y
    se persiste inmediatamente en PostgreSQL con db.commit().
    """
    if not current_user.stripe_customer_id:
        customer_id = await StripeService.create_customer(current_user)
        current_user.stripe_customer_id = customer_id
        
        # Persistencia en base de datos PostgreSQL
        if db is not None:
            db.add(current_user)
            await db.commit()
            await db.refresh(current_user)

    portal_url = await StripeService.create_customer_portal_session(
        customer_id=current_user.stripe_customer_id,
        return_url=return_url
    )
    return PortalSessionResponse(portal_url=portal_url)


@router.post(
    "/checkout",
    response_model=CheckoutSessionResponse,
    summary="Generar sesión de Stripe Checkout",
    description="Inicia el flujo asíncrono para adquirir un paquete de soporte técnico o suscripción mensual.",
)
async def create_checkout_session(
    payload: CheckoutSessionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Crea la sesión de checkout en Stripe de forma no bloqueante y retorna la URL segura.
    Si se aprovisionó un nuevo customer_id durante el checkout, se persiste en base de datos.
    """
    had_no_customer_id = current_user.stripe_customer_id is None

    session_data = await StripeService.create_checkout_session(
        user=current_user,
        price_id=payload.price_id,
        mode=payload.mode,
        success_url=payload.success_url,
        cancel_url=payload.cancel_url,
        extra_metadata=payload.metadata
    )

    if had_no_customer_id and current_user.stripe_customer_id and db is not None:
        db.add(current_user)
        await db.commit()
        await db.refresh(current_user)

    return CheckoutSessionResponse(
        checkout_url=session_data["checkout_url"],
        session_id=session_data["session_id"]
    )


# Sub-router para Webhooks
webhook_router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@webhook_router.post(
    "/stripe",
    response_model=WebhookResponse,
    summary="Recepción asíncrona de Webhooks de Stripe",
    description="Valida la firma criptográfica y actualiza el estado de la suscripción en PostgreSQL.",
)
async def handle_stripe_webhook(
    request: Request,
    stripe_signature: str = Header(..., alias="stripe-signature"),
    db: AsyncSession = Depends(get_db)
):
    """
    PUNTO CRÍTICO DE SEGURIDAD Y PERSISTENCIA:
    - Se lee el payload RAW (bytes) usando request.body() para validar la firma.
    - Sincroniza localmente subscription_status y subscription_id en el modelo User
      para evitar latencias y llamadas constantes a la API de Stripe en el frontend.
    """
    raw_payload = await request.body()
    event = StripeService.verify_webhook_signature(raw_payload, stripe_signature)

    event_type = event["type"]
    event_data = event["data"]["object"]

    logger.info(f"Webhook recibido de Stripe: {event_type} [ID: {event.get('id')}]")

    customer_id = event_data.get("customer")

    # Helper interno para buscar usuario por stripe_customer_id
    async def get_user_by_customer_id(cid: str) -> Optional[User]:
        if not cid or db is None:
            return None
        stmt = select(User).where(User.stripe_customer_id == cid)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    match event_type:
        case "customer.subscription.created" | "customer.subscription.updated":
            status_sub = event_data.get("status")
            subscription_id = event_data.get("id")
            logger.info(f"Suscripción {subscription_id} actualizada a '{status_sub}' para customer {customer_id}")

            user = await get_user_by_customer_id(customer_id)
            if user:
                user.subscription_status = status_sub
                user.subscription_id = subscription_id
                db.add(user)
                await db.commit()
                logger.info(f"Usuario {user.id} actualizado con subscription_status='{status_sub}'")
            else:
                logger.warning(f"No se encontró usuario en DB para stripe_customer_id={customer_id}")

        case "customer.subscription.deleted":
            subscription_id = event_data.get("id")
            logger.warning(f"Suscripción {subscription_id} cancelada para customer {customer_id}")

            user = await get_user_by_customer_id(customer_id)
            if user:
                user.subscription_status = "canceled"
                db.add(user)
                await db.commit()
                logger.info(f"Usuario {user.id} marcado como 'canceled'")

        case "invoice.payment_failed":
            invoice_id = event_data.get("id")
            logger.error(f"Fallo en cobro de factura {invoice_id} para customer {customer_id}")

            user = await get_user_by_customer_id(customer_id)
            if user:
                user.subscription_status = "past_due"
                db.add(user)
                await db.commit()
                logger.warning(f"Usuario {user.id} marcado con status 'past_due' debido a fallo de pago")

        case "checkout.session.completed":
            session_mode = event_data.get("mode")
            sub_id = event_data.get("subscription")
            logger.info(f"Checkout completado con éxito [modo: {session_mode}]")

            if session_mode == "subscription" and sub_id:
                user = await get_user_by_customer_id(customer_id)
                if user:
                    user.subscription_id = sub_id
                    user.subscription_status = "active"
                    db.add(user)
                    await db.commit()

        case _:
            logger.debug(f"Evento informativo no crítico: {event_type}")

    return WebhookResponse(
        status="success",
        event_type=event_type
    )

from typing import Optional, Dict, Any
from pydantic import BaseModel, HttpUrl, Field


class CheckoutSessionRequest(BaseModel):
    """
    Parámetros para iniciar un checkout en Stripe (pago único o suscripción).
    """
    price_id: str = Field(
        ..., 
        description="ID del precio configurado en el catálogo de Stripe (ej: price_1M...)"
    )
    success_url: Optional[str] = Field(
        None, 
        description="URL de redirección exitosa. Si se omite, se usa el default de la plataforma."
    )
    cancel_url: Optional[str] = Field(
        None, 
        description="URL de redirección si el usuario cancela."
    )
    mode: str = Field(
        "subscription", 
        description="Modo de pago de Stripe: 'subscription' o 'payment'"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Metadatos auxiliares para auditoría en webhooks"
    )


class CheckoutSessionResponse(BaseModel):
    checkout_url: str
    session_id: str


class PortalSessionResponse(BaseModel):
    portal_url: str


class WebhookResponse(BaseModel):
    status: str
    event_type: str

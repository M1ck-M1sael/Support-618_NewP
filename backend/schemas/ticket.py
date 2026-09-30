import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

from backend.models import TicketPriority, TicketStatus


class TicketCreateRequest(BaseModel):
    title: str = Field(..., min_length=5, max_length=200, example="Fallo en despliegue de base de datos")
    description: str = Field(..., min_length=10, example="Se presentó un error 500 al ejecutar las migraciones de Alembic.")
    category_id: uuid.UUID
    priority: TicketPriority = Field(default=TicketPriority.MEDIUM)
    extra_metadata: Optional[Dict[str, Any]] = Field(default=None, description="Datos de facturación (RFC) o metadatos de integración")


class TicketMessageCreateRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000, example="He reiniciado el servicio y el log muestra conexión timeout.")


class TicketResponse(BaseModel):
    id: uuid.UUID
    ticket_number: str
    title: str
    description: str
    category_id: uuid.UUID
    priority: TicketPriority
    status: TicketStatus
    client_id: uuid.UUID
    assigned_agent_id: Optional[uuid.UUID]
    extra_metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TicketMessageResponse(BaseModel):
    id: uuid.UUID
    ticket_id: uuid.UUID
    sender_id: uuid.UUID
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

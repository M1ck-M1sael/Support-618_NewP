"""
Support-618 - Tickets Router with Non-Blocking AWS Notifications (StackTON)
Demuestra el uso de BackgroundTasks para responder HTTP 201/200 de inmediato
mientras AWS SES y SNS se procesan en background sin degradar el throughput.
"""

import uuid
import random
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.deps import get_current_user, get_db
from backend.models import User, Ticket, TicketMessage, TicketPriority, TicketStatus, UserRole
from backend.schemas.ticket import (
    TicketCreateRequest, 
    TicketResponse, 
    TicketMessageCreateRequest, 
    TicketMessageResponse
)
from backend.services.notification_service import (
    NotificationService, 
    NotificationTemplates
)

router = APIRouter(prefix="/tickets", tags=["Tickets & Helpdesk"])


# --------------------------------------------------------------------------
# BACKGROUND TASKS DISPATCHERS (Corrutinas ejecutadas fuera del ciclo HTTP)
# --------------------------------------------------------------------------

async def dispatch_ticket_created_notifications(ticket: Ticket, client: User):
    """
    Tarea en background: Envía email de acuse de recibo y SMS si es incidente urgente.
    """
    # 1. Email SES al cliente
    email_html = NotificationTemplates.ticket_created_email(
        ticket_number=ticket.ticket_number,
        title=ticket.title,
        client_name=client.full_name
    )
    await NotificationService.send_email_notification(
        user=client,
        subject=f"[Support-618] Solicitud Recibida: {ticket.ticket_number} - {ticket.title}",
        body_html=email_html
    )

    # 2. SMS SNS si la prioridad es crítica y tiene teléfono registrado
    if ticket.priority == TicketPriority.URGENT:
        sms_body = NotificationTemplates.critical_incident_sms(ticket.ticket_number)
        await NotificationService.send_sms_alert(
            user=client,
            message=sms_body,
            priority=ticket.priority
        )


async def dispatch_agent_reply_notifications(ticket: Ticket, client: User, agent: User, reply_content: str):
    """
    Tarea en background: Notifica al cliente por email cuando un agente responde.
    """
    snippet = reply_content[:180] + ("..." if len(reply_content) > 180 else "")
    email_html = NotificationTemplates.agent_reply_email(
        ticket_number=ticket.ticket_number,
        agent_name=agent.full_name,
        client_name=client.full_name,
        message_snippet=snippet
    )
    await NotificationService.send_email_notification(
        user=client,
        subject=f"[Respuesta] Ticket {ticket.ticket_number}: {ticket.title}",
        body_html=email_html
    )


# --------------------------------------------------------------------------
# ENDPOINTS
# --------------------------------------------------------------------------

@router.post(
    "",
    response_model=TicketResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un nuevo ticket de soporte",
    description="Registra el incidente en PostgreSQL y despacha notificaciones AWS SES/SNS en segundo plano.",
)
async def create_ticket(
    payload: TicketCreateRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Generación de identificador legible único para Helpdesk
    random_suffix = random.randint(1000, 9999)
    ticket_number = f"ST-618-{random_suffix}"

    new_ticket = Ticket(
        id=uuid.uuid4(),
        ticket_number=ticket_number,
        title=payload.title,
        description=payload.description,
        category_id=payload.category_id,
        priority=payload.priority,
        status=TicketStatus.OPEN,
        client_id=current_user.id,
        extra_metadata=payload.extra_metadata
    )

    # Persistencia en base de datos
    if db is not None:
        db.add(new_ticket)
        await db.commit()
        await db.refresh(new_ticket)

    # ENCOLADO EN SEGUNDO PLANO (Background Tasks)
    # La respuesta HTTP regresa inmediatamente al cliente (<30ms)
    background_tasks.add_task(
        dispatch_ticket_created_notifications,
        ticket=new_ticket,
        client=current_user
    )

    return new_ticket


@router.post(
    "/{ticket_id}/messages",
    response_model=TicketMessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Añadir mensaje al hilo público del ticket",
    description="Si el remitente es un Agente o SuperAdmin, notifica al Cliente por correo en background.",
)
async def add_ticket_message(
    ticket_id: uuid.UUID,
    payload: TicketMessageCreateRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Buscar ticket
    ticket = None
    client = None

    if db is not None:
        stmt = select(Ticket).where(Ticket.id == ticket_id)
        result = await db.execute(stmt)
        ticket = result.scalar_one_or_none()
        
        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Ticket no encontrado"
            )

        # Buscar al cliente dueño del ticket para notificarlo
        client_stmt = select(User).where(User.id == ticket.client_id)
        client_res = await db.execute(client_stmt)
        client = client_res.scalar_one_or_none()
    else:
        # Mock para modo offline / pruebas
        ticket = Ticket(
            id=ticket_id,
            ticket_number="ST-618-9999",
            title="Ticket de prueba",
            description="Mock",
            category_id=uuid.uuid4(),
            priority=TicketPriority.MEDIUM,
            status=TicketStatus.OPEN,
            client_id=current_user.id
        )
        client = current_user

    new_message = TicketMessage(
        id=uuid.uuid4(),
        ticket_id=ticket_id,
        sender_id=current_user.id,
        content=payload.content
    )

    if db is not None:
        db.add(new_message)
        # Si respondió el agente, mover ticket a WAITING_CLIENT
        if current_user.role in [UserRole.AGENT, UserRole.SUPER_ADMIN]:
            ticket.status = TicketStatus.WAITING_CLIENT
            db.add(ticket)

        await db.commit()
        await db.refresh(new_message)

    # Si la respuesta proviene de un Agente o SuperAdmin, notificar al Cliente en background
    if current_user.role in [UserRole.AGENT, UserRole.SUPER_ADMIN] and client:
        background_tasks.add_task(
            dispatch_agent_reply_notifications,
            ticket=ticket,
            client=client,
            agent=current_user,
            reply_content=payload.content
        )

    return new_message

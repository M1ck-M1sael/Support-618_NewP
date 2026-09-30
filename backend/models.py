"""
Support-618 Database Models (StackTON)
ORM: SQLAlchemy 2.0+
Database: PostgreSQL
"""

import enum
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any

from sqlalchemy import (
    String,
    Text,
    Boolean,
    Integer,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Index,
    func
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    relationship
)


class Base(DeclarativeBase):
    pass


# --------------------------------------------------------------------------
# ENUMS
# --------------------------------------------------------------------------

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SuperAdmin"
    AGENT = "Agent"
    CLIENT = "Client"


class TicketStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    WAITING_CLIENT = "waiting_client"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


# --------------------------------------------------------------------------
# MODELOS
# --------------------------------------------------------------------------

class User(Base):
    """
    Modelo de Usuario que contempla roles RBAC, credenciales,
    preferencias de UI/notificación y vinculación con Stripe Customer Portal.
    """
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(255), 
        unique=True, 
        nullable=False, 
        index=True
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255), 
        nullable=False
    )
    full_name: Mapped[str] = mapped_column(
        String(150), 
        nullable=False
    )
    avatar_url: Mapped[Optional[str]] = mapped_column(
        String(500), 
        nullable=True
    )
    company_name: Mapped[Optional[str]] = mapped_column(
        String(150), 
        nullable=True
    )
    phone_number: Mapped[Optional[str]] = mapped_column(
        String(30), 
        nullable=True
    )

    # Control de Acceso basado en Roles (RBAC)
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole, name="user_role_enum", native_enum=False),
        nullable=False,
        default=UserRole.CLIENT,
        index=True
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, 
        default=True, 
        nullable=False
    )

    # Preferencia de interfaz (claro / oscuro)
    theme_preference: Mapped[str] = mapped_column(
        String(10), 
        default="dark", 
        nullable=False
    )

    # Identificador de cliente en Stripe para Customer Portal & Webhooks
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(
        String(100), 
        unique=True, 
        nullable=True, 
        index=True
    )

    # Estado de la suscripción local (evita llamadas constantes a Stripe API)
    subscription_status: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        default=None,
        index=True
    )
    subscription_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        default=None,
        index=True
    )

    # Preferencias de Notificación (Email SES, SMS/WhatsApp SNS)
    notification_preferences: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=lambda: {
            "email_notifications": True,
            "sms_critical_alerts": False,
            "whatsapp_updates": False,
        }
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )

    # Relaciones
    created_tickets: Mapped[List["Ticket"]] = relationship(
        "Ticket", 
        back_populates="client", 
        foreign_keys="Ticket.client_id"
    )
    assigned_tickets: Mapped[List["Ticket"]] = relationship(
        "Ticket", 
        back_populates="assigned_agent", 
        foreign_keys="Ticket.assigned_agent_id"
    )
    written_notes: Mapped[List["TicketNote"]] = relationship(
        "TicketNote", 
        back_populates="author",
        cascade="all, delete-orphan"
    )
    sent_messages: Mapped[List["TicketMessage"]] = relationship(
        "TicketMessage", 
        back_populates="sender",
        cascade="all, delete-orphan"
    )
    uploaded_attachments: Mapped[List["TicketAttachment"]] = relationship(
        "TicketAttachment", 
        back_populates="uploaded_by"
    )

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role.value})>"


class TicketCategory(Base):
    """
    Categorías dinámicas configurables por SuperAdmin
    (ej: Facturación, Soporte Técnico, Consultoría Cloud, Incidencia SLA).
    """
    __tablename__ = "ticket_categories"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(
        String(100), 
        unique=True, 
        nullable=False, 
        index=True
    )
    description: Mapped[str] = mapped_column(
        Text, 
        nullable=False
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, 
        default=True, 
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )

    # Relaciones
    tickets: Mapped[List["Ticket"]] = relationship(
        "Ticket", 
        back_populates="category"
    )

    def __repr__(self) -> str:
        return f"<TicketCategory {self.name} (active={self.is_active})>"


class Ticket(Base):
    """
    Entidad central de soporte. Gestiona el ciclo de vida del incidente,
    prioridad, asignación, metadatos fiscales/transaccionales y relaciones.
    """
    __tablename__ = "tickets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    
    # Código legible único para el usuario (ej: ST-618-1042)
    ticket_number: Mapped[str] = mapped_column(
        String(30), 
        unique=True, 
        nullable=False, 
        index=True
    )
    
    title: Mapped[str] = mapped_column(
        String(200), 
        nullable=False
    )
    description: Mapped[str] = mapped_column(
        Text, 
        nullable=False
    )

    # Categoría dinámica del ticket
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("ticket_categories.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    status: Mapped[TicketStatus] = mapped_column(
        SQLEnum(TicketStatus, name="ticket_status_enum", native_enum=False),
        nullable=False,
        default=TicketStatus.OPEN,
        index=True
    )
    priority: Mapped[TicketPriority] = mapped_column(
        SQLEnum(TicketPriority, name="ticket_priority_enum", native_enum=False),
        nullable=False,
        default=TicketPriority.MEDIUM,
        index=True
    )

    # Cliente solicitante
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    # Agente de soporte o SuperAdmin asignado (nullable si está en cola de espera)
    assigned_agent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Metadatos dinámicos estructurados (ej: datos fiscales RFC, Razón Social, Uso de CFDI, o Stripe Invoice ID)
    extra_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB, 
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), 
        nullable=True
    )

    # Relaciones ORM
    category: Mapped["TicketCategory"] = relationship(
        "TicketCategory", 
        back_populates="tickets"
    )
    client: Mapped["User"] = relationship(
        "User", 
        back_populates="created_tickets", 
        foreign_keys=[client_id]
    )
    assigned_agent: Mapped[Optional["User"]] = relationship(
        "User", 
        back_populates="assigned_tickets", 
        foreign_keys=[assigned_agent_id]
    )
    messages: Mapped[List["TicketMessage"]] = relationship(
        "TicketMessage", 
        back_populates="ticket", 
        cascade="all, delete-orphan",
        order_by="TicketMessage.created_at.asc()"
    )
    internal_notes: Mapped[List["TicketNote"]] = relationship(
        "TicketNote", 
        back_populates="ticket", 
        cascade="all, delete-orphan",
        order_by="TicketNote.created_at.asc()"
    )
    attachments: Mapped[List["TicketAttachment"]] = relationship(
        "TicketAttachment", 
        back_populates="ticket", 
        cascade="all, delete-orphan",
        order_by="TicketAttachment.created_at.asc()"
    )

    __table_args__ = (
        Index("ix_tickets_client_status", "client_id", "status"),
        Index("ix_tickets_agent_status", "assigned_agent_id", "status"),
        Index("ix_tickets_category_status", "category_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<Ticket {self.ticket_number}: {self.title[:30]} [{self.status.value}]>"


class TicketMessage(Base):
    """
    Hilo de conversación público entre el Cliente y el equipo de soporte (Agent / SuperAdmin).
    Totalmente visible para el creador del ticket.
    """
    __tablename__ = "ticket_messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )

    ticket_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("tickets.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Emisor del mensaje (Cliente o Agente)
    sender_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    content: Mapped[str] = mapped_column(
        Text, 
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )

    # Relaciones
    ticket: Mapped["Ticket"] = relationship(
        "Ticket", 
        back_populates="messages"
    )
    sender: Mapped["User"] = relationship(
        "User", 
        back_populates="sent_messages"
    )
    attachments: Mapped[List["TicketAttachment"]] = relationship(
        "TicketAttachment", 
        back_populates="message"
    )

    def __repr__(self) -> str:
        return f"<TicketMessage on {self.ticket_id} by {self.sender_id}>"


class TicketNote(Base):
    """
    Notas internas privadas exclusivas para SuperAdmin y Agent.
    NUNCA deben exponerse en endpoints accesibles para el rol Client.
    """
    __tablename__ = "ticket_notes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )

    ticket_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("tickets.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Autor de la nota (SuperAdmin o Agent)
    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    content: Mapped[str] = mapped_column(
        Text, 
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )

    # Relaciones
    ticket: Mapped["Ticket"] = relationship(
        "Ticket", 
        back_populates="internal_notes"
    )
    author: Mapped["User"] = relationship(
        "User", 
        back_populates="written_notes"
    )

    def __repr__(self) -> str:
        return f"<TicketNote on {self.ticket_id} by {self.author_id}>"


class TicketAttachment(Base):
    """
    Archivos adjuntos (capturas de pantalla, comprobantes de pago, logs, PDFs).
    Pueden pertenecer directamente al Ticket o estar vinculados a un TicketMessage específico.
    Almacenamiento físico en S3 / CloudFront.
    """
    __tablename__ = "ticket_attachments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )

    ticket_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("tickets.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Mensaje asociado (opcional, si se adjuntó en el momento de responder un mensaje)
    message_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("ticket_messages.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Usuario que subió el archivo
    uploaded_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    file_url: Mapped[str] = mapped_column(
        String(500), 
        nullable=False
    )
    file_name: Mapped[str] = mapped_column(
        String(255), 
        nullable=False
    )
    file_size_bytes: Mapped[int] = mapped_column(
        Integer, 
        nullable=False
    )
    mime_type: Mapped[str] = mapped_column(
        String(100), 
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )

    # Relaciones
    ticket: Mapped["Ticket"] = relationship(
        "Ticket", 
        back_populates="attachments"
    )
    message: Mapped[Optional["TicketMessage"]] = relationship(
        "TicketMessage", 
        back_populates="attachments"
    )
    uploaded_by: Mapped["User"] = relationship(
        "User", 
        back_populates="uploaded_attachments"
    )

    def __repr__(self) -> str:
        return f"<TicketAttachment {self.file_name} ({self.file_size_bytes} bytes)>"

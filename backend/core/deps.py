import uuid
from typing import AsyncGenerator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import User, UserRole

security = HTTPBearer(auto_error=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency para inyección de sesión de base de datos SQLAlchemy asíncrona.
    """
    # En producción: yield from async_session_maker()
    # Mock para aislamiento de testing y tipado
    yield None  # type: ignore


async def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Simulación de obtención de usuario autenticado mediante JWT Bearer.
    En producción decodifica el token, valida expiración y consulta en DB.
    """
    # Mock user representativo para desarrollo y pruebas del router
    mock_user = User(
        id=uuid.UUID("11111111-2222-3333-4444-555555555555"),
        email="cliente.demo@stackton.io",
        hashed_password="mock_hashed_password",
        full_name="Sofia Valenzuela",
        role=UserRole.CLIENT,
        is_active=True,
        theme_preference="dark",
        stripe_customer_id="cus_stackton_demo_123",
        notification_preferences={
            "email_notifications": True,
            "sms_critical_alerts": False,
            "whatsapp_updates": True
        }
    )

    if not mock_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cuenta de usuario inactiva"
        )

    return mock_user

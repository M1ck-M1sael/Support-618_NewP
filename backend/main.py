"""
Support-618 - FastAPI Application Entrypoint (StackTON)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.core.config import settings
from backend.routers.payments import router as payments_router, webhook_router
from backend.routers.tickets import router as tickets_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API de Helpdesk & Customer Portal para StackTON con gestión RBAC, Stripe y notificaciones.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuración CORS para el cliente Vite / React
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de routers bajo el prefijo de la API
app.include_router(payments_router, prefix=settings.API_V1_STR)
app.include_router(webhook_router, prefix=settings.API_V1_STR)
app.include_router(tickets_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

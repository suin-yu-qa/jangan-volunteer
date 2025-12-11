from app.routers.auth import router as auth_router
from app.routers.schedules import router as schedules_router
from app.routers.applications import router as applications_router
from app.routers.notices import router as notices_router
from app.routers.admin import router as admin_router
from app.routers.notifications import router as notifications_router

__all__ = [
    "auth_router",
    "schedules_router",
    "applications_router",
    "notices_router",
    "admin_router",
    "notifications_router",
]

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import User, Schedule, Application, Notice, Notification
from app.models.user import UserRole, AuthProvider
from app.routers import (
    auth_router,
    schedules_router,
    applications_router,
    notices_router,
    admin_router,
    notifications_router,
)
from app.utils.security import get_password_hash

# 데이터베이스 테이블 생성
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="봉사 일정 관리 시스템 API",
    version="1.0.0",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth_router, prefix="/api")
app.include_router(schedules_router, prefix="/api")
app.include_router(applications_router, prefix="/api")
app.include_router(notices_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")


@app.on_event("startup")
async def startup_event():
    """앱 시작 시 초기 관리자 계정 생성"""
    db = SessionLocal()
    try:
        # 초기 관리자 계정 확인
        admin = db.query(User).filter(User.email == settings.INITIAL_ADMIN_EMAIL).first()
        if not admin:
            admin = User(
                email=settings.INITIAL_ADMIN_EMAIL,
                password_hash=get_password_hash(settings.INITIAL_ADMIN_PASSWORD),
                name=settings.INITIAL_ADMIN_NAME,
                role=UserRole.ADMIN,
                provider=AuthProvider.EMAIL,
            )
            db.add(admin)
            db.commit()
            print(f"초기 관리자 계정 생성: {settings.INITIAL_ADMIN_EMAIL}")
    finally:
        db.close()


@app.get("/")
async def root():
    return {
        "message": f"{settings.APP_NAME} API",
        "version": "1.0.0",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

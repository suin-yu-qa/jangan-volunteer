from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"


class AuthProvider(str, enum.Enum):
    EMAIL = "email"
    GOOGLE = "google"
    KAKAO = "kakao"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)  # nullable for social login
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.USER)
    provider = Column(Enum(AuthProvider), default=AuthProvider.EMAIL)
    provider_id = Column(String(255), nullable=True)  # for social login
    fcm_token = Column(String(500), nullable=True)  # for push notifications
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    applications = relationship("Application", back_populates="user")
    created_schedules = relationship("Schedule", back_populates="creator")
    created_notices = relationship("Notice", back_populates="author")
    notifications = relationship("Notification", back_populates="user")

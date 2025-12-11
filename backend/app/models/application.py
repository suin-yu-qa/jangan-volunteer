from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class ApplicationStatus(str, enum.Enum):
    APPLIED = "applied"
    CANCELLED = "cancelled"


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    schedule_id = Column(Integer, ForeignKey("schedules.id"), nullable=False)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.APPLIED)
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    cancelled_at = Column(DateTime(timezone=True), nullable=True)

    # Unique constraint for user_id and schedule_id
    __table_args__ = (
        UniqueConstraint("user_id", "schedule_id", name="uq_user_schedule"),
    )

    # Relationships
    user = relationship("User", back_populates="applications")
    schedule = relationship("Schedule", back_populates="applications")

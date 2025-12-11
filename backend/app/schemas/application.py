from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.schemas.schedule import ScheduleResponse
from app.schemas.user import UserResponse


class ApplicationCreate(BaseModel):
    schedule_id: int


class ApplicationResponse(BaseModel):
    id: int
    userId: int
    scheduleId: int
    status: str
    appliedAt: datetime
    cancelledAt: Optional[datetime] = None
    schedule: Optional[ScheduleResponse] = None
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_mapping(cls, obj, include_schedule: bool = True, include_user: bool = False):
        schedule = None
        user = None

        if include_schedule and obj.schedule:
            schedule = ScheduleResponse.from_orm_with_mapping(obj.schedule)

        if include_user and obj.user:
            user = UserResponse.from_orm_with_mapping(obj.user)

        return cls(
            id=obj.id,
            userId=obj.user_id,
            scheduleId=obj.schedule_id,
            status=obj.status.value if hasattr(obj.status, 'value') else obj.status,
            appliedAt=obj.applied_at,
            cancelledAt=obj.cancelled_at,
            schedule=schedule,
            user=user,
        )

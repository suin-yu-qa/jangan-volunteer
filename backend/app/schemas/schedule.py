from pydantic import BaseModel
from typing import Optional
from datetime import date, time, datetime


class ScheduleCreate(BaseModel):
    title: str
    description: Optional[str] = None
    date: date
    startTime: str  # "HH:MM" format
    endTime: str    # "HH:MM" format
    location: Optional[str] = None


class ScheduleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[date] = None
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    location: Optional[str] = None


class ScheduleResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    date: str
    startTime: str
    endTime: str
    location: Optional[str]
    createdBy: int
    createdAt: datetime
    applicantCount: Optional[int] = None
    isApplied: Optional[bool] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_mapping(cls, obj, applicant_count: int = None, is_applied: bool = None):
        return cls(
            id=obj.id,
            title=obj.title,
            description=obj.description,
            date=obj.date.isoformat(),
            startTime=obj.start_time.strftime("%H:%M:%S"),
            endTime=obj.end_time.strftime("%H:%M:%S"),
            location=obj.location,
            createdBy=obj.created_by,
            createdAt=obj.created_at,
            applicantCount=applicant_count,
            isApplied=is_applied,
        )

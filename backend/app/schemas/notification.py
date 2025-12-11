from pydantic import BaseModel
from datetime import datetime


class NotificationResponse(BaseModel):
    id: int
    userId: int
    title: str
    body: str
    type: str
    isRead: bool
    createdAt: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_mapping(cls, obj):
        return cls(
            id=obj.id,
            userId=obj.user_id,
            title=obj.title,
            body=obj.body,
            type=obj.type.value if hasattr(obj.type, 'value') else obj.type,
            isRead=obj.is_read,
            createdAt=obj.created_at,
        )

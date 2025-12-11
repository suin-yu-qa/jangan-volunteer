from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.schemas.user import UserResponse


class NoticeCreate(BaseModel):
    title: str
    content: str
    isImportant: Optional[bool] = False


class NoticeUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    isImportant: Optional[bool] = None


class NoticeResponse(BaseModel):
    id: int
    title: str
    content: str
    isImportant: bool
    createdBy: int
    createdAt: datetime
    updatedAt: datetime
    author: Optional[UserResponse] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_mapping(cls, obj, include_author: bool = False):
        author = None
        if include_author and obj.author:
            author = UserResponse.from_orm_with_mapping(obj.author)

        return cls(
            id=obj.id,
            title=obj.title,
            content=obj.content,
            isImportant=obj.is_important,
            createdBy=obj.created_by,
            createdAt=obj.created_at,
            updatedAt=obj.updated_at,
            author=author,
        )


class PaginatedNoticeResponse(BaseModel):
    items: List[NoticeResponse]
    total: int
    page: int
    pageSize: int
    totalPages: int

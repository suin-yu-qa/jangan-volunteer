from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    phone: Optional[str]
    role: str
    provider: str
    createdAt: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_mapping(cls, obj):
        return cls(
            id=obj.id,
            email=obj.email,
            name=obj.name,
            phone=obj.phone,
            role=obj.role.value if hasattr(obj.role, 'value') else obj.role,
            provider=obj.provider.value if hasattr(obj.provider, 'value') else obj.provider,
            createdAt=obj.created_at,
        )


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None


class Token(BaseModel):
    accessToken: str
    refreshToken: str
    user: UserResponse


class TokenPayload(BaseModel):
    sub: int
    exp: datetime
    type: str  # "access" or "refresh"

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserResponse
from app.utils.security import get_password_hash
from app.utils.deps import get_current_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/register", response_model=UserResponse)
async def register_admin(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """새 관리자 등록 (관리자 전용)"""
    # 이메일 중복 체크
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 등록된 이메일입니다.",
        )

    # 관리자 생성
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        name=user_data.name,
        phone=user_data.phone,
        role=UserRole.ADMIN,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return UserResponse.from_orm_with_mapping(user)


@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """전체 사용자 목록 (관리자 전용)"""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [UserResponse.from_orm_with_mapping(user) for user in users]


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    role: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """사용자 역할 변경 (관리자 전용)"""
    if role not in ["admin", "user"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="유효하지 않은 역할입니다. (admin 또는 user)",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다.",
        )

    # 자기 자신의 역할 변경 방지
    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="자신의 역할은 변경할 수 없습니다.",
        )

    user.role = UserRole.ADMIN if role == "admin" else UserRole.USER
    db.commit()

    return {"message": f"사용자 역할이 {role}로 변경되었습니다."}

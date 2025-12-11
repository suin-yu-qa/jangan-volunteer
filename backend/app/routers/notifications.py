from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse
from app.utils.deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


class FcmTokenRequest(BaseModel):
    token: str


@router.post("/register-token")
async def register_fcm_token(
    request: FcmTokenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """FCM 토큰 등록"""
    current_user.fcm_token = request.token
    db.commit()

    return {"message": "FCM 토큰이 등록되었습니다."}


@router.get("", response_model=List[NotificationResponse])
async def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """알림 내역 조회"""
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id,
    ).order_by(Notification.created_at.desc()).limit(50).all()

    return [NotificationResponse.from_orm_with_mapping(notif) for notif in notifications]


@router.put("/{notification_id}/read")
async def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """알림 읽음 처리"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    ).first()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="알림을 찾을 수 없습니다.",
        )

    notification.is_read = True
    db.commit()

    return {"message": "알림이 읽음 처리되었습니다."}


@router.put("/read-all")
async def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """모든 알림 읽음 처리"""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()

    return {"message": "모든 알림이 읽음 처리되었습니다."}

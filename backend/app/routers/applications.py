from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.schedule import Schedule
from app.models.application import Application, ApplicationStatus
from app.schemas.application import ApplicationResponse
from app.utils.deps import get_current_user, get_current_admin

router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("/my", response_model=List[ApplicationResponse])
async def get_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """내 지원 내역 조회"""
    applications = db.query(Application).filter(
        Application.user_id == current_user.id,
    ).order_by(Application.applied_at.desc()).all()

    return [ApplicationResponse.from_orm_with_mapping(app, include_schedule=True) for app in applications]


@router.post("/{schedule_id}", response_model=ApplicationResponse)
async def apply_for_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """봉사 일정 지원"""
    # 일정 존재 확인
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="일정을 찾을 수 없습니다.",
        )

    # 기존 지원 내역 확인
    existing_application = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.schedule_id == schedule_id,
    ).first()

    if existing_application:
        if existing_application.status == ApplicationStatus.APPLIED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 지원한 일정입니다.",
            )
        else:
            # 취소된 지원을 다시 활성화
            existing_application.status = ApplicationStatus.APPLIED
            existing_application.cancelled_at = None
            db.commit()
            db.refresh(existing_application)
            return ApplicationResponse.from_orm_with_mapping(existing_application, include_schedule=True)

    # 새 지원 생성
    application = Application(
        user_id=current_user.id,
        schedule_id=schedule_id,
        status=ApplicationStatus.APPLIED,
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    return ApplicationResponse.from_orm_with_mapping(application, include_schedule=True)


@router.delete("/{schedule_id}")
async def cancel_application(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """지원 취소"""
    application = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.schedule_id == schedule_id,
        Application.status == ApplicationStatus.APPLIED,
    ).first()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="지원 내역을 찾을 수 없습니다.",
        )

    application.status = ApplicationStatus.CANCELLED
    application.cancelled_at = datetime.utcnow()
    db.commit()

    return {"message": "지원이 취소되었습니다."}


@router.get("/schedule/{schedule_id}", response_model=List[ApplicationResponse])
async def get_schedule_applicants(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """특정 일정의 지원자 목록 (관리자 전용)"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="일정을 찾을 수 없습니다.",
        )

    applications = db.query(Application).filter(
        Application.schedule_id == schedule_id,
        Application.status == ApplicationStatus.APPLIED,
    ).all()

    return [ApplicationResponse.from_orm_with_mapping(app, include_schedule=False, include_user=True) for app in applications]

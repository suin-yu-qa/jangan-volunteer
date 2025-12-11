from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date, time

from app.database import get_db
from app.models.user import User
from app.models.schedule import Schedule
from app.models.application import Application, ApplicationStatus
from app.schemas.schedule import ScheduleCreate, ScheduleUpdate, ScheduleResponse
from app.utils.deps import get_current_user, get_current_admin, get_current_user_optional

router = APIRouter(prefix="/schedules", tags=["schedules"])


@router.get("", response_model=List[ScheduleResponse])
async def get_schedules(
    year: int = Query(..., description="연도"),
    month: int = Query(..., ge=1, le=12, description="월"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """월별 일정 목록 조회"""
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)

    schedules = db.query(Schedule).filter(
        Schedule.date >= start_date,
        Schedule.date < end_date,
    ).order_by(Schedule.date, Schedule.start_time).all()

    result = []
    for schedule in schedules:
        # 지원자 수 계산
        applicant_count = db.query(func.count(Application.id)).filter(
            Application.schedule_id == schedule.id,
            Application.status == ApplicationStatus.APPLIED,
        ).scalar()

        # 현재 사용자 지원 여부
        is_applied = False
        if current_user:
            application = db.query(Application).filter(
                Application.user_id == current_user.id,
                Application.schedule_id == schedule.id,
                Application.status == ApplicationStatus.APPLIED,
            ).first()
            is_applied = application is not None

        result.append(ScheduleResponse.from_orm_with_mapping(
            schedule,
            applicant_count=applicant_count,
            is_applied=is_applied,
        ))

    return result


@router.get("/by-date", response_model=List[ScheduleResponse])
async def get_schedules_by_date(
    date_str: str = Query(..., alias="date", description="날짜 (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """특정 날짜의 일정 조회"""
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)",
        )

    schedules = db.query(Schedule).filter(
        Schedule.date == target_date,
    ).order_by(Schedule.start_time).all()

    result = []
    for schedule in schedules:
        applicant_count = db.query(func.count(Application.id)).filter(
            Application.schedule_id == schedule.id,
            Application.status == ApplicationStatus.APPLIED,
        ).scalar()

        is_applied = False
        if current_user:
            application = db.query(Application).filter(
                Application.user_id == current_user.id,
                Application.schedule_id == schedule.id,
                Application.status == ApplicationStatus.APPLIED,
            ).first()
            is_applied = application is not None

        result.append(ScheduleResponse.from_orm_with_mapping(
            schedule,
            applicant_count=applicant_count,
            is_applied=is_applied,
        ))

    return result


@router.get("/{schedule_id}", response_model=ScheduleResponse)
async def get_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """일정 상세 조회"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="일정을 찾을 수 없습니다.",
        )

    applicant_count = db.query(func.count(Application.id)).filter(
        Application.schedule_id == schedule.id,
        Application.status == ApplicationStatus.APPLIED,
    ).scalar()

    is_applied = False
    if current_user:
        application = db.query(Application).filter(
            Application.user_id == current_user.id,
            Application.schedule_id == schedule.id,
            Application.status == ApplicationStatus.APPLIED,
        ).first()
        is_applied = application is not None

    return ScheduleResponse.from_orm_with_mapping(
        schedule,
        applicant_count=applicant_count,
        is_applied=is_applied,
    )


@router.post("", response_model=ScheduleResponse)
async def create_schedule(
    schedule_data: ScheduleCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """일정 생성 (관리자 전용)"""
    try:
        start_time = datetime.strptime(schedule_data.startTime, "%H:%M").time()
        end_time = datetime.strptime(schedule_data.endTime, "%H:%M").time()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="시간 형식이 올바르지 않습니다. (HH:MM)",
        )

    if start_time >= end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="종료 시간은 시작 시간 이후여야 합니다.",
        )

    schedule = Schedule(
        title=schedule_data.title,
        description=schedule_data.description,
        date=schedule_data.date,
        start_time=start_time,
        end_time=end_time,
        location=schedule_data.location,
        created_by=current_admin.id,
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    return ScheduleResponse.from_orm_with_mapping(schedule, applicant_count=0, is_applied=False)


@router.put("/{schedule_id}", response_model=ScheduleResponse)
async def update_schedule(
    schedule_id: int,
    schedule_data: ScheduleUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """일정 수정 (관리자 전용)"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="일정을 찾을 수 없습니다.",
        )

    if schedule_data.title is not None:
        schedule.title = schedule_data.title
    if schedule_data.description is not None:
        schedule.description = schedule_data.description
    if schedule_data.date is not None:
        schedule.date = schedule_data.date
    if schedule_data.startTime is not None:
        schedule.start_time = datetime.strptime(schedule_data.startTime, "%H:%M").time()
    if schedule_data.endTime is not None:
        schedule.end_time = datetime.strptime(schedule_data.endTime, "%H:%M").time()
    if schedule_data.location is not None:
        schedule.location = schedule_data.location

    db.commit()
    db.refresh(schedule)

    applicant_count = db.query(func.count(Application.id)).filter(
        Application.schedule_id == schedule.id,
        Application.status == ApplicationStatus.APPLIED,
    ).scalar()

    return ScheduleResponse.from_orm_with_mapping(schedule, applicant_count=applicant_count, is_applied=False)


@router.delete("/{schedule_id}")
async def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """일정 삭제 (관리자 전용)"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="일정을 찾을 수 없습니다.",
        )

    db.delete(schedule)
    db.commit()

    return {"message": "일정이 삭제되었습니다."}

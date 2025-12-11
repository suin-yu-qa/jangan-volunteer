from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
import math

from app.database import get_db
from app.models.user import User
from app.models.notice import Notice
from app.schemas.notice import NoticeCreate, NoticeUpdate, NoticeResponse, PaginatedNoticeResponse
from app.utils.deps import get_current_user, get_current_admin

router = APIRouter(prefix="/notices", tags=["notices"])


@router.get("", response_model=PaginatedNoticeResponse)
async def get_notices(
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """공지사항 목록 조회"""
    total = db.query(Notice).count()
    total_pages = math.ceil(total / pageSize) if total > 0 else 1

    notices = db.query(Notice).order_by(
        Notice.is_important.desc(),
        Notice.created_at.desc(),
    ).offset((page - 1) * pageSize).limit(pageSize).all()

    return PaginatedNoticeResponse(
        items=[NoticeResponse.from_orm_with_mapping(notice) for notice in notices],
        total=total,
        page=page,
        pageSize=pageSize,
        totalPages=total_pages,
    )


@router.get("/{notice_id}", response_model=NoticeResponse)
async def get_notice(
    notice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """공지사항 상세 조회"""
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="공지사항을 찾을 수 없습니다.",
        )

    return NoticeResponse.from_orm_with_mapping(notice, include_author=True)


@router.post("", response_model=NoticeResponse)
async def create_notice(
    notice_data: NoticeCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """공지사항 작성 (관리자 전용)"""
    notice = Notice(
        title=notice_data.title,
        content=notice_data.content,
        is_important=notice_data.isImportant,
        created_by=current_admin.id,
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)

    return NoticeResponse.from_orm_with_mapping(notice)


@router.put("/{notice_id}", response_model=NoticeResponse)
async def update_notice(
    notice_id: int,
    notice_data: NoticeUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """공지사항 수정 (관리자 전용)"""
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="공지사항을 찾을 수 없습니다.",
        )

    if notice_data.title is not None:
        notice.title = notice_data.title
    if notice_data.content is not None:
        notice.content = notice_data.content
    if notice_data.isImportant is not None:
        notice.is_important = notice_data.isImportant

    db.commit()
    db.refresh(notice)

    return NoticeResponse.from_orm_with_mapping(notice)


@router.delete("/{notice_id}")
async def delete_notice(
    notice_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """공지사항 삭제 (관리자 전용)"""
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="공지사항을 찾을 수 없습니다.",
        )

    db.delete(notice)
    db.commit()

    return {"message": "공지사항이 삭제되었습니다."}

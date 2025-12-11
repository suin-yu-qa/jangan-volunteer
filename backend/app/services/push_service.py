"""
푸시 알림 서비스

Firebase Cloud Messaging을 사용하여 푸시 알림을 발송합니다.
Firebase 프로젝트 설정 후 firebase-credentials.json 파일을 설정해야 합니다.
"""

import os
from typing import List, Optional

from app.config import settings

# Firebase 초기화는 credentials 파일이 있을 때만 수행
firebase_app = None

try:
    import firebase_admin
    from firebase_admin import credentials, messaging

    if settings.FIREBASE_CREDENTIALS_PATH and os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        firebase_app = firebase_admin.initialize_app(cred)
        print("Firebase 초기화 완료")
except Exception as e:
    print(f"Firebase 초기화 실패: {e}")


async def send_push_notification(
    token: str,
    title: str,
    body: str,
    data: Optional[dict] = None,
) -> bool:
    """
    단일 사용자에게 푸시 알림 발송

    Args:
        token: FCM 토큰
        title: 알림 제목
        body: 알림 내용
        data: 추가 데이터

    Returns:
        성공 여부
    """
    if not firebase_app:
        print("Firebase가 초기화되지 않았습니다.")
        return False

    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            token=token,
        )
        response = messaging.send(message)
        print(f"푸시 알림 발송 성공: {response}")
        return True
    except Exception as e:
        print(f"푸시 알림 발송 실패: {e}")
        return False


async def send_push_notification_to_multiple(
    tokens: List[str],
    title: str,
    body: str,
    data: Optional[dict] = None,
) -> int:
    """
    여러 사용자에게 푸시 알림 발송

    Args:
        tokens: FCM 토큰 목록
        title: 알림 제목
        body: 알림 내용
        data: 추가 데이터

    Returns:
        성공한 발송 수
    """
    if not firebase_app:
        print("Firebase가 초기화되지 않았습니다.")
        return 0

    if not tokens:
        return 0

    try:
        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            tokens=tokens,
        )
        response = messaging.send_each_for_multicast(message)
        print(f"푸시 알림 발송: 성공 {response.success_count}, 실패 {response.failure_count}")
        return response.success_count
    except Exception as e:
        print(f"푸시 알림 발송 실패: {e}")
        return 0


async def send_schedule_notification(
    tokens: List[str],
    schedule_title: str,
    schedule_date: str,
):
    """새 봉사 일정 알림"""
    await send_push_notification_to_multiple(
        tokens=tokens,
        title="새로운 봉사 일정",
        body=f"{schedule_date}에 '{schedule_title}' 봉사 일정이 등록되었습니다.",
        data={"type": "schedule"},
    )


async def send_reminder_notification(
    tokens: List[str],
    schedule_title: str,
):
    """봉사 1일 전 리마인더"""
    await send_push_notification_to_multiple(
        tokens=tokens,
        title="봉사 일정 리마인더",
        body=f"내일 '{schedule_title}' 봉사가 예정되어 있습니다.",
        data={"type": "reminder"},
    )


async def send_notice_notification(
    tokens: List[str],
    notice_title: str,
):
    """새 공지사항 알림"""
    await send_push_notification_to_multiple(
        tokens=tokens,
        title="새로운 공지사항",
        body=f"'{notice_title}' 공지가 등록되었습니다.",
        data={"type": "notice"},
    )

/**
 * 알림 권한 요청 배너.
 * - 푸시 지원 + 권한 미결정 + 미구독 상태일 때만 표시
 * - "알림 받기" 버튼 → 권한 요청 + 구독 저장
 * - "다음에" 버튼 → localStorage 에 dismiss 기록 (1주 후 다시 노출)
 */
import { useEffect, useState } from 'react'
import {
  isPushSupported,
  getPermissionState,
  isSubscribed,
  subscribePush,
} from '@/services/push.service'

interface NotificationBannerProps {
  subscriberType: 'user' | 'admin'
  subscriberId: string
}

const DISMISS_KEY = 'notification_banner_dismissed_until'

export default function NotificationBanner({
  subscriberType,
  subscriberId,
}: NotificationBannerProps) {
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!isPushSupported()) return
      if (getPermissionState() !== 'default') return // 이미 결정됨 (granted/denied)
      if (await isSubscribed()) return // 이미 구독 중

      // dismiss 기간 내면 표시 안 함
      const until = localStorage.getItem(DISMISS_KEY)
      if (until && Number(until) > Date.now()) return

      if (!cancelled) setVisible(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!visible) return null

  const handleEnable = async () => {
    setBusy(true)
    const result = await subscribePush(subscriberType, subscriberId)
    setBusy(false)
    if (result.ok) {
      setVisible(false)
      alert('알림이 활성화되었습니다.')
    } else {
      alert(result.reason)
      if (getPermissionState() === 'denied') setVisible(false)
    }
  }

  const handleDismiss = () => {
    // 1주 후까지 안 보이게
    localStorage.setItem(DISMISS_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000))
    setVisible(false)
  }

  return (
    <div className="mx-4 mt-3 mb-1 rounded-xl border border-blue-200 bg-blue-50 p-3 flex items-start gap-3">
      <div className="text-2xl flex-shrink-0">🔔</div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-800 mb-0.5">알림 받기</h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          새 공지사항과 내일 봉사 일정 알림을 받아보세요.
        </p>
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={handleEnable}
            disabled={busy}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
          >
            {busy ? '설정 중...' : '알림 받기'}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            다음에
          </button>
        </div>
      </div>
    </div>
  )
}

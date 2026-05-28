/**
 * ============================================================================
 * 봉사 대시보드 페이지
 * ============================================================================
 *
 * 로그인한 사용자의 메인 화면입니다.
 *
 * 주요 기능:
 * - 봉사 신청 바로가기 카드
 * - 공지사항 바로가기 (읽지 않은 개수 표시)
 * - 공지사항 팝업 모달
 * - 로그아웃 기능
 * ============================================================================
 */

import { useNavigate } from 'react-router-dom'
import { useUser } from '@/context/UserContext'
import { Notice } from '@/types'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RoleSwitchTab from '@/components/RoleSwitchTab'
import DOMPurify from 'dompurify'

/** 한국 시간(KST) 기준 오늘 날짜를 YYYY-MM-DD 형식으로 반환 */
function getKoreanTodayString(): string {
  const KST_OFFSET = 9 * 60
  const now = new Date()
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60 * 1000
  const kst = new Date(utcMs + KST_OFFSET * 60 * 1000)
  const y = kst.getUTCFullYear()
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0')
  const d = String(kst.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 공지가 오늘 노출 기간 내인지 확인 (기간 미설정은 항상 노출) */
function isNoticeInPeriod(n: { start_date?: string | null; end_date?: string | null }, todayStr: string): boolean {
  if (!n.start_date || !n.end_date) return true
  return n.start_date <= todayStr && todayStr <= n.end_date
}

export default function ServiceSelectPage() {
  const navigate = useNavigate()
  const { user, logout } = useUser()
  const [noticeCount, setNoticeCount] = useState(0)
  const [unreadNoticeCount, setUnreadNoticeCount] = useState(0)

  // 공지사항 팝업 관련 상태
  const [popupNotice, setPopupNotice] = useState<Notice | null>(null)
  const [showPopup, setShowPopup] = useState(false)

  // 로그인 체크
  useEffect(() => {
    if (!user) {
      navigate('/')
    }
  }, [user, navigate])

  // 공지사항 개수 로드
  useEffect(() => {
    if (user) {
      loadCounts()
    }
  }, [user])

  /**
   * 공지사항 개수와 읽지 않은 항목 개수 로드
   */
  const loadCounts = async () => {
    if (!user) return

    try {
      const todayStr = getKoreanTodayString()

      // 사용자 읽음 기록
      const { data: reads } = await supabase
        .from('user_reads')
        .select('target_type, target_id')
        .eq('user_id', user.id)

      const noticeReads = new Set(
        (reads || []).filter((r) => r.target_type === 'notice').map((r) => r.target_id)
      )

      // 활성 공지사항 전체 (노출 기간 필터는 클라이언트에서 처리)
      const { data: activeNotices } = await supabase
        .from('notices')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      const visibleNotices = (activeNotices || []).filter((n) => isNoticeInPeriod(n, todayStr))

      // 표시 가능한 공지 개수
      setNoticeCount(visibleNotices.length)

      // 읽지 않은 공지 개수
      const unreadNotices = visibleNotices.filter((n) => !noticeReads.has(n.id)).length
      setUnreadNoticeCount(unreadNotices)

      // 팝업으로 표시할 공지사항 찾기 (다시 보지 않기 적용 + 노출 기간 내)
      const dismissedNotices = JSON.parse(
        localStorage.getItem(`dismissed_notices_${user.id}`) || '[]'
      ) as string[]

      const noticeForPopup = visibleNotices.find(
        (n) => !dismissedNotices.includes(n.id)
      )

      if (noticeForPopup) {
        setPopupNotice({
          id: noticeForPopup.id,
          title: noticeForPopup.title,
          content: noticeForPopup.content,
          isActive: noticeForPopup.is_active,
          startDate: noticeForPopup.start_date,
          endDate: noticeForPopup.end_date,
          createdBy: noticeForPopup.created_by,
          createdAt: noticeForPopup.created_at,
        })
        setShowPopup(true)
      }
    } catch (err) {
      console.error('Failed to load counts:', err)
    }
  }

  /** 공지사항 팝업 닫기 */
  const handleClosePopup = () => {
    setShowPopup(false)
  }

  /** 다시 보지 않기 처리 */
  const handleDismissNotice = () => {
    if (!user || !popupNotice) return

    const dismissedNotices = JSON.parse(
      localStorage.getItem(`dismissed_notices_${user.id}`) || '[]'
    ) as string[]

    if (!dismissedNotices.includes(popupNotice.id)) {
      dismissedNotices.push(popupNotice.id)
      localStorage.setItem(`dismissed_notices_${user.id}`, JSON.stringify(dismissedNotices))
    }

    setShowPopup(false)
  }

  if (!user) return null

  return (
    <div className="min-h-screen flex flex-col">
      {/* 헤더 */}
      <header className="header">
        <div className="max-w-lg mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-lg font-bold text-blue-600">공개 봉사</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{user.name}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 역할 전환 탭 (관리자에게만 표시) */}
      <RoleSwitchTab />

      {/* 메인 콘텐츠 */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        <div className="space-y-3">
          {/* 봉사 신청 카드 */}
          <button
            onClick={() => navigate('/calendar')}
            className="w-full card-hover text-left flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
              <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800">봉사 신청</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                전시대 봉사, 공원 봉사 일정을 확인하고 신청하세요
              </p>
            </div>
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* 공지사항 카드 */}
          <button
            onClick={() => navigate('/notices')}
            className="w-full card-hover text-left flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-800">공지사항</h3>
                {unreadNoticeCount > 0 && (
                  <span className="badge badge-blue">NEW</span>
                )}
                {noticeCount > 0 && (
                  <span className="badge badge-orange">{noticeCount}개</span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                관리자 공지사항을 확인하세요
              </p>
            </div>
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </main>

      {/* 공지사항 팝업 모달 */}
      {showPopup && popupNotice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleClosePopup}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-orange-50 px-5 py-4 border-b border-orange-100 flex-shrink-0">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                  <h2 className="font-bold text-gray-800">공지사항</h2>
                </div>
                <button
                  onClick={handleClosePopup}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <h3 className="font-semibold text-gray-800 text-lg mb-3">{popupNotice.title}</h3>
              <div
                className="notice-content text-gray-600 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(popupNotice.content) }}
              />
            </div>
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex-shrink-0 space-y-2">
              <button
                onClick={handleClosePopup}
                className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                확인
              </button>
              <button
                onClick={handleDismissNotice}
                className="w-full py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
              >
                다시 보지 않기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

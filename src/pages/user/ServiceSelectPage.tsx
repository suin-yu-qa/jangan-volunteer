/**
 * ============================================================================
 * 봉사 유형 선택 페이지
 * ============================================================================
 *
 * 로그인한 사용자가 봉사 유형을 선택하는 페이지입니다.
 *
 * 주요 기능:
 * - 봉사 유형 목록 표시 (전시대, 공원, 버스정류장)
 * - 각 유형별 주별 참여 제한 표시
 * - 공지사항 바로가기 버튼 (개수 표시)
 * - 로그아웃 기능
 *
 * 봉사 유형:
 * - 전시대 봉사: 주 3회 제한, 씨젠/이화수에서 진행
 * - 공원 봉사: 제한 없음
 * - 버스정류장 봉사: 제한 없음
 * ============================================================================
 */

import { useNavigate } from 'react-router-dom'
import { useUser } from '@/context/UserContext'
import { SERVICE_TYPES, LIMITED_LOCATIONS } from '@/lib/constants'
import { ServiceType, Notice } from '@/types'
import { useEffect, useState } from 'react'
import CartIcon from '@/components/icons/CartIcon'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/schedule'

export default function ServiceSelectPage() {
  const navigate = useNavigate()
  const { user, logout } = useUser()
  const [noticeCount, setNoticeCount] = useState(0)
  const [unreadNoticeCount, setUnreadNoticeCount] = useState(0)

  // 공지사항 팝업 관련 상태
  const [popupNotice, setPopupNotice] = useState<Notice | null>(null)
  const [showPopup, setShowPopup] = useState(false)

  // 오늘 전시대 마감 임박 장소
  const [nearFullLocations, setNearFullLocations] = useState<{ name: string; current: number; max: number }[]>([])

  // 로그인 체크
  useEffect(() => {
    if (!user) {
      navigate('/')
    }
  }, [user, navigate])

  // 공지사항 및 주제 개수 로드
  useEffect(() => {
    if (user) {
      loadCounts()
    }
  }, [user])

  // 오늘 전시대 마감 임박 장소 로드
  useEffect(() => {
    if (user) {
      loadTodayExhibitStatus()
    }
  }, [user])

  /**
   * 공지사항 개수와 읽지 않은 항목 개수 로드
   */
  const loadCounts = async () => {
    if (!user) return

    try {
      // 공지사항 개수
      const { count: notices } = await supabase
        .from('notices')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      if (notices !== null) {
        setNoticeCount(notices)
      }

      // 사용자 읽음 기록
      const { data: reads } = await supabase
        .from('user_reads')
        .select('target_type, target_id')
        .eq('user_id', user.id)

      const noticeReads = new Set(
        (reads || []).filter((r) => r.target_type === 'notice').map((r) => r.target_id)
      )

      // 읽지 않은 공지사항
      const { data: activeNotices } = await supabase
        .from('notices')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      const unreadNotices = (activeNotices || []).filter((n) => !noticeReads.has(n.id)).length
      setUnreadNoticeCount(unreadNotices)

      // 팝업으로 표시할 공지사항 찾기
      // localStorage에서 다시 보지 않기로 설정한 공지사항 ID 목록 가져오기
      const dismissedNotices = JSON.parse(
        localStorage.getItem(`dismissed_notices_${user.id}`) || '[]'
      ) as string[]

      // 다시 보지 않기 하지 않은 최신 활성 공지사항 찾기
      const noticeForPopup = (activeNotices || []).find(
        (n) => !dismissedNotices.includes(n.id)
      )

      if (noticeForPopup) {
        setPopupNotice({
          id: noticeForPopup.id,
          title: noticeForPopup.title,
          content: noticeForPopup.content,
          isActive: noticeForPopup.is_active,
          createdBy: noticeForPopup.created_by,
          createdAt: noticeForPopup.created_at,
        })
        setShowPopup(true)
      }
    } catch (err) {
      console.error('Failed to load counts:', err)
    }
  }

  /**
   * 오늘 전시대 봉사 마감 임박 장소 로드
   */
  const loadTodayExhibitStatus = async () => {
    try {
      const today = formatDate(new Date())

      // 오늘의 전시대 일정 조회
      const { data: schedules } = await supabase
        .from('schedules')
        .select('id, location')
        .eq('service_type', 'exhibit')
        .eq('date', today)

      if (!schedules || schedules.length === 0) return

      // 인원 제한 장소만 필터
      const limitedSchedules = schedules.filter(
        (s) => s.location in LIMITED_LOCATIONS
      )

      if (limitedSchedules.length === 0) return

      // 각 일정의 등록 인원 조회
      const nearFull: { name: string; current: number; max: number }[] = []

      for (const schedule of limitedSchedules) {
        const { count } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('schedule_id', schedule.id)

        const max = LIMITED_LOCATIONS[schedule.location]
        const current = count || 0

        // 마감 임박: 남은 자리 1개 이하 (5/6 이상)
        if (current >= max - 1) {
          nearFull.push({ name: schedule.location, current, max })
        }
      }

      setNearFullLocations(nearFull)
    } catch (err) {
      console.error('Failed to load exhibit status:', err)
    }
  }

  /**
   * 공지사항 팝업 닫기
   */
  const handleClosePopup = () => {
    setShowPopup(false)
  }

  /**
   * 다시 보지 않기 처리
   */
  const handleDismissNotice = () => {
    if (!user || !popupNotice) return

    // localStorage에 다시 보지 않기 설정 저장
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

  const handleSelectService = (serviceType: ServiceType) => {
    navigate(`/calendar/${serviceType}`)
  }

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

      {/* 메인 콘텐츠 */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {/* 봉사 유형 리스트 */}
        <div className="space-y-3">
          {SERVICE_TYPES.map((service) => (
            <button
              key={service.id}
              onClick={() => handleSelectService(service.id)}
              className="w-full card-hover text-left flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                {service.customIcon ? (
                  <CartIcon className="w-7 h-7 text-blue-600" />
                ) : (
                  service.icon
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800">
                    {service.name}
                  </h3>
                  {service.id === 'exhibit' && nearFullLocations.length > 0 && (
                    nearFullLocations.map((loc) => (
                      <span key={loc.name} className="badge badge-red">
                        {loc.name} {loc.current >= loc.max ? '마감' : '마감임박'}
                      </span>
                    ))
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5 truncate">
                  {service.description}
                </p>
              </div>
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        {/* 공지사항 버튼 */}
        <button
          onClick={() => navigate('/notices')}
          className="w-full mt-4 card-hover text-left flex items-center gap-4"
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
            {/* 헤더 */}
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

            {/* 콘텐츠 */}
            <div className="flex-1 overflow-y-auto p-5">
              <h3 className="font-semibold text-gray-800 text-lg mb-3">{popupNotice.title}</h3>
              <div className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                {popupNotice.content}
              </div>
            </div>

            {/* 하단 버튼 */}
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

/**
 * ============================================================================
 * 봉사 유형 선택 페이지
 * ============================================================================
 *
 * 로그인한 사용자가 봉사 유형을 선택하는 페이지입니다.
 *
 * 주요 기능:
 * - 봉사 유형 목록 표시 (전시대, 공원, 버스정류장)
 * - 각 유형별 월별 참여 제한 표시
 * - 공지사항 바로가기 버튼 (개수 표시)
 * - 로그아웃 기능
 *
 * 봉사 유형:
 * - 전시대 봉사: 월 3회 제한, 씨젠/이화수에서 진행
 * - 공원 봉사: 제한 없음
 * - 버스정류장 봉사: 제한 없음
 * ============================================================================
 */

import { useNavigate } from 'react-router-dom'
import { useUser } from '@/context/UserContext'
import { SERVICE_TYPES } from '@/lib/constants'
import { ServiceType } from '@/types'
import { useEffect, useState } from 'react'
import CartIcon from '@/components/icons/CartIcon'
import { supabase } from '@/lib/supabase'

export default function ServiceSelectPage() {
  const navigate = useNavigate()
  const { user, logout } = useUser()
  const [noticeCount, setNoticeCount] = useState(0)
  const [topicCount, setTopicCount] = useState(0)
  const [unreadNoticeCount, setUnreadNoticeCount] = useState(0)
  const [unreadTopicCount, setUnreadTopicCount] = useState(0)

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

  /**
   * 공지사항 및 봉사모임 주제 개수와 읽지 않은 항목 개수 로드
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

      // 봉사모임 주제 개수
      const { count: topics } = await supabase
        .from('meeting_topics')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      if (topics !== null) {
        setTopicCount(topics)
      }

      // 사용자 읽음 기록
      const { data: reads } = await supabase
        .from('user_reads')
        .select('target_type, target_id')
        .eq('user_id', user.id)

      const noticeReads = new Set(
        (reads || []).filter((r) => r.target_type === 'notice').map((r) => r.target_id)
      )
      const topicReads = new Set(
        (reads || []).filter((r) => r.target_type === 'meeting_topic').map((r) => r.target_id)
      )

      // 읽지 않은 공지사항
      const { data: activeNotices } = await supabase
        .from('notices')
        .select('id')
        .eq('is_active', true)

      const unreadNotices = (activeNotices || []).filter((n) => !noticeReads.has(n.id)).length
      setUnreadNoticeCount(unreadNotices)

      // 읽지 않은 봉사모임 주제
      const { data: activeTopics } = await supabase
        .from('meeting_topics')
        .select('id')
        .eq('is_active', true)

      const unreadTopics = (activeTopics || []).filter((t) => !topicReads.has(t.id)).length
      setUnreadTopicCount(unreadTopics)
    } catch (err) {
      console.error('Failed to load counts:', err)
    }
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
                  {service.hasLimit ? (
                    <span className="badge badge-yellow">월 {service.monthlyLimit}회</span>
                  ) : (
                    <span className="badge badge-green">무제한</span>
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

        {/* 봉사모임 주제 버튼 */}
        <button
          onClick={() => navigate('/topics')}
          className="w-full mt-3 card-hover text-left flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800">봉사모임 주제</h3>
              {unreadTopicCount > 0 && (
                <span className="badge badge-blue">NEW</span>
              )}
              {topicCount > 0 && (
                <span className="badge badge-gray">{topicCount}개</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              봉사모임 주제를 확인하세요
            </p>
          </div>
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* 안내 문구 */}
        <div className="mt-6 card bg-blue-50 border-blue-100">
          <h4 className="font-semibold text-blue-800 text-sm mb-2">안내사항</h4>
          <ul className="text-xs text-blue-700 space-y-1.5">
            <li>• 전시대 봉사: 씨젠, 이화수에서 진행 (월 3회 제한)</li>
            <li>• 공원/버스정류장 봉사: 장소는 관리자 공지 확인</li>
            <li>• 문의사항은 봉사감독자에게 문의해주세요</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

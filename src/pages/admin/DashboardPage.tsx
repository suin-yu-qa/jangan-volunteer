/**
 * ============================================================================
 * 관리자 대시보드 페이지
 * ============================================================================
 *
 * 관리자가 로그인 후 첫 화면으로 보는 종합 현황 페이지입니다.
 *
 * 주요 기능:
 * - 오늘 날짜 및 요일 표시
 * - 이번 달 통계 (총 일정 수, 총 신청 수, 오늘 신청 수)
 * - 오늘 봉사 일정 목록 및 참여자 현황
 * - 교대별 참여자 표시
 * - 각 관리 페이지로 이동하는 탭 네비게이션
 *
 * 탭 메뉴:
 * - 대시보드 (현재 페이지)
 * - 일정 관리
 * - 사용자 관리
 * - 공지사항
 * ============================================================================
 */

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAdmin } from '@/context/AdminContext'
import { supabase } from '@/lib/supabase'
import { Schedule, Registration, ServiceType } from '@/types'
import { formatDate, getKoreanDayName } from '@/utils/schedule'
import CartIcon from '@/components/icons/CartIcon'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { admin, logout, isLoggedIn } = useAdmin()

  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [stats, setStats] = useState({
    exhibitSchedules: 0,
    parkSchedules: 0,
    monthlyRegistrations: 0,
    todayRegistrations: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/admin')
    }
  }, [isLoggedIn, navigate])

  useEffect(() => {
    if (isLoggedIn) {
      loadDashboardData()
    }
  }, [isLoggedIn])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const today = formatDate(new Date())
      const startOfMonth = formatDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
      const endOfMonth = formatDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0))

      // 오늘 일정
      const { data: todayData } = await supabase
        .from('schedules')
        .select('*')
        .eq('date', today)

      if (todayData) {
        const schedules: Schedule[] = todayData.map((s) => ({
          id: s.id,
          serviceType: s.service_type as ServiceType,
          date: s.date,
          location: s.location,
          startTime: s.start_time,
          endTime: s.end_time,
          shiftCount: s.shift_count,
          participantsPerShift: s.participants_per_shift,
          createdBy: s.created_by,
          createdAt: s.created_at,
        }))
        setTodaySchedules(schedules)

        // 오늘 일정의 등록자 가져오기
        if (schedules.length > 0) {
          const { data: regData } = await supabase
            .from('registrations')
            .select('*, users(name)')
            .in('schedule_id', schedules.map((s) => s.id))

          if (regData) {
            const regs: Registration[] = regData.map((r: any) => ({
              id: r.id,
              scheduleId: r.schedule_id,
              userId: r.user_id,
              userName: r.users?.name || '',
              shiftNumber: r.shift_number,
              createdAt: r.created_at,
            }))
            setRegistrations(regs)
          }
        }
      }

      // 통계 - 전시대 일정
      const { count: exhibitCount } = await supabase
        .from('schedules')
        .select('*', { count: 'exact', head: true })
        .eq('service_type', 'exhibit')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)

      // 통계 - 공원 일정
      const { count: parkCount } = await supabase
        .from('schedules')
        .select('*', { count: 'exact', head: true })
        .eq('service_type', 'park')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)

      // 매월 신청 수
      const { count: regCount } = await supabase
        .from('registrations')
        .select('*, schedules!inner(*)', { count: 'exact', head: true })
        .gte('schedules.date', startOfMonth)
        .lte('schedules.date', endOfMonth)

      // 오늘 신청 수
      const { count: todayRegCount } = await supabase
        .from('registrations')
        .select('*, schedules!inner(*)', { count: 'exact', head: true })
        .eq('schedules.date', today)

      setStats({
        exhibitSchedules: exhibitCount || 0,
        parkSchedules: parkCount || 0,
        monthlyRegistrations: regCount || 0,
        todayRegistrations: todayRegCount || 0,
      })
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/admin')
  }

  if (!admin) return null

  const today = new Date()
  const dayName = getKoreanDayName(today)

  return (
    <div className="min-h-screen flex flex-col">
      {/* 헤더 */}
      <header className="header">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link to="/admin/dashboard" className="text-lg font-bold text-blue-600 hover:text-blue-700">
              공개 봉사
            </Link>
            <span className="text-sm text-gray-400">관리자</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{admin.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex">
            <Link to="/admin/dashboard" className="tab-item-active">
              대시보드
            </Link>
            <Link to="/admin/schedule" className="tab-item">
              일정 관리
            </Link>
            <Link to="/admin/locations" className="tab-item">
              장소 관리
            </Link>
            <Link to="/admin/users" className="tab-item">
              사용자 관리
            </Link>
            <Link to="/admin/notices" className="tab-item">
              공지사항
            </Link>
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : (
          <>
            {/* 오늘 날짜 */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {today.getMonth() + 1}월 {today.getDate()}일 ({dayName})
              </h2>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Link to="/admin/schedule?tab=exhibit" className="card text-center hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CartIcon className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-gray-500">전시대 봉사</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">{stats.exhibitSchedules}</div>
                <div className="text-xs text-gray-400 mt-1">이번달 일정</div>
              </Link>
              <Link to="/admin/schedule?tab=park" className="card text-center hover:shadow-md hover:border-green-200 transition-all cursor-pointer">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span>🌳</span>
                  <span className="text-xs text-gray-500">공원 봉사</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{stats.parkSchedules}</div>
                <div className="text-xs text-gray-400 mt-1">이번달 일정</div>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Link to="/admin/users" className="card text-center hover:shadow-md hover:border-purple-200 transition-all cursor-pointer">
                <div className="text-2xl font-bold text-purple-600">{stats.monthlyRegistrations}</div>
                <div className="text-xs text-gray-500 mt-1">매월 신청</div>
              </Link>
              <Link to="/admin/schedule?tab=all&focus=today" className="card text-center hover:shadow-md hover:border-orange-200 transition-all cursor-pointer">
                <div className="text-2xl font-bold text-orange-500">{stats.todayRegistrations}</div>
                <div className="text-xs text-gray-500 mt-1">오늘 신청</div>
              </Link>
            </div>

            {/* 오늘 일정 */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">오늘 일정</h3>
                <Link to="/admin/schedule" className="text-sm text-blue-600 hover:underline">
                  전체보기
                </Link>
              </div>

              {todaySchedules.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  오늘 예정된 일정이 없습니다
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 전시대 봉사 */}
                  {todaySchedules.filter(s => s.serviceType === 'exhibit').length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CartIcon className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">전시대 봉사</span>
                      </div>
                      <div className="space-y-2">
                        {todaySchedules
                          .filter(s => s.serviceType === 'exhibit')
                          .map((schedule) => {
                            const scheduleRegs = registrations.filter((r) => r.scheduleId === schedule.id)
                            const maxParticipants = schedule.participantsPerShift

                            return (
                              <div key={schedule.id} className="bg-blue-50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-gray-800">{schedule.location}</span>
                                  <span className="text-sm text-gray-500">
                                    {scheduleRegs.length}/{maxParticipants}명
                                  </span>
                                </div>
                                {scheduleRegs.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {scheduleRegs.map((reg) => (
                                      <span key={reg.id} className="badge badge-blue">
                                        {reg.userName}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )}

                  {/* 공원 봉사 */}
                  {todaySchedules.filter(s => s.serviceType === 'park').length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span>🌳</span>
                        <span className="text-sm font-medium text-gray-700">공원 봉사</span>
                      </div>
                      <div className="space-y-2">
                        {todaySchedules
                          .filter(s => s.serviceType === 'park')
                          .map((schedule) => {
                            const scheduleRegs = registrations.filter((r) => r.scheduleId === schedule.id)
                            const maxParticipants = schedule.participantsPerShift

                            return (
                              <div key={schedule.id} className="bg-green-50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-gray-800">{schedule.location}</span>
                                  <span className="text-sm text-gray-500">
                                    {scheduleRegs.length}/{maxParticipants}명
                                  </span>
                                </div>
                                {scheduleRegs.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {scheduleRegs.map((reg) => (
                                      <span key={reg.id} className="badge badge-green">
                                        {reg.userName}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

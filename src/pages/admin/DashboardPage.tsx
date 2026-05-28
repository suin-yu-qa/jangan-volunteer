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
import RoleSwitchTab from '@/components/RoleSwitchTab'

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
    pendingUsers: 0,
  })
  const [pendingUserList, setPendingUserList] = useState<{ id: string; name: string; createdAt: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

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

  // 30초 간격 자동 새로고침
  useEffect(() => {
    if (!isLoggedIn) return
    const interval = setInterval(() => {
      loadDashboardData(true)
    }, 30000)
    return () => clearInterval(interval)
  }, [isLoggedIn])

  const loadDashboardData = async (silent = false) => {
    if (!silent) setIsLoading(true)
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

      // 승인 대기 사용자
      const { data: pendingUsers, count: pendingCount } = await supabase
        .from('users')
        .select('id, name, created_at', { count: 'exact' })
        .eq('is_approved', false)
        .order('created_at', { ascending: false })

      if (pendingUsers) {
        setPendingUserList(pendingUsers.map((u) => ({
          id: u.id,
          name: u.name,
          createdAt: u.created_at,
        })))
      }

      setStats({
        exhibitSchedules: exhibitCount || 0,
        parkSchedules: parkCount || 0,
        monthlyRegistrations: regCount || 0,
        todayRegistrations: todayRegCount || 0,
        pendingUsers: pendingCount || 0,
      })
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setIsLoading(false)
      setLastRefreshed(new Date())
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

      {/* 역할 전환 탭 */}
      <RoleSwitchTab maxWidth="max-w-4xl" />

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
            <div className="mb-6 flex justify-between items-end">
              <h2 className="text-xl font-bold text-gray-800">
                {today.getMonth() + 1}월 {today.getDate()}일 ({dayName})
              </h2>
              <span className="text-xs text-gray-400">
                {lastRefreshed.getHours().toString().padStart(2, '0')}:{lastRefreshed.getMinutes().toString().padStart(2, '0')}:{lastRefreshed.getSeconds().toString().padStart(2, '0')} 갱신 · 30초 자동
              </span>
            </div>

            {/* 섹션 1: 봉사 일정 */}
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">봉사 일정</h3>
              <div className="grid grid-cols-2 gap-3">
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
            </div>

            {/* 섹션 2: 봉사 참여 신청 */}
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">봉사 참여 신청</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/admin/schedule" className="card text-center hover:shadow-md hover:border-purple-200 transition-all cursor-pointer">
                  <div className="text-2xl font-bold text-purple-600">{stats.monthlyRegistrations}</div>
                  <div className="text-xs text-gray-500 mt-1">이번달 신청</div>
                </Link>
                <Link to="/admin/schedule?tab=all&focus=today" className="card text-center hover:shadow-md hover:border-orange-200 transition-all cursor-pointer">
                  <div className="text-2xl font-bold text-orange-500">{stats.todayRegistrations}</div>
                  <div className="text-xs text-gray-500 mt-1">오늘 신청</div>
                </Link>
              </div>
            </div>

            {/* 섹션 3: 사용자 승인 대기 */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">사용자 가입 승인</h3>
              {stats.pendingUsers > 0 ? (
                <div className="card border-yellow-200 bg-yellow-50">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                      </span>
                      <h3 className="font-semibold text-yellow-800">
                        승인 대기 {stats.pendingUsers}명
                      </h3>
                    </div>
                    <Link to="/admin/users" className="text-sm text-yellow-700 hover:underline font-medium">
                      승인하기 →
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pendingUserList.map((u) => (
                      <div key={u.id} className="inline-flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 border border-yellow-200">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                        <span className="text-sm font-medium text-gray-700">{u.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="card text-center py-4">
                  <span className="text-sm text-gray-400">승인 대기 중인 사용자가 없습니다</span>
                </div>
              )}
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
                  {/* 전시대 봉사 - 같은 타입 일정을 하나로 합침 */}
                  {(() => {
                    const exhibitSchedules = todaySchedules.filter(s => s.serviceType === 'exhibit')
                    if (exhibitSchedules.length === 0) return null
                    const allRegs = registrations.filter(r =>
                      exhibitSchedules.some(s => s.id === r.scheduleId)
                    )
                    const EXHIBIT_MAX = 12
                    return (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CartIcon className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">전시대 봉사</span>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-500">
                              {allRegs.length}/{EXHIBIT_MAX}명
                            </span>
                          </div>
                          {allRegs.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {allRegs.map((reg) => (
                                <span key={reg.id} className="badge badge-blue">
                                  {reg.userName}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                  {/* 공원 봉사 - 같은 타입 일정을 하나로 합침 */}
                  {(() => {
                    const parkSchedules = todaySchedules.filter(s => s.serviceType === 'park')
                    if (parkSchedules.length === 0) return null
                    const allRegs = registrations.filter(r =>
                      parkSchedules.some(s => s.id === r.scheduleId)
                    )
                    return (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span>🌳</span>
                          <span className="text-sm font-medium text-gray-700">공원 봉사</span>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-500">
                              {allRegs.length}명 신청
                            </span>
                          </div>
                          {allRegs.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {allRegs.map((reg) => (
                                <span key={reg.id} className="badge badge-green">
                                  {reg.userName}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

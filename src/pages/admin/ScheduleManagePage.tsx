/**
 * ============================================================================
 * 일정 관리 페이지 (관리자용)
 * ============================================================================
 *
 * 봉사 일정을 생성, 조회, 삭제하는 관리 페이지입니다.
 *
 * 주요 기능:
 * - 봉사 일정 목록 조회 (월별 필터링)
 * - 새 일정 생성 (봉사 유형, 날짜)
 * - 전시대 봉사: 일정당 최대 12명 / 공원 봉사: 인원 제한 없음
 * - 일정 삭제
 * ============================================================================
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAdmin } from '@/context/AdminContext'
import { supabase } from '@/lib/supabase'
import { Schedule, ServiceType, Registration } from '@/types'
import {
  formatDate,
  getKoreanDayName,
  isCampaignLocation,
} from '@/utils/schedule'
import { SERVICE_TYPES, isUnifiedDate } from '@/lib/constants'
import CartIcon from '@/components/icons/CartIcon'
import RoleSwitchTab from '@/components/RoleSwitchTab'

export default function ScheduleManagePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { admin, logout, isLoggedIn } = useAdmin()
  /** 전시대 봉사 최대 인원 */
  const EXHIBIT_MAX = 12

  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // 선택 모드 관련 상태
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedSchedules, setSelectedSchedules] = useState<Set<string>>(new Set())

  // 스와이프 관련 상태
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)
  const minSwipeDistance = 50
  const scheduleListRef = useRef<HTMLDivElement>(null)
  const closestDateRef = useRef<HTMLDivElement>(null)

  // 탭 목록
  const tabList: (ServiceType | 'all')[] = ['all', 'exhibit', 'park']

  // 폼 상태
  const [formData, setFormData] = useState({
    serviceType: 'exhibit' as ServiceType,
    date: formatDate(new Date()),
  })

  // URL 쿼리 파라미터로 탭 설정
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'exhibit' || tab === 'park' || tab === 'all') {
      setSelectedServiceType(tab)
    }
  }, [searchParams])

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/admin')
    }
  }, [isLoggedIn, navigate])

  useEffect(() => {
    if (isLoggedIn) {
      loadSchedules()
      deleteOldRegistrations()
    }
  }, [isLoggedIn, selectedMonth])

  // 오늘 또는 가장 가까운 날짜로 자동 스크롤
  useEffect(() => {
    if (!isLoading && closestDateRef.current) {
      setTimeout(() => {
        closestDateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [isLoading])

  /**
   * 3개월 이전 봉사 신청 이력 자동 삭제
   */
  const deleteOldRegistrations = async () => {
    try {
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      const cutoffDate = formatDate(threeMonthsAgo)

      const { data: oldSchedules } = await supabase
        .from('schedules')
        .select('id')
        .lt('date', cutoffDate)

      if (oldSchedules && oldSchedules.length > 0) {
        const oldScheduleIds = oldSchedules.map((s) => s.id)

        const { error } = await supabase
          .from('registrations')
          .delete()
          .in('schedule_id', oldScheduleIds)

        if (error) {
          console.error('Failed to delete old registrations:', error)
        }
      }
    } catch (err) {
      console.error('Failed to cleanup old registrations:', err)
    }
  }

  const loadSchedules = async () => {
    setIsLoading(true)
    try {
      const year = selectedMonth.getFullYear()
      const month = selectedMonth.getMonth()
      const startOfMonth = formatDate(new Date(year, month, 1))
      const endOfMonth = formatDate(new Date(year, month + 1, 0))

      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)
        .order('date', { ascending: true })
        .order('service_type', { ascending: true })

      if (error) throw error

      const scheduleList: Schedule[] = (data || []).map((s) => ({
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

      setSchedules(scheduleList)

      // 신청 내역 로드
      if (scheduleList.length > 0) {
        const scheduleIds = scheduleList.map((s) => s.id)
        const { data: regData, error: regError } = await supabase
          .from('registrations')
          .select('*, users(name)')
          .in('schedule_id', scheduleIds)

        if (!regError && regData) {
          const regList: Registration[] = regData.map((r: any) => ({
            id: r.id,
            scheduleId: r.schedule_id,
            userId: r.user_id,
            userName: r.users?.name || '',
            shiftNumber: r.shift_number,
            createdAt: r.created_at,
          }))
          setRegistrations(regList)
        }
      } else {
        setRegistrations([])
      }
    } catch (err) {
      console.error('Failed to load schedules:', err)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 일정 생성
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!admin) return

    const isUnified = isUnifiedDate(formData.date)
    // 2026-06-01 이후: 폼의 유형 선택과 무관하게 "공개 봉사"로 통일 저장
    const serviceType = isUnified ? 'exhibit' : formData.serviceType
    const location = isUnified
      ? '공개 봉사'
      : (SERVICE_TYPES.find(s => s.id === serviceType)?.name || serviceType)
    const participantsPerShift = isUnified
      ? 999
      : (serviceType === 'exhibit' ? EXHIBIT_MAX : 999)

    try {
      const { error } = await supabase.from('schedules').insert({
        service_type: serviceType,
        date: formData.date,
        location,
        start_time: '00:00',
        end_time: '00:00',
        shift_count: 1,
        participants_per_shift: participantsPerShift,
        created_by: admin.id,
      })

      if (error) throw error

      setIsModalOpen(false)
      loadSchedules()

      setFormData({
        serviceType: 'exhibit',
        date: formatDate(new Date()),
      })
    } catch (err) {
      console.error('Failed to create schedule:', err)
      alert('일정 등록에 실패했습니다.')
    }
  }

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('이 일정을 삭제하시겠습니까? 등록된 신청도 함께 삭제됩니다.')) {
      return
    }

    try {
      await supabase.from('registrations').delete().eq('schedule_id', scheduleId)

      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleId)

      if (error) throw error

      loadSchedules()
    } catch (err) {
      console.error('Failed to delete schedule:', err)
      alert('일정 삭제에 실패했습니다.')
    }
  }

  /**
   * 신청자 삭제 (관리자용)
   */
  const handleDeleteRegistration = async (registrationId: string, userName: string) => {
    if (!confirm(`${userName}님의 신청을 취소하시겠습니까?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', registrationId)

      if (error) throw error

      loadSchedules()
    } catch (err) {
      console.error('Failed to delete registration:', err)
      alert('신청 취소에 실패했습니다.')
    }
  }

  /**
   * 일정 선택/해제 토글
   */
  const toggleScheduleSelection = (scheduleId: string) => {
    setSelectedSchedules((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(scheduleId)) {
        newSet.delete(scheduleId)
      } else {
        newSet.add(scheduleId)
      }
      return newSet
    })
  }

  /**
   * 전체 선택/해제
   */
  const toggleSelectAll = () => {
    if (selectedSchedules.size === filteredSchedules.length) {
      setSelectedSchedules(new Set())
    } else {
      setSelectedSchedules(new Set(filteredSchedules.map((s) => s.id)))
    }
  }

  /**
   * 선택 모드 종료
   */
  const exitSelectionMode = () => {
    setIsSelectionMode(false)
    setSelectedSchedules(new Set())
  }

  /**
   * 선택한 일정 일괄 삭제
   */
  const handleBulkDelete = async () => {
    if (selectedSchedules.size === 0) {
      alert('삭제할 일정을 선택해주세요.')
      return
    }

    if (!confirm(`선택한 ${selectedSchedules.size}개의 일정을 삭제하시겠습니까?\n등록된 신청도 함께 삭제됩니다.`)) {
      return
    }

    try {
      const scheduleIds = Array.from(selectedSchedules)

      // 먼저 관련 신청 삭제
      await supabase.from('registrations').delete().in('schedule_id', scheduleIds)

      // 일정 삭제
      const { error } = await supabase
        .from('schedules')
        .delete()
        .in('id', scheduleIds)

      if (error) throw error

      alert(`${scheduleIds.length}개의 일정이 삭제되었습니다.`)
      exitSelectionMode()
      loadSchedules()
    } catch (err) {
      console.error('Failed to bulk delete schedules:', err)
      alert('일정 삭제에 실패했습니다.')
    }
  }



  const handleLogout = () => {
    logout()
    navigate('/admin')
  }

  /**
   * 스와이프 시작
   */
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY })
  }

  /**
   * 스와이프 이동
   */
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY })
  }

  /**
   * 스와이프 종료 - 수평 스와이프만 탭 전환 (수직 스크롤 무시)
   */
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distanceX = touchStart.x - touchEnd.x
    const distanceY = Math.abs(touchStart.y - touchEnd.y)

    // 수직 이동이 수평 이동보다 크면 스크롤로 판단 → 탭 전환 안 함
    if (distanceY > Math.abs(distanceX)) return

    const isLeftSwipe = distanceX > minSwipeDistance
    const isRightSwipe = distanceX < -minSwipeDistance

    const currentIndex = tabList.indexOf(selectedServiceType)

    if (isLeftSwipe && currentIndex < tabList.length - 1) {
      setSelectedServiceType(tabList[currentIndex + 1])
    } else if (isRightSwipe && currentIndex > 0) {
      setSelectedServiceType(tabList[currentIndex - 1])
    }
  }

  if (!admin) return null

  // 봉사 유형별 필터링
  const typeFilteredSchedules = selectedServiceType === 'all'
    ? schedules
    : schedules.filter((s) => s.serviceType === selectedServiceType)

  // 검색어 필터링 (신청자 이름)
  const filteredSchedules = searchQuery.trim()
    ? typeFilteredSchedules.filter((s) => {
        const query = searchQuery.trim().toLowerCase()
        const scheduleRegs = registrations.filter((r) => r.scheduleId === s.id)
        return scheduleRegs.some((r) => r.userName?.toLowerCase().includes(query))
      })
    : typeFilteredSchedules

  // 일정을 날짜별로 그룹화
  const schedulesByDate = filteredSchedules.reduce((acc, schedule) => {
    if (!acc[schedule.date]) {
      acc[schedule.date] = []
    }
    acc[schedule.date].push(schedule)
    return acc
  }, {} as Record<string, Schedule[]>)

  return (
    <div className="min-h-screen flex flex-col">
      {/* 헤더 */}
      <header className="header">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link to="/admin/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img
                src="/icons/icon-512-v2.png"
                alt=""
                className="w-7 h-7 rounded-md object-cover"
                draggable={false}
              />
              <span className="text-lg font-bold text-blue-600">공개 봉사</span>
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
            <Link to="/admin/dashboard" className="tab-item">
              대시보드
            </Link>
            <Link to="/admin/schedule" className="tab-item-active">
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
        {/* 검색 필터 */}
        <div className="mb-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="신청자 이름으로 검색..."
              className="input-field pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 상단 컨트롤 - 2줄 레이아웃 */}
        <div className="mb-6 space-y-3">
          {/* 첫번째 줄: 월 선택 */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-bold text-gray-800 min-w-[120px] text-center">
              {selectedMonth.getFullYear()}년 {selectedMonth.getMonth() + 1}월
            </h2>
            <button
              onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* 두번째 줄: 버튼들 */}
          <div className="flex items-center justify-end gap-2">
            {isSelectionMode ? (
              <>
                <button
                  onClick={toggleSelectAll}
                  className="btn-secondary flex items-center gap-1"
                >
                  <span className="hidden sm:inline">{selectedSchedules.size === filteredSchedules.length ? '전체 해제' : '전체 선택'}</span>
                  <span className="sm:hidden">{selectedSchedules.size === filteredSchedules.length ? '해제' : '전체'}</span>
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedSchedules.size === 0}
                  className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="hidden sm:inline">삭제</span> ({selectedSchedules.size})
                </button>
                <button
                  onClick={exitSelectionMode}
                  className="btn-secondary"
                >
                  취소
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsSelectionMode(true)}
                  className="btn-secondary flex items-center gap-1"
                  title="선택"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span className="hidden sm:inline">선택</span>
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="btn-primary flex items-center gap-1"
                  title="일정 추가"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">일정 추가</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 일정 목록 - 스와이프로 탭 전환 가능 */}
        <div
          ref={scheduleListRef}
          className="card"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {selectedServiceType === 'all'
                ? '이번 달 일정이 없습니다'
                : `이번 달 ${SERVICE_TYPES.find(s => s.id === selectedServiceType)?.name || ''} 일정이 없습니다`
              }
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {(() => {
                const today = formatDate(new Date())
                const sortedDates = Object.keys(schedulesByDate).sort()

                // 오늘 날짜가 있으면 오늘, 없으면 오늘과 가장 가까운 날짜 찾기
                let closestDate = sortedDates.find(d => d === today)
                if (!closestDate) {
                  // 오늘 이후의 가장 가까운 날짜 찾기
                  closestDate = sortedDates.find(d => d >= today)
                  // 오늘 이후 날짜가 없으면 오늘 이전 가장 가까운 날짜
                  if (!closestDate && sortedDates.length > 0) {
                    closestDate = sortedDates[sortedDates.length - 1]
                  }
                }

                return Object.entries(schedulesByDate).map(([date, dateSchedules]) => {
                  const dateObj = new Date(date)
                  const dayName = getKoreanDayName(dateObj)
                  const isToday = today === date
                  const isClosestDate = closestDate === date

                  return (
                    <div
                      key={date}
                      className="py-4 first:pt-0 last:pb-0"
                      ref={isClosestDate ? closestDateRef : null}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`font-semibold ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>
                          {dateObj.getMonth() + 1}월 {dateObj.getDate()}일 ({dayName})
                        </span>
                        {isToday && <span className="badge badge-blue">오늘</span>}
                      </div>
                    <div className="space-y-2">
                      {/* 그룹: 일반 전시대(통합) + 캠페인 슬롯별 분리 + 공원 */}
                      {(() => {
                        type AdminGroup = {
                          key: string
                          name: string
                          schedules: Schedule[]
                          serviceType: ServiceType
                          isCampaign: boolean
                          perGroupMax: number  // 0이면 무제한
                          icon?: string
                          customIcon?: boolean
                          badgeClass: string
                          timeLabel?: string
                        }
                        const groups: AdminGroup[] = []

                        // 2026-06-01 이후: 해당 날짜의 모든 일정을 "공개 봉사" 하나로 통합 표시
                        // (관리자도 사용자와 동일한 통합 그룹으로 보이도록)
                        if (isUnifiedDate(date)) {
                          if (dateSchedules.length > 0) {
                            groups.push({
                              key: 'unified-public',
                              name: '공개 봉사',
                              schedules: dateSchedules,
                              serviceType: 'exhibit',
                              isCampaign: false,
                              perGroupMax: 0,
                              icon: '🤝',
                              badgeClass: 'badge-indigo',
                            })
                          }
                        } else {

                        const exhibitService = SERVICE_TYPES.find(s => s.id === 'exhibit')
                        const parkService = SERVICE_TYPES.find(s => s.id === 'park')

                        const regularExhibit = dateSchedules.filter(
                          s => s.serviceType === 'exhibit' && !isCampaignLocation(s.location)
                        )
                        if (regularExhibit.length > 0) {
                          groups.push({
                            key: 'exhibit-regular',
                            name: exhibitService?.name || '전시대',
                            schedules: regularExhibit,
                            serviceType: 'exhibit',
                            isCampaign: false,
                            perGroupMax: EXHIBIT_MAX,
                            icon: exhibitService?.icon,
                            customIcon: exhibitService?.customIcon,
                            badgeClass: 'badge-blue',
                          })
                        }

                        const campaignByLoc = new Map<string, Schedule[]>()
                        dateSchedules
                          .filter(s => s.serviceType === 'exhibit' && isCampaignLocation(s.location))
                          .forEach(s => {
                            const arr = campaignByLoc.get(s.location) || []
                            arr.push(s)
                            campaignByLoc.set(s.location, arr)
                          })
                        Array.from(campaignByLoc.entries())
                          .sort(([a], [b]) => a.localeCompare(b))
                          .forEach(([loc, schs]) => {
                            const sample = schs[0]
                            const timeLabel = sample
                              ? `${sample.startTime.slice(0, 5)} ~ ${sample.endTime.slice(0, 5)}`
                              : ''
                            groups.push({
                              key: `campaign-${loc}`,
                              name: loc,
                              schedules: schs,
                              serviceType: 'exhibit',
                              isCampaign: true,
                              perGroupMax: 0, // 무제한 — 신청 인원 수만 표시 (공원 봉사 동일)
                              icon: '📣',
                              badgeClass: 'badge-orange',
                              timeLabel,
                            })
                          })

                        const parkSch = dateSchedules.filter(s => s.serviceType === 'park')
                        if (parkSch.length > 0) {
                          groups.push({
                            key: 'park',
                            name: parkService?.name || '공원',
                            schedules: parkSch,
                            serviceType: 'park',
                            isCampaign: false,
                            perGroupMax: 0,
                            icon: parkService?.icon,
                            badgeClass: 'badge-green',
                          })
                        }
                        }  // end else (legacy 비통합 분기)

                        return groups.map((group) => {
                          const allRegs = registrations.filter(r =>
                            group.schedules.some(s => s.id === r.scheduleId)
                          )
                          const filledSlots = allRegs.length
                          const limited = group.perGroupMax > 0
                          const allSelected = group.schedules.every(s => selectedSchedules.has(s.id))

                          return (
                            <div
                              key={group.key}
                              className={`bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors ${
                                isSelectionMode && allSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                              }`}
                              onClick={isSelectionMode ? () => {
                                group.schedules.forEach(s => toggleScheduleSelection(s.id))
                              } : undefined}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  {isSelectionMode && (
                                    <input
                                      type="checkbox"
                                      checked={allSelected}
                                      onChange={() => {
                                        group.schedules.forEach(s => toggleScheduleSelection(s.id))
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                    />
                                  )}
                                  {group.customIcon ? (
                                    <CartIcon className="w-5 h-5 text-blue-600" />
                                  ) : (
                                    <span className="text-lg">{group.icon}</span>
                                  )}
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`badge ${group.badgeClass}`}>
                                        {group.name}
                                      </span>
                                      {group.timeLabel && (
                                        <span className="text-xs text-gray-500">{group.timeLabel}</span>
                                      )}
                                      <span className="text-sm text-gray-500">
                                        {limited ? `${filledSlots}/${group.perGroupMax}명` : `${filledSlots}명 신청`}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {!isSelectionMode && (
                                  <button
                                    onClick={() => {
                                      if (!confirm(`이 날짜의 ${group.name} 일정을 모두 삭제하시겠습니까?`)) return
                                      group.schedules.forEach(s => handleDelete(s.id))
                                    }}
                                    className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                                  >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                              {/* 신청자 목록 */}
                              {allRegs.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {allRegs.map((reg) => (
                                    <span
                                      key={reg.id}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600 group"
                                    >
                                      {reg.userName || '참여자'}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteRegistration(reg.id, reg.userName || '참여자')
                                        }}
                                        className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-100 rounded-full transition-colors"
                                        title="신청 취소"
                                      >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })
                      })()}
                    </div>
                  </div>
                  )
                })
              })()}
            </div>
          )}
        </div>
      </main>

      {/* 일정 추가 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">일정 추가</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* 봉사 유형 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  봉사 유형
                </label>
                <select
                  value={formData.serviceType}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      serviceType: e.target.value as ServiceType,
                    })
                  }}
                  className="input-field"
                >
                  {SERVICE_TYPES.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.customIcon ? '📋' : service.icon} {service.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 날짜 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  날짜
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>

              {/* 안내 */}
              <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                {isUnifiedDate(formData.date)
                  ? '✓ 2026-06-01 이후 — 유형 선택과 무관하게 "공개 봉사"로 통합 저장됩니다 (인원 제한 없음)'
                  : formData.serviceType === 'exhibit'
                    ? `전시대 봉사: 일정당 최대 ${EXHIBIT_MAX}명`
                    : '공원 봉사: 인원 제한 없음'
                }
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 btn-secondary"
                >
                  취소
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

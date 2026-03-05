/**
 * ============================================================================
 * 봉사 일정 캘린더 페이지
 * ============================================================================
 *
 * 선택한 봉사 유형의 일정을 달력과 리스트로 표시하고
 * 봉사 신청/취소를 처리하는 핵심 페이지입니다.
 *
 * 주요 기능:
 * - 월별 달력에 봉사 일정 표시
 * - 장소별 탭 필터링 (전시대: 씨젠/이화수, 공원: 장안 근린 공원/뚝방 공원/마로니에 공원)
 * - 탭 간 슬라이드 애니메이션
 * - 전시대 봉사: 일정당 최대 12명, 월 10회 제한
 * - 공원 봉사: 일정당 최대 30명
 * - 봉사 신청 및 취소 (불참하기)
 * - 내 신청 현황 요약 표시
 * ============================================================================
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUser } from '@/context/UserContext'
import { SERVICE_TYPES, hasParticipantLimit } from '@/lib/constants'
import { useLocations } from '@/hooks/useLocations'
import { ServiceType, Schedule, Registration } from '@/types'
import { supabase } from '@/lib/supabase'
import { formatDate, getKoreanDayName } from '@/utils/schedule'
import Calendar from '@/components/common/Calendar'
import CartIcon from '@/components/icons/CartIcon'

export default function CalendarPage() {
  const { serviceType } = useParams<{ serviceType: ServiceType }>()
  const navigate = useNavigate()
  const { user } = useUser()
  const { exhibitLocations, parkLocations, getMaxParticipants } = useLocations()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // 장소별 탭 상태
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const scheduleListRef = useRef<HTMLDivElement>(null)

  // 스와이프 관련 상태
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const minSwipeDistance = 50

  const service = SERVICE_TYPES.find((s) => s.id === serviceType)

  // 장소 목록 (DB에서 동적으로 로드)
  const locations = serviceType === 'exhibit'
    ? exhibitLocations
    : serviceType === 'park'
      ? parkLocations
      : []

  // 장소 탭이 있는 봉사 유형인 경우 첫 번째 장소를 기본 선택
  useEffect(() => {
    if ((serviceType === 'exhibit' || serviceType === 'park') && locations.length > 0 && selectedLocation === 'all') {
      setSelectedLocation(locations[0])
    }
  }, [serviceType, locations, selectedLocation])

  useEffect(() => {
    if (!user) {
      navigate('/')
    }
  }, [user, navigate])

  useEffect(() => {
    if (!serviceType) return
    loadSchedules()
  }, [serviceType])

  const loadSchedules = async () => {
    setIsLoading(true)
    try {
      const now = new Date()
      // 과거 3개월부터 미래 2개월까지 일정 로드 (이력 조회 지원)
      const startOfPastMonths = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0)

      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedules')
        .select('*')
        .eq('service_type', serviceType)
        .gte('date', formatDate(startOfPastMonths))
        .lte('date', formatDate(endOfNextMonth))
        .order('date', { ascending: true })

      if (scheduleError) throw scheduleError

      const scheduleList: Schedule[] = (scheduleData || []).map((s) => ({
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
      }
    } catch (err) {
      console.error('Failed to load schedules:', err)
      setSchedules([])
      setRegistrations([])
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 날짜 클릭 핸들러
   */
  const handleDateClick = (date: Date) => {
    const dateStr = formatDate(date)
    setSelectedDate(dateStr)
    // 일정 리스트로 스크롤
    setTimeout(() => {
      scheduleListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleRegister = async (scheduleId: string, location: string) => {
    if (!user) return

    // 씨젠, 롯데리아 앞만 인원 제한 적용
    if (hasParticipantLimit(location)) {
      const currentRegs = registrations.filter((r) => r.scheduleId === scheduleId)
      const maxParticipants = getMaxParticipants(location)
      if (currentRegs.length >= maxParticipants) {
        alert('신청 인원이 마감되었습니다.')
        return
      }
    }

    try {
      const { error } = await supabase
        .from('registrations')
        .insert({
          schedule_id: scheduleId,
          user_id: user.id,
          shift_number: 1, // 교대 개념 제거, 기본값 1
        })

      if (error) throw error
      await loadSchedules()
    } catch (err) {
      console.error('Registration failed:', err)
      alert('신청에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const handleCancel = async (registrationId: string) => {
    if (!confirm('정말 불참하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', registrationId)

      if (error) throw error
      await loadSchedules()
    } catch (err) {
      console.error('Cancel failed:', err)
      alert('취소에 실패했습니다. 다시 시도해주세요.')
    }
  }

  /**
   * 탭 변경 핸들러 (슬라이드 애니메이션 포함)
   */
  const handleLocationChange = (newLocation: string) => {
    if (newLocation === selectedLocation) return

    const currentIndex = locations.indexOf(selectedLocation)
    const newIndex = locations.indexOf(newLocation)

    setSlideDirection(newIndex > currentIndex ? 'left' : 'right')
    setSelectedLocation(newLocation)

    // 애니메이션 후 방향 초기화
    setTimeout(() => setSlideDirection(null), 300)
  }

  /**
   * 스와이프 시작
   */
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  /**
   * 스와이프 이동
   */
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  /**
   * 스와이프 종료 - 탭 전환
   */
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (locations.length > 0) {
      const currentIndex = locations.indexOf(selectedLocation)

      if (isLeftSwipe && currentIndex < locations.length - 1) {
        // 왼쪽으로 스와이프 -> 다음 탭
        handleLocationChange(locations[currentIndex + 1])
      } else if (isRightSwipe && currentIndex > 0) {
        // 오른쪽으로 스와이프 -> 이전 탭
        handleLocationChange(locations[currentIndex - 1])
      }
    }
  }

  if (!user || !service) return null

  // 장소별 필터링된 일정
  const filteredSchedules = (serviceType === 'exhibit' || serviceType === 'park')
    ? schedules.filter((s) => s.location === selectedLocation)
    : schedules

  const scheduleDates = filteredSchedules.map((s) => s.date)
  const myRegistrations = registrations.filter((r) => r.userId === user.id)
  const today = formatDate(new Date())

  // 마감 상태 계산 (날짜별)
  const dateStatusMap = new Map<string, { total: number; full: number }>()
  filteredSchedules.forEach((schedule) => {
    const scheduleRegs = registrations.filter((r) => r.scheduleId === schedule.id)
    const maxParticipants = getMaxParticipants(schedule.location)
    const isFull = scheduleRegs.length >= maxParticipants

    const current = dateStatusMap.get(schedule.date) || { total: 0, full: 0 }
    current.total += 1
    if (isFull) current.full += 1
    dateStatusMap.set(schedule.date, current)
  })

  // 완전 마감 날짜 (해당 날짜의 모든 일정이 마감)
  const fullDates = Array.from(dateStatusMap.entries())
    .filter(([_, status]) => status.total > 0 && status.full === status.total)
    .map(([date]) => date)

  // 일부 마감 날짜 (해당 날짜의 일부 일정만 마감)
  const partialFullDates = Array.from(dateStatusMap.entries())
    .filter(([_, status]) => status.full > 0 && status.full < status.total)
    .map(([date]) => date)

  // 선택된 날짜가 있으면 그 날짜의 일정만, 없으면 오늘 일정만 표시
  const displayDate = selectedDate || today
  const displaySchedules = filteredSchedules.filter((s) => s.date === displayDate)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* 헤더 */}
      <header className="header">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/select')}
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                title="이전"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {service.customIcon ? (
                  <CartIcon className="w-6 h-6 text-blue-600" />
                ) : (
                  <span>{service.icon}</span>
                )}
                <span>{service.name}</span>
              </h1>
            </div>
            <button
              onClick={() => navigate('/select')}
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              title="홈으로"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">

        {/* 달력 */}
        <div className="card mb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : (
            <Calendar
              scheduleDates={scheduleDates}
              onDateClick={handleDateClick}
              selectedDate={selectedDate || undefined}
              fullDates={fullDates}
              partialFullDates={partialFullDates}
            />
          )}
        </div>

        {/* 장소별 탭 (전시대, 공원) - 일정 리스트 위에 배치 */}
        {(serviceType === 'exhibit' || serviceType === 'park') && locations.length > 0 && (
          <div className="mb-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {locations.map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleLocationChange(loc)}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                    selectedLocation === loc
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 일정 리스트 - 스와이프로 탭 전환 가능 */}
        <div
          ref={scheduleListRef}
          className="mb-4 overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            {selectedDate ? (
              <>
                {new Date(displayDate).getMonth() + 1}/{new Date(displayDate).getDate()}일 일정
              </>
            ) : (
              '오늘 일정'
            )}
            {(serviceType === 'exhibit' || serviceType === 'park') && selectedLocation && (
              <span className="ml-2 text-blue-600">({selectedLocation})</span>
            )}
          </h2>

          <div
            ref={contentRef}
            className={`transition-transform duration-300 ease-in-out ${
              slideDirection === 'left' ? 'animate-slide-left' : ''
            } ${slideDirection === 'right' ? 'animate-slide-right' : ''}`}
          >
            {displaySchedules.length === 0 ? (
              <div className="card text-center py-8 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {selectedDate
                  ? `${new Date(displayDate).getMonth() + 1}/${new Date(displayDate).getDate()}일에 일정이 없습니다`
                  : '오늘 일정이 없습니다'
                }
              </div>
            ) : (
              <div className="space-y-3">
                {displaySchedules.map((schedule: Schedule) => {
                  const dateObj = new Date(schedule.date)
                  const dayName = getKoreanDayName(dateObj)
                  const isToday = schedule.date === today
                  const scheduleRegs = registrations.filter((r) => r.scheduleId === schedule.id)
                  const myReg = scheduleRegs.find((r) => r.userId === user.id)
                  const filledSlots = scheduleRegs.length
                  const maxParticipants = getMaxParticipants(schedule.location)
                  const isLimited = hasParticipantLimit(schedule.location)
                  const isFull = isLimited && filledSlots >= maxParticipants
                  const canRegister = !myReg && !isFull
                  // 당일은 사용자가 취소 불가 (관리자만 가능)
                  const canCancel = myReg && !isToday

                  return (
                    <div key={schedule.id} className="card">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-semibold ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>
                              {dateObj.getMonth() + 1}/{dateObj.getDate()} ({dayName})
                            </span>
                            {isToday && <span className="badge badge-blue">오늘</span>}
                            {myReg && <span className="badge badge-green">신청완료</span>}
                          </div>
                          <div className="text-sm text-gray-500">
                            <span className="font-medium text-gray-700">{schedule.location}</span>
                            <span className="mx-2">·</span>
                            <span className={isFull ? 'text-red-500 font-medium' : ''}>
                              {isLimited ? `${filledSlots}/${maxParticipants}명` : `${filledSlots}명 신청`}
                            </span>
                            {isFull && <span className="ml-1 text-red-500">(마감)</span>}
                          </div>
                        </div>
                        <div>
                          {myReg ? (
                            canCancel ? (
                              <button
                                onClick={() => handleCancel(myReg.id)}
                                className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-medium"
                              >
                                불참하기
                              </button>
                            ) : (
                              <span className="px-3 py-2 text-xs text-gray-400 bg-gray-100 rounded-lg">
                                당일 취소 불가
                              </span>
                            )
                          ) : canRegister ? (
                            <button
                              onClick={() => handleRegister(schedule.id, schedule.location)}
                              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                              신청하기
                            </button>
                          ) : null}
                        </div>
                      </div>

                      {/* 신청자 목록 */}
                      {scheduleRegs.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-100">
                          {scheduleRegs.map((reg) => (
                            <span
                              key={reg.id}
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                reg.userId === user.id
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {reg.userName || '참여자'}
                            </span>
                          ))}
                        </div>
                      )}

                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* 내 신청 현황 - 한 줄로 표시 */}
        {myRegistrations.length > 0 && (
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-800 text-sm mb-3">
              내 신청 현황 ({myRegistrations.length}건)
            </h3>
            <div className="flex flex-wrap gap-2">
              {myRegistrations.map((reg) => {
                const schedule = schedules.find((s) => s.id === reg.scheduleId)
                if (!schedule) return null
                const dateObj = new Date(schedule.date)
                const isScheduleToday = schedule.date === today

                return (
                  <div
                    key={reg.id}
                    className="inline-flex items-center gap-2 bg-white rounded-full px-3 py-1.5 border border-blue-200"
                  >
                    <span className="text-sm font-medium text-gray-800">
                      {dateObj.getMonth() + 1}/{dateObj.getDate()} {schedule.location}
                    </span>
                    {isScheduleToday ? (
                      <span className="text-xs text-gray-400" title="당일 취소 불가">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-10v5a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h4a2 2 0 012 2z" />
                        </svg>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleCancel(reg.id)}
                        className="text-red-500 hover:text-red-700"
                        title="불참하기"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

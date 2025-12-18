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
 * - 장소별 탭 필터링 (씨젠/이화수)
 * - 탭 간 슬라이드 애니메이션
 * - 일정 클릭 시 교대별 상세 정보 확장
 * - 봉사 신청 및 취소 (불참하기)
 * - 전시대 봉사 월별 참여 횟수 추적 (3회 제한)
 * - 내 신청 현황 요약 표시
 *
 * 데이터 흐름:
 * 1. URL에서 봉사 유형 추출 (/calendar/:serviceType)
 * 2. 해당 유형의 일정 목록 로드
 * 3. 각 일정의 신청 내역 로드
 * 4. 교대별 정보 계산 및 표시
 * ============================================================================
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUser } from '@/context/UserContext'
import { SERVICE_TYPES, EXHIBIT_LOCATIONS } from '@/lib/constants'
import { ServiceType, Schedule, Registration } from '@/types'
import { supabase } from '@/lib/supabase'
import { getShiftInfos, formatDate, getKoreanDayName } from '@/utils/schedule'
import Calendar from '@/components/common/Calendar'
import DateModal from '@/components/common/DateModal'
import CartIcon from '@/components/icons/CartIcon'

export default function CalendarPage() {
  const { serviceType } = useParams<{ serviceType: ServiceType }>()
  const navigate = useNavigate()
  const { user } = useUser()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [monthlyCount, setMonthlyCount] = useState(0)
  const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 장소별 탭 상태 (전시대 봉사용)
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const service = SERVICE_TYPES.find((s) => s.id === serviceType)

  // 장소 목록 (전체 + 개별 장소)
  const locations = serviceType === 'exhibit' ? ['all', ...EXHIBIT_LOCATIONS] : []

  useEffect(() => {
    if (!user) {
      navigate('/')
    }
  }, [user, navigate])

  useEffect(() => {
    if (!serviceType) return
    loadSchedules()
  }, [serviceType])

  useEffect(() => {
    if (serviceType === 'exhibit' && user) {
      calculateMonthlyCount()
    }
  }, [registrations, user, serviceType])

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

  const calculateMonthlyCount = async () => {
    if (!user) return

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*, schedules!inner(*)')
        .eq('user_id', user.id)
        .eq('schedules.service_type', 'exhibit')
        .gte('schedules.date', formatDate(startOfMonth))
        .lte('schedules.date', formatDate(endOfMonth))

      if (!error && data) {
        setMonthlyCount(data.length)
      }
    } catch (err) {
      console.error('Failed to calculate monthly count:', err)
    }
  }

  /**
   * 날짜 클릭 핸들러 - 모달 열기
   */
  const handleDateClick = (date: Date) => {
    const dateStr = formatDate(date)
    setSelectedDate(dateStr)
    setIsModalOpen(true)
  }

  /**
   * 모달 닫기 핸들러
   */
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedDate(null)
  }

  const handleRegister = async (scheduleId: string, shiftNumber: number) => {
    if (!user) return

    if (serviceType === 'exhibit' && monthlyCount >= 3) {
      alert('전시대 봉사는 월 3회까지만 참여 가능합니다.')
      return
    }

    try {
      const { error } = await supabase
        .from('registrations')
        .insert({
          schedule_id: scheduleId,
          user_id: user.id,
          shift_number: shiftNumber,
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
    setExpandedScheduleId(null)

    // 애니메이션 후 방향 초기화
    setTimeout(() => setSlideDirection(null), 300)
  }

  if (!user || !service) return null

  // 장소별 필터링된 일정
  const filteredSchedules = schedules.filter((s) =>
    selectedLocation === 'all' || s.location === selectedLocation
  )

  const scheduleDates = filteredSchedules.map((s) => s.date)
  const myRegistrations = registrations.filter((r) => r.userId === user.id)
  const today = formatDate(new Date())
  const upcomingSchedules = filteredSchedules.filter((s) => s.date >= today)

  // 장소별 탭 라벨
  const getLocationLabel = (loc: string) => {
    if (loc === 'all') return '전체'
    return loc
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* 헤더 */}
      <header className="header">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/select')}
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
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
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {/* 참여 현황 (전시대만) */}
        {serviceType === 'exhibit' && (
          <div className="card mb-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">이번 달 참여 현황</span>
              <div className="flex items-center gap-2">
                <div className="progress-bar w-24">
                  <div
                    className={`progress-fill ${monthlyCount >= 3 ? 'bg-red-500' : ''}`}
                    style={{ width: `${(monthlyCount / 3) * 100}%` }}
                  />
                </div>
                <span className={`font-bold text-sm ${monthlyCount >= 3 ? 'text-red-600' : 'text-blue-600'}`}>
                  {monthlyCount}/3회
                </span>
              </div>
            </div>
            {monthlyCount >= 3 && (
              <p className="text-xs text-red-600 mt-2 bg-red-50 rounded-md px-2 py-1.5">
                이번 달 참여 가능 횟수를 모두 사용했습니다.
              </p>
            )}
          </div>
        )}

        {/* 장소별 탭 (전시대만) */}
        {serviceType === 'exhibit' && locations.length > 0 && (
          <div className="mb-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {locations.map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleLocationChange(loc)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                    selectedLocation === loc
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {getLocationLabel(loc)}
                </button>
              ))}
            </div>
          </div>
        )}

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
            />
          )}
        </div>

        {/* 일정 리스트 (슬라이드 애니메이션 적용) */}
        <div className="mb-4 overflow-hidden">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            예정된 일정
            {selectedLocation !== 'all' && (
              <span className="ml-2 text-blue-600">({selectedLocation})</span>
            )}
          </h2>

          <div
            ref={contentRef}
            className={`transition-transform duration-300 ease-in-out ${
              slideDirection === 'left' ? 'animate-slide-left' : ''
            } ${slideDirection === 'right' ? 'animate-slide-right' : ''}`}
          >
            {upcomingSchedules.length === 0 ? (
              <div className="card text-center py-8 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {selectedLocation === 'all'
                  ? '예정된 일정이 없습니다'
                  : `${selectedLocation} 예정된 일정이 없습니다`
                }
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSchedules.map((schedule) => {
                  const dateObj = new Date(schedule.date)
                  const dayName = getKoreanDayName(dateObj)
                  const isToday = schedule.date === today
                  const scheduleRegs = registrations.filter((r) => r.scheduleId === schedule.id)
                  const myReg = scheduleRegs.find((r) => r.userId === user.id)
                  const shifts = getShiftInfos(schedule, scheduleRegs)
                  const totalSlots = schedule.shiftCount * schedule.participantsPerShift
                  const filledSlots = scheduleRegs.length
                  const isExpanded = expandedScheduleId === schedule.id

                  return (
                    <div key={schedule.id} className="card p-0 overflow-hidden">
                      <div
                        onClick={() => setExpandedScheduleId(isExpanded ? null : schedule.id)}
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-semibold ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>
                                {dateObj.getMonth() + 1}/{dateObj.getDate()} ({dayName})
                              </span>
                              {isToday && <span className="badge badge-blue">오늘</span>}
                              {myReg && <span className="badge badge-green">신청완료</span>}
                            </div>
                            <div className="text-sm text-gray-500">
                              <span className="font-medium text-gray-700">{schedule.location}</span>
                              <span className="mx-1">·</span>
                              <span>{schedule.startTime} - {schedule.endTime}</span>
                              <span className="mx-1">·</span>
                              <span>{schedule.shiftCount}교대</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">{filledSlots}/{totalSlots}명</span>
                            <svg
                              className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-gray-100 p-4 bg-gray-50">
                          <div className="space-y-2">
                            {shifts.map((shift) => {
                              const isMyShift = shift.registrations.some((r) => r.userId === user.id)
                              const myShiftReg = shift.registrations.find((r) => r.userId === user.id)
                              const isFull = shift.availableSlots <= 0
                              const canRegister = !myReg && !isFull && (serviceType !== 'exhibit' || monthlyCount < 3)

                              return (
                                <div
                                  key={shift.shiftNumber}
                                  className={`bg-white rounded-lg p-3 border transition-all ${isMyShift ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                                >
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <span className="font-medium text-gray-800">{shift.shiftNumber}교대</span>
                                      <span className="text-gray-400 text-sm ml-2">{shift.startTime} - {shift.endTime}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {shift.registrations.length > 0 && (
                                        <div className="flex -space-x-1 mr-2">
                                          {shift.registrations.map((reg) => (
                                            <span
                                              key={reg.id}
                                              className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${reg.userId === user.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                                              title={reg.userName || '참여자'}
                                            >
                                              {(reg.userName || '?')[0]}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      <span className={`badge ${isFull ? 'badge-red' : 'badge-green'}`}>
                                        {isFull ? '마감' : `${shift.availableSlots}자리`}
                                      </span>
                                      {isMyShift && myShiftReg ? (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleCancel(myShiftReg.id) }}
                                          className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors font-medium"
                                        >
                                          불참하기
                                        </button>
                                      ) : canRegister ? (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleRegister(schedule.id, shift.shiftNumber) }}
                                          className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors font-medium"
                                        >
                                          신청하기
                                        </button>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          {myReg && (
                            <div className="mt-3 p-2 bg-blue-100 rounded-md text-xs text-blue-700">
                              이 일정에 이미 신청하셨습니다. 다른 시간대로 변경하려면 먼저 불참하기를 눌러주세요.
                            </div>
                          )}
                          {serviceType === 'exhibit' && monthlyCount >= 3 && !myReg && (
                            <div className="mt-3 p-2 bg-orange-100 rounded-md text-xs text-orange-700">
                              이번 달 참여 가능 횟수를 모두 사용했습니다.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* 내 신청 현황 */}
        {myRegistrations.length > 0 && (
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-800 text-sm mb-3">내 신청 현황</h3>
            <div className="space-y-2">
              {myRegistrations.map((reg) => {
                const schedule = schedules.find((s) => s.id === reg.scheduleId)
                if (!schedule) return null
                const dateObj = new Date(schedule.date)
                const dayName = getKoreanDayName(dateObj)
                const shifts = getShiftInfos(schedule, registrations.filter((r) => r.scheduleId === schedule.id))
                const myShift = shifts.find((s) => s.shiftNumber === reg.shiftNumber)

                return (
                  <div key={reg.id} className="flex justify-between items-center bg-white rounded-lg p-3 border border-blue-100">
                    <div>
                      <div className="font-medium text-gray-800">
                        {dateObj.getMonth() + 1}/{dateObj.getDate()} ({dayName}) - {schedule.location}
                      </div>
                      <div className="text-sm text-gray-500">
                        {reg.shiftNumber}교대 ({myShift?.startTime} - {myShift?.endTime})
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancel(reg.id)}
                      className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors font-medium"
                    >
                      불참하기
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* 날짜 선택 모달 */}
      {selectedDate && (
        <DateModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          date={selectedDate}
          schedule={filteredSchedules.find((s) => s.date === selectedDate) || null}
          registrations={registrations}
          user={user}
          onRegister={handleRegister}
          onCancel={handleCancel}
          monthlyCount={monthlyCount}
          serviceType={serviceType as ServiceType}
        />
      )}
    </div>
  )
}

/**
 * ============================================================================
 * 봉사 일정 캘린더 페이지
 * ============================================================================
 *
 * 봉사 일정을 달력과 리스트로 표시하고 봉사 신청/취소를 처리하는 핵심 페이지입니다.
 *
 * 주요 기능:
 * - 월별 달력에 봉사 일정 표시
 * - 날짜 선택 시 전시대/공원 봉사 일정 한눈에 표시
 * - 전시대 봉사: 일정당 최대 12명
 * - 공원 봉사: 인원 제한 없음 (무제한)
 * - 봉사 신청 및 취소 (불참하기)
 * - 내 신청 현황 요약 표시
 * ============================================================================
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@/context/UserContext'
import { ServiceType, Schedule, Registration } from '@/types'
import { supabase } from '@/lib/supabase'
import {
  formatDate,
  isCampaignLocation,
  CAMPAIGN_PER_SLOT_MAX,
} from '@/utils/schedule'
import { isUnifiedDate } from '@/lib/constants'
import Calendar from '@/components/common/Calendar'
import RoleSwitchTab from '@/components/RoleSwitchTab'

/** 전시대 봉사 일정당 최대 인원 */
const EXHIBIT_MAX_PARTICIPANTS = 12

export default function CalendarPage() {
  const navigate = useNavigate()
  const { user } = useUser()

  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // 전체 봉사 유형의 사용자 신청 내역
  const [allMyRegs, setAllMyRegs] = useState<Array<{
    id: string
    serviceType: ServiceType
    date: string
    location: string
  }>>([])

  const scheduleListRef = useRef<HTMLDivElement>(null)

  // 로그인 체크
  useEffect(() => {
    if (!user) {
      navigate('/')
    }
  }, [user, navigate])

  // 일정 로드
  useEffect(() => {
    loadSchedules()
  }, [])

  // 전체 봉사 유형의 이번 주 신청 내역 로드
  useEffect(() => {
    if (!user) return
    loadAllMyRegistrations()
  }, [user])

  // 5초 간격 백그라운드 자동 새로고침 (탭이 활성화된 경우에만)
  useEffect(() => {
    if (!user) return
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadSchedulesSilent()
        loadAllMyRegistrations()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [user])

  const loadAllMyRegistrations = async () => {
    if (!user) return
    try {
      const { data } = await supabase
        .from('registrations')
        .select('id, schedules(date, service_type, location)')
        .eq('user_id', user.id)

      if (data) {
        const regs = data
          .filter((r: any) => r.schedules)
          .map((r: any) => ({
            id: r.id,
            serviceType: r.schedules.service_type as ServiceType,
            date: r.schedules.date,
            location: r.schedules.location || '',
          }))
        setAllMyRegs(regs)
      }
    } catch (err) {
      console.error('Failed to load all my registrations:', err)
    }
  }

  /**
   * 백그라운드 자동 새로고침용 (로딩 스피너 없이)
   */
  const loadSchedulesSilent = async () => {
    try {
      const now = new Date()
      // 과거 1개월 + 미래 2개월 = 3개월치
      const startDate = formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 1))
      const endDate = formatDate(new Date(now.getFullYear(), now.getMonth() + 2, 0))

      // schedules + registrations 병렬 쿼리 (registrations 는 schedules.date 로 JOIN 필터)
      const [scheduleRes, regRes] = await Promise.all([
        supabase
          .from('schedules')
          .select('*')
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: true }),
        supabase
          .from('registrations')
          .select('*, users(name), schedules!inner(date)')
          .gte('schedules.date', startDate)
          .lte('schedules.date', endDate),
      ])

      const scheduleList: Schedule[] = (scheduleRes.data || []).map((s) => ({
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

      const regList: Registration[] = (regRes.data || []).map((r: any) => ({
        id: r.id,
        scheduleId: r.schedule_id,
        userId: r.user_id,
        userName: r.users?.name || '',
        shiftNumber: r.shift_number,
        createdAt: r.created_at,
      }))
      setRegistrations(regList)
    } catch (err) {
      console.error('Silent refresh failed:', err)
    }
  }

  const loadSchedules = async () => {
    setIsLoading(true)
    try {
      const now = new Date()
      // 과거 1개월 + 미래 2개월 = 3개월치
      const startDate = formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 1))
      const endDate = formatDate(new Date(now.getFullYear(), now.getMonth() + 2, 0))

      const [scheduleRes, regRes] = await Promise.all([
        supabase
          .from('schedules')
          .select('*')
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: true }),
        supabase
          .from('registrations')
          .select('*, users(name), schedules!inner(date)')
          .gte('schedules.date', startDate)
          .lte('schedules.date', endDate),
      ])

      if (scheduleRes.error) throw scheduleRes.error

      const scheduleList: Schedule[] = (scheduleRes.data || []).map((s) => ({
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

      const regList: Registration[] = (regRes.data || []).map((r: any) => ({
        id: r.id,
        scheduleId: r.schedule_id,
        userId: r.user_id,
        userName: r.users?.name || '',
        shiftNumber: r.shift_number,
        createdAt: r.created_at,
      }))
      setRegistrations(regList)
    } catch (err) {
      console.error('Failed to load schedules:', err)
      setSchedules([])
      setRegistrations([])
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 해당 서비스 타입에 인원 제한이 있는지
   */
  const hasLimit = (sType: ServiceType): boolean => {
    return sType === 'exhibit'
  }

  /**
   * 날짜 클릭 핸들러
   */
  const handleDateClick = (date: Date) => {
    const dateStr = formatDate(date)
    setSelectedDate(dateStr)
    setTimeout(() => {
      scheduleListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  /**
   * 봉사 신청 처리
   */
  const handleRegister = async (scheduleId: string) => {
    if (!user) return

    const targetSchedule = schedules.find((s) => s.id === scheduleId)
    if (!targetSchedule) return

    const targetIsCampaign = isCampaignLocation(targetSchedule.location)

    // 전시대 봉사 일자별 12명 캡: 일반 전시대일 때만 적용 (캠페인은 슬롯별 6명 캡 사용)
    // 2026-06-01 이후 통합 운영 일정은 인원 제한 없음
    if (hasLimit(targetSchedule.serviceType) && !targetIsCampaign && !isUnifiedDate(targetSchedule.date)) {
      const { data: sameDateExhibitSchedules } = await supabase
        .from('schedules')
        .select('id, location')
        .eq('date', targetSchedule.date)
        .eq('service_type', 'exhibit')

      // 일반 전시대만 합산 (캠페인 제외)
      const regularIds = (sameDateExhibitSchedules || [])
        .filter((s: any) => !isCampaignLocation(s.location))
        .map((s: any) => s.id)

      if (regularIds.length > 0) {
        const { count } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .in('schedule_id', regularIds)

        if ((count || 0) >= EXHIBIT_MAX_PARTICIPANTS) {
          await loadSchedulesSilent()
          return
        }
      }
    }

    // 캠페인 슬롯별 6명 캡 실시간 체크
    if (targetIsCampaign) {
      const { count } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('schedule_id', scheduleId)

      if ((count || 0) >= CAMPAIGN_PER_SLOT_MAX) {
        alert('해당 캠페인 슬롯이 마감되었습니다.')
        await loadSchedulesSilent()
        return
      }
    }

    // 같은 날짜 중복 신청 체크
    // 규칙:
    //  - 캠페인 + 캠페인(서로 다른 location)은 허용
    //  - 그 외에는 같은 날 1건만 허용
    const { data: sameDateSchedules } = await supabase
      .from('schedules')
      .select('id, location')
      .eq('date', targetSchedule.date)

    if (sameDateSchedules && sameDateSchedules.length > 0) {
      const sameDateIds = sameDateSchedules.map((s: any) => s.id)
      const locById = new Map<string, string>(
        sameDateSchedules.map((s: any) => [s.id as string, s.location as string])
      )

      const { data: existingRegs } = await supabase
        .from('registrations')
        .select('schedule_id')
        .eq('user_id', user.id)
        .in('schedule_id', sameDateIds)

      if (existingRegs && existingRegs.length > 0) {
        const conflict = existingRegs.some((r: any) => {
          const existingLoc = locById.get(r.schedule_id) || ''
          const existingIsCampaign = isCampaignLocation(existingLoc)
          if (targetIsCampaign && existingIsCampaign) {
            // 다른 캠페인 슬롯이면 허용, 같은 슬롯이면 차단
            return existingLoc === targetSchedule.location
          }
          // 그 외(일반-일반, 일반-캠페인 혼합)는 차단
          return true
        })
        if (conflict) {
          alert('같은 날짜·시간대에 이미 신청하셨습니다.')
          await loadAllMyRegistrations()
          return
        }
      }
    }

    try {
      const { error } = await supabase
        .from('registrations')
        .insert({
          schedule_id: scheduleId,
          user_id: user.id,
          shift_number: 1,
        })

      if (error) throw error
      await loadSchedulesSilent()
      await loadAllMyRegistrations()
    } catch (err) {
      console.error('Registration failed:', err)
      alert('신청에 실패했습니다. 다시 시도해주세요.')
    }
  }

  /**
   * 봉사 취소 처리
   */
  const handleCancel = async (registrationId: string) => {
    if (!confirm('정말 불참하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', registrationId)

      if (error) throw error
      await loadSchedules()
      await loadAllMyRegistrations()
    } catch (err) {
      console.error('Cancel failed:', err)
      alert('취소에 실패했습니다. 다시 시도해주세요.')
    }
  }

  if (!user) return null

  // 전체 일정 (장소 필터 없이)
  const scheduleDates = schedules.map((s) => s.date)
  const today = formatDate(new Date())

  // 선택된 날짜가 있으면 그 날짜의 일정만, 없으면 오늘 일정만 표시
  const displayDate = selectedDate || today
  const displaySchedules = schedules.filter((s) => s.date === displayDate)

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
              <button
                onClick={() => navigate('/select')}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                aria-label="홈으로"
              >
                <img
                  src="/icons/icon-512-v2.png"
                  alt=""
                  className="w-7 h-7 rounded-md object-cover"
                  draggable={false}
                />
                <h1 className="text-lg font-bold text-gray-800">봉사 신청</h1>
              </button>
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

      {/* 역할 전환 탭 (관리자에게만 표시) */}
      <RoleSwitchTab />

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
            />
          )}
        </div>

        {/* 일정 리스트 */}
        <div
          ref={scheduleListRef}
          className="mb-4"
        >
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            {selectedDate ? (
              <>
                {new Date(displayDate).getMonth() + 1}/{new Date(displayDate).getDate()}일 일정
              </>
            ) : (
              '오늘 일정'
            )}
          </h2>

          <div>
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
              <div className="space-y-4">
                {(() => {
                  // 표시 그룹 계산: 일반 전시대(통합) + 캠페인 슬롯별 분리 + 공원
                  type Group = {
                    key: string
                    name: string
                    icon: string
                    borderColor: string
                    textColor: string
                    schedules: Schedule[]
                    serviceType: ServiceType
                    isCampaign: boolean
                    perGroupMax: number  // 그룹의 최대 인원 (0이면 무제한)
                    timeLabel?: string
                  }
                  const groups: Group[] = []

                  // 2026-06-01 이후 통합 운영: 해당 날짜의 모든 일정을 "공개 봉사" 하나로 묶음
                  // (DB의 service_type은 그대로 유지되지만 UI 상에서만 통합 표시)
                  if (isUnifiedDate(displayDate) && displaySchedules.length > 0) {
                    groups.push({
                      key: 'unified-public',
                      name: '공개 봉사',
                      icon: '🤝',
                      borderColor: 'border-indigo-200',
                      textColor: 'text-indigo-700',
                      schedules: displaySchedules,
                      serviceType: 'exhibit', // 그룹 키 용도 — 실제 의미 없음
                      isCampaign: false,
                      perGroupMax: 0, // 무제한
                    })
                    return groups.map((group) => {
                      const groupRegs = group.schedules.flatMap((s) =>
                        registrations.filter((r) => r.scheduleId === s.id)
                      )
                      const myReg = groupRegs.find((r) => r.userId === user.id)
                      const filledSlots = groupRegs.length
                      const isToday = group.schedules[0].date === today
                      const isPast = group.schedules[0].date < today

                      // 같은 날 다른 그룹에 이미 등록되어 있는지 (통합 그룹 내에서는 myReg 검사로 충분)
                      const availableSchedule = group.schedules[0]
                      const canRegister = !myReg && !isPast && !!availableSchedule
                      const canCancel = myReg && !isToday

                      return (
                        <div key={group.key} className={`card border ${group.borderColor}`}>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <img
                                  src="/illustrations/public-volunteer-card.png"
                                  alt=""
                                  className="w-8 h-8 object-contain flex-shrink-0"
                                  draggable={false}
                                />
                                <span className={`font-semibold ${group.textColor}`}>{group.name}</span>
                                {isToday && <span className="badge badge-blue">오늘</span>}
                                {myReg && <span className="badge badge-green">신청완료</span>}
                              </div>
                              <div className="text-sm text-gray-500">
                                <span>{filledSlots}명 신청</span>
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
                              ) : isPast ? (
                                <span className="px-3 py-2 text-xs text-gray-400 bg-gray-100 rounded-lg">
                                  지난 일정
                                </span>
                              ) : canRegister ? (
                                <button
                                  onClick={() => handleRegister(availableSchedule.id)}
                                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                  신청하기
                                </button>
                              ) : null}
                            </div>
                          </div>

                          {/* 신청자 목록 */}
                          {groupRegs.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-100">
                              {groupRegs.map((reg) => (
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
                    })
                  }

                  const regularExhibit = displaySchedules.filter(
                    (s) => s.serviceType === 'exhibit' && !isCampaignLocation(s.location)
                  )
                  if (regularExhibit.length > 0) {
                    groups.push({
                      key: 'exhibit-regular',
                      name: '전시대 봉사',
                      icon: '📋',
                      borderColor: 'border-blue-200',
                      textColor: 'text-blue-700',
                      schedules: regularExhibit,
                      serviceType: 'exhibit',
                      isCampaign: false,
                      perGroupMax: EXHIBIT_MAX_PARTICIPANTS,
                    })
                  }

                  // 캠페인 — location별로 별도 카드
                  const campaignByLocation = new Map<string, Schedule[]>()
                  displaySchedules
                    .filter((s) => s.serviceType === 'exhibit' && isCampaignLocation(s.location))
                    .forEach((s) => {
                      const arr = campaignByLocation.get(s.location) || []
                      arr.push(s)
                      campaignByLocation.set(s.location, arr)
                    })
                  Array.from(campaignByLocation.entries())
                    .sort(([a], [b]) => a.localeCompare(b))  // 오전 > 오후
                    .forEach(([loc, schs]) => {
                      const sample = schs[0]
                      const timeLabel = sample
                        ? `${sample.startTime.slice(0, 5)} ~ ${sample.endTime.slice(0, 5)}`
                        : ''
                      groups.push({
                        key: `campaign-${loc}`,
                        name: loc,
                        icon: '📣',
                        borderColor: 'border-purple-200',
                        textColor: 'text-purple-700',
                        schedules: schs,
                        serviceType: 'exhibit',
                        isCampaign: true,
                        perGroupMax: 0, // 무제한 — 공원 봉사처럼 신청 인원 수만 표시
                        timeLabel,
                      })
                    })

                  const parkSchedules = displaySchedules.filter((s) => s.serviceType === 'park')
                  if (parkSchedules.length > 0) {
                    groups.push({
                      key: 'park',
                      name: '공원 봉사',
                      icon: '🌳',
                      borderColor: 'border-green-200',
                      textColor: 'text-green-700',
                      schedules: parkSchedules,
                      serviceType: 'park',
                      isCampaign: false,
                      perGroupMax: 0,
                    })
                  }

                  return groups.map((group) => {
                    const groupRegs = group.schedules.flatMap((s) =>
                      registrations.filter((r) => r.scheduleId === s.id)
                    )
                    const myReg = groupRegs.find((r) => r.userId === user.id)
                    const filledSlots = groupRegs.length
                    const limited = group.perGroupMax > 0
                    const isFull = limited && filledSlots >= group.perGroupMax

                    const isToday = group.schedules[0].date === today
                    const isPast = group.schedules[0].date < today

                    // 같은 날 다른 그룹에 이미 등록되어 있는지 (당일 신청 제한 판단)
                    // 캠페인 그룹은 다른 캠페인 그룹과는 공존 허용
                    const myOtherSameDay = !myReg
                      ? allMyRegs.find((r) => {
                          if (r.date !== group.schedules[0].date) return false
                          const otherIsCampaign = isCampaignLocation(r.location)
                          if (group.isCampaign && otherIsCampaign) return false  // 다른 캠페인 슬롯 OK
                          return true
                        })
                      : undefined

                    // 그룹 내 자리가 남은 스케줄
                    const availableSchedule = group.schedules.find((s) => {
                      const sRegs = registrations.filter((r) => r.scheduleId === s.id)
                      // 그룹 단위 캡으로 판정 (캠페인 6명, 일반 전시대는 일자별 12명 = 그룹 합산)
                      if (!limited) return true
                      return groupRegs.length < group.perGroupMax && sRegs.length < (s.participantsPerShift || group.perGroupMax)
                    })
                    const canRegister = !myReg && !isFull && !isPast && !myOtherSameDay && !!availableSchedule
                    const canCancel = myReg && !isToday

                    return (
                      <div key={group.key} className={`card border ${group.borderColor}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span>{group.icon}</span>
                              <span className={`font-semibold ${group.textColor}`}>{group.name}</span>
                              {group.timeLabel && (
                                <span className="text-xs text-gray-500">{group.timeLabel}</span>
                              )}
                              {isToday && <span className="badge badge-blue">오늘</span>}
                              {myReg && <span className="badge badge-green">신청완료</span>}
                            </div>
                            <div className="text-sm text-gray-500">
                              <span className={isFull ? 'text-red-500 font-medium' : ''}>
                                {limited ? `${filledSlots}/${group.perGroupMax}명` : `${filledSlots}명 신청`}
                              </span>
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
                            ) : isPast ? (
                              <span className="px-3 py-2 text-xs text-gray-400 bg-gray-100 rounded-lg">
                                지난 일정
                              </span>
                            ) : myOtherSameDay ? (
                              <span className="px-3 py-2 text-xs text-orange-500 bg-orange-50 rounded-lg border border-orange-200">
                                당일 신청완료
                              </span>
                            ) : canRegister ? (
                              <button
                                onClick={() => handleRegister(availableSchedule!.id)}
                                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                              >
                                신청하기
                              </button>
                            ) : null}
                          </div>
                        </div>

                        {/* 신청자 목록 */}
                        {groupRegs.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-100">
                            {groupRegs.map((reg) => (
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
                  })
                })()}
              </div>
            )}
          </div>
        </div>

        {/* 내 신청 현황 - 이번 주 전체 봉사 유형 표시 */}
        {(() => {
          const now = new Date()
          const dayOfWeek = now.getDay()
          const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
          const monday = new Date(now)
          monday.setDate(now.getDate() + diffToMonday)
          monday.setHours(0, 0, 0, 0)
          const sunday = new Date(monday)
          sunday.setDate(monday.getDate() + 6)
          const weekStart = formatDate(monday)
          const weekEnd = formatDate(sunday)
          const thisWeekRegs = allMyRegs
            .filter((r) => r.date >= weekStart && r.date <= weekEnd)
            .sort((a, b) => a.date.localeCompare(b.date))

          if (thisWeekRegs.length === 0) return null

          return (
            <div className="card bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-blue-800 text-sm mb-3">
                이번 주 신청 현황 ({thisWeekRegs.length}건)
              </h3>
              <div className="flex flex-wrap gap-2">
                {thisWeekRegs.map((reg) => {
                  const dateObj = new Date(reg.date)
                  const isExhibit = reg.serviceType === 'exhibit'
                  const isCampaign = isCampaignLocation(reg.location)
                  const isRegToday = reg.date === today
                  // 2026-06-01 이후 일정은 통합 운영 — 유형 구분 없이 "공개봉사"로 표시
                  const isUnified = isUnifiedDate(reg.date)
                  const label = isUnified
                    ? '공개봉사'
                    : isExhibit
                      ? (isCampaign ? reg.location.replace(/^서울 캠페인 ?/, '캠페인 ') : '전시대')
                      : '공원'
                  const dotColor = isUnified
                    ? 'bg-indigo-500'
                    : isCampaign
                      ? 'bg-purple-500'
                      : (isExhibit ? 'bg-blue-500' : 'bg-green-500')
                  const borderClass = isUnified
                    ? 'border-indigo-200'
                    : isCampaign
                      ? 'border-purple-200'
                      : (isExhibit ? 'border-blue-200' : 'border-green-200')

                  return (
                    <div
                      key={reg.id}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 border bg-white ${borderClass}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                      <span className="text-sm font-medium text-gray-800">
                        {dateObj.getMonth() + 1}/{dateObj.getDate()} {label}
                      </span>
                      {isRegToday ? (
                        <span className="text-xs text-gray-400" title="당일 취소 불가">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCancel(reg.id)}
                          className="text-red-400 hover:text-red-600 ml-0.5"
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
          )
        })()}
      </main>
    </div>
  )
}

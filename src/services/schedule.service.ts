/**
 * ============================================================================
 * 일정 서비스 모듈
 * ============================================================================
 *
 * 봉사 일정(schedules 테이블) 관련 API 호출 로직을 담당합니다.
 *
 * 주요 기능:
 * - 일정 목록 조회 (기간별, 봉사 유형별)
 * - 일정 생성/수정/삭제
 * - 일정 상세 조회
 *
 * 사용 예시:
 * const schedules = await scheduleService.getByDateRange('exhibit', startDate, endDate)
 * ============================================================================
 */

import { supabase } from '@/lib/supabase'
import { Schedule, ServiceType } from '@/types'
import { formatDate } from '@/utils/schedule'
import { DEFAULT_SCHEDULE_TIMES, EXHIBIT_LOCATIONS } from '@/lib/constants'

/**
 * 일정 서비스 객체
 * 모든 일정 관련 API 호출 메서드를 포함
 */
export const scheduleService = {
  /**
   * 기간별 일정 목록 조회
   *
   * @param serviceType - 봉사 유형 (exhibit, park, bus_stop)
   * @param startDate - 조회 시작 날짜
   * @param endDate - 조회 종료 날짜
   * @returns 일정 목록
   *
   * @example
   * const schedules = await scheduleService.getByDateRange(
   *   'exhibit',
   *   new Date('2024-01-01'),
   *   new Date('2024-01-31')
   * )
   */
  async getByDateRange(
    serviceType: ServiceType,
    startDate: Date,
    endDate: Date
  ): Promise<Schedule[]> {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('service_type', serviceType)
      .gte('date', formatDate(startDate))
      .lte('date', formatDate(endDate))
      .order('date', { ascending: true })

    if (error) {
      console.error('일정 조회 실패:', error)
      throw error
    }

    // DB 스키마를 앱 타입으로 변환
    return (data || []).map((s) => ({
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
  },

  /**
   * 새 일정 생성
   *
   * @param schedule - 생성할 일정 정보
   * @returns 생성된 일정
   */
  async create(schedule: Omit<Schedule, 'id' | 'createdAt'>): Promise<Schedule> {
    const { data, error } = await supabase
      .from('schedules')
      .insert({
        service_type: schedule.serviceType,
        date: schedule.date,
        location: schedule.location,
        start_time: schedule.startTime,
        end_time: schedule.endTime,
        shift_count: schedule.shiftCount,
        participants_per_shift: schedule.participantsPerShift,
        created_by: schedule.createdBy,
      })
      .select()
      .single()

    if (error) {
      console.error('일정 생성 실패:', error)
      throw error
    }

    return {
      id: data.id,
      serviceType: data.service_type as ServiceType,
      date: data.date,
      location: data.location,
      startTime: data.start_time,
      endTime: data.end_time,
      shiftCount: data.shift_count,
      participantsPerShift: data.participants_per_shift,
      createdBy: data.created_by,
      createdAt: data.created_at,
    }
  },

  /**
   * 일정 삭제
   *
   * @param scheduleId - 삭제할 일정 ID
   */
  async delete(scheduleId: string): Promise<void> {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', scheduleId)

    if (error) {
      console.error('일정 삭제 실패:', error)
      throw error
    }
  },

  /**
   * 일정 수정
   *
   * @param scheduleId - 수정할 일정 ID
   * @param updates - 수정할 필드들
   * @returns 수정된 일정
   */
  async update(
    scheduleId: string,
    updates: Partial<Omit<Schedule, 'id' | 'createdAt' | 'createdBy'>>
  ): Promise<Schedule> {
    const updateData: Record<string, unknown> = {}

    // 앱 필드명을 DB 컬럼명으로 변환
    if (updates.serviceType) updateData.service_type = updates.serviceType
    if (updates.date) updateData.date = updates.date
    if (updates.location) updateData.location = updates.location
    if (updates.startTime) updateData.start_time = updates.startTime
    if (updates.endTime) updateData.end_time = updates.endTime
    if (updates.shiftCount) updateData.shift_count = updates.shiftCount
    if (updates.participantsPerShift) updateData.participants_per_shift = updates.participantsPerShift

    const { data, error } = await supabase
      .from('schedules')
      .update(updateData)
      .eq('id', scheduleId)
      .select()
      .single()

    if (error) {
      console.error('일정 수정 실패:', error)
      throw error
    }

    return {
      id: data.id,
      serviceType: data.service_type as ServiceType,
      date: data.date,
      location: data.location,
      startTime: data.start_time,
      endTime: data.end_time,
      shiftCount: data.shift_count,
      participantsPerShift: data.participants_per_shift,
      createdBy: data.created_by,
      createdAt: data.created_at,
    }
  },

  /**
   * 이번 주 전시대 봉사 일정 자동 생성
   * - 수요일: 오전 9:30~12:00 (씨젠, 이화수)
   * - 금요일: 오후 1:45~4:00 (씨젠, 이화수)
   * - 토요일: 오후 1:45~4:00 (씨젠, 이화수)
   * - 일요일: 오후 3:15~5:30 (씨젠, 이화수)
   *
   * @returns 생성된 일정 수
   */
  async autoGenerateWeeklySchedules(): Promise<number> {
    const now = new Date()

    // 이번 주 시작일 (일요일 기준)
    const dayOfWeek = now.getDay()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - dayOfWeek)
    startOfWeek.setHours(0, 0, 0, 0)

    // 이번 주 종료일 (토요일)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    // 요일별 시간 설정 (0: 일, 3: 수, 5: 금, 6: 토)
    const dayConfig: Record<number, { startTime: string; endTime: string }> = {
      0: DEFAULT_SCHEDULE_TIMES.sunday,
      3: DEFAULT_SCHEDULE_TIMES.wednesday,
      5: DEFAULT_SCHEDULE_TIMES.friday,
      6: DEFAULT_SCHEDULE_TIMES.saturday,
    }

    const targetDays = [0, 3, 5, 6]
    const schedulesToCreate: Array<{
      service_type: string
      date: string
      location: string
      start_time: string
      end_time: string
      shift_count: number
      participants_per_shift: number
      created_by: string
    }> = []

    // 이번 주의 모든 날짜를 순회
    const currentDate = new Date(startOfWeek)
    while (currentDate <= endOfWeek) {
      const dayNum = currentDate.getDay()

      if (targetDays.includes(dayNum)) {
        const dateStr = formatDate(currentDate)
        const times = dayConfig[dayNum]

        // 씨젠, 이화수 두 장소에 대해 일정 생성
        for (const location of EXHIBIT_LOCATIONS) {
          schedulesToCreate.push({
            service_type: 'exhibit',
            date: dateStr,
            location: location,
            start_time: times.startTime,
            end_time: times.endTime,
            shift_count: 3,
            participants_per_shift: 2,
            created_by: 'system', // 시스템 자동 생성
          })
        }
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    if (schedulesToCreate.length === 0) {
      return 0
    }

    // 기존 일정 조회
    const { data: existingSchedules } = await supabase
      .from('schedules')
      .select('date, location')
      .eq('service_type', 'exhibit')
      .gte('date', formatDate(startOfWeek))
      .lte('date', formatDate(endOfWeek))

    const existingKeys = new Set(
      (existingSchedules || []).map((s) => `${s.date}-${s.location}`)
    )

    // 중복 제거
    const newSchedules = schedulesToCreate.filter(
      (s) => !existingKeys.has(`${s.date}-${s.location}`)
    )

    if (newSchedules.length === 0) {
      return 0
    }

    // 일정 생성
    const { error } = await supabase.from('schedules').insert(newSchedules)

    if (error) {
      console.error('자동 일정 생성 실패:', error)
      throw error
    }

    return newSchedules.length
  },
}

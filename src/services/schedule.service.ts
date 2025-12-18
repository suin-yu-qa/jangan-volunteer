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
}

/**
 * ============================================================================
 * 봉사 신청 서비스 모듈
 * ============================================================================
 *
 * 봉사 신청(registrations 테이블) 관련 API 호출 로직을 담당합니다.
 *
 * 주요 기능:
 * - 봉사 신청 생성/취소
 * - 일정별 신청 내역 조회
 * - 사용자별 신청 내역 조회
 * - 월별 참여 횟수 계산
 *
 * 사용 예시:
 * await registrationService.create(scheduleId, userId, shiftNumber)
 * ============================================================================
 */

import { supabase } from '@/lib/supabase'
import { Registration } from '@/types'
import { formatDate } from '@/utils/schedule'

/**
 * 봉사 신청 서비스 객체
 * 모든 신청 관련 API 호출 메서드를 포함
 */
export const registrationService = {
  /**
   * 일정 ID 목록으로 신청 내역 조회
   *
   * @param scheduleIds - 조회할 일정 ID 배열
   * @returns 신청 내역 목록 (사용자 이름 포함)
   */
  async getByScheduleIds(scheduleIds: string[]): Promise<Registration[]> {
    if (scheduleIds.length === 0) return []

    const { data, error } = await supabase
      .from('registrations')
      .select('*, users(name)')
      .in('schedule_id', scheduleIds)

    if (error) {
      console.error('신청 내역 조회 실패:', error)
      throw error
    }

    return (data || []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      scheduleId: r.schedule_id as string,
      userId: r.user_id as string,
      userName: (r.users as { name?: string })?.name || '',
      shiftNumber: r.shift_number as number,
      createdAt: r.created_at as string,
    }))
  },

  /**
   * 봉사 신청 생성
   *
   * @param scheduleId - 일정 ID
   * @param userId - 사용자 ID
   * @param shiftNumber - 교대 번호
   * @returns 생성된 신청 내역
   */
  async create(
    scheduleId: string,
    userId: string,
    shiftNumber: number
  ): Promise<Registration> {
    const { data, error } = await supabase
      .from('registrations')
      .insert({
        schedule_id: scheduleId,
        user_id: userId,
        shift_number: shiftNumber,
      })
      .select('*, users(name)')
      .single()

    if (error) {
      console.error('봉사 신청 실패:', error)
      throw error
    }

    return {
      id: data.id,
      scheduleId: data.schedule_id,
      userId: data.user_id,
      userName: data.users?.name || '',
      shiftNumber: data.shift_number,
      createdAt: data.created_at,
    }
  },

  /**
   * 봉사 신청 취소
   *
   * @param registrationId - 취소할 신청 ID
   */
  async cancel(registrationId: string): Promise<void> {
    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('id', registrationId)

    if (error) {
      console.error('봉사 신청 취소 실패:', error)
      throw error
    }
  },

  /**
   * 사용자의 월별 전시대 봉사 참여 횟수 조회
   *
   * @param userId - 사용자 ID
   * @param year - 조회 연도
   * @param month - 조회 월 (0-11)
   * @returns 참여 횟수
   */
  async getMonthlyExhibitCount(
    userId: string,
    year: number,
    month: number
  ): Promise<number> {
    const startOfMonth = new Date(year, month, 1)
    const endOfMonth = new Date(year, month + 1, 0)

    const { data, error } = await supabase
      .from('registrations')
      .select('*, schedules!inner(*)')
      .eq('user_id', userId)
      .eq('schedules.service_type', 'exhibit')
      .gte('schedules.date', formatDate(startOfMonth))
      .lte('schedules.date', formatDate(endOfMonth))

    if (error) {
      console.error('월별 참여 횟수 조회 실패:', error)
      throw error
    }

    return data?.length || 0
  },

  /**
   * 사용자의 전체 신청 내역 조회
   *
   * @param userId - 사용자 ID
   * @returns 신청 내역 목록
   */
  async getByUserId(userId: string): Promise<Registration[]> {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('사용자 신청 내역 조회 실패:', error)
      throw error
    }

    return (data || []).map((r) => ({
      id: r.id,
      scheduleId: r.schedule_id,
      userId: r.user_id,
      shiftNumber: r.shift_number,
      createdAt: r.created_at,
    }))
  },
}

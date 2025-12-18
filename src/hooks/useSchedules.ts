/**
 * ============================================================================
 * 일정 관리 훅
 * ============================================================================
 *
 * 봉사 일정 데이터를 관리하는 커스텀 훅입니다.
 *
 * 주요 기능:
 * - 일정 목록 조회 및 상태 관리
 * - 신청 내역 조회 및 상태 관리
 * - 봉사 신청/취소 처리
 * - 월별 참여 횟수 계산
 *
 * 사용 예시:
 * const { schedules, isLoading, handleRegister, handleCancel } = useSchedules('exhibit')
 * ============================================================================
 */

import { useState, useEffect, useCallback } from 'react'
import { Schedule, Registration, ServiceType } from '@/types'
import { scheduleService, registrationService } from '@/services'

/**
 * 훅 반환 타입
 */
interface UseSchedulesReturn {
  /** 일정 목록 */
  schedules: Schedule[]
  /** 신청 내역 목록 */
  registrations: Registration[]
  /** 로딩 상태 */
  isLoading: boolean
  /** 이번 달 전시대 참여 횟수 */
  monthlyCount: number
  /** 데이터 새로고침 */
  refresh: () => Promise<void>
  /** 봉사 신청 */
  handleRegister: (scheduleId: string, shiftNumber: number) => Promise<boolean>
  /** 봉사 취소 */
  handleCancel: (registrationId: string) => Promise<boolean>
}

/**
 * 일정 관리 훅
 *
 * @param serviceType - 봉사 유형
 * @param userId - 사용자 ID (신청/취소에 필요)
 * @returns 일정 관련 상태 및 핸들러
 *
 * @example
 * function CalendarPage() {
 *   const { schedules, isLoading, handleRegister } = useSchedules('exhibit', user.id)
 *
 *   if (isLoading) return <Loading />
 *
 *   return (
 *     <Calendar
 *       schedules={schedules}
 *       onRegister={handleRegister}
 *     />
 *   )
 * }
 */
export function useSchedules(
  serviceType: ServiceType,
  userId?: string
): UseSchedulesReturn {
  // 상태 관리
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [monthlyCount, setMonthlyCount] = useState(0)

  /**
   * 일정 및 신청 내역 로드
   */
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const now = new Date()
      // 과거 3개월부터 미래 2개월까지
      const startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0)

      // 일정 조회
      const scheduleList = await scheduleService.getByDateRange(
        serviceType,
        startDate,
        endDate
      )
      setSchedules(scheduleList)

      // 신청 내역 조회
      if (scheduleList.length > 0) {
        const scheduleIds = scheduleList.map((s) => s.id)
        const regList = await registrationService.getByScheduleIds(scheduleIds)
        setRegistrations(regList)
      } else {
        setRegistrations([])
      }
    } catch (err) {
      console.error('일정 로드 실패:', err)
      setSchedules([])
      setRegistrations([])
    } finally {
      setIsLoading(false)
    }
  }, [serviceType])

  /**
   * 월별 전시대 참여 횟수 계산
   */
  const calculateMonthlyCount = useCallback(async () => {
    if (!userId || serviceType !== 'exhibit') {
      setMonthlyCount(0)
      return
    }

    try {
      const now = new Date()
      const count = await registrationService.getMonthlyExhibitCount(
        userId,
        now.getFullYear(),
        now.getMonth()
      )
      setMonthlyCount(count)
    } catch (err) {
      console.error('월별 참여 횟수 계산 실패:', err)
      setMonthlyCount(0)
    }
  }, [userId, serviceType])

  // 초기 데이터 로드
  useEffect(() => {
    loadData()
  }, [loadData])

  // 월별 참여 횟수 계산
  useEffect(() => {
    if (userId) {
      calculateMonthlyCount()
    }
  }, [registrations, userId, calculateMonthlyCount])

  /**
   * 봉사 신청 핸들러
   *
   * @param scheduleId - 일정 ID
   * @param shiftNumber - 교대 번호
   * @returns 성공 여부
   */
  const handleRegister = useCallback(
    async (scheduleId: string, shiftNumber: number): Promise<boolean> => {
      if (!userId) return false

      // 전시대 봉사 월별 제한 확인
      if (serviceType === 'exhibit' && monthlyCount >= 3) {
        alert('전시대 봉사는 월 3회까지만 참여 가능합니다.')
        return false
      }

      try {
        await registrationService.create(scheduleId, userId, shiftNumber)
        await loadData() // 데이터 새로고침
        return true
      } catch (err) {
        console.error('봉사 신청 실패:', err)
        alert('신청에 실패했습니다. 다시 시도해주세요.')
        return false
      }
    },
    [userId, serviceType, monthlyCount, loadData]
  )

  /**
   * 봉사 취소 핸들러
   *
   * @param registrationId - 신청 ID
   * @returns 성공 여부
   */
  const handleCancel = useCallback(
    async (registrationId: string): Promise<boolean> => {
      if (!confirm('정말 불참하시겠습니까?')) return false

      try {
        await registrationService.cancel(registrationId)
        await loadData() // 데이터 새로고침
        return true
      } catch (err) {
        console.error('봉사 취소 실패:', err)
        alert('취소에 실패했습니다. 다시 시도해주세요.')
        return false
      }
    },
    [loadData]
  )

  return {
    schedules,
    registrations,
    isLoading,
    monthlyCount,
    refresh: loadData,
    handleRegister,
    handleCancel,
  }
}

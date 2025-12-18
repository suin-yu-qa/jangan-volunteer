/**
 * ============================================================================
 * 일정 유틸리티 모듈
 * ============================================================================
 *
 * 이 모듈은 봉사 일정과 관련된 유틸리티 함수들을 제공합니다.
 *
 * 주요 기능:
 * - calculateShiftTimes: 교대 시간 계산
 * - getShiftInfos: 교대별 상세 정보 생성
 * - isWeekend: 주말 여부 확인
 * - formatDate: 날짜 포맷 변환
 * - getKoreanDayName: 한국어 요일 반환
 * ============================================================================
 */

import { Schedule, ShiftInfo, Registration } from '@/types'

/**
 * 교대 시간을 계산합니다.
 *
 * 전체 봉사 시간을 교대 횟수로 균등 분할하여
 * 각 교대의 시작/종료 시간을 계산합니다.
 *
 * @param startTime - 봉사 시작 시간 (HH:mm 형식)
 * @param endTime - 봉사 종료 시간 (HH:mm 형식)
 * @param shiftCount - 교대 횟수 (3 또는 4)
 * @returns 각 교대의 시작/종료 시간 배열
 *
 * @example
 * calculateShiftTimes('10:00', '12:00', 3)
 * // 결과: [
 * //   { startTime: '10:00', endTime: '10:40' },
 * //   { startTime: '10:40', endTime: '11:20' },
 * //   { startTime: '11:20', endTime: '12:00' }
 * // ]
 */
export function calculateShiftTimes(
  startTime: string,
  endTime: string,
  shiftCount: number
): { startTime: string; endTime: string }[] {
  // 시간을 분 단위로 변환
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)

  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute
  const totalMinutes = endMinutes - startMinutes
  const shiftDuration = Math.floor(totalMinutes / shiftCount)

  const shifts: { startTime: string; endTime: string }[] = []

  // 각 교대별 시간 계산
  for (let i = 0; i < shiftCount; i++) {
    const shiftStartMinutes = startMinutes + i * shiftDuration
    // 마지막 교대는 정확히 종료 시간까지
    const shiftEndMinutes = i === shiftCount - 1
      ? endMinutes
      : shiftStartMinutes + shiftDuration

    shifts.push({
      startTime: formatTime(shiftStartMinutes),
      endTime: formatTime(shiftEndMinutes),
    })
  }

  return shifts
}

/**
 * 분 단위 시간을 HH:mm 형식 문자열로 변환합니다.
 *
 * @param totalMinutes - 분 단위 시간 (0시 기준)
 * @returns HH:mm 형식 문자열
 *
 * @example
 * formatTime(630) // '10:30'
 */
function formatTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

/**
 * 일정과 등록 정보를 기반으로 교대 정보를 생성합니다.
 *
 * 각 교대별로 시간, 신청자 목록, 남은 자리 수를 계산하여 반환합니다.
 *
 * @param schedule - 봉사 일정 정보
 * @param registrations - 해당 일정의 신청 내역 목록
 * @returns 교대별 상세 정보 배열
 */
export function getShiftInfos(
  schedule: Schedule,
  registrations: Registration[]
): ShiftInfo[] {
  // 교대별 시간 계산
  const shiftTimes = calculateShiftTimes(
    schedule.startTime,
    schedule.endTime,
    schedule.shiftCount
  )

  // 각 교대별 정보 생성
  return shiftTimes.map((times, index) => {
    const shiftNumber = index + 1
    // 해당 교대에 신청한 내역만 필터링
    const shiftRegistrations = registrations.filter(
      (r) => r.shiftNumber === shiftNumber
    )

    return {
      shiftNumber,
      startTime: times.startTime,
      endTime: times.endTime,
      registrations: shiftRegistrations,
      availableSlots: schedule.participantsPerShift - shiftRegistrations.length,
    }
  })
}

/**
 * 주어진 날짜가 주말인지 확인합니다.
 *
 * @param date - 확인할 날짜
 * @returns 주말이면 true, 평일이면 false
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6  // 일요일 = 0, 토요일 = 6
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 변환합니다.
 *
 * @param date - 변환할 날짜
 * @returns YYYY-MM-DD 형식 문자열
 *
 * @example
 * formatDate(new Date('2024-01-15')) // '2024-01-15'
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 한국어 요일을 반환합니다.
 *
 * @param date - 요일을 구할 날짜
 * @returns 한국어 요일 (일, 월, 화, 수, 목, 금, 토)
 *
 * @example
 * getKoreanDayName(new Date('2024-01-15')) // '월'
 */
export function getKoreanDayName(date: Date): string {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return days[date.getDay()]
}

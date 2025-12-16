import { Schedule, ShiftInfo, Registration } from '@/types'

/**
 * 교대 시간을 계산합니다.
 * 예: 10:00-12:00, 3교대 → [10:00-10:40, 10:40-11:20, 11:20-12:00]
 */
export function calculateShiftTimes(
  startTime: string,
  endTime: string,
  shiftCount: number
): { startTime: string; endTime: string }[] {
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)

  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute
  const totalMinutes = endMinutes - startMinutes
  const shiftDuration = Math.floor(totalMinutes / shiftCount)

  const shifts: { startTime: string; endTime: string }[] = []

  for (let i = 0; i < shiftCount; i++) {
    const shiftStartMinutes = startMinutes + i * shiftDuration
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

function formatTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

/**
 * 일정과 등록 정보를 기반으로 교대 정보를 생성합니다.
 */
export function getShiftInfos(
  schedule: Schedule,
  registrations: Registration[]
): ShiftInfo[] {
  const shiftTimes = calculateShiftTimes(
    schedule.startTime,
    schedule.endTime,
    schedule.shiftCount
  )

  return shiftTimes.map((times, index) => {
    const shiftNumber = index + 1
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
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6  // 일요일 = 0, 토요일 = 6
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 변환합니다.
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 한국어 요일을 반환합니다.
 */
export function getKoreanDayName(date: Date): string {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return days[date.getDay()]
}

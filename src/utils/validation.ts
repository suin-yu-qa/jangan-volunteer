/**
 * ============================================================================
 * 유효성 검사 유틸리티 모듈
 * ============================================================================
 *
 * 입력값 유효성 검사 함수들을 제공합니다.
 *
 * 주요 기능:
 * - 이름 유효성 검사
 * - 이메일 유효성 검사
 * - 비밀번호 유효성 검사
 * - 날짜/시간 유효성 검사
 *
 * 사용 예시:
 * if (isValidName(name)) { ... }
 * ============================================================================
 */

/**
 * 이름 유효성 검사
 *
 * 조건:
 * - 2자 이상 20자 이하
 * - 한글, 영문, 공백만 허용
 *
 * @param name - 검사할 이름
 * @returns 유효 여부
 *
 * @example
 * isValidName('홍길동')    // true
 * isValidName('John Doe')  // true
 * isValidName('홍')        // false (너무 짧음)
 */
export function isValidName(name: string): boolean {
  if (!name || name.trim().length < 2 || name.trim().length > 20) {
    return false
  }

  // 한글, 영문, 공백만 허용
  const nameRegex = /^[가-힣a-zA-Z\s]+$/
  return nameRegex.test(name.trim())
}

/**
 * 이메일 유효성 검사
 *
 * @param email - 검사할 이메일
 * @returns 유효 여부
 *
 * @example
 * isValidEmail('test@example.com')  // true
 * isValidEmail('invalid-email')     // false
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * 비밀번호 유효성 검사
 *
 * 조건:
 * - 최소 8자 이상
 * - 영문, 숫자 포함
 *
 * @param password - 검사할 비밀번호
 * @returns 유효 여부
 *
 * @example
 * isValidPassword('Password123')  // true
 * isValidPassword('1234')         // false
 */
export function isValidPassword(password: string): boolean {
  if (!password || password.length < 8) {
    return false
  }

  // 영문 포함 확인
  const hasLetter = /[a-zA-Z]/.test(password)
  // 숫자 포함 확인
  const hasNumber = /\d/.test(password)

  return hasLetter && hasNumber
}

/**
 * 날짜 문자열 유효성 검사 (YYYY-MM-DD 형식)
 *
 * @param dateStr - 검사할 날짜 문자열
 * @returns 유효 여부
 *
 * @example
 * isValidDateString('2024-01-15')  // true
 * isValidDateString('2024/01/15')  // false
 */
export function isValidDateString(dateStr: string): boolean {
  if (!dateStr) return false

  // 형식 검사
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateStr)) return false

  // 실제 유효한 날짜인지 확인
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return false

  // 파싱된 날짜가 원래 문자열과 일치하는지 확인
  const [year, month, day] = dateStr.split('-').map(Number)
  return (
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day
  )
}

/**
 * 시간 문자열 유효성 검사 (HH:mm 형식)
 *
 * @param timeStr - 검사할 시간 문자열
 * @returns 유효 여부
 *
 * @example
 * isValidTimeString('10:30')  // true
 * isValidTimeString('25:00')  // false
 */
export function isValidTimeString(timeStr: string): boolean {
  if (!timeStr) return false

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
  return timeRegex.test(timeStr)
}

/**
 * 시간 범위 유효성 검사 (시작 < 종료)
 *
 * @param startTime - 시작 시간 (HH:mm)
 * @param endTime - 종료 시간 (HH:mm)
 * @returns 유효 여부
 *
 * @example
 * isValidTimeRange('10:00', '12:00')  // true
 * isValidTimeRange('14:00', '10:00')  // false
 */
export function isValidTimeRange(startTime: string, endTime: string): boolean {
  if (!isValidTimeString(startTime) || !isValidTimeString(endTime)) {
    return false
  }

  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)

  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  return startMinutes < endMinutes
}

/**
 * 필수값 검사
 *
 * @param value - 검사할 값
 * @returns 값이 존재하면 true
 *
 * @example
 * isRequired('hello')  // true
 * isRequired('')       // false
 * isRequired(null)     // false
 */
export function isRequired(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

/**
 * 교대 횟수 유효성 검사 (3 또는 4)
 *
 * @param count - 교대 횟수
 * @returns 유효 여부
 */
export function isValidShiftCount(count: number): boolean {
  return count === 3 || count === 4
}

/**
 * 참여 인원 유효성 검사 (1-10명)
 *
 * @param count - 참여 인원
 * @returns 유효 여부
 */
export function isValidParticipantCount(count: number): boolean {
  return Number.isInteger(count) && count >= 1 && count <= 10
}

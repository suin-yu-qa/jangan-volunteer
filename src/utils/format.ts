/**
 * ============================================================================
 * 포맷팅 유틸리티 모듈
 * ============================================================================
 *
 * 다양한 데이터 포맷팅 함수들을 제공합니다.
 *
 * 주요 기능:
 * - 파일 크기 포맷팅
 * - 날짜/시간 표시 포맷
 * - 숫자 포맷팅
 * - 텍스트 줄임 처리
 *
 * 사용 예시:
 * formatFileSize(1024) // '1 KB'
 * formatRelativeTime(new Date()) // '방금 전'
 * ============================================================================
 */

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환합니다.
 *
 * @param bytes - 파일 크기 (바이트)
 * @returns 포맷팅된 파일 크기 문자열
 *
 * @example
 * formatFileSize(512)      // '512 B'
 * formatFileSize(1024)     // '1 KB'
 * formatFileSize(1048576)  // '1 MB'
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i]
}

/**
 * 날짜를 한국어 형식으로 변환합니다.
 *
 * @param date - 날짜 객체 또는 문자열
 * @param options - 포맷 옵션
 * @returns 포맷팅된 날짜 문자열
 *
 * @example
 * formatKoreanDate(new Date()) // '2024년 1월 15일'
 * formatKoreanDate(new Date(), { includeTime: true }) // '2024년 1월 15일 오후 3:30'
 */
export function formatKoreanDate(
  date: Date | string,
  options: {
    includeTime?: boolean
    includeYear?: boolean
  } = {}
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const { includeTime = false, includeYear = true } = options

  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()

  let result = includeYear
    ? `${year}년 ${month}월 ${day}일`
    : `${month}월 ${day}일`

  if (includeTime) {
    const hours = d.getHours()
    const minutes = d.getMinutes()
    const period = hours >= 12 ? '오후' : '오전'
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours

    result += ` ${period} ${displayHours}:${minutes.toString().padStart(2, '0')}`
  }

  return result
}

/**
 * 상대적 시간을 반환합니다 (방금 전, 1시간 전 등).
 *
 * @param date - 날짜 객체 또는 문자열
 * @returns 상대적 시간 문자열
 *
 * @example
 * formatRelativeTime(new Date(Date.now() - 30000))  // '방금 전'
 * formatRelativeTime(new Date(Date.now() - 3600000)) // '1시간 전'
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  const weeks = Math.floor(diff / 604800000)
  const months = Math.floor(diff / 2592000000)

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`
  if (weeks < 4) return `${weeks}주 전`
  if (months < 12) return `${months}개월 전`

  return formatKoreanDate(d)
}

/**
 * 텍스트를 지정된 길이로 줄입니다.
 *
 * @param text - 원본 텍스트
 * @param maxLength - 최대 길이
 * @param suffix - 줄임 표시 (기본: '...')
 * @returns 줄인 텍스트
 *
 * @example
 * truncateText('안녕하세요 반갑습니다', 10) // '안녕하세요 반...'
 */
export function truncateText(
  text: string,
  maxLength: number,
  suffix: string = '...'
): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - suffix.length) + suffix
}

/**
 * 숫자에 천 단위 콤마를 추가합니다.
 *
 * @param num - 숫자
 * @returns 콤마가 추가된 문자열
 *
 * @example
 * formatNumber(1234567) // '1,234,567'
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR')
}

/**
 * 전화번호 포맷팅
 *
 * @param phone - 전화번호 (숫자만)
 * @returns 포맷팅된 전화번호
 *
 * @example
 * formatPhoneNumber('01012345678') // '010-1234-5678'
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
  }

  return phone
}

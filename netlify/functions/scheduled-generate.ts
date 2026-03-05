/**
 * ============================================================================
 * 봉사 일정 자동 생성 스케줄 함수
 * ============================================================================
 *
 * 매월 마지막 주 월요일 새벽 12시(한국 시간)에 실행됩니다.
 * 다음 달의 봉사 일정을 자동으로 생성합니다.
 *
 * 생성 규칙:
 * - 수/금/토/일에 전시대 + 공원 일정 생성
 * - 매월 첫째 주 토요일은 제외
 * - 전시대: 씨젠, 이화수
 * - 공원: 장안 근린 공원, 뚝방 공원, 마로니에 공원
 * ============================================================================
 */

import { Config, Context } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// 장소 상수
const EXHIBIT_LOCATIONS = ['씨젠', '롯데리아 앞']
const PARK_LOCATIONS = ['장안 근린 공원', '뚝방 공원', '마로니에 공원']

// 장소별 최대 참여 인원
const MAX_PARTICIPANTS_BY_LOCATION: Record<string, number> = {
  '씨젠': 6,
  '롯데리아 앞': 6,
  '장안 근린 공원': 12,
  '뚝방 공원': 12,
  '마로니에 공원': 12,
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷팅
 */
const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 첫째 주 토요일인지 확인
 */
const isFirstSaturdayOfMonth = (date: Date): boolean => {
  if (date.getDay() !== 6) return false
  return date.getDate() <= 7
}

/**
 * 장소별 최대 인원 가져오기
 */
const getMaxParticipants = (location: string): number => {
  return MAX_PARTICIPANTS_BY_LOCATION[location] || 12
}

/**
 * 다음 달의 봉사 일정 자동 생성
 */
async function generateNextMonthSchedules() {
  const now = new Date()
  // 다음 달 계산
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const year = nextMonth.getFullYear()
  const month = nextMonth.getMonth()

  const startOfMonth = new Date(year, month, 1)
  const endOfMonth = new Date(year, month + 1, 0)

  const targetDays = [0, 3, 5, 6] // 일, 수, 금, 토
  const schedulesToCreate: Array<{
    service_type: string
    date: string
    location: string
    start_time: string
    end_time: string
    shift_count: number
    participants_per_shift: number
    created_by: string | null
  }> = []

  const currentDate = new Date(startOfMonth)
  while (currentDate <= endOfMonth) {
    const dayOfWeek = currentDate.getDay()

    // 첫째 주 토요일은 제외
    if (targetDays.includes(dayOfWeek) && !isFirstSaturdayOfMonth(currentDate)) {
      const dateStr = formatDate(currentDate)

      // 전시대 봉사 일정 생성
      for (const location of EXHIBIT_LOCATIONS) {
        schedulesToCreate.push({
          service_type: 'exhibit',
          date: dateStr,
          location: location,
          start_time: '00:00',
          end_time: '00:00',
          shift_count: 1,
          participants_per_shift: getMaxParticipants(location),
          created_by: null,
        })
      }

      // 공원 봉사 일정 생성
      for (const location of PARK_LOCATIONS) {
        schedulesToCreate.push({
          service_type: 'park',
          date: dateStr,
          location: location,
          start_time: '00:00',
          end_time: '00:00',
          shift_count: 1,
          participants_per_shift: getMaxParticipants(location),
          created_by: null,
        })
      }
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }

  if (schedulesToCreate.length === 0) {
    return { success: true, message: '생성할 일정이 없습니다.', count: 0 }
  }

  // 기존 일정 조회 (중복 체크)
  const { data: existingSchedules } = await supabase
    .from('schedules')
    .select('service_type, date, location')
    .gte('date', formatDate(startOfMonth))
    .lte('date', formatDate(endOfMonth))

  const existingKeys = new Set(
    (existingSchedules || []).map((s) => `${s.service_type}-${s.date}-${s.location}`)
  )

  // 중복되지 않는 일정만 필터링
  const newSchedules = schedulesToCreate.filter(
    (s) => !existingKeys.has(`${s.service_type}-${s.date}-${s.location}`)
  )

  if (newSchedules.length === 0) {
    return { success: true, message: '이미 모든 일정이 등록되어 있습니다.', count: 0 }
  }

  // 일정 생성
  const { error } = await supabase.from('schedules').insert(newSchedules)

  if (error) {
    throw error
  }

  const exhibitCount = newSchedules.filter((s) => s.service_type === 'exhibit').length
  const parkCount = newSchedules.filter((s) => s.service_type === 'park').length

  return {
    success: true,
    message: `${year}년 ${month + 1}월 일정 생성 완료`,
    count: newSchedules.length,
    details: {
      exhibit: exhibitCount,
      park: parkCount,
    },
  }
}

/**
 * Netlify Scheduled Function 핸들러
 */
export default async (req: Request, context: Context) => {
  console.log('봉사 일정 자동 생성 함수 실행 시작:', new Date().toISOString())

  try {
    const result = await generateNextMonthSchedules()
    console.log('생성 결과:', result)

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('일정 생성 실패:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

/**
 * 스케줄 설정
 * 매월 마지막 주 월요일 새벽 12시 (한국 시간 KST = UTC+9)
 * UTC 기준으로는 일요일 15:00 (일요일 오후 3시)
 *
 * cron 표현식: "0 15 22-28 * 0"
 * - 0: 0분
 * - 15: 15시 (UTC) = 00시 (KST)
 * - 22-28: 22일~28일 (마지막 주에 해당)
 * - *: 매월
 * - 0: 일요일 (UTC 기준, KST로는 월요일)
 *
 * 참고: 마지막 주 월요일은 항상 22일~28일 사이에 있음
 */
export const config: Config = {
  schedule: '0 15 22-28 * 0',
}

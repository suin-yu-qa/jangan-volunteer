/**
 * ============================================================================
 * 자동 일정 생성 Edge Function
 * ============================================================================
 *
 * 매주 월요일 오전 8시(KST)에 실행되어 해당 주의 전시대 봉사 일정을 자동 생성합니다.
 *
 * 생성되는 일정:
 * - 수요일: 오전 9:30~12:00 (씨젠, 이화수)
 * - 금요일: 오후 1:45~4:00 (씨젠, 이화수)
 * - 토요일: 오후 1:45~4:00 (씨젠, 이화수)
 * - 일요일: 오후 3:15~5:30 (씨젠, 이화수)
 * ============================================================================
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXHIBIT_LOCATIONS = ['씨젠', '롯데리아 앞']

const DEFAULT_SCHEDULE_TIMES: Record<number, { startTime: string; endTime: string }> = {
  0: { startTime: '15:15', endTime: '17:30' }, // 일요일
  3: { startTime: '09:30', endTime: '12:00' }, // 수요일
  5: { startTime: '13:45', endTime: '16:00' }, // 금요일
  6: { startTime: '13:45', endTime: '16:00' }, // 토요일
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

Deno.serve(async (req) => {
  try {
    // Supabase 클라이언트 생성
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 현재 시간 (KST 기준)
    const now = new Date()

    // 이번 주 시작일 (일요일 기준)
    const dayOfWeek = now.getDay()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - dayOfWeek)
    startOfWeek.setHours(0, 0, 0, 0)

    // 이번 주 종료일 (토요일)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    const targetDays = [0, 3, 5, 6] // 일, 수, 금, 토
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
        const times = DEFAULT_SCHEDULE_TIMES[dayNum]

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
            created_by: 'system',
          })
        }
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    if (schedulesToCreate.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: '생성할 일정이 없습니다.', created: 0 }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 기존 일정 조회
    const { data: existingSchedules } = await supabase
      .from('schedules')
      .select('date, location')
      .eq('service_type', 'exhibit')
      .gte('date', formatDate(startOfWeek))
      .lte('date', formatDate(endOfWeek))

    const existingKeys = new Set(
      (existingSchedules || []).map((s: { date: string; location: string }) => `${s.date}-${s.location}`)
    )

    // 중복 제거
    const newSchedules = schedulesToCreate.filter(
      (s) => !existingKeys.has(`${s.date}-${s.location}`)
    )

    if (newSchedules.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: '이미 모든 일정이 등록되어 있습니다.', created: 0 }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 일정 생성
    const { error } = await supabase.from('schedules').insert(newSchedules)

    if (error) {
      console.error('자동 일정 생성 실패:', error)
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`${newSchedules.length}개의 일정이 자동 생성되었습니다.`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `${newSchedules.length}개의 일정이 생성되었습니다.`,
        created: newSchedules.length,
        schedules: newSchedules.map(s => `${s.date} ${s.location}`)
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Edge Function 오류:', error)
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

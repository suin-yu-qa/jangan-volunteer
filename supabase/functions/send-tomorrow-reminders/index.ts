// deno-lint-ignore-file no-explicit-any
/**
 * send-tomorrow-reminders — 매일 21시 KST 자동 호출
 *
 * 1. 내일 (KST) 일정 조회
 * 2. 해당 일정에 신청한 사용자 목록 추출
 * 3. 그 사용자들의 push_subscriptions 로 알림 발송
 *
 * pg_cron 으로 매일 12:00 UTC (= 21:00 KST) 호출됨.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY')!
const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')!
const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@example.com'

webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

function getKoreanTomorrowDateStr(): string {
  const KST_OFFSET = 9 * 60
  const now = new Date()
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60 * 1000
  const kstNow = new Date(utcMs + KST_OFFSET * 60 * 1000)
  const tomorrow = new Date(kstNow)
  tomorrow.setUTCDate(kstNow.getUTCDate() + 1)
  const y = tomorrow.getUTCFullYear()
  const m = String(tomorrow.getUTCMonth() + 1).padStart(2, '0')
  const d = String(tomorrow.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

Deno.serve(async () => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const tomorrow = getKoreanTomorrowDateStr()

  // 1) 내일 일정 ID 조회
  const { data: schedules } = await supabase
    .from('schedules')
    .select('id')
    .eq('date', tomorrow)

  if (!schedules || schedules.length === 0) {
    return jsonResponse({ tomorrow, sent: 0, message: '내일 일정 없음' })
  }
  const scheduleIds = schedules.map((s: any) => s.id)

  // 2) 신청자(user_id) 조회 — 중복 제거
  const { data: regs } = await supabase
    .from('registrations')
    .select('user_id')
    .in('schedule_id', scheduleIds)

  if (!regs || regs.length === 0) {
    return jsonResponse({ tomorrow, sent: 0, message: '내일 일정 신청자 없음' })
  }
  const userIds = Array.from(new Set(regs.map((r: any) => r.user_id)))

  // 3) 해당 사용자들의 구독 조회
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('user_id', userIds)

  if (!subs || subs.length === 0) {
    return jsonResponse({ tomorrow, sent: 0, message: '구독한 사용자 없음', userCount: userIds.length })
  }

  // 4) 푸시 발송
  const payload = JSON.stringify({
    title: '내일 공개 봉사 일정 알림',
    body: `내일 (${tomorrow}) 공개 봉사가 있습니다. 잊지 마세요!`,
    url: '/calendar',
  })

  const results = await Promise.allSettled(
    subs.map(async (sub: any) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        return { ok: true }
      } catch (err: any) {
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
        return { ok: false, status: err?.statusCode }
      }
    })
  )

  const sent = results.filter(
    (r) => r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value.ok
  ).length

  return jsonResponse({
    tomorrow,
    sent,
    failed: results.length - sent,
    total: results.length,
    userCount: userIds.length,
  })
})

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

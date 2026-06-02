// deno-lint-ignore-file no-explicit-any
/**
 * send-push — Web Push 알림 발송 Edge Function
 *
 * Request body:
 *   {
 *     title: string,
 *     body: string,
 *     url?: string,
 *     recipients: { type: 'all_users' | 'all_admins' | 'user_ids', ids?: string[] }
 *   }
 *
 * Response:
 *   { sent: number, failed: number, total: number }
 *
 * 환경변수 (Supabase Functions Secrets):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (자동 제공)
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (수동 설정)
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY')!
const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')!
const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@example.com'

webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

interface PushPayload {
  title: string
  body: string
  url?: string
  recipients: {
    type: 'all_users' | 'all_admins' | 'user_ids'
    ids?: string[]
  }
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  let payload: PushPayload
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400)
  }

  if (!payload.title || !payload.body || !payload.recipients) {
    return jsonResponse({ error: 'Missing title/body/recipients' }, 400)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // 대상별 구독 조회
  let query = supabase.from('push_subscriptions').select('id, endpoint, p256dh, auth')
  const { type, ids } = payload.recipients
  if (type === 'all_admins') {
    query = query.not('admin_id', 'is', null)
  } else if (type === 'all_users') {
    query = query.not('user_id', 'is', null)
  } else if (type === 'user_ids' && ids && ids.length > 0) {
    query = query.in('user_id', ids)
  } else if (type === 'user_ids') {
    return jsonResponse({ sent: 0, failed: 0, total: 0, message: 'No user_ids provided' })
  }

  const { data: subs, error: subsError } = await query
  if (subsError) {
    console.error('Failed to query subscriptions:', subsError)
    return jsonResponse({ error: 'DB query failed' }, 500)
  }
  if (!subs || subs.length === 0) {
    return jsonResponse({ sent: 0, failed: 0, total: 0, message: 'No subscribers' })
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || '/',
  })

  const results = await Promise.allSettled(
    subs.map(async (sub: any) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notificationPayload
        )
        return { ok: true, id: sub.id }
      } catch (err: any) {
        // 410 Gone / 404 — 만료된 구독 정리
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        } else {
          console.error('Push send error:', err?.statusCode, err?.message)
        }
        return { ok: false, id: sub.id, status: err?.statusCode }
      }
    })
  )

  const succeeded = results.filter(
    (r) => r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value.ok
  ).length
  const total = results.length
  const failed = total - succeeded

  return jsonResponse({ sent: succeeded, failed, total })
})

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

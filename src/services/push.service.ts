/**
 * Web Push 알림 구독·해지 서비스.
 * - 브라우저에 알림 권한 요청
 * - Service Worker 의 pushManager 로 구독 발급
 * - Supabase push_subscriptions 테이블에 endpoint + key 저장
 */
import { supabase } from '@/lib/supabase'
import { VAPID_PUBLIC_KEY } from '@/lib/push-config'

/** base64url → Uint8Array (VAPID applicationServerKey 변환용) */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i)
  return output
}

/** Web Push 지원 환경인지 확인 */
export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/** 현재 알림 권한 상태 */
export function getPermissionState(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported'
  return Notification.permission
}

/**
 * 구독 (권한 요청 + pushManager.subscribe + DB 저장)
 * @param subscriberType 'user' | 'admin'
 * @param subscriberId users.id 또는 admins.id
 */
export async function subscribePush(
  subscriberType: 'user' | 'admin',
  subscriberId: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!isPushSupported()) {
    return { ok: false, reason: '이 브라우저는 푸시 알림을 지원하지 않습니다.' }
  }

  // 권한 요청
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { ok: false, reason: '알림 권한이 거부되었습니다.' }
  }

  // Service Worker 등록 확인
  const registration = await navigator.serviceWorker.ready

  // 구독 발급 (기존 구독 있으면 재사용)
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    })
  }

  // DB 저장 (endpoint UNIQUE — upsert)
  const json = subscription.toJSON()
  if (!json.keys?.p256dh || !json.keys?.auth) {
    return { ok: false, reason: '구독 키를 가져올 수 없습니다.' }
  }
  const row = {
    [subscriberType === 'user' ? 'user_id' : 'admin_id']: subscriberId,
    endpoint: subscription.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
    user_agent: navigator.userAgent.slice(0, 200),
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(row, { onConflict: 'endpoint' })

  if (error) {
    console.error('Failed to save push subscription:', error)
    return { ok: false, reason: '구독 저장에 실패했습니다.' }
  }

  return { ok: true }
}

/** 구독 해지 (브라우저 구독 취소 + DB 행 삭제) */
export async function unsubscribePush(): Promise<void> {
  if (!isPushSupported()) return
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return

  await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
  await subscription.unsubscribe()
}

/** 현재 사용자/관리자가 이미 구독 중인지 확인 */
export async function isSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  return !!subscription
}

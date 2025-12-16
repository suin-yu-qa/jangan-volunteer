/**
 * 카카오톡 알림톡 관련 유틸리티
 *
 * 참고: 실제 알림톡 발송은 카카오 비즈니스 채널 + 알림톡 API가 필요합니다.
 * 이 파일은 Supabase Edge Functions에서 사용하거나,
 * 별도 백엔드 서버에서 처리해야 합니다.
 *
 * 카카오 알림톡 설정 방법:
 * 1. 카카오 비즈니스 (https://business.kakao.com) 가입
 * 2. 카카오톡 채널 생성
 * 3. 알림톡 발송 권한 신청 및 승인
 * 4. 메시지 템플릿 등록 및 승인
 */

export interface KakaoNotificationPayload {
  phoneNumber: string
  templateCode: string
  templateParams: Record<string, string>
}

// 알림톡 템플릿 예시
export const NOTIFICATION_TEMPLATES = {
  // 봉사 신청 완료
  REGISTRATION_COMPLETE: {
    code: 'volunteer_registration',
    buildParams: (data: {
      userName: string
      serviceName: string
      date: string
      time: string
      location: string
    }) => ({
      '#{이름}': data.userName,
      '#{봉사유형}': data.serviceName,
      '#{날짜}': data.date,
      '#{시간}': data.time,
      '#{장소}': data.location,
    }),
  },

  // 봉사 하루 전 리마인더
  REMINDER: {
    code: 'volunteer_reminder',
    buildParams: (data: {
      userName: string
      serviceName: string
      date: string
      time: string
      location: string
    }) => ({
      '#{이름}': data.userName,
      '#{봉사유형}': data.serviceName,
      '#{날짜}': data.date,
      '#{시간}': data.time,
      '#{장소}': data.location,
    }),
  },

  // 일정 변경 알림
  SCHEDULE_CHANGE: {
    code: 'volunteer_schedule_change',
    buildParams: (data: {
      userName: string
      serviceName: string
      originalDate: string
      newDate: string
      reason: string
    }) => ({
      '#{이름}': data.userName,
      '#{봉사유형}': data.serviceName,
      '#{기존날짜}': data.originalDate,
      '#{변경날짜}': data.newDate,
      '#{변경사유}': data.reason,
    }),
  },
}

/**
 * 카카오 알림톡 발송 (실제 구현 시 Supabase Edge Function 또는 백엔드 필요)
 *
 * Supabase Edge Function 예시:
 *
 * ```typescript
 * // supabase/functions/send-kakao-notification/index.ts
 * import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
 *
 * serve(async (req) => {
 *   const { phoneNumber, templateCode, templateParams } = await req.json()
 *
 *   // 카카오 알림톡 API 호출
 *   const response = await fetch('https://kakao-api-endpoint', {
 *     method: 'POST',
 *     headers: {
 *       'Authorization': `Bearer ${Deno.env.get('KAKAO_API_KEY')}`,
 *       'Content-Type': 'application/json',
 *     },
 *     body: JSON.stringify({
 *       phone: phoneNumber,
 *       template_code: templateCode,
 *       template_params: templateParams,
 *     }),
 *   })
 *
 *   return new Response(JSON.stringify({ success: true }))
 * })
 * ```
 */
export async function sendKakaoNotification(
  payload: KakaoNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    // 실제 구현 시 Supabase Edge Function 호출
    // const response = await supabase.functions.invoke('send-kakao-notification', {
    //   body: payload,
    // })

    console.log('카카오 알림톡 발송 요청:', payload)

    // 현재는 시뮬레이션
    return { success: true }
  } catch (error) {
    console.error('카카오 알림톡 발송 실패:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * 관리자용: 참여자 전체에게 알림 발송
 */
export async function sendBulkNotification(
  registrations: Array<{
    userName: string
    phoneNumber?: string
  }>,
  message: string
): Promise<{ successCount: number; failCount: number }> {
  let successCount = 0
  let failCount = 0

  for (const reg of registrations) {
    if (!reg.phoneNumber) {
      failCount++
      continue
    }

    const result = await sendKakaoNotification({
      phoneNumber: reg.phoneNumber,
      templateCode: 'custom_message',
      templateParams: {
        '#{이름}': reg.userName,
        '#{메시지}': message,
      },
    })

    if (result.success) {
      successCount++
    } else {
      failCount++
    }
  }

  return { successCount, failCount }
}

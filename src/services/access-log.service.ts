/**
 * 접속 로그 서비스
 * 유저 페이지 접속 기록을 Supabase access_logs 테이블에 저장
 */

import { supabase } from '@/lib/supabase'

interface AccessLog {
  user_id?: string
  user_name?: string
  page: string
  action?: string
}

/**
 * 접속 로그 기록
 */
export async function logAccess(log: AccessLog) {
  try {
    await supabase.from('access_logs').insert({
      user_id: log.user_id || null,
      user_name: log.user_name || '비로그인',
      page: log.page,
      action: log.action || 'page_view',
      user_agent: navigator.userAgent,
    })
  } catch {
    // 로그 실패해도 서비스 영향 없음
  }
}

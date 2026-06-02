/**
 * Web Push 설정 — VAPID 공개키.
 * 공개키는 클라이언트에 노출돼도 안전합니다 (서명 검증용).
 * 비공개키는 Supabase Edge Function 환경변수에만 보관 (절대 커밋 금지).
 */
export const VAPID_PUBLIC_KEY =
  'BJwLqlyKhanDMoYfMP4ixli_nOHHtSIKC9YZry2bwXWM6VjT-KH8gaVB_9AAa-yPDTrkgt5lgveXEXnLVNLaB_E'

-- ============================================================================
-- 010_push_subscriptions.sql
-- ============================================================================
-- Web Push 알림 구독 정보 저장 테이블.
-- 사용자 또는 관리자가 알림 권한 동의 시 브라우저가 발급한 구독 정보를
-- 여기에 저장하고, Edge Function이 이 정보로 푸시를 발송한다.
-- ============================================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- 사용자 또는 관리자 중 하나만 가질 수 있음
  CONSTRAINT push_subscriber_xor CHECK (
    (user_id IS NOT NULL AND admin_id IS NULL) OR
    (user_id IS NULL AND admin_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_admin ON push_subscriptions(admin_id);

-- ============================================================================
-- 자동 일정 생성 크론 작업 설정
-- ============================================================================
-- 매주 월요일 오전 8시(KST, UTC+9)에 전시대 봉사 일정을 자동 생성합니다.
-- UTC 기준으로는 일요일 밤 11시(23:00)입니다.
-- ============================================================================

-- pg_cron 확장 활성화 (이미 활성화되어 있을 수 있음)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- pg_net 확장 활성화 (HTTP 요청용)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 기존 크론 작업이 있으면 삭제
SELECT cron.unschedule('auto-generate-weekly-schedules')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'auto-generate-weekly-schedules'
);

-- 매주 월요일 오전 8시 KST (UTC 23:00 일요일)에 Edge Function 호출
-- cron 표현식: 분 시 일 월 요일
-- 0 23 * * 0 = 매주 일요일 23:00 UTC = 매주 월요일 08:00 KST
SELECT cron.schedule(
  'auto-generate-weekly-schedules',
  '0 23 * * 0',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/auto-generate-schedules',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 크론 작업 확인용 코멘트
COMMENT ON EXTENSION pg_cron IS '매주 월요일 오전 8시(KST) 자동 일정 생성';

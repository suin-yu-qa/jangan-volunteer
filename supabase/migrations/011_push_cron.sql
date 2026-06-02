-- ============================================================================
-- 011_push_cron.sql
-- ============================================================================
-- pg_cron 으로 매일 12:00 UTC (= 21:00 KST) 에
-- send-tomorrow-reminders Edge Function 호출.
--
-- 사용 전 아래 두 값을 본인 환경에 맞춰 치환하세요:
--   <PROJECT_REF>       — Supabase 프로젝트 ref (예: abcdefghijklmnop)
--   <SERVICE_ROLE_KEY>  — Supabase 대시보드 → Settings → API → service_role key
-- ============================================================================

-- pg_cron, pg_net 확장 활성화 (1회만)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 기존 동일 이름 job 있으면 제거 (재실행 시 안전)
SELECT cron.unschedule('send-tomorrow-reminders')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-tomorrow-reminders');

-- 매일 12:00 UTC (= 21:00 KST) 실행
SELECT cron.schedule(
  'send-tomorrow-reminders',
  '0 12 * * *',
  $$
    SELECT net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-tomorrow-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- 등록 확인:
--   SELECT * FROM cron.job WHERE jobname = 'send-tomorrow-reminders';
-- 실행 이력:
--   SELECT * FROM cron.job_run_details
--   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-tomorrow-reminders')
--   ORDER BY start_time DESC LIMIT 10;

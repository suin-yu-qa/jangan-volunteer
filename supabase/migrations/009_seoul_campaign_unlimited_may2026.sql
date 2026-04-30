-- ============================================================================
-- 009: 2026년 5월 서울 캠페인 일정 — 인원 무제한 + 일자 추가
-- ============================================================================
-- 요청자 측 일정 변경:
--   - 5/7 (목), 5/14 (목), 5/21 (목): 기존 6명 → 인원 무제한
--   - 5/12 (화), 5/19 (화): 신규 추가, 인원 무제한
-- 시간 슬롯은 기존과 동일: 오전 07:00-09:00, 오후 17:00-19:00
-- 코드 컨벤션상 무제한 sentinel = participants_per_shift = 999
-- (참고: src/pages/admin/ScheduleManagePage.tsx:207, :403)
-- ============================================================================

-- 1) 기존 5/7, 5/14, 5/21 → 인원 무제한 (참가자 수 제한 해제)
UPDATE schedules
SET participants_per_shift = 999
WHERE service_type = 'exhibit'
  AND date IN ('2026-05-07', '2026-05-14', '2026-05-21')
  AND location LIKE '서울 캠페인%';

-- 2) 5/12 (화), 5/19 (화) 신규 추가 — 무제한
INSERT INTO schedules (service_type, date, location, start_time, end_time, shift_count, participants_per_shift, created_by)
VALUES
  ('exhibit', '2026-05-12', '서울 캠페인 오전', '07:00', '09:00', 1, 999, NULL),
  ('exhibit', '2026-05-12', '서울 캠페인 오후', '17:00', '19:00', 1, 999, NULL),
  ('exhibit', '2026-05-19', '서울 캠페인 오전', '07:00', '09:00', 1, 999, NULL),
  ('exhibit', '2026-05-19', '서울 캠페인 오후', '17:00', '19:00', 1, 999, NULL);

-- 롤백 참고용 (필요 시 수동 실행)
-- 1) 기존 일자 정원 6명으로 복원:
-- UPDATE schedules
-- SET participants_per_shift = 6
-- WHERE service_type = 'exhibit'
--   AND date IN ('2026-05-07', '2026-05-14', '2026-05-21')
--   AND location LIKE '서울 캠페인%';
--
-- 2) 신규 추가한 5/12, 5/19 제거 (신청자 있으면 cascade로 같이 삭제됨에 주의):
-- DELETE FROM schedules
-- WHERE service_type = 'exhibit'
--   AND date IN ('2026-05-12', '2026-05-19')
--   AND location LIKE '서울 캠페인%';

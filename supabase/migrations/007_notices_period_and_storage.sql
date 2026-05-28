-- ============================================================================
-- 007: 공지사항 노출 기간 + Storage(이미지/PDF/Excel 첨부) 추가
-- ============================================================================
-- Supabase SQL Editor에서 그대로 실행하세요.
-- ============================================================================

-- 1) notices 테이블에 노출 기간 컬럼 추가
ALTER TABLE notices
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE;

-- 노출 기간으로 자주 조회하므로 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_notices_period ON notices(start_date, end_date);

-- 2) notice-attachments Storage 버킷 생성 (Public Read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'notice-attachments',
  'notice-attachments',
  true,
  10485760, -- 10MB
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3) Storage 정책 — 누구나 읽기 가능, 누구나 업로드/삭제 가능 (현 인증 모델에 맞춤)
DROP POLICY IF EXISTS "Notice attachments public read" ON storage.objects;
CREATE POLICY "Notice attachments public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'notice-attachments');

DROP POLICY IF EXISTS "Notice attachments insert" ON storage.objects;
CREATE POLICY "Notice attachments insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'notice-attachments');

DROP POLICY IF EXISTS "Notice attachments delete" ON storage.objects;
CREATE POLICY "Notice attachments delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'notice-attachments');

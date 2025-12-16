-- 사용자 승인 기능 추가
-- Supabase SQL Editor에서 실행하세요

-- users 테이블에 is_approved 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- 기존 사용자들을 승인 상태로 변경 (필요한 경우)
-- UPDATE users SET is_approved = true WHERE is_approved IS NULL;

-- users 테이블 업데이트 정책 추가 (관리자가 승인 상태 변경 가능)
CREATE POLICY "Users can be updated" ON users
  FOR UPDATE USING (true);

-- users 테이블 삭제 정책 추가 (관리자가 삭제 가능)
CREATE POLICY "Users can be deleted" ON users
  FOR DELETE USING (true);

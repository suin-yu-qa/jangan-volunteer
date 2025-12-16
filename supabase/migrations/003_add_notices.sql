-- 공지사항 테이블 추가
-- Supabase SQL Editor에서 실행하세요

CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notices_is_active ON notices(is_active);
CREATE INDEX IF NOT EXISTS idx_notices_created_at ON notices(created_at DESC);

-- RLS 활성화
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 정책 설정
CREATE POLICY "Notices are viewable by everyone" ON notices
  FOR SELECT USING (true);

-- 관리자가 공지사항 관리 가능
CREATE POLICY "Notices can be managed" ON notices
  FOR ALL USING (true);

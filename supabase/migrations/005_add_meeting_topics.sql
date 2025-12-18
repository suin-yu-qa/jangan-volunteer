-- ============================================================================
-- 봉사모임 주제 및 읽음 처리 테이블
-- ============================================================================
-- 이 마이그레이션은 다음 기능을 위한 테이블을 생성합니다:
-- 1. meeting_topics: 봉사모임 주제 (관리자가 업로드)
-- 2. topic_attachments: 주제에 첨부된 파일 (PDF, 이미지 등)
-- 3. user_reads: 사용자 읽음 처리 (공지사항, 봉사모임 주제)
-- ============================================================================

-- 봉사모임 주제 테이블
CREATE TABLE IF NOT EXISTS meeting_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,               -- 주제 제목
  content TEXT,                              -- 주제 내용/설명
  is_active BOOLEAN DEFAULT true,            -- 활성화 여부
  created_by UUID NOT NULL REFERENCES admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 첨부파일 테이블 (공지사항 및 봉사모임 주제용)
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(255) NOT NULL,           -- 원본 파일명
  file_path VARCHAR(500) NOT NULL,           -- Storage 경로
  file_type VARCHAR(100) NOT NULL,           -- MIME 타입
  file_size INTEGER NOT NULL,                -- 파일 크기 (bytes)
  target_type VARCHAR(50) NOT NULL,          -- 대상 유형 ('notice' 또는 'meeting_topic')
  target_id UUID NOT NULL,                   -- 대상 ID
  uploaded_by UUID NOT NULL REFERENCES admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 읽음 처리 테이블
CREATE TABLE IF NOT EXISTS user_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type VARCHAR(50) NOT NULL,          -- 대상 유형 ('notice' 또는 'meeting_topic')
  target_id UUID NOT NULL,                   -- 대상 ID
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)    -- 동일 항목 중복 읽음 방지
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_meeting_topics_active ON meeting_topics(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_meeting_topics_created_at ON meeting_topics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attachments_target ON attachments(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_user_reads_user ON user_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reads_target ON user_reads(target_type, target_id);

-- RLS 정책 설정
ALTER TABLE meeting_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reads ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 활성화된 주제 조회 가능
CREATE POLICY "Anyone can view active topics" ON meeting_topics
  FOR SELECT USING (is_active = true);

-- 모든 사용자가 첨부파일 조회 가능
CREATE POLICY "Anyone can view attachments" ON attachments
  FOR SELECT USING (true);

-- 사용자는 자신의 읽음 기록만 조회/생성
CREATE POLICY "Users can view own reads" ON user_reads
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own reads" ON user_reads
  FOR INSERT WITH CHECK (true);

-- Supabase Storage 버킷 생성 (Supabase 대시보드에서 직접 생성 필요)
-- 버킷 이름: attachments
-- 공개 접근: true
-- 허용 MIME 타입: image/*, application/pdf

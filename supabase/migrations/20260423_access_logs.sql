-- 접속 로그 테이블
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  user_name TEXT,
  page TEXT NOT NULL,
  action TEXT DEFAULT 'page_view',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_access_logs_created_at ON access_logs(created_at DESC);
CREATE INDEX idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX idx_access_logs_page ON access_logs(page);

-- RLS
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "누구나 로그 삽입 가능" ON access_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "누구나 로그 조회 가능" ON access_logs FOR SELECT USING (true);

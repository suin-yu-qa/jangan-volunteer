-- admins 테이블에 username, password 컬럼 추가
ALTER TABLE admins
ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS password VARCHAR(100);

-- 기본 관리자 계정 추가 (아이디: admin, 비밀번호: admin1234)
INSERT INTO admins (name, username, password, email)
VALUES ('관리자', 'admin', 'admin1234', 'admin@example.com')
ON CONFLICT (username) DO NOTHING;

-- RLS 정책 추가 (관리자 조회 허용)
DROP POLICY IF EXISTS "Admins can be queried for login" ON admins;
CREATE POLICY "Admins can be queried for login" ON admins
  FOR SELECT USING (true);

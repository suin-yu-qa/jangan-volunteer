-- 공개 봉사 앱 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요

-- 1. 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 관리자 테이블
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kakao_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 봉사 일정 테이블
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('exhibit', 'park', 'bus_stop')),
  date DATE NOT NULL,
  location VARCHAR(255) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  shift_count INTEGER NOT NULL DEFAULT 3 CHECK (shift_count BETWEEN 3 AND 4),
  participants_per_shift INTEGER NOT NULL DEFAULT 2,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 봉사 신청 테이블
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shift_number INTEGER NOT NULL CHECK (shift_number BETWEEN 1 AND 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 같은 일정의 같은 교대에 중복 신청 방지
  UNIQUE(schedule_id, user_id),
  -- 같은 일정의 같은 교대에 중복 슬롯 방지는 애플리케이션 레벨에서 처리
  UNIQUE(schedule_id, shift_number, user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
CREATE INDEX IF NOT EXISTS idx_schedules_service_type ON schedules(service_type);
CREATE INDEX IF NOT EXISTS idx_registrations_schedule_id ON registrations(schedule_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);

-- RLS (Row Level Security) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 정책 설정
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert themselves" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Schedules are viewable by everyone" ON schedules
  FOR SELECT USING (true);

CREATE POLICY "Schedules can be managed by admins" ON schedules
  FOR ALL USING (true);

CREATE POLICY "Registrations are viewable by everyone" ON registrations
  FOR SELECT USING (true);

CREATE POLICY "Registrations can be managed by users" ON registrations
  FOR ALL USING (true);

CREATE POLICY "Admins are viewable by everyone" ON admins
  FOR SELECT USING (true);

CREATE POLICY "Admins can be created" ON admins
  FOR INSERT WITH CHECK (true);

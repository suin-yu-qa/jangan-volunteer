-- ============================================================================
-- 장소 관리 테이블 생성
-- ============================================================================
--
-- 관리자가 봉사 장소를 동적으로 추가/수정/삭제할 수 있게 합니다.
--
-- 테이블 구조:
-- - id: UUID 기본키
-- - service_type: 봉사 유형 (exhibit, park)
-- - name: 장소 이름 (예: 씨젠, 이화수)
-- - max_participants: 최대 참여 인원
-- - is_active: 활성화 여부 (비활성화된 장소는 목록에 표시되지 않음)
-- - display_order: 표시 순서
-- - created_at: 생성 일시
-- - updated_at: 수정 일시
-- ============================================================================

-- 장소 테이블 생성
CREATE TABLE IF NOT EXISTS locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_type TEXT NOT NULL CHECK (service_type IN ('exhibit', 'park')),
    name TEXT NOT NULL,
    max_participants INTEGER NOT NULL DEFAULT 12,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_locations_service_type ON locations(service_type);
CREATE INDEX IF NOT EXISTS idx_locations_is_active ON locations(is_active);
CREATE INDEX IF NOT EXISTS idx_locations_display_order ON locations(display_order);

-- 중복 방지 (동일 봉사 유형 내에서 장소 이름 중복 불가)
CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_unique_name ON locations(service_type, name);

-- RLS (Row Level Security) 활성화
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- 읽기 정책: 모든 사용자가 활성화된 장소 조회 가능
CREATE POLICY "Anyone can view active locations" ON locations
    FOR SELECT USING (is_active = true);

-- 관리자 전체 접근 정책
CREATE POLICY "Admins can do anything with locations" ON locations
    FOR ALL USING (true);

-- 기존 데이터 마이그레이션 (constants.ts에 있던 데이터)
-- 전시대 봉사 장소
INSERT INTO locations (service_type, name, max_participants, display_order) VALUES
    ('exhibit', '씨젠', 6, 1),
    ('exhibit', '이화수', 6, 2)
ON CONFLICT (service_type, name) DO NOTHING;

-- 공원 봉사 장소
INSERT INTO locations (service_type, name, max_participants, display_order) VALUES
    ('park', '장안 근린 공원', 12, 1),
    ('park', '뚝방 공원', 12, 2),
    ('park', '마로니에 공원', 4, 3)
ON CONFLICT (service_type, name) DO NOTHING;

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

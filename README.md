# 공개 봉사 웹앱

봉사 활동 관리를 위한 웹앱입니다. 사용자는 봉사를 신청하고, 관리자는 일정을 관리할 수 있습니다.

## 주요 기능

### 사용자 앱
- 이름 입력 후 입장
- 3가지 봉사 유형 선택 (전시대, 공원, 버스 정류장)
- 달력에서 일정 확인 및 신청
- 전시대 봉사 월 3회 제한

### 관리자 웹
- 카카오 로그인
- 봉사 일정 등록/삭제
- 교대 설정 (3~4교대, 시간 설정)
- 참여자 현황 확인

## 기술 스택

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend/DB**: Supabase
- **배포**: Netlify

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 복사하여 `.env` 파일을 만들고 값을 입력하세요:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_KAKAO_APP_KEY=your-kakao-key  # 선택
```

### 3. Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 `supabase/migrations/001_initial_schema.sql` 실행
3. Settings > API에서 URL과 anon key 복사

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:5173 에서 확인

### 5. 빌드

```bash
npm run build
```

## 폴더 구조

```
src/
├── components/
│   └── common/          # 공통 컴포넌트 (Calendar, Modal)
├── context/             # React Context (User, Admin)
├── lib/
│   ├── supabase.ts      # Supabase 클라이언트
│   ├── kakao.ts         # 카카오 알림톡
│   └── constants.ts     # 상수 정의
├── pages/
│   ├── user/            # 사용자 페이지
│   └── admin/           # 관리자 페이지
├── types/               # TypeScript 타입
└── utils/               # 유틸리티 함수
```

## 배포 (Netlify)

1. Netlify에 GitHub 저장소 연결
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Environment variables에 Supabase 키 추가

## 봉사 유형

| 유형 | 장소 | 일정 | 제한 |
|------|------|------|------|
| 전시대 | 씨젠, 이화수 | 수2, 금1, 토2, 일1 | 월 3회 |
| 공원 | 관리자 등록 | 주 4회 | 무제한 |
| 버스 정류장 | 관리자 등록 | 주 4회 | 무제한 |

### 전시대 봉사 시간

- 평일: 10:00 - 12:00
- 주말: 15:00 - 17:00
- 교대: 3~4교대 (관리자 설정)

## 카카오톡 알림 (선택)

카카오 비즈니스 채널과 알림톡 API 설정이 필요합니다.
자세한 내용은 `src/lib/kakao.ts` 주석 참고.

## 라이선스

MIT License

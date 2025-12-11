# 장안북부 전시대 - 봉사 일정 관리 시스템

봉사 일정을 관리하고 지원/취소할 수 있는 PWA(Progressive Web App) 웹앱입니다.

## 기능

### 사용자 기능
- 회원가입/로그인 (이메일, Google, Kakao)
- 달력으로 봉사 일정 확인
- 봉사 일정 지원/취소
- 내 봉사 계획 확인
- 공지사항 확인
- 푸시 알림 수신

### 관리자 기능
- 봉사 일정 생성/수정/삭제
- 공지사항 작성/수정/삭제
- 사용자 관리 (역할 변경)
- 새 관리자 등록

## 기술 스택

### Frontend
- React 18 + TypeScript
- Vite (빌드 도구)
- TailwindCSS (스타일링)
- Zustand (상태 관리)
- React Router (라우팅)
- PWA (Workbox)

### Backend
- Python 3.11+
- FastAPI
- PostgreSQL
- SQLAlchemy (ORM)
- JWT (인증)
- Firebase Cloud Messaging (푸시 알림)

## 시작하기

### 필수 조건
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Docker & Docker Compose (선택)

### 개발 환경 설정

1. **저장소 클론**
```bash
git clone <repository-url>
cd jangan-volunteer
```

2. **데이터베이스 실행 (Docker)**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

3. **백엔드 설정**
```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일 수정

# 서버 실행
uvicorn app.main:app --reload
```

4. **프론트엔드 설정**
```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env

# 개발 서버 실행
npm run dev
```

5. **접속**
- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:8000
- API 문서: http://localhost:8000/docs

### 프로덕션 배포 (Docker)

```bash
# 환경 변수 설정
export SECRET_KEY=your-secret-key
export GOOGLE_CLIENT_ID=your-google-client-id
export GOOGLE_CLIENT_SECRET=your-google-client-secret
export KAKAO_CLIENT_ID=your-kakao-client-id
export KAKAO_CLIENT_SECRET=your-kakao-client-secret

# 빌드 및 실행
docker-compose up -d --build
```

## 프로젝트 구조

```
jangan-volunteer/
├── frontend/               # React 프론트엔드
│   ├── src/
│   │   ├── components/    # 컴포넌트
│   │   ├── pages/         # 페이지
│   │   ├── hooks/         # 커스텀 훅
│   │   ├── stores/        # Zustand 스토어
│   │   ├── services/      # API 서비스
│   │   └── types/         # TypeScript 타입
│   └── ...
├── backend/                # FastAPI 백엔드
│   ├── app/
│   │   ├── models/        # SQLAlchemy 모델
│   │   ├── schemas/       # Pydantic 스키마
│   │   ├── routers/       # API 라우터
│   │   ├── services/      # 비즈니스 로직
│   │   └── utils/         # 유틸리티
│   └── ...
├── docker-compose.yml      # 프로덕션 Docker 설정
└── docker-compose.dev.yml  # 개발 Docker 설정
```

## 초기 관리자 계정

- 이메일: ruichela521@gmail.com
- 비밀번호: DBtndls521!!

## OAuth 설정

### Google OAuth
1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. OAuth 2.0 클라이언트 ID 생성
3. 승인된 리디렉션 URI 추가: `http://localhost:8000/api/auth/social/google/callback`

### Kakao OAuth
1. [Kakao Developers](https://developers.kakao.com/)에서 앱 생성
2. REST API 키 확인
3. Redirect URI 등록: `http://localhost:8000/api/auth/social/kakao/callback`

## 푸시 알림 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트 생성
2. Cloud Messaging 설정
3. 서비스 계정 키 다운로드 → `backend/firebase-credentials.json`
4. 웹 푸시 인증서 키 생성 → 프론트엔드 환경 변수 설정

## 라이선스

MIT License

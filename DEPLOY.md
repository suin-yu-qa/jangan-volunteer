# 장안북부 전시대 - 배포 가이드

## 목차
1. [Cloudtype 배포 (추천 - 무료)](#1-cloudtype-배포)
2. [AWS EC2 배포](#2-aws-ec2-배포)
3. [OAuth 설정](#3-oauth-설정)
4. [SSL 인증서 설정](#4-ssl-인증서-설정)

---

## 1. Cloudtype 배포

### 장점
- 무료 플랜 제공
- 자동 HTTPS
- GitHub 연동으로 자동 배포
- 한국 서버로 빠른 속도

### 배포 단계

#### Step 1: Cloudtype 가입
1. [cloudtype.io](https://cloudtype.io) 접속
2. GitHub 계정으로 가입

#### Step 2: PostgreSQL 생성
1. 대시보드 → "새 프로젝트" → "데이터베이스"
2. PostgreSQL 선택
3. 생성 후 연결 정보 복사 (DATABASE_URL)

#### Step 3: Backend 배포
1. "새 프로젝트" → "애플리케이션" → "Docker"
2. GitHub 저장소 연결
3. 설정:
   - **Dockerfile 경로**: `backend/Dockerfile`
   - **포트**: `8000`
4. 환경변수 설정:
   ```
   DATABASE_URL=postgresql://... (Step 2에서 복사)
   SECRET_KEY=your-secret-key
   FRONTEND_URL=https://your-frontend.cloudtype.app
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   KAKAO_CLIENT_ID=...
   KAKAO_CLIENT_SECRET=...
   ```
5. 배포 후 URL 확인 (예: `https://jangan-backend.cloudtype.app`)

#### Step 4: Frontend 배포
1. "새 프로젝트" → "애플리케이션" → "Docker"
2. GitHub 저장소 연결
3. 설정:
   - **Dockerfile 경로**: `frontend/Dockerfile.cloudtype`
   - **포트**: `80`
4. 빌드 인자:
   ```
   VITE_API_URL=https://jangan-backend.cloudtype.app/api
   ```
5. 배포 후 URL 확인 (예: `https://jangan-frontend.cloudtype.app`)

#### Step 5: OAuth Redirect URI 업데이트
- Google: `https://jangan-backend.cloudtype.app/api/auth/social/google/callback`
- Kakao: `https://jangan-backend.cloudtype.app/api/auth/social/kakao/callback`

---

## 2. AWS EC2 배포

### 필요 사항
- AWS 계정
- 도메인 (선택 - 없으면 IP로 접속)

### Step 1: EC2 인스턴스 생성

1. AWS Console → EC2 → "인스턴스 시작"
2. 설정:
   - **AMI**: Ubuntu 22.04 LTS
   - **인스턴스 유형**: t2.small 이상 (최소 2GB RAM)
   - **스토리지**: 20GB 이상
3. 보안 그룹 설정:
   | 유형 | 포트 | 소스 |
   |------|------|------|
   | SSH | 22 | 내 IP |
   | HTTP | 80 | 0.0.0.0/0 |
   | HTTPS | 443 | 0.0.0.0/0 |

4. 키 페어 생성 및 다운로드

### Step 2: EC2 접속 및 초기 설정

```bash
# SSH 접속
ssh -i your-key.pem ubuntu@your-ec2-ip

# Docker 설치
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 재로그인 (docker 그룹 적용)
exit
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### Step 3: 프로젝트 배포

```bash
# 프로젝트 클론
git clone https://github.com/your-repo/jangan-volunteer.git
cd jangan-volunteer

# 환경변수 설정
cp .env.production.example .env
nano .env  # 값 수정

# SSL 없이 먼저 테스트 (HTTP)
cp nginx/conf.d/default.nossl.conf.example nginx/conf.d/default.conf

# Docker 빌드 및 실행
docker-compose -f aws/docker-compose.aws.yml up -d --build

# 로그 확인
docker-compose -f aws/docker-compose.aws.yml logs -f
```

### Step 4: 도메인 연결 (선택)

1. 도메인 DNS 설정:
   - A 레코드: `your-domain.com` → EC2 IP
   - A 레코드: `www.your-domain.com` → EC2 IP

2. SSL 인증서 발급:
```bash
# Certbot 설치
sudo apt-get install -y certbot

# 인증서 발급 (잠시 nginx 중지)
docker-compose -f aws/docker-compose.aws.yml stop nginx
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# nginx 설정 업데이트
nano nginx/conf.d/default.conf
# your-domain.com을 실제 도메인으로 변경

# 재시작
docker-compose -f aws/docker-compose.aws.yml up -d
```

### Step 5: 자동 SSL 갱신 설정

```bash
# crontab 편집
sudo crontab -e

# 아래 줄 추가 (매월 1일 갱신)
0 0 1 * * certbot renew --quiet && docker-compose -f /home/ubuntu/jangan-volunteer/aws/docker-compose.aws.yml restart nginx
```

---

## 3. OAuth 설정

### Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성
3. "API 및 서비스" → "사용자 인증 정보"
4. "OAuth 2.0 클라이언트 ID" 생성
5. 설정:
   - **애플리케이션 유형**: 웹 애플리케이션
   - **승인된 JavaScript 원본**: `https://your-domain.com`
   - **승인된 리디렉션 URI**: `https://your-domain.com/api/auth/social/google/callback`
6. 클라이언트 ID와 시크릿 복사

### Kakao OAuth

1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 애플리케이션 추가
3. "앱 키" → REST API 키 복사
4. "카카오 로그인" 활성화
5. "Redirect URI" 등록: `https://your-domain.com/api/auth/social/kakao/callback`
6. "동의항목" → 이메일 필수 동의로 설정

---

## 4. SSL 인증서 설정

### Let's Encrypt (무료)

```bash
# Certbot 설치
sudo apt-get install -y certbot

# 인증서 발급
sudo certbot certonly --standalone -d your-domain.com

# 인증서 위치
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

### 자동 갱신

```bash
# 갱신 테스트
sudo certbot renew --dry-run

# crontab에 추가
sudo crontab -e
0 0 1 * * certbot renew --quiet
```

---

## 문제 해결

### 로그 확인
```bash
# 모든 컨테이너 로그
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 컨테이너 재시작
```bash
docker-compose restart backend
docker-compose restart frontend
```

### DB 접속
```bash
docker-compose exec db psql -U postgres -d jangan_volunteer
```

### 완전 재빌드
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

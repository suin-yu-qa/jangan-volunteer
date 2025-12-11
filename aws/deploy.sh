#!/bin/bash

# AWS EC2 배포 스크립트
# 사용법: ./deploy.sh

set -e

echo "=========================================="
echo "장안북부 전시대 - AWS 배포 스크립트"
echo "=========================================="

# 변수 설정
APP_DIR="/home/ubuntu/jangan-volunteer"
DOMAIN=${DOMAIN:-"your-domain.com"}

# 1. 시스템 업데이트
echo "[1/6] 시스템 업데이트 중..."
sudo apt-get update && sudo apt-get upgrade -y

# 2. Docker 설치
echo "[2/6] Docker 설치 중..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker ubuntu
    rm get-docker.sh
fi

# Docker Compose 설치
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# 3. 프로젝트 디렉토리 생성
echo "[3/6] 프로젝트 설정 중..."
mkdir -p $APP_DIR
cd $APP_DIR

# 4. 환경 변수 파일 확인
if [ ! -f ".env" ]; then
    echo "⚠️  .env 파일이 없습니다. .env.example을 복사하고 수정해주세요."
    echo "   cp .env.example .env && nano .env"
    exit 1
fi

# 5. Docker 빌드 및 실행
echo "[4/6] Docker 컨테이너 빌드 중..."
docker-compose build

echo "[5/6] Docker 컨테이너 시작 중..."
docker-compose up -d

# 6. SSL 인증서 설정 (Certbot)
echo "[6/6] SSL 인증서 설정..."
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    sudo apt-get install -y certbot
    sudo certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
fi

echo "=========================================="
echo "배포 완료!"
echo "- 사이트: https://$DOMAIN"
echo "- API: https://$DOMAIN/api"
echo "=========================================="

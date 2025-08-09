# 🐳 꿈결 Docker 가이드

꿈결 프로젝트의 Docker 기반 개발 및 배포 가이드입니다.

## 📋 목차
- [사전 요구사항](#사전-요구사항)
- [개발 환경 실행](#개발-환경-실행)
- [프로덕션 환경 배포](#프로덕션-환경-배포)
- [Docker 구성 요소](#docker-구성-요소)
- [환경 변수 설정](#환경-변수-설정)
- [모니터링 및 로그](#모니터링-및-로그)
- [백업 및 복원](#백업-및-복원)
- [문제 해결](#문제-해결)

## 🔧 사전 요구사항

### 필수 소프트웨어
- **Docker**: 20.10.0 이상
- **Docker Compose**: 2.0.0 이상
- **Git**: 프로젝트 클론용

### 설치 확인
```bash
docker --version
docker-compose --version
```

## 🚀 개발 환경 실행

### 1. 프로젝트 클론
```bash
git clone https://github.com/lilyth-y/dream-tracer.git
cd dream-tracer
```

### 2. 환경 변수 설정
```bash
# .env 파일 생성 (샘플에서 복사)
cp .env.example .env

# 필수 환경 변수 설정
nano .env
```

**개발 환경 필수 변수:**
```bash
# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# 데이터베이스
POSTGRES_DB=dreamtracer
POSTGRES_USER=dreamuser
POSTGRES_PASSWORD=dreampass2024

# Redis
REDIS_PASSWORD=dreamtracer2024
```

### 3. 개발 서버 시작
```bash
# 모든 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f dream-tracer

# 개발 서버만 시작 (다른 서비스는 제외)
docker-compose up dream-tracer
```

### 4. 서비스 접속
- **메인 애플리케이션**: http://localhost
- **직접 접속 (Nginx 우회)**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 5. 개발 중 유용한 명령어
```bash
# 컨테이너 상태 확인
docker-compose ps

# 특정 서비스 재시작
docker-compose restart dream-tracer

# 컨테이너 내부 접속
docker-compose exec dream-tracer sh
docker-compose exec postgres psql -U dreamuser -d dreamtracer

# 로그 실시간 확인
docker-compose logs -f

# 모든 서비스 중지
docker-compose down

# 볼륨까지 삭제 (데이터 초기화)
docker-compose down -v
```

## 🏭 프로덕션 환경 배포

### 1. 프로덕션 환경 변수 설정
```bash
# .env.production 파일 생성
cp .env.example .env.production

# 프로덕션 설정 수정
nano .env.production
```

**프로덕션 추가 변수:**
```bash
# 모니터링
GRAFANA_PASSWORD=secure_grafana_password

# SSL 인증서 (Let's Encrypt 등)
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem

# 보안
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here
```

### 2. 프로덕션 배포
```bash
# 프로덕션 빌드 및 실행
docker-compose -f docker-compose.prod.yml up -d

# 배포 상태 확인
docker-compose -f docker-compose.prod.yml ps

# 로그 확인
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. SSL 인증서 설정
```bash
# Let's Encrypt 사용 예시
mkdir -p docker/nginx/ssl

# Certbot으로 인증서 발급 (예시)
sudo certbot certonly --standalone -d your-domain.com
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem docker/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem docker/nginx/ssl/key.pem
```

## 🛠 Docker 구성 요소

### 개발 환경 서비스
| 서비스 | 포트 | 설명 |
|--------|------|------|
| dream-tracer | 3000 | Next.js 개발 서버 |
| nginx | 80 | 리버스 프록시 |
| postgres | 5432 | PostgreSQL 데이터베이스 |
| redis | 6379 | Redis 캐시 |

### 프로덕션 환경 추가 서비스
| 서비스 | 포트 | 설명 |
|--------|------|------|
| prometheus | 9090 | 메트릭 수집 |
| grafana | 3001 | 모니터링 대시보드 |
| redis-master | - | Redis 마스터 |
| redis-slave | - | Redis 슬레이브 |
| backup | - | 자동 백업 서비스 |

## 🔐 환경 변수 설정

### 필수 환경 변수
```bash
# .env 파일 예시
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1

# API Keys
OPENAI_API_KEY=sk-...
FIREBASE_API_KEY=...

# 데이터베이스
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=dreamtracer
POSTGRES_USER=dreamuser
POSTGRES_PASSWORD=secure_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=secure_redis_password

# 보안
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_32_character_encryption_key
```

### 보안 주의사항
- `.env` 파일은 절대 Git에 커밋하지 마세요
- 프로덕션에서는 강력한 패스워드 사용
- API 키는 환경별로 분리 관리

## 📊 모니터링 및 로그

### Grafana 대시보드 접속
```bash
# 프로덕션 환경에서만 사용 가능
http://your-domain:3001
# 로그인: admin / (GRAFANA_PASSWORD)
```

### 로그 확인
```bash
# 전체 로그
docker-compose logs

# 특정 서비스 로그
docker-compose logs dream-tracer
docker-compose logs postgres
docker-compose logs redis

# 실시간 로그 (팔로우)
docker-compose logs -f --tail=100 dream-tracer

# 로그 파일 위치 (컨테이너 내부)
docker-compose exec dream-tracer ls -la /app/.next/
```

### 헬스 체크
```bash
# 애플리케이션 상태 확인
curl http://localhost/api/health

# 데이터베이스 연결 확인
docker-compose exec postgres pg_isready -U dreamuser

# Redis 연결 확인
docker-compose exec redis redis-cli ping
```

## 💾 백업 및 복원

### 자동 백업 (프로덕션)
프로덕션 환경에서는 자동 백업이 설정되어 있습니다.

```bash
# 백업 상태 확인
docker-compose -f docker-compose.prod.yml logs backup

# 백업 파일 확인
ls -la backups/

# 수동 백업 실행
docker-compose -f docker-compose.prod.yml exec backup /backup.sh
```

### 수동 백업
```bash
# PostgreSQL 백업
docker-compose exec postgres pg_dump -U dreamuser dreamtracer > backup_$(date +%Y%m%d).sql

# Redis 백업
docker-compose exec redis redis-cli SAVE
docker cp $(docker-compose ps -q redis):/data/dump.rdb ./redis_backup_$(date +%Y%m%d).rdb
```

### 복원
```bash
# PostgreSQL 복원
docker-compose exec -T postgres psql -U dreamuser dreamtracer < backup_20240109.sql

# Redis 복원
docker cp redis_backup_20240109.rdb $(docker-compose ps -q redis):/data/dump.rdb
docker-compose restart redis
```

## 🔧 문제 해결

### 일반적인 문제들

#### 1. 포트 충돌
```bash
# 사용 중인 포트 확인
netstat -tulpn | grep :3000

# 다른 포트로 변경
docker-compose up -p 3001:3000 dream-tracer
```

#### 2. 권한 문제
```bash
# 파일 권한 수정
sudo chown -R $(whoami):$(whoami) .

# Docker 권한 문제
sudo usermod -aG docker $USER
# 로그아웃 후 재로그인 필요
```

#### 3. 메모리 부족
```bash
# Docker 메모리 사용량 확인
docker stats

# 불필요한 컨테이너/이미지 정리
docker system prune -a
```

#### 4. 빌드 실패
```bash
# 캐시 없이 다시 빌드
docker-compose build --no-cache

# 특정 서비스만 다시 빌드
docker-compose build --no-cache dream-tracer
```

### 로그 분석
```bash
# 에러 로그만 필터링
docker-compose logs dream-tracer 2>&1 | grep -i error

# 최근 100줄 로그
docker-compose logs --tail=100 dream-tracer

# 특정 시간대 로그
docker-compose logs --since="2024-01-09T10:00:00" dream-tracer
```

### 성능 최적화
```bash
# 컨테이너 리소스 사용량 모니터링
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# 이미지 크기 최적화 확인
docker images | grep dream-tracer
```

## 📝 추가 정보

### 유용한 Docker 명령어
```bash
# 모든 컨테이너 중지
docker stop $(docker ps -aq)

# 사용하지 않는 리소스 정리
docker system prune -a --volumes

# 컨테이너 내부 쉘 접속
docker-compose exec dream-tracer /bin/sh

# 파일 복사 (호스트 ↔ 컨테이너)
docker cp local_file.txt container_name:/app/
docker cp container_name:/app/file.txt ./
```

### 개발 팁
- `volumes` 마운트로 코드 변경사항이 실시간 반영됩니다
- `.env` 파일 변경 시 컨테이너 재시작이 필요합니다
- 데이터베이스 스키마 변경 시 볼륨을 삭제하고 재시작하세요

### 프로덕션 배포 체크리스트
- [ ] 환경 변수 보안 설정 완료
- [ ] SSL 인증서 설정 완료  
- [ ] 백업 스케줄 설정 확인
- [ ] 모니터링 대시보드 접속 확인
- [ ] 로드 밸런싱 테스트 완료
- [ ] 장애 복구 절차 문서화 완료

---

**🌟 꿈결 Docker 환경이 성공적으로 구축되었습니다!**

더 자세한 정보나 문제가 발생하면 이슈를 등록해 주세요.
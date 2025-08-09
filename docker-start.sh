#!/bin/bash
# 꿈결 Docker 환경 실행 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로고 출력
echo -e "${BLUE}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║           🌙 꿈결 (Dream Tracer)      ║"
echo "  ║         Docker 환경 시작 스크립트      ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"

# 함수 정의
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Docker 설치 확인
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker가 설치되어 있지 않습니다."
        error "Docker를 설치하고 다시 실행해주세요: https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose가 설치되어 있지 않습니다."
        error "Docker Compose를 설치하고 다시 실행해주세요."
        exit 1
    fi

    log "Docker 설치 확인 완료"
}

# 환경 변수 파일 확인
check_env() {
    if [ ! -f ".env" ]; then
        warning ".env 파일이 없습니다."
        if [ -f ".env.example" ]; then
            log ".env.example 파일을 .env로 복사합니다..."
            cp .env.example .env
            warning "⚠️  .env 파일의 API 키들을 실제 값으로 수정해주세요!"
        else
            error ".env.example 파일도 없습니다. 환경 변수를 수동으로 설정해주세요."
            exit 1
        fi
    else
        log "환경 변수 파일 확인 완료"
    fi
}

# 메뉴 출력
show_menu() {
    echo -e "${BLUE}"
    echo "실행할 환경을 선택해주세요:"
    echo "1) 개발 환경 (development)"
    echo "2) 프로덕션 환경 (production)"
    echo "3) 특정 서비스만 실행"
    echo "4) 로그 확인"
    echo "5) 종료"
    echo -e "${NC}"
    read -p "선택 (1-5): " choice
}

# 개발 환경 실행
start_development() {
    log "개발 환경을 시작합니다..."
    
    # 기존 컨테이너 정리
    docker-compose down 2>/dev/null || true
    
    # 개발 환경 실행
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        log "✅ 개발 환경이 성공적으로 시작되었습니다!"
        echo ""
        echo "🌐 서비스 접속 정보:"
        echo "   - 메인 애플리케이션: http://localhost"
        echo "   - 직접 접속: http://localhost:3000" 
        echo "   - PostgreSQL: localhost:5432"
        echo "   - Redis: localhost:6379"
        echo ""
        echo "📝 유용한 명령어:"
        echo "   - 로그 확인: docker-compose logs -f"
        echo "   - 컨테이너 상태: docker-compose ps"
        echo "   - 서비스 중지: docker-compose down"
        
        # 헬스 체크
        echo ""
        log "서비스 상태를 확인 중입니다..."
        sleep 10
        
        if curl -s http://localhost >/dev/null; then
            log "✅ 애플리케이션이 정상적으로 실행 중입니다!"
        else
            warning "⚠️  애플리케이션이 아직 준비되지 않았습니다. 잠시 후 다시 확인해주세요."
        fi
    else
        error "❌ 개발 환경 시작 실패"
        exit 1
    fi
}

# 프로덕션 환경 실행
start_production() {
    log "프로덕션 환경을 시작합니다..."
    
    # 프로덕션 환경 변수 확인
    if [ ! -f ".env.production" ]; then
        warning ".env.production 파일이 없습니다."
        read -p "계속 진행하시겠습니까? (y/N): " confirm
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            exit 1
        fi
    fi
    
    # 기존 컨테이너 정리
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    
    # 프로덕션 환경 실행
    docker-compose -f docker-compose.prod.yml up -d
    
    if [ $? -eq 0 ]; then
        log "✅ 프로덕션 환경이 성공적으로 시작되었습니다!"
        echo ""
        echo "🌐 서비스 접속 정보:"
        echo "   - 메인 애플리케이션: https://your-domain.com"
        echo "   - Grafana 모니터링: http://localhost:3001"
        echo "   - Prometheus: http://localhost:9090"
        echo ""
        echo "📊 모니터링:"
        echo "   - 컨테이너 상태: docker-compose -f docker-compose.prod.yml ps"
        echo "   - 로그 확인: docker-compose -f docker-compose.prod.yml logs -f"
    else
        error "❌ 프로덕션 환경 시작 실패"
        exit 1
    fi
}

# 특정 서비스 실행
start_specific_service() {
    echo ""
    echo "실행할 서비스를 선택해주세요:"
    echo "1) dream-tracer (메인 애플리케이션)"
    echo "2) postgres (데이터베이스)"
    echo "3) redis (캐시)"
    echo "4) nginx (프록시)"
    echo ""
    read -p "선택 (1-4): " service_choice
    
    case $service_choice in
        1) service="dream-tracer" ;;
        2) service="postgres" ;;
        3) service="redis" ;;
        4) service="nginx" ;;
        *) error "잘못된 선택입니다."; return ;;
    esac
    
    log "$service 서비스를 시작합니다..."
    docker-compose up -d $service
    
    if [ $? -eq 0 ]; then
        log "✅ $service 서비스가 성공적으로 시작되었습니다!"
    else
        error "❌ $service 서비스 시작 실패"
    fi
}

# 로그 확인
show_logs() {
    echo ""
    echo "확인할 로그를 선택해주세요:"
    echo "1) 전체 로그"
    echo "2) dream-tracer 로그"
    echo "3) postgres 로그"
    echo "4) redis 로그"
    echo "5) nginx 로그"
    echo ""
    read -p "선택 (1-5): " log_choice
    
    case $log_choice in
        1) docker-compose logs -f ;;
        2) docker-compose logs -f dream-tracer ;;
        3) docker-compose logs -f postgres ;;
        4) docker-compose logs -f redis ;;
        5) docker-compose logs -f nginx ;;
        *) error "잘못된 선택입니다."; return ;;
    esac
}

# 메인 실행 로직
main() {
    # 시스템 확인
    check_docker
    check_env
    
    # 메뉴 루프
    while true; do
        echo ""
        show_menu
        
        case $choice in
            1)
                start_development
                break
                ;;
            2)
                start_production
                break
                ;;
            3)
                start_specific_service
                ;;
            4)
                show_logs
                ;;
            5)
                log "스크립트를 종료합니다."
                exit 0
                ;;
            *)
                error "잘못된 선택입니다. 1-5 사이의 숫자를 입력해주세요."
                ;;
        esac
    done
}

# 스크립트 실행
main
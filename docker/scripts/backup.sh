#!/bin/sh
# 꿈결 PostgreSQL 자동 백업 스크립트

set -e

# 환경 변수 설정
POSTGRES_HOST="postgres"
POSTGRES_PORT="5432"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="dreamtracer_backup_${DATE}.sql"
RETENTION_DAYS=7

# 로그 함수
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# 백업 디렉토리 생성
mkdir -p ${BACKUP_DIR}

log "PostgreSQL 백업 시작: ${BACKUP_FILE}"

# 데이터베이스 백업 실행
pg_dump -h ${POSTGRES_HOST} \
        -p ${POSTGRES_PORT} \
        -U ${POSTGRES_USER} \
        -d ${POSTGRES_DB} \
        --no-password \
        --verbose \
        --clean \
        --if-exists \
        --create \
        --format=custom \
        --file=${BACKUP_DIR}/${BACKUP_FILE}

if [ $? -eq 0 ]; then
    log "백업 완료: ${BACKUP_FILE}"
    
    # 백업 파일 압축
    gzip ${BACKUP_DIR}/${BACKUP_FILE}
    log "백업 파일 압축 완료: ${BACKUP_FILE}.gz"
    
    # 파일 크기 확인
    BACKUP_SIZE=$(du -h ${BACKUP_DIR}/${BACKUP_FILE}.gz | cut -f1)
    log "백업 파일 크기: ${BACKUP_SIZE}"
    
    # 오래된 백업 파일 정리 (7일 이상 된 파일 삭제)
    find ${BACKUP_DIR} -name "dreamtracer_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
    log "오래된 백업 파일 정리 완료 (${RETENTION_DAYS}일 이상)"
    
    # 백업 파일 목록 출력
    log "현재 백업 파일 목록:"
    ls -la ${BACKUP_DIR}/dreamtracer_backup_*.sql.gz 2>/dev/null || log "백업 파일이 없습니다."
    
else
    log "백업 실패!"
    exit 1
fi

# 백업 복원 스크립트 생성
cat > ${BACKUP_DIR}/restore_${DATE}.sh << EOF
#!/bin/sh
# 백업 복원 스크립트 - ${DATE}
# 사용법: ./restore_${DATE}.sh

set -e

BACKUP_FILE="${BACKUP_FILE}.gz"
POSTGRES_HOST="\${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="\${POSTGRES_PORT:-5432}"
POSTGRES_USER="\${POSTGRES_USER:-dreamuser}"
POSTGRES_DB="\${POSTGRES_DB:-dreamtracer}"

echo "백업 복원 시작: \${BACKUP_FILE}"

# 백업 파일 압축 해제
gunzip -c \${BACKUP_FILE} > temp_restore.sql

# 데이터베이스 복원
pg_restore -h \${POSTGRES_HOST} \\
           -p \${POSTGRES_PORT} \\
           -U \${POSTGRES_USER} \\
           -d \${POSTGRES_DB} \\
           --no-password \\
           --verbose \\
           --clean \\
           --if-exists \\
           temp_restore.sql

if [ \$? -eq 0 ]; then
    echo "복원 완료: \${BACKUP_FILE}"
    rm -f temp_restore.sql
else
    echo "복원 실패!"
    rm -f temp_restore.sql
    exit 1
fi
EOF

chmod +x ${BACKUP_DIR}/restore_${DATE}.sh
log "복원 스크립트 생성 완료: restore_${DATE}.sh"

log "전체 백업 프로세스 완료"
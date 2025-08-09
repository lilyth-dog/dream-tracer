-- 꿈결 데이터베이스 초기화 스크립트

-- 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 꿈 분석 테이블 (Firebase와 병행 사용)
CREATE TABLE IF NOT EXISTS dream_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    dream_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 감정 분석 결과
    emotion_score JSONB,
    sentiment_score FLOAT,
    
    -- 키워드 및 태그 분석
    keywords TEXT[],
    auto_tags TEXT[],
    
    -- AI 해석 메타데이터
    interpretation_confidence FLOAT,
    interpretation_categories TEXT[],
    
    -- 패턴 분석
    recurring_elements TEXT[],
    symbol_frequency JSONB,
    
    UNIQUE(user_id, dream_id)
);

-- 사용자 통계 테이블
CREATE TABLE IF NOT EXISTS user_statistics (
    user_id VARCHAR(255) PRIMARY KEY,
    total_dreams INTEGER DEFAULT 0,
    total_lucid_dreams INTEGER DEFAULT 0,
    avg_dream_length FLOAT DEFAULT 0,
    most_common_emotions TEXT[],
    most_common_tags TEXT[],
    streak_count INTEGER DEFAULT 0,
    last_dream_date DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 꿈 패턴 분석 테이블
CREATE TABLE IF NOT EXISTS dream_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    pattern_type VARCHAR(100) NOT NULL, -- 'recurring_symbol', 'emotion_trend', 'time_pattern' 등
    pattern_data JSONB NOT NULL,
    confidence_score FLOAT,
    first_detected TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI 캐시 테이블 (Redis 백업용)
CREATE TABLE IF NOT EXISTS ai_cache (
    cache_key VARCHAR(255) PRIMARY KEY,
    cache_value JSONB NOT NULL,
    cache_type VARCHAR(50) NOT NULL, -- 'interpretation', 'image_generation', 'analysis'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 시스템 로그 테이블
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    log_level VARCHAR(20) NOT NULL,
    log_message TEXT NOT NULL,
    log_data JSONB,
    user_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_dream_analytics_user_id ON dream_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_dream_analytics_created_at ON dream_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_dream_patterns_user_id ON dream_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_dream_patterns_type ON dream_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON ai_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(log_level);

-- GIN 인덱스 (JSONB 검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_dream_analytics_emotion_gin ON dream_analytics USING GIN(emotion_score);
CREATE INDEX IF NOT EXISTS idx_dream_patterns_data_gin ON dream_patterns USING GIN(pattern_data);

-- 트리거 함수: 통계 업데이트
CREATE OR REPLACE FUNCTION update_user_statistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_statistics (user_id, total_dreams, last_dream_date, updated_at)
    VALUES (NEW.user_id, 1, CURRENT_DATE, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        total_dreams = user_statistics.total_dreams + 1,
        last_dream_date = CURRENT_DATE,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거: dream_analytics 테이블에 새 레코드 추가 시 통계 업데이트
CREATE TRIGGER trigger_update_user_statistics
    AFTER INSERT ON dream_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_user_statistics();

-- 파티션 테이블 (로그 데이터 관리용)
-- 월별로 시스템 로그 파티션 생성
CREATE TABLE IF NOT EXISTS system_logs_y2024m01 PARTITION OF system_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- 만료된 캐시 정리 함수
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM ai_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 권한 설정
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dreamuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dreamuser;

-- 초기 설정 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '꿈결 데이터베이스 초기화가 완료되었습니다.';
    RAISE NOTICE '생성된 테이블: dream_analytics, user_statistics, dream_patterns, ai_cache, system_logs';
    RAISE NOTICE '확장 기능: uuid-ossp, pg_trgm';
END $$;
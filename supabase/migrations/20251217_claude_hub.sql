-- =============================================
-- Claude Hub: 프로젝트 관리 + 지식 허브 시스템
-- 최종수정: 2025-12-17
-- =============================================

-- =============================================
-- 1. 프로젝트 레지스트리 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS project_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 기본 정보
    code VARCHAR(50) NOT NULL UNIQUE,        -- koreanews, hobakflower
    name VARCHAR(100) NOT NULL,              -- 표시명
    description TEXT,                        -- 프로젝트 설명
    path VARCHAR(500),                       -- d:\cbt\koreanews

    -- Git 설정
    git_email VARCHAR(100) NOT NULL,
    git_name VARCHAR(50) NOT NULL,
    git_repo VARCHAR(200),                   -- github.com/...
    git_branch VARCHAR(50) DEFAULT 'master',

    -- Vercel 설정
    vercel_project VARCHAR(100),
    vercel_team VARCHAR(100),
    vercel_domain VARCHAR(200),

    -- 기술 스택
    tech_stack TEXT[],                       -- ['nextjs', 'python', 'supabase']

    -- 상태
    status VARCHAR(20) DEFAULT 'active',     -- active, archived, paused

    -- 메타
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_project_registry_code ON project_registry(code);
CREATE INDEX IF NOT EXISTS idx_project_registry_status ON project_registry(status);

-- =============================================
-- 2. 지식 허브 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS knowledge_hub (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 범위 (3단계)
    scope VARCHAR(20) NOT NULL,              -- global, stack, project
    project_code VARCHAR(50),                -- FK: project_registry.code (scope=project)
    stack VARCHAR(50),                       -- nextjs, python, supabase (scope=stack)

    -- 분류
    topic VARCHAR(50) NOT NULL,              -- prompting, development, troubleshooting, workflow, preferences
    tags TEXT[],                             -- ['claude4', 'best-practices']

    -- 내용 (3단계 깊이)
    title VARCHAR(200) NOT NULL,
    summary TEXT NOT NULL,                   -- 3줄 요약 (필수, 가벼움)
    content TEXT,                            -- 상세 내용 (마크다운)
    raw_source TEXT,                         -- 원본 (선택, 거의 안 읽음)

    -- 출처
    source_type VARCHAR(20),                 -- video, conversation, document, error
    source_url TEXT,
    source_title VARCHAR(200),

    -- 검색용
    search_vector TSVECTOR,

    -- 메타
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(50) DEFAULT 'claude'  -- claude, manual
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_knowledge_hub_scope ON knowledge_hub(scope);
CREATE INDEX IF NOT EXISTS idx_knowledge_hub_project ON knowledge_hub(project_code);
CREATE INDEX IF NOT EXISTS idx_knowledge_hub_topic ON knowledge_hub(topic);
CREATE INDEX IF NOT EXISTS idx_knowledge_hub_tags ON knowledge_hub USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_hub_created ON knowledge_hub(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_hub_search ON knowledge_hub USING GIN(search_vector);

-- 전문 검색 트리거
CREATE OR REPLACE FUNCTION knowledge_hub_search_trigger()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(NEW.summary, '')), 'B') ||
        setweight(to_tsvector('simple', coalesce(NEW.content, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS knowledge_hub_search_update ON knowledge_hub;
CREATE TRIGGER knowledge_hub_search_update
    BEFORE INSERT OR UPDATE ON knowledge_hub
    FOR EACH ROW
    EXECUTE FUNCTION knowledge_hub_search_trigger();

-- =============================================
-- 3. 세션 로그 테이블 (Claude 대화 기록)
-- =============================================
CREATE TABLE IF NOT EXISTS session_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 세션 정보
    project_code VARCHAR(50),                -- 작업한 프로젝트
    session_date DATE DEFAULT CURRENT_DATE,

    -- 내용
    summary TEXT NOT NULL,                   -- 세션 요약
    tasks_completed TEXT[],                  -- 완료한 작업 목록
    decisions_made TEXT[],                   -- 내린 결정들
    issues_found TEXT[],                     -- 발견한 이슈

    -- 연결된 지식
    knowledge_ids UUID[],                    -- 이 세션에서 생성된 지식

    -- 메타
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_logs_project ON session_logs(project_code);
CREATE INDEX IF NOT EXISTS idx_session_logs_date ON session_logs(session_date DESC);

-- =============================================
-- 4. RLS 정책
-- =============================================
ALTER TABLE project_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_hub ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for project_registry" ON project_registry FOR ALL USING (true);
CREATE POLICY "Allow all for knowledge_hub" ON knowledge_hub FOR ALL USING (true);
CREATE POLICY "Allow all for session_logs" ON session_logs FOR ALL USING (true);

-- =============================================
-- 5. 초기 데이터: 기존 프로젝트 등록
-- =============================================
INSERT INTO project_registry (code, name, path, git_email, git_name, git_repo, vercel_project, vercel_team, tech_stack, status)
VALUES
    ('koreanews', 'Korea NEWS', 'd:\cbt\koreanews', 'kyh6412057153@gmail.com', '유향', 'korea-news/koreanewsone', 'koreanewsone', 'koreanews-projects', ARRAY['nextjs', 'typescript', 'supabase', 'python'], 'active'),
    ('hobakflower', '호박꽃', 'd:\cbt\hobakflower', 'ko518533@gmail.com', '광혁', NULL, NULL, NULL, ARRAY['nextjs', 'typescript'], 'active'),
    ('electrical-cbt', '전기기사 CBT', 'd:\cbt\electrical-cbt', 'multi618@gmail.com', '중', NULL, NULL, NULL, ARRAY['nextjs', 'typescript'], 'active'),
    ('thub', 'T-Hub', 'd:\cbt\thub', 'multi618@gmail.com', '중', NULL, NULL, NULL, ARRAY['nextjs', 'typescript'], 'active')
ON CONFLICT (code) DO UPDATE SET
    git_email = EXCLUDED.git_email,
    git_name = EXCLUDED.git_name,
    tech_stack = EXCLUDED.tech_stack,
    updated_at = NOW();

-- =============================================
-- 6. 초기 데이터: 오늘 배운 지식 저장
-- =============================================
INSERT INTO knowledge_hub (scope, topic, tags, title, summary, content, source_type, source_title)
VALUES
    ('global', 'prompting', ARRAY['claude4', 'best-practices', 'migration'],
     'Claude 4 프롬프팅 가이드',
     '1. Claude 4는 글자 그대로 해석 - 구체적 지시 필수
2. "생각해봐" 대신 "검토/고려/평가" 사용 (토큰 절약)
3. 맥락(Why) 추가하면 성능 향상',
     '## Claude 3 → 4 핵심 변화 7가지

### 1. 지시 해석: 눈치껏 → 글자 그대로
- Claude 3: 대충 말해도 알아서
- Claude 4: 말한 그대로 정확히 구현
- **적용**: 기능/요소 명시적으로 나열

### 2. 제안 vs 실행 분리
- Claude 3: 제안과 실행 동시
- Claude 4: 명시적 구분 필요
- **적용**: "분석해줘" vs "수정해줘" 명확히

### 3. 강조 표현 민감도
- Claude 3: 강조 필요 ("반드시", "기필코")
- Claude 4: 과민 반응, 일반어로 충분
- **적용**: 강조 표현 자제

### 4. 자동 요약 제거
- Claude 3: 작업 후 자동 요약
- Claude 4: 요청시에만 요약
- **적용**: "완료 후 변경사항 요약해줘" 추가

### 5. 병렬 처리
- Claude 3: 순차 처리
- Claude 4: 병렬 동시 처리
- **적용**: 필요시 "순차적으로 처리해줘" 명시

### 6. Think 민감도 (4.5 Opus)
- "생각해봐" 표현에 Extended Thinking 발동
- 토큰 소비 증가
- **적용**: "검토해봐", "고려해봐", "평가해봐" 대체

### 7. 파일 다수 생성
- Claude 3: 필요한 파일 1개
- Claude 4: 관련 파일 여러 개 동시 생성
- **적용**: "과잉 설계 피해, 요청된 변경만" 명시

## 실전 적용 팁

### 맥락(Why) 추가
```
❌ "줄임표 사용하지 마"
✅ "이 응답은 TTS가 읽을 거야. TTS는 줄임표 발음 못하니까 사용하지 마"
```

### 기대 이상 원하면 명시
```
❌ "대시보드 만들어줘"
✅ "대시보드 만들어줘. 월별 차트, 필터, 다크모드 포함. 기본을 넘어 완전한 구현해줘"
```

### 환각 방지
```
"열지 않은 코드에 대해 절대 추측하지 마.
파일 참조하면 답하기 전 반드시 파일 읽어"
```',
     'video', '인공지능 아카데미 아지 - Claude 4 프롬프팅')
ON CONFLICT DO NOTHING;

-- 코멘트
COMMENT ON TABLE project_registry IS '프로젝트 레지스트리 - 모든 프로젝트의 Git/Vercel 설정 관리';
COMMENT ON TABLE knowledge_hub IS '지식 허브 - 대화에서 배운 내용 저장 (RAG용)';
COMMENT ON TABLE session_logs IS '세션 로그 - Claude 대화 세션 기록';

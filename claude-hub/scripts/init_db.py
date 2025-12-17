"""
Initialize Database Tables for Claude Hub
Run this script once to create the required tables in Supabase
"""
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from supabase import create_client

# Get credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    print("ERROR: Supabase credentials not found in .env file")
    sys.exit(1)

print(f"Connecting to Supabase: {SUPABASE_URL}")
client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# SQL statements to create tables
SQL_STATEMENTS = """
-- 1. Project Registry Table
CREATE TABLE IF NOT EXISTS project_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    path VARCHAR(500),
    git_email VARCHAR(100) NOT NULL,
    git_name VARCHAR(50) NOT NULL,
    git_repo VARCHAR(200),
    git_branch VARCHAR(50) DEFAULT 'master',
    vercel_project VARCHAR(100),
    vercel_team VARCHAR(100),
    vercel_domain VARCHAR(200),
    tech_stack TEXT[],
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Knowledge Hub Table
CREATE TABLE IF NOT EXISTS knowledge_hub (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope VARCHAR(20) NOT NULL,
    project_code VARCHAR(50),
    stack VARCHAR(50),
    topic VARCHAR(50) NOT NULL,
    tags TEXT[],
    title VARCHAR(200) NOT NULL,
    summary TEXT NOT NULL,
    content TEXT,
    raw_source TEXT,
    source_type VARCHAR(20),
    source_url TEXT,
    source_title VARCHAR(200),
    search_vector TSVECTOR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(50) DEFAULT 'claude'
);

-- 3. Session Logs Table
CREATE TABLE IF NOT EXISTS session_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_code VARCHAR(50),
    session_date DATE DEFAULT CURRENT_DATE,
    summary TEXT NOT NULL,
    tasks_completed TEXT[],
    decisions_made TEXT[],
    issues_found TEXT[],
    knowledge_ids UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""

def init_tables_via_rpc():
    """Try to create tables via RPC (requires setup in Supabase)"""
    print("Note: Table creation via anon key is limited.")
    print("Please run the SQL migration directly in Supabase Dashboard:")
    print(f"  1. Go to {SUPABASE_URL.replace('.supabase.co', '.supabase.co/project/default/sql')}")
    print("  2. Open SQL Editor")
    print("  3. Paste the contents of: koreanews/supabase/migrations/20251217_claude_hub.sql")
    print("  4. Click 'Run'")
    return False

def check_tables_exist():
    """Check if tables already exist"""
    try:
        # Try to query project_registry
        result = client.table("project_registry").select("code").limit(1).execute()
        print("project_registry table exists")
        return True
    except Exception as e:
        if "PGRST205" in str(e):
            print("project_registry table does not exist")
            return False
        else:
            print(f"Error checking tables: {e}")
            return False

def insert_initial_data():
    """Insert initial project data"""
    print("\nInserting initial project data...")

    projects = [
        {
            "code": "koreanews",
            "name": "Korea NEWS",
            "path": "d:\\cbt\\koreanews",
            "git_email": "kyh6412057153@gmail.com",
            "git_name": "유향",
            "git_repo": "korea-news/koreanewsone",
            "vercel_project": "koreanewsone",
            "vercel_team": "koreanews-projects",
            "tech_stack": ["nextjs", "typescript", "supabase", "python"],
            "status": "active"
        },
        {
            "code": "hobakflower",
            "name": "호박꽃",
            "path": "d:\\cbt\\hobakflower",
            "git_email": "ko518533@gmail.com",
            "git_name": "광혁",
            "tech_stack": ["nextjs", "typescript"],
            "status": "active"
        },
        {
            "code": "electrical-cbt",
            "name": "전기기사 CBT",
            "path": "d:\\cbt\\electrical-cbt",
            "git_email": "multi618@gmail.com",
            "git_name": "중",
            "tech_stack": ["nextjs", "typescript"],
            "status": "active"
        },
        {
            "code": "thub",
            "name": "T-Hub",
            "path": "d:\\cbt\\thub",
            "git_email": "multi618@gmail.com",
            "git_name": "중",
            "tech_stack": ["nextjs", "typescript"],
            "status": "active"
        }
    ]

    for project in projects:
        try:
            result = client.table("project_registry").upsert(
                project,
                on_conflict="code"
            ).execute()
            print(f"  Inserted/Updated: {project['code']}")
        except Exception as e:
            print(f"  Error inserting {project['code']}: {e}")

    # Insert Claude 4 prompting guide
    knowledge_data = {
        "scope": "global",
        "topic": "prompting",
        "tags": ["claude4", "best-practices", "migration"],
        "title": "Claude 4 Prompting Guide",
        "summary": """1. Claude 4는 글자 그대로 해석 - 구체적 지시 필수
2. "생각해봐" 대신 "검토/고려/평가" 사용 (토큰 절약)
3. 맥락(Why) 추가하면 성능 향상""",
        "content": """## Claude 3 -> 4 핵심 변화 7가지

### 1. 지시 해석: 눈치껏 -> 글자 그대로
- Claude 3: 대충 말해도 알아서
- Claude 4: 말한 그대로 정확히 구현
- **적용**: 기능/요소 명시적으로 나열

### 2. 제안 vs 실행 분리
- Claude 3: 제안과 실행 동시
- Claude 4: 명시적 구분 필요

### 3. 강조 표현 민감도
- Claude 4: 과민 반응, 일반어로 충분

### 4. 자동 요약 제거
- Claude 4: 요청시에만 요약

### 5. 병렬 처리
- Claude 4: 병렬 동시 처리

### 6. Think 민감도 (4.5 Opus)
- "생각해봐" 표현에 Extended Thinking 발동
- **적용**: "검토해봐", "고려해봐" 대체

### 7. 파일 다수 생성
- Claude 4: 관련 파일 여러 개 동시 생성
- **적용**: "요청된 변경만" 명시""",
        "source_type": "video",
        "source_title": "인공지능 아카데미 아지 - Claude 4 Prompting"
    }

    try:
        result = client.table("knowledge_hub").insert(knowledge_data).execute()
        print(f"  Inserted knowledge: {knowledge_data['title']}")
    except Exception as e:
        if "duplicate" in str(e).lower():
            print(f"  Knowledge already exists: {knowledge_data['title']}")
        else:
            print(f"  Error inserting knowledge: {e}")

if __name__ == "__main__":
    print("=" * 50)
    print("Claude Hub Database Initialization")
    print("=" * 50)

    if check_tables_exist():
        print("\nTables already exist. Inserting/updating initial data...")
        insert_initial_data()
        print("\nDone!")
    else:
        init_tables_via_rpc()
        print("\nAfter creating tables, run this script again to insert initial data.")

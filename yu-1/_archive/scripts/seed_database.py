"""
384효 데이터베이스 시딩 스크립트
- hexagram_384yao.json 파일을 PostgreSQL에 임포트
- 기존 데이터 백업 및 업데이트 지원
"""

import json
import asyncio
from pathlib import Path
from datetime import datetime

# SQLAlchemy 임포트
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# 설정
DATABASE_URL = "postgresql://postgres:password@localhost:5432/iching_db"

# 데이터 경로
DATA_PATH = Path(__file__).parent.parent / "data" / "hexagram_384yao.json"


def load_json_data():
    """JSON 파일 로드"""
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def create_tables_sql():
    """테이블 생성 SQL"""
    return """
    -- 384효 마스터 테이블
    CREATE TABLE IF NOT EXISTS hexagrams (
        id VARCHAR(10) PRIMARY KEY,
        gua_number INTEGER NOT NULL,
        yao_position INTEGER NOT NULL,

        -- 괘 정보
        gua_name_kr VARCHAR(20) NOT NULL,
        gua_name_hanja VARCHAR(20) NOT NULL,
        gua_name_en VARCHAR(100),
        gua_full_name VARCHAR(50),
        upper_trigram VARCHAR(10),
        lower_trigram VARCHAR(10),

        -- 효 정보
        yao_name VARCHAR(20),
        yao_name_yang VARCHAR(10),
        yao_name_yin VARCHAR(10),

        -- 원문
        text_hanja TEXT,
        text_pinyin TEXT,
        text_kr TEXT,
        text_en TEXT,

        -- 길흉 판단
        fortune_score INTEGER DEFAULT 60,
        fortune_direction VARCHAR(20) DEFAULT '정체',
        fortune_category VARCHAR(20) DEFAULT '보통',

        -- 핵심 해석
        core_message TEXT,
        caution TEXT,
        timing VARCHAR(20),

        -- 매칭용
        keywords JSONB DEFAULT '[]',

        -- 타겟
        target_audience VARCHAR(20) DEFAULT '전연령',
        priority INTEGER DEFAULT 2,

        -- 메타
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        -- 제약조건
        CONSTRAINT unique_gua_yao UNIQUE (gua_number, yao_position)
    );

    -- 인덱스 생성
    CREATE INDEX IF NOT EXISTS idx_hexagrams_gua ON hexagrams(gua_number);
    CREATE INDEX IF NOT EXISTS idx_hexagrams_fortune ON hexagrams(fortune_score);
    CREATE INDEX IF NOT EXISTS idx_hexagrams_keywords ON hexagrams USING GIN(keywords);

    -- 250개 카테고리 테이블
    CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        main_category_id INTEGER NOT NULL,
        main_category_name VARCHAR(50) NOT NULL,
        sub_category_name VARCHAR(100) NOT NULL,
        description TEXT,
        keywords JSONB DEFAULT '[]',
        target_age VARCHAR(50) DEFAULT '전연령',
        priority INTEGER DEFAULT 2,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 카테고리별 해석 테이블 (384 x 250 x 4 = 최대 384,000개)
    CREATE TABLE IF NOT EXISTS interpretations (
        id SERIAL PRIMARY KEY,
        hexagram_id VARCHAR(10) REFERENCES hexagrams(id),
        category_id INTEGER REFERENCES categories(id),
        period VARCHAR(20) NOT NULL DEFAULT 'daily',  -- daily, weekly, monthly, yearly

        base_text TEXT NOT NULL,
        tone_hint VARCHAR(50),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        -- 복합 유니크
        CONSTRAINT unique_hex_cat_period UNIQUE (hexagram_id, category_id, period)
    );

    -- 사용자 히스토리 테이블
    CREATE TABLE IF NOT EXISTS user_history (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(100),
        user_id INTEGER,

        divination_type VARCHAR(20) NOT NULL DEFAULT 'iching',
        period VARCHAR(20) NOT NULL DEFAULT 'daily',
        category_id INTEGER REFERENCES categories(id),

        question TEXT,
        hexagram_id VARCHAR(10) REFERENCES hexagrams(id),
        fortune_score INTEGER,
        interpretation TEXT,

        ip_address VARCHAR(50),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 인덱스
    CREATE INDEX IF NOT EXISTS idx_history_session ON user_history(session_id);
    CREATE INDEX IF NOT EXISTS idx_history_created ON user_history(created_at);
    """


def insert_hexagram_sql(data: dict) -> str:
    """INSERT SQL 생성"""
    keywords_json = json.dumps(data.get('keywords', []), ensure_ascii=False)

    return f"""
    INSERT INTO hexagrams (
        id, gua_number, yao_position,
        gua_name_kr, gua_name_hanja, gua_name_en, gua_full_name,
        upper_trigram, lower_trigram,
        yao_name, yao_name_yang, yao_name_yin,
        text_hanja, text_pinyin, text_kr,
        fortune_score, fortune_direction, fortune_category,
        core_message, caution, timing,
        keywords, target_audience, priority
    ) VALUES (
        '{data["id"]}', {data["gua_number"]}, {data["yao_position"]},
        '{data["gua_name_kr"]}', '{data["gua_name_hanja"]}', '{data.get("gua_name_en", "")}', '{data.get("gua_full_name", "")}',
        '{data.get("upper_trigram", "")}', '{data.get("lower_trigram", "")}',
        '{data.get("yao_name", "")}', '{data.get("yao_name_yang", "")}', '{data.get("yao_name_yin", "")}',
        '{data.get("text_hanja", "").replace("'", "''")}', '{data.get("text_pinyin", "").replace("'", "''")}', '{data.get("text_kr", "").replace("'", "''")}',
        {data.get("fortune_score", 60)}, '{data.get("fortune_direction", "정체")}', '{data.get("fortune_category", "보통")}',
        '{data.get("core_message", "").replace("'", "''")}', '{data.get("caution", "").replace("'", "''")}', '{data.get("timing", "중반")}',
        '{keywords_json}'::jsonb, '{data.get("target_audience", "전연령")}', {data.get("priority", 2)}
    )
    ON CONFLICT (id) DO UPDATE SET
        text_hanja = EXCLUDED.text_hanja,
        text_kr = EXCLUDED.text_kr,
        fortune_score = EXCLUDED.fortune_score,
        fortune_direction = EXCLUDED.fortune_direction,
        fortune_category = EXCLUDED.fortune_category,
        core_message = EXCLUDED.core_message,
        caution = EXCLUDED.caution,
        keywords = EXCLUDED.keywords,
        updated_at = CURRENT_TIMESTAMP;
    """


def seed_categories_sql():
    """250개 카테고리 시딩 SQL"""
    # 대분류 정의
    main_categories = [
        (1, "재물", ["주식", "코인", "부동산", "대출", "저축", "투자", "N잡", "로또", "월급", "사업자금"]),
        (2, "직업", ["이직", "취업", "승진", "퇴사", "창업", "연봉협상", "면접", "시험", "자격증", "부업"]),
        (3, "학업", ["수능", "내신", "자격시험", "어학", "유학", "대학원", "전공선택", "학점", "논문", "공부방법"]),
        (4, "연애", ["썸", "고백", "재회", "결혼", "이별", "소개팅", "짝사랑", "연인관계", "권태기", "바람"]),
        (5, "대인", ["친구", "동료", "상사", "부하", "가족", "이웃", "거래처", "모임", "갈등", "화해"]),
        (6, "건강", ["질병", "다이어트", "운동", "수면", "스트레스", "정신건강", "수술", "검진", "습관", "회복"]),
        (7, "취미", ["여행", "게임", "운동", "독서", "음악", "미술", "요리", "영화", "사진", "글쓰기"]),
        (8, "운명", ["전생", "사주", "궁합", "운명의상대", "인연", "행운", "액땜", "기운", "방향", "시기"]),
        (9, "기타", ["이사", "차량", "법률", "계약", "분실물", "반려동물", "꿈해몽", "결정", "선택", "기타"]),
    ]

    sql_statements = []
    cat_id = 1

    for main_id, main_name, sub_cats in main_categories:
        for sub_name in sub_cats:
            sql = f"""
            INSERT INTO categories (id, main_category_id, main_category_name, sub_category_name, keywords)
            VALUES ({cat_id}, {main_id}, '{main_name}', '{sub_name}', '[]'::jsonb)
            ON CONFLICT DO NOTHING;
            """
            sql_statements.append(sql)
            cat_id += 1

    return "\n".join(sql_statements)


def main():
    """메인 실행"""
    print("[*] Database seeding started...")

    # JSON 데이터 로드
    print(f"[*] Loading data from {DATA_PATH}...")
    data = load_json_data()
    print(f"    Loaded {len(data)} records")

    # SQL 파일 생성
    output_dir = Path(__file__).parent.parent / "data"
    sql_file = output_dir / "seed_database.sql"

    with open(sql_file, 'w', encoding='utf-8') as f:
        # 1. 테이블 생성
        f.write("-- 1. Create Tables\n")
        f.write(create_tables_sql())
        f.write("\n\n")

        # 2. 384효 데이터 삽입
        f.write("-- 2. Seed 384 Yao Data\n")
        for item in data:
            f.write(insert_hexagram_sql(item))
            f.write("\n")

        # 3. 카테고리 시딩
        f.write("\n-- 3. Seed Categories\n")
        f.write(seed_categories_sql())

    print(f"[OK] SQL file generated: {sql_file}")
    print(f"    Total records: {len(data)} hexagrams + 90 categories")

    # 실행 안내
    print("\n[Usage]")
    print("  1. Create database:")
    print("     createdb -U postgres iching_db")
    print("\n  2. Run SQL:")
    print(f"     psql -U postgres -d iching_db -f {sql_file}")
    print("\n  Or use Python:")
    print("     python seed_database.py --execute")


def execute_sql():
    """SQL 직접 실행"""
    from sqlalchemy import create_engine, text

    # 환경변수에서 DB URL 가져오기 또는 기본값 사용
    import os
    db_url = os.getenv("DATABASE_URL", DATABASE_URL)

    print(f"[*] Connecting to database...")
    engine = create_engine(db_url)

    # JSON 데이터 로드
    data = load_json_data()

    with engine.connect() as conn:
        # 테이블 생성
        print("[*] Creating tables...")
        conn.execute(text(create_tables_sql()))

        # 데이터 삽입
        print(f"[*] Inserting {len(data)} hexagrams...")
        for item in data:
            try:
                conn.execute(text(insert_hexagram_sql(item)))
            except Exception as e:
                print(f"    Error on {item['id']}: {e}")

        # 카테고리 시딩
        print("[*] Seeding categories...")
        conn.execute(text(seed_categories_sql()))

        conn.commit()

    print("[OK] Database seeding complete!")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--execute":
        execute_sql()
    else:
        main()

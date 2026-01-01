"""
384효 CSV 데이터를 PostgreSQL DB로 임포트
독립 실행 버전 (외부 모듈 의존성 최소화)
"""

import csv
import json
import sys
import os
from pathlib import Path
from datetime import datetime

# SQLAlchemy 임포트
from sqlalchemy import create_engine, text, Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.sql import func

# 경로 설정
backend_dir = Path(__file__).parent.parent

# 환경변수에서 DB URL 가져오기 (없으면 기본값)
DATABASE_URL_SYNC = os.getenv(
    "DATABASE_URL_SYNC",
    "postgresql://postgres:password@localhost:5432/iching_db"
)

# Base 정의
Base = declarative_base()


class Hexagram(Base):
    """384효 마스터 테이블 (스크립트용 정의)"""
    __tablename__ = "hexagrams"

    id = Column(String(10), primary_key=True, index=True)
    gua_number = Column(Integer, nullable=False, index=True)
    gua_name_ko = Column(String(20), nullable=False)
    gua_name_hanja = Column(String(20), nullable=False)
    yao_number = Column(Integer, nullable=False)
    yao_position = Column(String(20), nullable=False)
    original_text = Column(Text, nullable=False)
    original_meaning = Column(Text, nullable=False)
    direction = Column(String(10), nullable=False, default="정체")
    score = Column(Integer, nullable=False, default=50)
    core_message = Column(String(200), nullable=False)
    caution = Column(String(200), nullable=False)
    timing = Column(String(20), nullable=False)
    keywords = Column(JSON, default=[])
    image_symbol = Column(String(200))
    age_target = Column(String(20), default="전연령")
    priority = Column(String(10), default="중")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


def create_sync_engine():
    """동기 엔진 생성"""
    return create_engine(
        DATABASE_URL_SYNC,
        echo=False,
        pool_pre_ping=True
    )


def parse_keywords(keywords_str: str) -> list:
    """키워드 문자열을 리스트로 변환"""
    try:
        # JSON 형식인 경우
        if keywords_str.startswith('['):
            return json.loads(keywords_str)
        # 콤마 구분인 경우
        return [k.strip() for k in keywords_str.split(',') if k.strip()]
    except:
        return []


def import_384yao():
    """384효 데이터 임포트"""

    # 파일 경로
    csv_path = backend_dir / "data" / "384yao_complete.csv"

    if not csv_path.exists():
        print(f"[ERROR] CSV file not found: {csv_path}")
        return False

    # DB 연결
    engine = create_sync_engine()
    Session = sessionmaker(bind=engine)

    # 테이블 생성 (없으면)
    Base.metadata.create_all(engine)
    print("[OK] Database tables ready")

    session = Session()

    try:
        # 기존 데이터 카운트
        existing_count = session.query(Hexagram).count()
        print(f"[*] Existing hexagrams in DB: {existing_count}")

        # CSV 로드
        rows_imported = 0
        rows_updated = 0

        with open(csv_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)

            for row in reader:
                # 기존 레코드 확인
                existing = session.query(Hexagram).filter(
                    Hexagram.id == row['id']
                ).first()

                # 키워드 파싱
                keywords = parse_keywords(row['keywords'])

                if existing:
                    # 업데이트
                    existing.gua_number = int(row['gua_number'])
                    existing.gua_name_ko = row['gua_name_ko']
                    existing.gua_name_hanja = row['gua_name_hanja']
                    existing.yao_number = int(row['yao_number'])
                    existing.yao_position = row['yao_position']
                    existing.original_text = row['original_text']
                    existing.original_meaning = row['original_meaning']
                    existing.direction = row['direction']
                    existing.score = int(row['score'])
                    existing.core_message = row['core_message']
                    existing.caution = row['caution']
                    existing.timing = row['timing']
                    existing.keywords = keywords
                    existing.image_symbol = row['image_symbol']
                    existing.age_target = row['age_target']
                    existing.priority = row['priority']
                    rows_updated += 1
                else:
                    # 새로 삽입
                    hexagram = Hexagram(
                        id=row['id'],
                        gua_number=int(row['gua_number']),
                        gua_name_ko=row['gua_name_ko'],
                        gua_name_hanja=row['gua_name_hanja'],
                        yao_number=int(row['yao_number']),
                        yao_position=row['yao_position'],
                        original_text=row['original_text'],
                        original_meaning=row['original_meaning'],
                        direction=row['direction'],
                        score=int(row['score']),
                        core_message=row['core_message'],
                        caution=row['caution'],
                        timing=row['timing'],
                        keywords=keywords,
                        image_symbol=row['image_symbol'],
                        age_target=row['age_target'],
                        priority=row['priority'],
                    )
                    session.add(hexagram)
                    rows_imported += 1

        # 커밋
        session.commit()

        # 최종 카운트
        final_count = session.query(Hexagram).count()

        print(f"\n[Import Summary]")
        print(f"   New records: {rows_imported}")
        print(f"   Updated records: {rows_updated}")
        print(f"   Total in DB: {final_count}")

        # 샘플 확인
        print(f"\n[Sample Data]")
        samples = session.query(Hexagram).limit(3).all()
        for h in samples:
            print(f"   {h.id}: {h.gua_name_ko} {h.yao_position}")
            print(f"      원문: {h.original_text}")
            print(f"      점수: {h.score}, 방향: {h.direction}")

        return True

    except Exception as e:
        session.rollback()
        print(f"[ERROR] Import failed: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        session.close()


def verify_import():
    """임포트 검증"""
    engine = create_sync_engine()
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # 괘별 카운트 확인
        print("\n[Verification]")

        result = session.execute(text("""
            SELECT gua_number, gua_name_ko, COUNT(*) as yao_count
            FROM hexagrams
            GROUP BY gua_number, gua_name_ko
            ORDER BY gua_number
            LIMIT 10
        """))

        print("   Gua   Name      Yao Count")
        print("   " + "-" * 30)
        for row in result:
            status = "✓" if row.yao_count == 6 else "✗"
            print(f"   {row.gua_number:>3}  {row.gua_name_ko:<10} {row.yao_count} {status}")

        # 점수 분포
        score_dist = session.execute(text("""
            SELECT
                CASE
                    WHEN score >= 90 THEN '대길(90+)'
                    WHEN score >= 70 THEN '길(70-89)'
                    WHEN score >= 50 THEN '무탈(50-69)'
                    WHEN score >= 30 THEN '회(30-49)'
                    ELSE '흉(0-29)'
                END as fortune,
                COUNT(*) as count
            FROM hexagrams
            GROUP BY 1
            ORDER BY MIN(score) DESC
        """))

        print("\n   Fortune Distribution:")
        for row in score_dist:
            print(f"      {row.fortune}: {row.count}")

    finally:
        session.close()


if __name__ == "__main__":
    print("[*] 384 Yao Import to PostgreSQL")
    print("=" * 50)

    success = import_384yao()

    if success:
        verify_import()
        print("\n[Complete!]")
    else:
        print("\n[Failed!]")
        sys.exit(1)

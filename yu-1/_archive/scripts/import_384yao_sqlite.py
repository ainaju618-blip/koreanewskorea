"""
384효 CSV 데이터를 SQLite DB로 임포트
PostgreSQL 없이 테스트 가능한 버전
"""

import csv
import json
import sys
from pathlib import Path

from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.sql import func

# 경로 설정
backend_dir = Path(__file__).parent.parent
db_path = backend_dir / "data" / "iching.db"

# SQLite URL
DATABASE_URL = f"sqlite:///{db_path}"

# Base 정의
Base = declarative_base()


class Hexagram(Base):
    """384효 마스터 테이블"""
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
    core_message = Column(Text, nullable=False)
    caution = Column(String(200), nullable=False)
    timing = Column(String(20), nullable=False)
    keywords = Column(Text, default="[]")  # SQLite용 JSON 텍스트
    image_symbol = Column(String(200))
    age_target = Column(String(20), default="전연령")
    priority = Column(String(10), default="중")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


def parse_keywords(keywords_str: str) -> str:
    """키워드 문자열을 JSON 문자열로 변환"""
    try:
        if keywords_str.startswith('['):
            return keywords_str
        return json.dumps([k.strip() for k in keywords_str.split(',') if k.strip()], ensure_ascii=False)
    except:
        return "[]"


def import_384yao():
    """384효 데이터 임포트"""

    csv_path = backend_dir / "data" / "384yao_complete.csv"

    if not csv_path.exists():
        print(f"[ERROR] CSV file not found: {csv_path}")
        return False

    # DB 연결
    engine = create_engine(DATABASE_URL, echo=False)
    Session = sessionmaker(bind=engine)

    # 테이블 생성
    Base.metadata.create_all(engine)
    print(f"[OK] Database created: {db_path}")

    session = Session()

    try:
        # 기존 데이터 삭제
        session.query(Hexagram).delete()
        session.commit()

        # CSV 로드
        rows_imported = 0

        with open(csv_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)

            for row in reader:
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
                    keywords=parse_keywords(row['keywords']),
                    image_symbol=row['image_symbol'],
                    age_target=row['age_target'],
                    priority=row['priority'],
                )
                session.add(hexagram)
                rows_imported += 1

        session.commit()

        print(f"\n[Import Summary]")
        print(f"   Imported: {rows_imported} records")

        # 검증
        total = session.query(Hexagram).count()
        print(f"   Total in DB: {total}")

        # 샘플 출력
        print(f"\n[Sample Data]")
        samples = session.query(Hexagram).limit(3).all()
        for h in samples:
            print(f"   {h.id}: {h.gua_name_ko} {h.yao_position}")
            print(f"      원문: {h.original_text}")
            print(f"      점수: {h.score}, 방향: {h.direction}")

        # 괘별 카운트
        print(f"\n[Verification]")
        from sqlalchemy import text
        result = session.execute(text("""
            SELECT gua_number, gua_name_ko, COUNT(*) as cnt
            FROM hexagrams
            GROUP BY gua_number, gua_name_ko
            HAVING cnt != 6
        """))
        incomplete = list(result)
        if incomplete:
            print(f"   [WARN] Incomplete gua: {len(incomplete)}")
            for row in incomplete[:5]:
                print(f"      {row.gua_number} {row.gua_name_ko}: {row.cnt} yao")
        else:
            print(f"   [OK] All 64 gua have 6 yao each")

        return True

    except Exception as e:
        session.rollback()
        print(f"[ERROR] Import failed: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        session.close()


if __name__ == "__main__":
    print("[*] 384 Yao Import to SQLite")
    print("=" * 50)

    success = import_384yao()

    if success:
        print("\n[Complete!]")
    else:
        print("\n[Failed!]")
        sys.exit(1)

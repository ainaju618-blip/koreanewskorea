"""
384효 + 카테고리 + 해석 모델 (컨설팅 확정 스키마)
17개 필드 확정 버전
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class Hexagram(Base):
    """
    384효 마스터 테이블
    컨설팅 확정: 17개 필드
    """
    __tablename__ = "hexagrams"

    # PK: "괘번호-효번호" 형식 (예: "14-6")
    id = Column(String(10), primary_key=True, index=True)

    # 괘 정보
    gua_number = Column(Integer, nullable=False, index=True)  # 1~64
    gua_name_ko = Column(String(20), nullable=False)  # 건괘, 곤괘...
    gua_name_hanja = Column(String(20), nullable=False)  # 乾, 坤...

    # 효 정보
    yao_number = Column(Integer, nullable=False)  # 1~6
    yao_position = Column(String(20), nullable=False)  # 초효(初九), 상효(上九)...

    # 원문
    original_text = Column(Text, nullable=False)  # 효사 한자 원문
    original_meaning = Column(Text, nullable=False)  # 직역 (한글)

    # 길흉 판단
    direction = Column(String(10), nullable=False, default="정체")  # 상승/정체/하강
    score = Column(Integer, nullable=False, default=50)  # 0~100

    # 해석
    core_message = Column(String(200), nullable=False)  # 핵심 한줄 메시지
    caution = Column(String(200), nullable=False)  # 주의사항
    timing = Column(String(20), nullable=False)  # 초반/중반/후반

    # 매칭용
    keywords = Column(JSON, default=[])  # ["잠재", "인내", "대기"]

    # 이미지/타겟
    image_symbol = Column(String(200))  # 이미지 생성용 프롬프트
    age_target = Column(String(20), default="전연령")  # 전연령/MZ/중장년
    priority = Column(String(10), default="중")  # 고/중/저

    # 메타
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 관계
    interpretations = relationship("Interpretation", back_populates="hexagram")


class Category(Base):
    """
    카테고리 테이블 (250개)
    컨설팅 확정: 8개 필드
    """
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)  # 1~250

    # 대분류 (9개)
    major_id = Column(Integer, nullable=False, index=True)  # 1~9
    major_name = Column(String(20), nullable=False)  # 재물, 직업...
    major_icon = Column(String(10), nullable=False)  # 💰, 💼...

    # 소분류
    sub_name = Column(String(50), nullable=False)  # 주식, 코인, 부동산...
    description = Column(String(200))  # 카테고리 설명

    # 매칭용
    keywords = Column(JSON, default=[])  # ["비트코인", "BTC", "코인"]

    # 타겟
    age_target = Column(String(20), default="전연령")  # 전연령/MZ/중장년

    # 메타
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 관계
    interpretations = relationship("Interpretation", back_populates="category")


class Interpretation(Base):
    """
    카테고리별 해석 테이블
    384효 × 250카테고리 × 4기간 = 최대 384,000개
    (실제로는 필요한 것만 생성)
    """
    __tablename__ = "interpretations"

    id = Column(Integer, primary_key=True, index=True)

    # FK
    hexagram_id = Column(String(10), ForeignKey("hexagrams.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False, index=True)

    # 기간
    period = Column(String(20), default="daily")  # daily/weekly/monthly/yearly

    # 해석 내용
    base_text = Column(Text, nullable=False)  # LLM 없이 쓸 수 있는 기본 해석
    tone_hint = Column(String(20), default="중립")  # 단호/위로/현실적/희망적/중립

    # 메타
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 관계
    hexagram = relationship("Hexagram", back_populates="interpretations")
    category = relationship("Category", back_populates="interpretations")

    # 복합 유니크 (같은 효+카테고리+기간 조합은 1개만)
    __table_args__ = (
        UniqueConstraint('hexagram_id', 'category_id', 'period', name='uq_hex_cat_period'),
    )


class UserHistory(Base):
    """
    사용자 질문/선택 로그
    """
    __tablename__ = "user_history"

    id = Column(Integer, primary_key=True, index=True)

    # 세션
    session_id = Column(String(100), index=True)
    user_id = Column(Integer, nullable=True)  # 로그인 사용자

    # 입력
    divination_type = Column(String(20), default="iching")
    period = Column(String(20))
    category_id = Column(Integer)
    question = Column(Text)

    # 결과
    hexagram_id = Column(String(10))  # "14-6"
    fortune_score = Column(Integer)
    interpretation = Column(Text)  # 최종 출력된 해석

    # 메타
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(String(50))
    user_agent = Column(String(200))

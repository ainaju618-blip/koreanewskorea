"""
효(爻) 데이터 Repository

384효 정보 조회를 담당하는 Repository 계층
"""
from typing import Optional, List, Tuple
from dataclasses import dataclass

# 384효 완전 데이터 임포트
try:
    from app.data.yao_complete import YAO_DATA
except ImportError:
    YAO_DATA = {}


@dataclass
class YaoData:
    """효 데이터 DTO"""
    hexagram_number: int
    position: int  # 1-6
    name: str  # 초구, 육이 등
    text_hanja: str
    text_kr: str
    interpretation: str
    fortune_score: int
    fortune_category: str  # 대길, 길, 평, 흉, 대흉
    keywords: List[str]


class YaoRepository:
    """
    384효 데이터 Repository

    책임:
    - 효 데이터 조회
    - 효 이름 생성 (음/양 기반)
    """

    def __init__(self):
        self._data = YAO_DATA

    def get_yao(self, hexagram_number: int, position: int) -> Optional[YaoData]:
        """특정 괘의 특정 효 데이터 조회"""
        if position < 1 or position > 6:
            return None

        key = (hexagram_number, position)
        raw = self._data.get(key)

        if not raw:
            return self._get_fallback(hexagram_number, position)

        return YaoData(
            hexagram_number=hexagram_number,
            position=position,
            name=raw.get("name", self._generate_yao_name(position)),
            text_hanja=raw.get("text_hanja", ""),
            text_kr=raw.get("text_kr", ""),
            interpretation=raw.get("interpretation", ""),
            fortune_score=raw.get("fortune_score", 50),
            fortune_category=raw.get("fortune_category", "평"),
            keywords=raw.get("keywords", []),
        )

    def _get_fallback(self, hexagram_number: int, position: int) -> YaoData:
        """데이터 없을 때 기본값"""
        return YaoData(
            hexagram_number=hexagram_number,
            position=position,
            name=self._generate_yao_name(position),
            text_hanja="爻辭",
            text_kr="효사 정보 준비 중",
            interpretation="해당 효의 의미를 살펴 신중히 행동하십시오.",
            fortune_score=50,
            fortune_category="평",
            keywords=["신중", "기다림"],
        )

    def _generate_yao_name(self, position: int) -> str:
        """위치 기반 효 이름 생성 (임시)"""
        position_names = ["초", "이", "삼", "사", "오", "상"]
        return f"{position_names[position-1]}효"

    def get_hexagram_yaos(self, hexagram_number: int) -> List[YaoData]:
        """특정 괘의 모든 효 조회"""
        return [
            self.get_yao(hexagram_number, pos)
            for pos in range(1, 7)
        ]

    def exists(self, hexagram_number: int, position: int) -> bool:
        """효 데이터 존재 여부"""
        return (hexagram_number, position) in self._data


# 싱글톤 인스턴스
yao_repository = YaoRepository()

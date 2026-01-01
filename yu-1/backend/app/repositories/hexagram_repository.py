"""
괘(卦) 데이터 Repository

64괘 정보 조회를 담당하는 Repository 계층
"""
from typing import Optional, Dict, Any
from dataclasses import dataclass

# 64괘 완전 데이터 임포트
try:
    from app.data.hexagram_complete import HEXAGRAM_DATA
except ImportError:
    HEXAGRAM_DATA = {}


@dataclass
class HexagramData:
    """괘 데이터 DTO"""
    number: int
    name_ko: str
    name_hanja: str
    name_full: str
    gua_ci: str
    gua_ci_hanja: str = ""
    nature: str = ""
    image: str = ""
    judgment: str = ""


class HexagramRepository:
    """
    64괘 데이터 Repository

    책임:
    - 괘 데이터 조회
    - 데이터 형식 변환
    """

    def __init__(self):
        self._data = HEXAGRAM_DATA
        self._fallback_cache: Dict[int, Dict] = {}

    def get_hexagram(self, number: int) -> Optional[HexagramData]:
        """괘 번호로 데이터 조회"""
        if number < 1 or number > 64:
            return None

        raw = self._data.get(number)
        if not raw:
            return self._get_fallback(number)

        return HexagramData(
            number=number,
            name_ko=raw.get("name_ko", f"괘{number}"),
            name_hanja=raw.get("name_hanja", "卦"),
            name_full=raw.get("name_full", f"괘{number}"),
            gua_ci=raw.get("gua_ci", ""),
            gua_ci_hanja=raw.get("gua_ci_hanja", ""),
            nature=raw.get("nature", ""),
            image=raw.get("image", ""),
            judgment=raw.get("judgment", ""),
        )

    def _get_fallback(self, number: int) -> HexagramData:
        """데이터 없을 때 기본값 반환"""
        return HexagramData(
            number=number,
            name_ko=f"괘{number}",
            name_hanja="卦",
            name_full=f"괘{number}",
            gua_ci="괘사 정보 준비 중",
        )

    def get_gua_ci(self, number: int) -> str:
        """괘사만 조회"""
        hex_data = self.get_hexagram(number)
        return hex_data.gua_ci if hex_data else ""

    def exists(self, number: int) -> bool:
        """괘 데이터 존재 여부"""
        return number in self._data


# 싱글톤 인스턴스
hexagram_repository = HexagramRepository()

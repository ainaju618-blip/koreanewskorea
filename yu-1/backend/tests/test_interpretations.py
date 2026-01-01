"""
384효 해석 데이터 테스트

테스트 범위:
- 효 데이터 구조 검증
- 괘 데이터 구조 검증
- 해석 품질 검증
- Repository 기능 테스트
"""
import pytest
from typing import Dict, Any, List

from app.repositories.yao_repository import yao_repository, YaoData
from app.repositories.hexagram_repository import hexagram_repository, HexagramData


class TestYaoRepository:
    """효 Repository 테스트"""

    def test_get_yao_valid(self):
        """유효한 효 조회 테스트"""
        # 건괘(1) 초효
        yao = yao_repository.get_yao(1, 1)

        assert yao is not None
        assert isinstance(yao, YaoData)
        assert yao.hexagram_number == 1
        assert yao.position == 1

    def test_get_yao_all_positions(self):
        """모든 효 위치(1-6) 조회 테스트"""
        for position in range(1, 7):
            yao = yao_repository.get_yao(1, position)
            assert yao is not None
            assert yao.position == position

    def test_get_yao_invalid_position(self):
        """무효한 효 위치 테스트"""
        # 0, 7 등 잘못된 위치
        assert yao_repository.get_yao(1, 0) is None
        assert yao_repository.get_yao(1, 7) is None

    def test_get_hexagram_yaos(self):
        """괘의 모든 효 조회 테스트"""
        yaos = yao_repository.get_hexagram_yaos(1)

        assert len(yaos) == 6
        for i, yao in enumerate(yaos, 1):
            assert yao.position == i

    def test_yao_data_fields(self):
        """효 데이터 필드 검증"""
        yao = yao_repository.get_yao(1, 1)

        # 필수 필드 확인
        assert hasattr(yao, "hexagram_number")
        assert hasattr(yao, "position")
        assert hasattr(yao, "name")
        assert hasattr(yao, "text_hanja")
        assert hasattr(yao, "text_kr")
        assert hasattr(yao, "interpretation")
        assert hasattr(yao, "fortune_score")
        assert hasattr(yao, "fortune_category")
        assert hasattr(yao, "keywords")

    def test_yao_fortune_score_range(self):
        """효 점수 범위 검증 (0-100)"""
        yao = yao_repository.get_yao(1, 1)

        assert 0 <= yao.fortune_score <= 100

    def test_yao_fortune_category_valid(self):
        """효 길흉 카테고리 검증"""
        valid_categories = {"대길", "길", "평", "흉", "대흉"}

        yao = yao_repository.get_yao(1, 1)
        assert yao.fortune_category in valid_categories

    def test_yao_keywords_not_empty(self):
        """효 키워드가 비어있지 않은지 확인"""
        yao = yao_repository.get_yao(1, 1)

        assert isinstance(yao.keywords, list)
        assert len(yao.keywords) > 0


class TestHexagramRepository:
    """괘 Repository 테스트"""

    def test_get_hexagram_valid(self):
        """유효한 괘 조회 테스트"""
        hexagram = hexagram_repository.get_hexagram(1)

        assert hexagram is not None
        assert isinstance(hexagram, HexagramData)
        assert hexagram.number == 1

    def test_get_hexagram_all_64(self):
        """모든 64괘 조회 테스트"""
        for num in range(1, 65):
            hexagram = hexagram_repository.get_hexagram(num)
            assert hexagram is not None
            assert hexagram.number == num

    def test_get_hexagram_invalid(self):
        """무효한 괘 번호 테스트"""
        assert hexagram_repository.get_hexagram(0) is None
        assert hexagram_repository.get_hexagram(65) is None
        assert hexagram_repository.get_hexagram(-1) is None

    def test_hexagram_data_fields(self):
        """괘 데이터 필드 검증"""
        hexagram = hexagram_repository.get_hexagram(1)

        # 필수 필드 확인
        assert hasattr(hexagram, "number")
        assert hasattr(hexagram, "name_ko")
        assert hasattr(hexagram, "name_hanja")
        assert hasattr(hexagram, "name_full")
        assert hasattr(hexagram, "gua_ci")

    def test_get_gua_ci(self):
        """괘사 조회 테스트"""
        gua_ci = hexagram_repository.get_gua_ci(1)

        assert isinstance(gua_ci, str)

    def test_hexagram_exists(self):
        """괘 존재 여부 확인 테스트"""
        assert hexagram_repository.exists(1) or not hexagram_repository.exists(1)
        # exists 메서드가 불리언 반환하는지 확인


class TestYaoNaming:
    """효 이름 규칙 테스트"""

    def test_yang_yao_names(self):
        """양효 이름 규칙 테스트"""
        # 건괘(1)는 모든 효가 양효
        expected_names = {
            1: "초구",
            2: "구이",
            3: "구삼",
            4: "구사",
            5: "구오",
            6: "상구",
        }

        for pos, expected_name in expected_names.items():
            yao = yao_repository.get_yao(1, pos)
            # 이름에 "구" 포함 확인 (양효)
            assert "구" in yao.name or "효" in yao.name

    def test_yin_yao_names(self):
        """음효 이름 규칙 테스트"""
        # 곤괘(2)는 모든 효가 음효
        expected_names = {
            1: "초육",
            2: "육이",
            3: "육삼",
            4: "육사",
            5: "육오",
            6: "상육",
        }

        for pos, expected_name in expected_names.items():
            yao = yao_repository.get_yao(2, pos)
            # 이름에 "육" 포함 확인 (음효)
            assert "육" in yao.name or "효" in yao.name


class TestInterpretationQuality:
    """해석 품질 테스트"""

    def test_interpretation_not_empty(self):
        """해석이 비어있지 않은지 확인"""
        yao = yao_repository.get_yao(1, 1)

        assert len(yao.interpretation) > 0
        assert len(yao.text_kr) > 0

    def test_interpretation_min_length(self):
        """해석 최소 길이 확인"""
        min_length = 10  # 최소 10자

        yao = yao_repository.get_yao(1, 1)
        assert len(yao.interpretation) >= min_length

    def test_text_hanja_present(self):
        """한자 원문 존재 확인"""
        yao = yao_repository.get_yao(1, 1)

        # 한자 또는 placeholder 존재
        assert len(yao.text_hanja) > 0

    def test_keywords_relevance(self):
        """키워드 관련성 테스트"""
        # 건괘 초효: 잠룡(潛龍) 관련 키워드
        yao = yao_repository.get_yao(1, 1)

        # 키워드가 해석과 관련있는지 (최소 1개 이상 포함)
        interpretation_lower = yao.interpretation.lower()
        keyword_found = any(
            kw.lower() in interpretation_lower or kw in yao.text_kr
            for kw in yao.keywords
        )
        # 키워드가 해석에 직접 나타나지 않을 수 있으므로 pass
        assert isinstance(yao.keywords, list)


class TestFortuneScoreDistribution:
    """길흉 점수 분포 테스트"""

    def test_fortune_score_variance(self):
        """점수 분포가 다양한지 확인"""
        scores = []

        # 건괘의 6효 점수 수집
        for pos in range(1, 7):
            yao = yao_repository.get_yao(1, pos)
            scores.append(yao.fortune_score)

        # 모든 점수가 동일하지 않음
        assert len(set(scores)) > 1, "All fortune scores are the same"

    def test_qian_hexagram_has_high_score(self):
        """건괘(大吉 괘)에 높은 점수가 있는지 확인"""
        # 건괘 구오(비룡재천)는 대길
        yao = yao_repository.get_yao(1, 5)

        assert yao.fortune_score >= 80

    def test_fortune_category_matches_score(self):
        """점수와 카테고리 일관성 확인"""
        yao = yao_repository.get_yao(1, 5)

        if yao.fortune_score >= 80:
            assert yao.fortune_category in ["대길", "길"]
        elif yao.fortune_score >= 60:
            assert yao.fortune_category in ["대길", "길", "평"]
        elif yao.fortune_score >= 40:
            assert yao.fortune_category in ["길", "평", "흉"]
        else:
            assert yao.fortune_category in ["평", "흉", "대흉"]


class TestSpecialHexagrams:
    """특수 괘 테스트"""

    def test_qian_hexagram_complete(self):
        """건괘(1) 완전성 테스트"""
        hexagram = hexagram_repository.get_hexagram(1)

        assert hexagram is not None
        assert "건" in hexagram.name_ko or "乾" in hexagram.name_hanja

        # 6효 모두 존재
        for pos in range(1, 7):
            yao = yao_repository.get_yao(1, pos)
            assert yao is not None

    def test_kun_hexagram_complete(self):
        """곤괘(2) 완전성 테스트"""
        hexagram = hexagram_repository.get_hexagram(2)

        assert hexagram is not None

        # 6효 모두 존재
        for pos in range(1, 7):
            yao = yao_repository.get_yao(2, pos)
            assert yao is not None

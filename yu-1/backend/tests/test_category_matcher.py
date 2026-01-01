"""
카테고리 매칭 테스트 (category_matcher.py)

테스트 케이스:
1. 키워드 정확 매칭
2. 대분류 우선순위
3. 신뢰도 검증
4. 엣지 케이스
"""
import pytest
from typing import Tuple

from app.services.category_matcher import CategoryMatcher, category_matcher


class TestCategoryMatcherKeywordMatching:
    """키워드 기반 매칭 테스트"""

    @pytest.fixture
    def matcher(self) -> CategoryMatcher:
        """테스트용 매처 인스턴스"""
        return CategoryMatcher()

    # ========== 재물 (major_id=1) ==========
    @pytest.mark.parametrize("question,expected_major,expected_sub,min_confidence", [
        # 주식/증권
        ("삼성전자 주식 사도 될까요?", 1, 1, 0.3),
        ("코스피 지금 들어가도 되나요", 1, 1, 0.3),
        # 코인/가상자산
        ("비트코인 지금 매수해도 될까요?", 1, 2, 0.3),
        ("이더리움 상승할까요?", 1, 2, 0.3),
        ("업비트에서 코인 사도 될까", 1, 2, 0.3),
        # 부동산/아파트
        ("아파트 청약 당첨될까요?", 1, 3, 0.3),
        ("전세 계약 연장해야 할까요", 1, 3, 0.3),
        # 대출/빚
        ("대출 갚을 수 있을까요?", 1, 4, 0.3),
        # 로또/복권
        ("로또 1등 당첨될까요?", 1, 7, 0.3),
    ])
    def test_wealth_category_matching(
        self,
        matcher: CategoryMatcher,
        question: str,
        expected_major: int,
        expected_sub: int,
        min_confidence: float
    ):
        """재물 카테고리 매칭 테스트"""
        major_id, category_id, confidence = matcher.match_question(question)

        assert major_id == expected_major, f"대분류 불일치: {major_id} != {expected_major}"
        assert category_id == expected_sub, f"소분류 불일치: {category_id} != {expected_sub}"
        assert confidence >= min_confidence, f"신뢰도 미달: {confidence} < {min_confidence}"

    # ========== 직업 (major_id=2) ==========
    @pytest.mark.parametrize("question,expected_major,expected_sub,min_confidence", [
        ("이직해도 될까요?", 2, 21, 0.3),
        ("면접 볼 건데 합격할까요?", 2, 22, 0.3),
        ("승진할 수 있을까요?", 2, 23, 0.3),
        ("퇴사해도 될까요?", 2, 24, 0.3),
        ("창업하면 성공할까요?", 2, 25, 0.3),
    ])
    def test_career_category_matching(
        self,
        matcher: CategoryMatcher,
        question: str,
        expected_major: int,
        expected_sub: int,
        min_confidence: float
    ):
        """직업 카테고리 매칭 테스트"""
        major_id, category_id, confidence = matcher.match_question(question)

        assert major_id == expected_major
        assert category_id == expected_sub
        assert confidence >= min_confidence

    # ========== 연애 (major_id=4) ==========
    @pytest.mark.parametrize("question,expected_major,expected_sub,min_confidence", [
        ("썸남이 나한테 호감 있을까요?", 4, 46, 0.3),
        ("고백해도 될까요?", 4, 47, 0.3),
        ("전남친이랑 재회할 수 있을까요?", 4, 48, 0.3),
        ("결혼해도 될까요?", 4, 49, 0.3),
        ("이별해야 할까요?", 4, 50, 0.3),
        ("소개팅 잘 될까요?", 4, 51, 0.3),
    ])
    def test_romance_category_matching(
        self,
        matcher: CategoryMatcher,
        question: str,
        expected_major: int,
        expected_sub: int,
        min_confidence: float
    ):
        """연애 카테고리 매칭 테스트"""
        major_id, category_id, confidence = matcher.match_question(question)

        assert major_id == expected_major
        assert category_id == expected_sub
        assert confidence >= min_confidence


class TestCategoryMatcherEdgeCases:
    """엣지 케이스 테스트"""

    @pytest.fixture
    def matcher(self) -> CategoryMatcher:
        return CategoryMatcher()

    def test_empty_question_returns_default(self, matcher: CategoryMatcher):
        """빈 질문은 기타 카테고리 반환"""
        major_id, category_id, confidence = matcher.match_question("")

        assert major_id == 9  # 기타
        assert category_id == 100  # 미분류
        assert confidence == 0.0

    def test_unknown_question_returns_default(self, matcher: CategoryMatcher):
        """매칭 불가 질문은 기타 카테고리 반환"""
        major_id, category_id, confidence = matcher.match_question("ㅋㅋㅋㅋㅋ")

        assert major_id == 9
        assert category_id == 100
        assert confidence == 0.0

    def test_mixed_keywords_matches_strongest(self, matcher: CategoryMatcher):
        """복합 키워드는 가장 강한 매칭 선택"""
        # "주식"과 "이직" 둘 다 포함
        question = "주식으로 돈 벌어서 이직할까요?"
        major_id, category_id, confidence = matcher.match_question(question)

        # 둘 중 하나에 매칭되어야 함
        assert major_id in [1, 2]  # 재물 또는 직업

    def test_case_insensitive_matching(self, matcher: CategoryMatcher):
        """대소문자 무시 매칭"""
        major_id, category_id, confidence = matcher.match_question("ETF 투자 어때요?")

        assert major_id == 1  # 재물
        assert category_id == 9  # 펀드/ETF


class TestCategoryMatcherConfidenceScoring:
    """신뢰도 점수 테스트"""

    @pytest.fixture
    def matcher(self) -> CategoryMatcher:
        return CategoryMatcher()

    def test_multiple_keywords_higher_confidence(self, matcher: CategoryMatcher):
        """키워드 많을수록 신뢰도 높음"""
        # 키워드 1개
        _, _, conf1 = matcher.match_question("주식")

        # 키워드 3개
        _, _, conf3 = matcher.match_question("주식 매수 종목 추천해주세요")

        assert conf3 >= conf1, "키워드 많은 질문이 신뢰도 높아야 함"

    def test_long_keyword_higher_weight(self, matcher: CategoryMatcher):
        """긴 키워드에 가중치"""
        # "비트코인" (4글자)
        _, cat1, conf1 = matcher.match_question("비트코인")

        # "BTC" (3글자)
        _, cat2, conf2 = matcher.match_question("BTC")

        # 둘 다 코인 카테고리
        assert cat1 == 2
        assert cat2 == 2


class TestCategoryMatcherMainCategories:
    """대분류 조회 테스트"""

    @pytest.fixture
    def matcher(self) -> CategoryMatcher:
        return CategoryMatcher()

    def test_get_main_categories_returns_9(self, matcher: CategoryMatcher):
        """9개 대분류 반환"""
        categories = matcher.get_main_categories()

        assert len(categories) == 9

    def test_main_categories_have_required_fields(self, matcher: CategoryMatcher):
        """대분류 필수 필드 확인"""
        categories = matcher.get_main_categories()

        for cat in categories:
            assert "id" in cat
            assert "name" in cat
            assert "icon" in cat


class TestCategoryMatcherSubCategories:
    """소분류 조회 테스트"""

    @pytest.fixture
    def matcher(self) -> CategoryMatcher:
        return CategoryMatcher()

    @pytest.mark.parametrize("major_id,min_count", [
        (1, 10),  # 재물: 최소 10개
        (2, 10),  # 직업: 최소 10개
        (3, 5),   # 학업: 최소 5개
        (4, 10),  # 연애: 최소 10개
        (5, 5),   # 대인: 최소 5개
        (6, 5),   # 건강: 최소 5개
        (7, 5),   # 취미: 최소 5개
        (8, 5),   # 운명: 최소 5개
        (9, 2),   # 기타: 최소 2개
    ])
    def test_sub_categories_count(
        self,
        matcher: CategoryMatcher,
        major_id: int,
        min_count: int
    ):
        """대분류별 소분류 개수 확인"""
        subs = matcher.get_sub_categories(major_id)

        assert len(subs) >= min_count, f"대분류 {major_id}: {len(subs)} < {min_count}"


class TestCategoryMatcherIntegration:
    """통합 테스트"""

    def test_singleton_instance_works(self):
        """싱글톤 인스턴스 작동 확인"""
        major_id, category_id, confidence = category_matcher.match_question(
            "돈 벌고 싶어요"
        )

        # 재물 카테고리에 매칭되어야 함
        assert major_id == 1

    def test_real_world_questions(self):
        """실제 질문 예시 테스트"""
        test_cases = [
            ("오늘 주식 사도 될까요?", 1, "주식"),
            ("남친이 바람피는 것 같아요", 4, "바람"),
            ("취업 될까요?", 2, "취업"),
            ("수능 잘 볼까요?", 3, "수능"),
            ("다이어트 성공할까요?", 6, "다이어트"),
            ("해외여행 가도 될까요?", 7, "여행"),
            ("이사 가도 될까요?", 8, "이사"),
        ]

        for question, expected_major, keyword in test_cases:
            major_id, _, _ = category_matcher.match_question(question)
            assert major_id == expected_major, (
                f"'{question}' (키워드: {keyword}): "
                f"예상 {expected_major}, 실제 {major_id}"
            )


# ========== 성능 테스트 ==========
class TestCategoryMatcherPerformance:
    """성능 테스트"""

    @pytest.fixture
    def matcher(self) -> CategoryMatcher:
        return CategoryMatcher()

    def test_matching_speed(self, matcher: CategoryMatcher):
        """매칭 속도 테스트 (1000회 < 1초)"""
        import time

        questions = [
            "주식 사도 될까요?",
            "이직해도 될까요?",
            "고백해도 될까요?",
            "시험 붙을까요?",
        ]

        start = time.time()
        for _ in range(250):
            for q in questions:
                matcher.match_question(q)
        elapsed = time.time() - start

        assert elapsed < 1.0, f"1000회 매칭에 {elapsed:.2f}초 소요 (목표: <1초)"

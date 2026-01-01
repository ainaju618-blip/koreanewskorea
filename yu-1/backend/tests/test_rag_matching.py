"""
RAG 매칭 및 카테고리 매처 테스트

테스트 범위:
- 카테고리 자동 매칭
- 키워드 기반 매칭
- 질문 분류 정확도
- RAG 서비스 기능
"""
import pytest
from typing import Tuple

from app.services.category_matcher import category_matcher, CategoryMatcher
from app.data.category_seed import CATEGORY_DATA, MAJOR_CATEGORIES


class TestCategoryMatcher:
    """카테고리 매처 테스트"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """테스트 전 카테고리 데이터 로드"""
        category_matcher._ensure_loaded()

    def test_match_question_returns_tuple(self):
        """매칭 결과가 튜플(major_id, category_id, confidence)인지 확인"""
        result = category_matcher.match_question("비트코인 살까요?")

        assert isinstance(result, tuple)
        assert len(result) == 3

        major_id, category_id, confidence = result
        assert isinstance(major_id, int)
        assert isinstance(category_id, int)
        assert isinstance(confidence, float)

    def test_match_stock_question(self):
        """주식 질문 매칭 테스트"""
        questions = [
            "삼성전자 주식 사도 될까요?",
            "테슬라 매수 타이밍",
            "코스피 지금 들어가도 될까요?",
        ]

        for question in questions:
            major_id, category_id, confidence = category_matcher.match_question(question)
            # 재물(1) 카테고리 매칭
            assert major_id == 1, f"Expected 재물(1) for '{question}', got {major_id}"

    def test_match_crypto_question(self):
        """코인 질문 매칭 테스트"""
        questions = [
            "비트코인 지금 사도 될까요?",
            "이더리움 전망이 어떨까요?",
            "업비트에서 코인 사려는데",
        ]

        for question in questions:
            major_id, category_id, confidence = category_matcher.match_question(question)
            assert major_id == 1, f"Expected 재물(1) for '{question}', got {major_id}"

    def test_match_job_question(self):
        """직업 질문 매칭 테스트"""
        questions = [
            "이직하면 잘 될까요?",
            "면접 결과가 어떨까요?",
            "연봉 협상 잘 될까요?",
        ]

        for question in questions:
            major_id, category_id, confidence = category_matcher.match_question(question)
            assert major_id == 2, f"Expected 직업(2) for '{question}', got {major_id}"

    def test_match_love_question(self):
        """연애 질문 매칭 테스트"""
        questions = [
            "썸남이 나한테 관심 있을까요?",
            "고백하면 성공할까요?",
            "헤어진 전남친과 재회 가능할까요?",
        ]

        for question in questions:
            major_id, category_id, confidence = category_matcher.match_question(question)
            assert major_id == 4, f"Expected 연애(4) for '{question}', got {major_id}"

    def test_match_exam_question(self):
        """시험/학업 질문 매칭 테스트"""
        questions = [
            "수능 잘 볼 수 있을까요?",
            "자격증 시험 합격할까요?",
            "공무원 시험 붙을 수 있을까요?",
        ]

        for question in questions:
            major_id, category_id, confidence = category_matcher.match_question(question)
            assert major_id == 3, f"Expected 학업(3) for '{question}', got {major_id}"

    def test_match_health_question(self):
        """건강 질문 매칭 테스트"""
        questions = [
            "수술 결과가 좋을까요?",
            "다이어트 성공할 수 있을까요?",
            "임신 가능할까요?",
        ]

        for question in questions:
            major_id, category_id, confidence = category_matcher.match_question(question)
            assert major_id == 6, f"Expected 건강(6) for '{question}', got {major_id}"

    def test_match_unknown_question(self):
        """분류 불가능한 질문 테스트"""
        # 키워드가 없는 모호한 질문
        result = category_matcher.match_question("안녕하세요")
        major_id, category_id, confidence = result

        # 기타(9) 또는 낮은 신뢰도
        assert major_id == 9 or confidence < 0.5

    def test_confidence_higher_for_specific_questions(self):
        """구체적 질문이 더 높은 신뢰도를 갖는지 확인"""
        specific = "비트코인 매수 타이밍 알려주세요"
        vague = "요즘 운이 어떨까요?"

        _, _, specific_conf = category_matcher.match_question(specific)
        _, _, vague_conf = category_matcher.match_question(vague)

        assert specific_conf > vague_conf


class TestKeywordMatching:
    """키워드 매칭 테스트"""

    def test_exact_keyword_match(self):
        """정확한 키워드 매칭"""
        # "비트코인"은 재물 > 코인/가상자산에 있음
        major_id, category_id, _ = category_matcher.match_question("비트코인")

        assert major_id == 1  # 재물

    def test_multiple_keywords_higher_confidence(self):
        """여러 키워드 매칭 시 더 높은 신뢰도"""
        single = "코인"
        multiple = "비트코인 업비트 매수"

        _, _, single_conf = category_matcher.match_question(single)
        _, _, multiple_conf = category_matcher.match_question(multiple)

        assert multiple_conf >= single_conf

    def test_case_insensitive_matching(self):
        """대소문자 구분 없는 매칭"""
        lower = "btc 매수"
        upper = "BTC 매수"

        major1, cat1, _ = category_matcher.match_question(lower)
        major2, cat2, _ = category_matcher.match_question(upper)

        assert major1 == major2

    def test_partial_keyword_match(self):
        """부분 키워드 매칭"""
        # "주식" 키워드는 "주식투자"에서도 매칭되어야 함
        major_id, _, _ = category_matcher.match_question("주식투자 하려는데")
        assert major_id == 1  # 재물


class TestCategoryMatcherAPI:
    """카테고리 매처 API 테스트"""

    def test_get_main_categories(self):
        """대분류 목록 조회"""
        majors = category_matcher.get_main_categories()

        assert len(majors) == 9
        for major in majors:
            assert "id" in major
            assert "name" in major
            assert "icon" in major

    def test_get_sub_categories(self):
        """소분류 목록 조회"""
        for major_id in range(1, 10):
            subs = category_matcher.get_sub_categories(major_id)

            assert len(subs) > 0
            for sub in subs:
                assert sub["major_id"] == major_id
                assert "id" in sub
                assert "name" in sub

    def test_get_category_by_id(self):
        """ID로 카테고리 조회"""
        # ID 1은 주식/증권
        cat = category_matcher.get_category_by_id(1)

        assert cat is not None
        assert cat["id"] == 1

    def test_get_category_by_id_invalid(self):
        """잘못된 ID로 조회"""
        cat = category_matcher.get_category_by_id(9999)
        assert cat is None

    def test_get_category_name(self):
        """카테고리 전체 이름 조회"""
        name = category_matcher.get_category_name(1)

        assert "재물" in name or ">" in name


class TestMatchingAccuracy:
    """매칭 정확도 테스트"""

    def test_finance_questions_accuracy(self):
        """재물 관련 질문 정확도"""
        finance_questions = [
            ("주식 투자 어떨까요?", 1),
            ("부동산 매수 타이밍", 1),
            ("로또 당첨될까요?", 1),
            ("연금 잘 받을 수 있을까요?", 1),
        ]

        correct = 0
        for question, expected_major in finance_questions:
            major_id, _, _ = category_matcher.match_question(question)
            if major_id == expected_major:
                correct += 1

        accuracy = correct / len(finance_questions)
        assert accuracy >= 0.75, f"Finance accuracy: {accuracy:.0%}"

    def test_relationship_questions_accuracy(self):
        """대인관계 질문 정확도"""
        relationship_questions = [
            ("썸 잘 될까요?", 4),  # 연애
            ("결혼 언제 할 수 있을까요?", 4),  # 연애
            ("친구와 화해할 수 있을까요?", 5),  # 대인
            ("직장 동료와 관계", 5),  # 대인 (또는 직업)
        ]

        correct = 0
        for question, expected_major in relationship_questions:
            major_id, _, _ = category_matcher.match_question(question)
            if major_id == expected_major:
                correct += 1

        accuracy = correct / len(relationship_questions)
        assert accuracy >= 0.5, f"Relationship accuracy: {accuracy:.0%}"


class TestEdgeCases:
    """엣지 케이스 테스트"""

    def test_empty_question(self):
        """빈 질문 처리"""
        major_id, category_id, confidence = category_matcher.match_question("")

        # 기타 카테고리 또는 낮은 신뢰도
        assert major_id == 9 or confidence == 0

    def test_special_characters(self):
        """특수문자 포함 질문"""
        question = "비트코인!!! 사야할까요???"
        major_id, _, _ = category_matcher.match_question(question)

        assert major_id == 1  # 재물

    def test_very_long_question(self):
        """매우 긴 질문"""
        question = "주식 투자를 " * 50 + "해도 될까요?"
        major_id, _, _ = category_matcher.match_question(question)

        assert major_id == 1  # 재물

    def test_mixed_categories(self):
        """복합 카테고리 질문"""
        # 재물 + 직업
        question = "이직하면 연봉이 오를까요?"
        major_id, _, _ = category_matcher.match_question(question)

        # 둘 중 하나
        assert major_id in [1, 2]

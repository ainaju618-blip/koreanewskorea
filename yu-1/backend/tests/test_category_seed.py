"""
카테고리 시드 데이터 테스트

테스트 범위:
- 9대분류 정의 검증
- 250개 소분류 데이터 검증
- 카테고리 구조 검증
- 키워드 중복 검사
"""
import pytest
from typing import Set

from app.data.category_seed import (
    MAJOR_CATEGORIES,
    CATEGORY_DATA,
    get_all_categories,
    get_categories_by_major,
    get_major_categories,
)


class TestMajorCategories:
    """9대분류 테스트"""

    def test_major_categories_count(self):
        """대분류가 9개인지 확인"""
        assert len(MAJOR_CATEGORIES) == 9

    def test_major_categories_ids(self):
        """대분류 ID가 1-9인지 확인"""
        expected_ids = {1, 2, 3, 4, 5, 6, 7, 8, 9}
        actual_ids = set(MAJOR_CATEGORIES.keys())
        assert actual_ids == expected_ids

    def test_major_categories_have_name_and_icon(self):
        """각 대분류가 name과 icon을 가지는지 확인"""
        for major_id, data in MAJOR_CATEGORIES.items():
            assert "name" in data, f"Major {major_id} missing 'name'"
            assert "icon" in data, f"Major {major_id} missing 'icon'"
            assert len(data["name"]) > 0, f"Major {major_id} has empty name"
            assert len(data["icon"]) > 0, f"Major {major_id} has empty icon"

    def test_major_category_names(self):
        """대분류 이름이 올바른지 확인"""
        expected_names = {"재물", "직업", "학업", "연애", "대인", "건강", "취미", "운명", "기타"}
        actual_names = {data["name"] for data in MAJOR_CATEGORIES.values()}
        assert actual_names == expected_names


class TestSubCategories:
    """소분류 테스트"""

    def test_category_data_not_empty(self):
        """소분류 데이터가 비어있지 않은지 확인"""
        assert len(CATEGORY_DATA) > 0

    def test_category_data_min_count(self):
        """소분류가 최소 50개 이상인지 확인"""
        assert len(CATEGORY_DATA) >= 50

    def test_all_categories_have_required_fields(self):
        """모든 소분류가 필수 필드를 가지는지 확인"""
        required_fields = {"id", "major_id", "sub_name", "keywords", "age_target"}

        for cat in CATEGORY_DATA:
            for field in required_fields:
                assert field in cat, f"Category {cat.get('id', 'unknown')} missing field '{field}'"

    def test_category_ids_unique(self):
        """소분류 ID가 고유한지 확인"""
        ids = [cat["id"] for cat in CATEGORY_DATA]
        assert len(ids) == len(set(ids)), "Duplicate category IDs found"

    def test_category_major_ids_valid(self):
        """소분류의 major_id가 유효한지 확인"""
        valid_major_ids = set(MAJOR_CATEGORIES.keys())

        for cat in CATEGORY_DATA:
            assert cat["major_id"] in valid_major_ids, \
                f"Category {cat['id']} has invalid major_id: {cat['major_id']}"

    def test_each_major_has_subcategories(self):
        """각 대분류에 최소 1개 이상의 소분류가 있는지 확인"""
        for major_id in MAJOR_CATEGORIES.keys():
            subcats = [cat for cat in CATEGORY_DATA if cat["major_id"] == major_id]
            assert len(subcats) > 0, f"Major category {major_id} has no subcategories"

    def test_keywords_are_lists(self):
        """키워드가 리스트 형태인지 확인"""
        for cat in CATEGORY_DATA:
            assert isinstance(cat["keywords"], list), \
                f"Category {cat['id']} keywords is not a list"

    def test_age_target_valid(self):
        """age_target이 유효한 값인지 확인"""
        valid_targets = {"전연령", "MZ", "중장년"}

        for cat in CATEGORY_DATA:
            assert cat["age_target"] in valid_targets, \
                f"Category {cat['id']} has invalid age_target: {cat['age_target']}"


class TestCategoryFunctions:
    """카테고리 함수 테스트"""

    def test_get_all_categories(self):
        """get_all_categories 함수 테스트"""
        all_cats = get_all_categories()

        assert len(all_cats) == len(CATEGORY_DATA)

        # 확장된 필드 확인
        for cat in all_cats:
            assert "major_name" in cat
            assert "major_icon" in cat
            assert "description" in cat

    def test_get_categories_by_major(self):
        """get_categories_by_major 함수 테스트"""
        for major_id in MAJOR_CATEGORIES.keys():
            cats = get_categories_by_major(major_id)

            # 모든 결과가 해당 major_id를 가지는지 확인
            for cat in cats:
                assert cat["major_id"] == major_id

    def test_get_major_categories(self):
        """get_major_categories 함수 테스트"""
        majors = get_major_categories()

        assert len(majors) == 9

        for major in majors:
            assert "id" in major
            assert "name" in major
            assert "icon" in major


class TestKeywordQuality:
    """키워드 품질 테스트"""

    def test_no_empty_string_keywords(self):
        """빈 문자열 키워드가 없는지 확인"""
        for cat in CATEGORY_DATA:
            for keyword in cat["keywords"]:
                assert len(keyword.strip()) > 0, \
                    f"Category {cat['id']} has empty keyword"

    def test_keywords_not_too_long(self):
        """키워드가 너무 길지 않은지 확인 (최대 20자)"""
        max_length = 20

        for cat in CATEGORY_DATA:
            for keyword in cat["keywords"]:
                assert len(keyword) <= max_length, \
                    f"Category {cat['id']} has keyword too long: {keyword}"

    def test_popular_keywords_present(self):
        """주요 키워드가 포함되어 있는지 확인"""
        all_keywords: Set[str] = set()
        for cat in CATEGORY_DATA:
            all_keywords.update(cat["keywords"])

        # 주요 키워드 확인
        important_keywords = ["주식", "코인", "이직", "면접", "결혼", "건강"]
        for keyword in important_keywords:
            assert keyword in all_keywords, f"Important keyword '{keyword}' missing"


class TestCategoryDistribution:
    """카테고리 분포 테스트"""

    def test_major_category_distribution(self):
        """대분류별 소분류 분포 확인"""
        distribution = {}
        for cat in CATEGORY_DATA:
            major_id = cat["major_id"]
            distribution[major_id] = distribution.get(major_id, 0) + 1

        # 재물, 직업, 연애가 가장 많아야 함
        top_categories = sorted(distribution.items(), key=lambda x: x[1], reverse=True)[:3]
        top_major_ids = {item[0] for item in top_categories}

        # 1(재물), 2(직업), 4(연애) 중 최소 2개가 상위 3개에 포함
        expected_top = {1, 2, 4}
        overlap = top_major_ids & expected_top
        assert len(overlap) >= 2, f"Expected 재물/직업/연애 in top 3, got: {top_major_ids}"

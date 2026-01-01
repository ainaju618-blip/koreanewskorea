"""
카테고리 자동 매칭 서비스 (DB 기반 리팩토링)
컨설팅 확정: DB에서 키워드 로드 → 코드 수정 없이 카테고리 추가 가능
"""
from typing import Optional, Tuple, List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

# 시드 데이터 (DB 연결 전 fallback)
from app.data.category_seed import get_all_categories, get_major_categories, CATEGORY_DATA, MAJOR_CATEGORIES


class CategoryMatcher:
    """
    카테고리 자동 매칭 서비스

    특징:
    - DB에서 카테고리/키워드 로드 (향후)
    - 현재는 시드 데이터 사용
    - 코드 수정 없이 카테고리 확장 가능
    """

    def __init__(self):
        # 캐시된 카테고리 데이터
        self._categories: List[Dict] = []
        self._major_categories: List[Dict] = []
        self._loaded = False

    def _ensure_loaded(self):
        """시드 데이터 로드 (lazy loading)"""
        if not self._loaded:
            self._categories = get_all_categories()
            self._major_categories = get_major_categories()
            self._loaded = True

    async def load_from_db(self, db: AsyncSession):
        """
        DB에서 카테고리 로드 (향후 구현)
        현재는 시드 데이터 사용
        """
        # TODO: DB 연동 시
        # from app.models.hexagram import Category
        # result = await db.execute(select(Category))
        # self._categories = [row._asdict() for row in result.scalars().all()]
        self._ensure_loaded()

    def match_question(self, question: str) -> Tuple[int, int, float]:
        """
        질문을 카테고리에 매칭

        Args:
            question: 사용자 질문

        Returns:
            (major_id, category_id, confidence)
        """
        self._ensure_loaded()
        question_lower = question.lower()

        best_match = None
        best_score = 0.0

        # 1. 모든 카테고리 키워드 매칭
        for cat in self._categories:
            keywords = cat.get("keywords", [])
            if not keywords:
                continue

            score = self._calculate_keyword_score(question_lower, keywords)

            if score > best_score:
                best_score = score
                best_match = cat

        # 2. 신뢰도 임계값 체크
        if best_match and best_score >= 0.1:  # 키워드 1개 이상 매칭
            return (
                best_match["major_id"],
                best_match["id"],
                min(best_score * 2, 1.0)  # 신뢰도 0~1 스케일링
            )

        # 3. 대분류 키워드 매칭 (fallback)
        for major_id, major_data in MAJOR_CATEGORIES.items():
            if major_id == 9:  # 기타 제외
                continue

            # 대분류 자체에도 키워드가 있으면 매칭
            major_keywords = self._get_major_keywords(major_id)
            score = self._calculate_keyword_score(question_lower, major_keywords)

            if score > best_score:
                best_score = score
                # 해당 대분류의 첫 번째 소분류 반환
                for cat in self._categories:
                    if cat["major_id"] == major_id:
                        return (major_id, cat["id"], score)

        # 4. 매칭 실패 → 기타
        return (9, 100, 0.0)  # 미분류

    def _calculate_keyword_score(self, question: str, keywords: List[str]) -> float:
        """
        키워드 매칭 점수 계산

        개선된 로직:
        - 정확히 일치하는 키워드 수 / 전체 키워드 수
        - 긴 키워드 매칭에 가중치
        """
        if not keywords:
            return 0.0

        matches = 0
        weighted_matches = 0.0

        for keyword in keywords:
            kw_lower = keyword.lower()
            if kw_lower in question:
                matches += 1
                # 긴 키워드에 가중치 (3글자 이상)
                weight = 1.0 + (len(keyword) - 2) * 0.1 if len(keyword) > 2 else 1.0
                weighted_matches += weight

        # 기본 점수 + 가중치 점수
        base_score = matches / len(keywords)
        weighted_score = weighted_matches / len(keywords)

        return (base_score + weighted_score) / 2

    def _get_major_keywords(self, major_id: int) -> List[str]:
        """대분류의 모든 소분류 키워드 합침"""
        all_keywords = []
        for cat in self._categories:
            if cat["major_id"] == major_id:
                all_keywords.extend(cat.get("keywords", []))
        return list(set(all_keywords))  # 중복 제거

    def get_main_categories(self) -> List[Dict]:
        """대분류 목록 반환"""
        self._ensure_loaded()
        return self._major_categories

    def get_sub_categories(self, major_id: int) -> List[Dict]:
        """특정 대분류의 소분류 목록 반환"""
        self._ensure_loaded()
        return [
            {
                "id": cat["id"],
                "name": cat["sub_name"],
                "major_id": cat["major_id"],
                "keywords": cat.get("keywords", [])
            }
            for cat in self._categories
            if cat["major_id"] == major_id
        ]

    def get_category_by_id(self, category_id: int) -> Optional[Dict]:
        """ID로 카테고리 조회"""
        self._ensure_loaded()
        for cat in self._categories:
            if cat["id"] == category_id:
                return cat
        return None

    def get_category_name(self, category_id: int) -> str:
        """카테고리 전체 이름 반환 (대분류 > 소분류)"""
        cat = self.get_category_by_id(category_id)
        if cat:
            return f"{cat['major_name']} > {cat['sub_name']}"
        return "기타"


# 싱글톤 인스턴스
category_matcher = CategoryMatcher()

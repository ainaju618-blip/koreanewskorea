"""
질문 검색 API
- 키워드 검색
- 카테고리별 질문
- 랜덤 질문
- 인기 질문
"""

import json
import random
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/questions", tags=["questions"])

# 데이터 로드
DATA_DIR = Path(__file__).parent.parent / "data"

# 전역 데이터 (서버 시작 시 로드)
_questions_data = None
_keyword_index = None
_category_map = None

def load_data():
    """데이터 로드"""
    global _questions_data, _keyword_index, _category_map

    if _questions_data is None:
        with open(DATA_DIR / "questions_unified.json", 'r', encoding='utf-8') as f:
            _questions_data = json.load(f)

    if _keyword_index is None:
        try:
            with open(DATA_DIR / "keywords_index.json", 'r', encoding='utf-8') as f:
                _keyword_index = json.load(f)
        except FileNotFoundError:
            _keyword_index = {"index": {}, "stats": {}}

    if _category_map is None:
        try:
            with open(DATA_DIR / "category_questions_map.json", 'r', encoding='utf-8') as f:
                _category_map = json.load(f)
        except FileNotFoundError:
            _category_map = {"categories": {}}

def get_questions_data():
    load_data()
    return _questions_data

def get_keyword_index():
    load_data()
    return _keyword_index

def get_category_map():
    load_data()
    return _category_map


# Response Models
class QuestionItem(BaseModel):
    id: str
    text: str
    major_category_id: int
    major_category_name: str
    sub_category: str
    score: Optional[float] = None

class SearchResponse(BaseModel):
    query: str
    total: int
    results: List[QuestionItem]

class CategoryQuestionsResponse(BaseModel):
    category_id: int
    category_name: str
    total: int
    questions: List[QuestionItem]

class StatsResponse(BaseModel):
    total_questions: int
    total_keywords: int
    categories: dict


@router.get("/search", response_model=SearchResponse)
async def search_questions(
    q: str = Query(..., min_length=1, description="검색어"),
    category_id: Optional[int] = Query(None, ge=1, le=9, description="카테고리 필터 (1-9)"),
    limit: int = Query(20, ge=1, le=100, description="결과 개수")
):
    """
    질문 검색 API

    - 키워드 기반 검색
    - 카테고리 필터링 지원
    """
    data = get_questions_data()
    index = get_keyword_index()

    questions = data["questions"]
    questions_dict = {q["id"]: q for q in questions}

    # 검색어 분리
    search_terms = q.strip().split()

    # 매칭된 질문 ID 수집 (점수 계산)
    question_scores = {}

    for term in search_terms:
        # 키워드 인덱스에서 검색
        if term in index["index"]:
            for q_id in index["index"][term]:
                question_scores[q_id] = question_scores.get(q_id, 0) + 1

        # 텍스트 직접 검색 (부분 일치)
        for q_item in questions:
            if term in q_item["text"]:
                q_id = q_item["id"]
                question_scores[q_id] = question_scores.get(q_id, 0) + 0.5

    # 결과 정렬 (점수 높은 순)
    sorted_ids = sorted(question_scores.keys(), key=lambda x: -question_scores[x])

    results = []
    for q_id in sorted_ids:
        if len(results) >= limit:
            break

        q_item = questions_dict.get(q_id)
        if q_item is None:
            continue

        # 카테고리 필터
        if category_id and q_item["major_category_id"] != category_id:
            continue

        results.append(QuestionItem(
            id=q_item["id"],
            text=q_item["text"],
            major_category_id=q_item["major_category_id"],
            major_category_name=q_item["major_category_name"],
            sub_category=q_item["sub_category"],
            score=round(question_scores[q_id], 2)
        ))

    return SearchResponse(
        query=q,
        total=len(results),
        results=results
    )


@router.get("/category/{category_id}", response_model=CategoryQuestionsResponse)
async def get_category_questions(
    category_id: int,
    sub_category: Optional[str] = Query(None, description="소분류 필터"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """카테고리별 질문 조회"""
    data = get_questions_data()
    cat_map = get_category_map()

    # 카테고리명 매핑
    category_names = {
        1: "재물", 2: "직업", 3: "학업", 4: "연애",
        5: "대인", 6: "건강", 7: "취미", 8: "운명", 9: "기타"
    }

    if category_id not in category_names:
        raise HTTPException(status_code=404, detail="Invalid category_id")

    # 카테고리 질문 필터링
    cat_data = cat_map["categories"].get(str(category_id), {})
    questions = cat_data.get("questions", [])

    # 소분류 필터
    if sub_category:
        questions = [q for q in questions if q.get("sub_category") == sub_category]

    # 페이지네이션
    paginated = questions[offset:offset + limit]

    return CategoryQuestionsResponse(
        category_id=category_id,
        category_name=category_names[category_id],
        total=len(questions),
        questions=[
            QuestionItem(
                id=q["id"],
                text=q["text"],
                major_category_id=category_id,
                major_category_name=category_names[category_id],
                sub_category=q.get("sub_category", "")
            )
            for q in paginated
        ]
    )


@router.get("/random")
async def get_random_questions(
    category_id: Optional[int] = Query(None, ge=1, le=9),
    count: int = Query(5, ge=1, le=20)
):
    """랜덤 질문 추천"""
    data = get_questions_data()
    questions = data["questions"]

    # 카테고리 필터
    if category_id:
        questions = [q for q in questions if q["major_category_id"] == category_id]

    # 랜덤 선택
    selected = random.sample(questions, min(count, len(questions)))

    return {
        "count": len(selected),
        "questions": [
            {
                "id": q["id"],
                "text": q["text"],
                "category": q["major_category_name"],
                "sub_category": q["sub_category"]
            }
            for q in selected
        ]
    }


@router.get("/popular")
async def get_popular_questions(
    category_id: Optional[int] = Query(None, ge=1, le=9),
    limit: int = Query(10, ge=1, le=50)
):
    """
    인기 질문 (카테고리별)

    - 실제 사용 통계가 없으므로 랜덤 시뮬레이션
    - 추후 UserHistory 기반으로 변경 가능
    """
    data = get_questions_data()
    questions = data["questions"]

    # 카테고리 필터
    if category_id:
        questions = [q for q in questions if q["major_category_id"] == category_id]

    # 상위 질문 선택 (실제로는 사용 통계 기반)
    # 현재는 앞쪽 질문을 "인기"로 가정
    selected = questions[:limit]

    return {
        "category_id": category_id,
        "count": len(selected),
        "questions": [
            {
                "id": q["id"],
                "text": q["text"],
                "category": q["major_category_name"],
                "sub_category": q["sub_category"],
                "popularity_score": round(random.uniform(0.7, 1.0), 2)  # 시뮬레이션
            }
            for q in selected
        ]
    }


@router.get("/stats", response_model=StatsResponse)
async def get_stats():
    """통계 정보"""
    data = get_questions_data()
    index = get_keyword_index()

    # 카테고리별 통계
    category_stats = data.get("statistics", {}).get("by_category", {})

    return StatsResponse(
        total_questions=data["total_count"],
        total_keywords=index.get("total_keywords", 0),
        categories=category_stats
    )


@router.get("/suggest")
async def suggest_questions(
    text: str = Query(..., min_length=2, description="사용자 입력 텍스트"),
    limit: int = Query(5, ge=1, le=10)
):
    """
    질문 자동 완성/추천

    - 입력 텍스트 기반 유사 질문 추천
    """
    data = get_questions_data()
    questions = data["questions"]

    # 간단한 텍스트 매칭
    matches = []
    text_lower = text.lower()

    for q in questions:
        q_text = q["text"].lower()
        if text_lower in q_text:
            # 매칭 위치가 앞쪽일수록 높은 점수
            pos = q_text.find(text_lower)
            score = 1.0 - (pos / len(q_text))
            matches.append((q, score))

    # 점수순 정렬
    matches.sort(key=lambda x: -x[1])

    return {
        "input": text,
        "suggestions": [
            {
                "id": q["id"],
                "text": q["text"],
                "category": q["major_category_name"],
                "score": round(score, 2)
            }
            for q, score in matches[:limit]
        ]
    }

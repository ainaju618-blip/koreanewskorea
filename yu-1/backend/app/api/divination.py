"""
점술 API 핸들러

경량화된 API 계층 - UseCase 호출과 응답 변환만 담당
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from app.usecases.divination_usecase import divination_usecase
from app.services.llm_service import llm_service
from app.services.category_matcher import category_matcher

router = APIRouter(prefix="/api/divination", tags=["divination"])


# ============================================================================
# Request/Response Models
# ============================================================================

class DivinationRequest(BaseModel):
    divination_type: str = Field(default="iching", description="점술 종류")
    period: str = Field(default="daily", description="기간: daily/weekly/monthly/yearly")
    main_category: int = Field(ge=1, le=9, description="대분류 ID (1~9)")
    question: str = Field(min_length=2, max_length=100, description="질문 (2~100자)")
    session_id: Optional[str] = None


class HexagramInfo(BaseModel):
    number: int
    name_kr: str
    name_hanja: str
    name_full: str


class YaoInfo(BaseModel):
    position: int
    name: str
    text_hanja: str
    text_kr: str


class ReadingMethodInfo(BaseModel):
    reading_type: str
    yao_position: Optional[int]
    use_transformed: bool
    description: str


class DivinationResponse(BaseModel):
    hexagram: HexagramInfo
    yao: Optional[YaoInfo]
    reading_method: ReadingMethodInfo
    gua_ci: Optional[str]
    transformed_gua_ci: Optional[str]
    interpretation: str
    fortune_score: int
    fortune_category: str
    action_guide: Optional[str]
    caution: Optional[str]
    keywords: List[str]
    matched_category: str
    changing_lines: List[int]
    transformed_hexagram: Optional[int]
    transformed_hexagram_name: Optional[str]


class CategoryResponse(BaseModel):
    id: int
    name: str
    emoji: str


class SubCategoryResponse(BaseModel):
    id: int
    name: str
    main_id: int


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/cast", response_model=DivinationResponse)
async def cast_divination(
    request: DivinationRequest
):
    """
    점 치기 (메인 API)

    전통 주역 변효 해석 규칙 적용
    """
    # UseCase 호출
    result = await divination_usecase.cast_divination(
        question=request.question,
        main_category=request.main_category,
        period=request.period
    )

    # 응답 변환
    yao_info = None
    if result.yao:
        yao_info = YaoInfo(
            position=result.yao.position,
            name=result.yao.name,
            text_hanja=result.yao.text_hanja,
            text_kr=result.yao.text_kr
        )

    return DivinationResponse(
        hexagram=HexagramInfo(
            number=result.hexagram.number,
            name_kr=result.hexagram.name_ko,
            name_hanja=result.hexagram.name_hanja,
            name_full=result.hexagram.name_full
        ),
        yao=yao_info,
        reading_method=ReadingMethodInfo(
            reading_type=result.reading_type,
            yao_position=result.yao_position,
            use_transformed=result.use_transformed,
            description=result.reading_description
        ),
        gua_ci=result.gua_ci,
        transformed_gua_ci=result.transformed_gua_ci,
        interpretation=result.interpretation,
        fortune_score=result.fortune_score,
        fortune_category=result.fortune_category,
        action_guide=result.action_guide,
        caution=result.caution,
        keywords=result.keywords,
        matched_category=result.matched_category,
        changing_lines=result.changing_lines,
        transformed_hexagram=result.transformed_hexagram.number if result.transformed_hexagram else None,
        transformed_hexagram_name=result.transformed_hexagram.name_full if result.transformed_hexagram else None
    )


@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories():
    """대분류 카테고리 목록"""
    return category_matcher.get_main_categories()


@router.get("/categories/{main_id}/sub", response_model=List[SubCategoryResponse])
async def get_sub_categories(main_id: int):
    """소분류 카테고리 목록"""
    if main_id < 1 or main_id > 9:
        raise HTTPException(status_code=400, detail="Invalid category ID")
    return category_matcher.get_sub_categories(main_id)


# ============================================================================
# 효 이름 파싱 유틸리티
# ============================================================================

YAO_NAME_TO_POSITION = {
    # 양효 이름
    "초구": 1, "구이": 2, "구삼": 3, "구사": 4, "구오": 5, "상구": 6,
    # 음효 이름
    "초육": 1, "육이": 2, "육삼": 3, "육사": 4, "육오": 5, "상육": 6,
}

CATEGORY_NAME_TO_ID = {
    "재물": 1, "직업": 2, "학업": 3, "연애": 4, "대인": 5,
    "건강": 6, "취미": 7, "운명": 8, "기타": 9,
}


def parse_yao_name(yao_name: str) -> Optional[int]:
    """효 이름을 위치(1-6)로 변환"""
    return YAO_NAME_TO_POSITION.get(yao_name.strip())


def parse_category_name(category_name: str) -> Optional[int]:
    """카테고리 이름을 ID(1-9)로 변환"""
    return CATEGORY_NAME_TO_ID.get(category_name.strip())


# ============================================================================
# GET /api/divination 엔드포인트
# ============================================================================

class SimpleYaoResponse(BaseModel):
    """간단한 효 조회 응답"""
    hexagram_number: int
    hexagram_name: str
    yao_position: int
    yao_name: str
    text_hanja: str
    text_kr: str
    interpretation: str
    fortune_score: int
    fortune_category: str
    keywords: List[str]
    category_interpretation: Optional[str] = None
    matched_category: str


@router.get("", response_model=SimpleYaoResponse)
async def get_divination(
    category: str,
    yao: str,
    hexagram: int = 1
):
    """
    384효 + 카테고리 매칭 조회 (GET)

    Args:
        category: 대분류 카테고리 이름 (재물, 직업, 학업, 연애, 대인, 건강, 취미, 운명, 기타)
        yao: 효 이름 (초구, 구이, 구삼, 구사, 구오, 상구 / 초육, 육이, 육삼, 육사, 육오, 상육)
        hexagram: 괘 번호 (1-64, 기본값 1)

    Returns:
        해당 효의 해석 + 카테고리 매칭 결과
    """
    from app.repositories.hexagram_repository import hexagram_repository
    from app.repositories.yao_repository import yao_repository

    # 1. 효 이름 파싱
    yao_position = parse_yao_name(yao)
    if yao_position is None:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid yao name: {yao}. Valid names: 초구, 구이, 구삼, 구사, 구오, 상구, 초육, 육이, 육삼, 육사, 육오, 상육"
        )

    # 2. 카테고리 파싱
    category_id = parse_category_name(category)
    if category_id is None:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category: {category}. Valid categories: 재물, 직업, 학업, 연애, 대인, 건강, 취미, 운명, 기타"
        )

    # 3. 괘 번호 검증
    if hexagram < 1 or hexagram > 64:
        raise HTTPException(status_code=400, detail="Hexagram number must be 1-64")

    # 4. 괘 데이터 조회
    hex_data = hexagram_repository.get_hexagram(hexagram)
    if not hex_data:
        raise HTTPException(status_code=404, detail=f"Hexagram {hexagram} not found")

    # 5. 효 데이터 조회
    yao_data = yao_repository.get_yao(hexagram, yao_position)
    if not yao_data:
        raise HTTPException(status_code=404, detail=f"Yao not found for hexagram {hexagram}, position {yao_position}")

    # 6. 카테고리별 해석 매칭 (향후 확장)
    category_key = f"{category}_{yao_data.fortune_category}"
    category_interpretation = _get_category_interpretation(
        category_id=category_id,
        fortune_category=yao_data.fortune_category,
        base_interpretation=yao_data.interpretation
    )

    # 7. 응답 생성
    return SimpleYaoResponse(
        hexagram_number=hexagram,
        hexagram_name=hex_data.name_full,
        yao_position=yao_position,
        yao_name=yao_data.name,
        text_hanja=yao_data.text_hanja,
        text_kr=yao_data.text_kr,
        interpretation=yao_data.interpretation,
        fortune_score=yao_data.fortune_score,
        fortune_category=yao_data.fortune_category,
        keywords=yao_data.keywords,
        category_interpretation=category_interpretation,
        matched_category=category
    )


def _get_category_interpretation(
    category_id: int,
    fortune_category: str,
    base_interpretation: str
) -> str:
    """
    카테고리별 맞춤 해석 생성

    향후 DB에서 카테고리별 해석 조회로 확장 가능
    """
    category_contexts = {
        1: "재물/투자 관점에서",
        2: "직업/커리어 관점에서",
        3: "학업/시험 관점에서",
        4: "연애/관계 관점에서",
        5: "대인관계 관점에서",
        6: "건강/웰빙 관점에서",
        7: "취미/여가 관점에서",
        8: "운명/인생 관점에서",
        9: "일반적으로",
    }

    context = category_contexts.get(category_id, "")

    fortune_guides = {
        "대길": "매우 좋은 흐름입니다. 적극적으로 행동하세요.",
        "길": "좋은 시기입니다. 계획대로 진행하세요.",
        "평": "평온한 시기입니다. 신중하게 판단하세요.",
        "흉": "조심해야 할 때입니다. 무리하지 마세요.",
        "대흉": "잠시 멈추고 때를 기다리세요.",
    }

    guide = fortune_guides.get(fortune_category, "")

    return f"{context} {base_interpretation} {guide}".strip()


# ============================================================================
# 오늘의 운세 API
# ============================================================================

class TodayFortuneResponse(BaseModel):
    """오늘의 운세 응답"""
    hexagram_number: int
    hexagram_name: str
    hexagram_hanja: str
    hexagram_symbol: str  # 상괘 + 하괘 심볼
    yao_position: int
    yao_name: str
    text_hanja: str
    text_kr: str
    interpretation: str
    fortune_score: int
    fortune_category: str
    keywords: List[str]
    gua_ci: str
    luck_number: int
    luck_name: str
    # 일간운세 전용 필드 (1+2 구조)
    daily_headline: str = ""  # 대제목 (15-25자)
    daily_body: str = ""      # 본문 (50-70자)


@router.get("/today", response_model=TodayFortuneResponse)
async def get_today_fortune():
    """
    오늘의 운세 조회 (시초법 기반)

    - 매 요청마다 새로운 랜덤 괘 생성 (새로고침 시 변경)
    - 시초법 알고리즘 + 운발수 가중치 적용
    - 일간운세 전용 해석문 (1+2 구조: headline + body)
    """
    import random
    from datetime import date
    from app.services.divination import divination_service, HEXAGRAM_REVERSE
    from app.repositories.hexagram_repository import hexagram_repository
    from app.repositories.yao_repository import yao_repository
    from app.data.hexagram_complete import TRIGRAM_INFO
    from app.data.daily_fortune_final import get_daily_fortune

    # 매번 새로운 랜덤 괘 생성 (새로고침마다 다른 운세)
    today = date.today()

    # 시초법으로 점 치기 (운발수 가중치 적용) - 완전 랜덤
    result = divination_service.uniform_384_divination()

    # 괘 정보 조회
    hex_data = hexagram_repository.get_hexagram(result.hexagram_number)
    if not hex_data:
        raise HTTPException(status_code=500, detail="Hexagram data not found")

    # 효 위치
    yao_position = result.changing_lines[0] if result.changing_lines else 1

    # 효 정보 조회
    yao_data = yao_repository.get_yao(result.hexagram_number, yao_position)
    if not yao_data:
        raise HTTPException(status_code=500, detail="Yao data not found")

    # 상하괘 심볼 가져오기
    if result.hexagram_number in HEXAGRAM_REVERSE:
        upper, lower = HEXAGRAM_REVERSE[result.hexagram_number]
        upper_symbol = TRIGRAM_INFO.get(upper, {}).get("symbol", "")
        lower_symbol = TRIGRAM_INFO.get(lower, {}).get("symbol", "")
        hexagram_symbol = upper_symbol + lower_symbol
    else:
        hexagram_symbol = "☰☰"

    # 운발수에서 운세 이름 추출
    description = result.reading_method.description
    luck_number = 5  # 기본값
    luck_name = "평운"

    if "운발수" in description:
        # "운발수 N(운세이름)" 형식에서 추출
        import re
        match = re.search(r"운발수 (\d+)\(([^)]+)\)", description)
        if match:
            luck_number = int(match.group(1))
            luck_name = match.group(2)

    # 일간운세 전용 해석문 조회 (날짜 기반으로 변형 선택)
    # 3일에 한 번씩 변형이 바뀌도록 설정
    variation = (today.toordinal() // 3) % 3
    daily_fortune = get_daily_fortune(result.hexagram_number, yao_position, variation)

    return TodayFortuneResponse(
        hexagram_number=result.hexagram_number,
        hexagram_name=hex_data.name_full,
        hexagram_hanja=hex_data.name_hanja,
        hexagram_symbol=hexagram_symbol,
        yao_position=yao_position,
        yao_name=yao_data.name,
        text_hanja=yao_data.text_hanja,
        text_kr=yao_data.text_kr,
        interpretation=yao_data.interpretation,
        fortune_score=yao_data.fortune_score,
        fortune_category=yao_data.fortune_category,
        keywords=yao_data.keywords,
        gua_ci=hex_data.gua_ci if hasattr(hex_data, 'gua_ci') else "",
        luck_number=luck_number,
        luck_name=luck_name,
        daily_headline=daily_fortune.get("headline", ""),
        daily_body=daily_fortune.get("body", "")
    )


@router.get("/health")
async def health_check():
    """서버 상태 확인"""
    ollama_ok = await llm_service.health_check()
    return {
        "status": "ok",
        "ollama": "connected" if ollama_ok else "disconnected",
        "timestamp": datetime.now().isoformat()
    }


# ============================================================================
# 질문 기반 자동 점술 API (B-1)
# ============================================================================

class QuestionBasedRequest(BaseModel):
    """질문 기반 점술 요청"""
    question: str = Field(min_length=2, max_length=200, description="사용자 질문")
    period: str = Field(default="daily", description="기간: daily/weekly/monthly/yearly")


class MatchedCategoryInfo(BaseModel):
    """매칭된 카테고리 정보"""
    major_id: int
    major_name: str
    sub_id: Optional[int]
    sub_name: Optional[str]
    confidence: float


class SimilarQuestion(BaseModel):
    """유사 질문"""
    id: str
    text: str
    similarity: float


class QuestionBasedResponse(BaseModel):
    """질문 기반 점술 응답"""
    matched_category: MatchedCategoryInfo
    similar_questions: List[SimilarQuestion]
    divination_result: DivinationResponse


@router.post("/cast-by-question", response_model=QuestionBasedResponse)
async def cast_divination_by_question(request: QuestionBasedRequest):
    """
    질문 기반 자동 점술

    사용자가 질문만 입력하면:
    1. 질문 분석 → 카테고리 자동 매칭
    2. 유사 질문 검색
    3. 점술 수행
    4. 통합 결과 반환
    """
    import json
    from pathlib import Path

    # 1. 카테고리 자동 매칭
    major_id, sub_id, confidence = category_matcher.match_question(request.question)

    # 카테고리 이름 조회
    category_names = {
        1: "재물", 2: "직업", 3: "학업", 4: "연애",
        5: "대인", 6: "건강", 7: "취미", 8: "운명", 9: "기타"
    }
    major_name = category_names.get(major_id, "기타")

    # 소분류 이름 조회
    sub_name = None
    if sub_id:
        sub_cats = category_matcher.get_sub_categories(major_id)
        for sc in sub_cats:
            if sc["id"] == sub_id:
                sub_name = sc["name"]
                break

    matched_category = MatchedCategoryInfo(
        major_id=major_id,
        major_name=major_name,
        sub_id=sub_id,
        sub_name=sub_name,
        confidence=round(confidence, 2)
    )

    # 2. 유사 질문 검색
    similar_questions = []
    try:
        data_dir = Path(__file__).parent.parent / "data"
        questions_file = data_dir / "questions_unified.json"

        if questions_file.exists():
            with open(questions_file, 'r', encoding='utf-8') as f:
                q_data = json.load(f)

            # 간단한 텍스트 매칭
            query_words = set(request.question.lower().split())
            matches = []

            for q in q_data.get("questions", [])[:2000]:  # 성능을 위해 일부만
                q_text = q["text"].lower()
                q_words = set(q_text.split())
                # 자카드 유사도
                intersection = len(query_words & q_words)
                union = len(query_words | q_words)
                similarity = intersection / union if union > 0 else 0

                if similarity > 0.1:
                    matches.append((q, similarity))

            # 상위 5개
            matches.sort(key=lambda x: -x[1])
            similar_questions = [
                SimilarQuestion(
                    id=m[0]["id"],
                    text=m[0]["text"],
                    similarity=round(m[1], 2)
                )
                for m in matches[:5]
            ]
    except Exception as e:
        print(f"[WARN] Similar question search failed: {e}")

    # 3. 점술 수행
    result = await divination_usecase.cast_divination(
        question=request.question,
        main_category=major_id,
        period=request.period
    )

    # 4. 응답 생성
    yao_info = None
    if result.yao:
        yao_info = YaoInfo(
            position=result.yao.position,
            name=result.yao.name,
            text_hanja=result.yao.text_hanja,
            text_kr=result.yao.text_kr
        )

    divination_response = DivinationResponse(
        hexagram=HexagramInfo(
            number=result.hexagram.number,
            name_kr=result.hexagram.name_ko,
            name_hanja=result.hexagram.name_hanja,
            name_full=result.hexagram.name_full
        ),
        yao=yao_info,
        reading_method=ReadingMethodInfo(
            reading_type=result.reading_type,
            yao_position=result.yao_position,
            use_transformed=result.use_transformed,
            description=result.reading_description
        ),
        gua_ci=result.gua_ci,
        transformed_gua_ci=result.transformed_gua_ci,
        interpretation=result.interpretation,
        fortune_score=result.fortune_score,
        fortune_category=result.fortune_category,
        action_guide=result.action_guide,
        caution=result.caution,
        keywords=result.keywords,
        matched_category=f"{major_name} > {sub_name}" if sub_name else major_name,
        changing_lines=result.changing_lines,
        transformed_hexagram=result.transformed_hexagram.number if result.transformed_hexagram else None,
        transformed_hexagram_name=result.transformed_hexagram.name_full if result.transformed_hexagram else None
    )

    return QuestionBasedResponse(
        matched_category=matched_category,
        similar_questions=similar_questions,
        divination_result=divination_response
    )


@router.post("/recommend-category")
async def recommend_category(question: str):
    """
    질문 기반 카테고리 추천

    질문 텍스트를 분석하여 적합한 카테고리 추천
    """
    major_id, sub_id, confidence = category_matcher.match_question(question)

    category_names = {
        1: "재물", 2: "직업", 3: "학업", 4: "연애",
        5: "대인", 6: "건강", 7: "취미", 8: "운명", 9: "기타"
    }

    return {
        "question": question,
        "recommended": {
            "major_id": major_id,
            "major_name": category_names.get(major_id, "기타"),
            "sub_id": sub_id,
            "confidence": round(confidence, 2)
        },
        "all_scores": category_matcher.get_all_category_scores(question) if hasattr(category_matcher, 'get_all_category_scores') else None
    }

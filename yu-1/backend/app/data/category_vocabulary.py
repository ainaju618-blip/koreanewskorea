"""
카테고리별 표현 사전 (LLM 없이 자연스러운 답변용)

9대분류 × 4방향 = 36가지 도메인 특화 표현
"""

from app.data.question_direction import QuestionDirection

# 카테고리별 행동 동사 (질문 방향에 따른 도메인 특화 표현)
CATEGORY_ACTIONS = {
    # 1. 재물 💰
    "재물": {
        QuestionDirection.START: ["투자", "매수", "시작"],
        QuestionDirection.MAINTAIN: ["보유", "유지", "관리"],
        QuestionDirection.CHANGE: ["종목 변경", "포트폴리오 조정", "리밸런싱"],
        QuestionDirection.END: ["매도", "정리", "손절"],
    },
    # 2. 직업 💼
    "직업": {
        QuestionDirection.START: ["입사", "취업", "지원"],
        QuestionDirection.MAINTAIN: ["현 직장", "커리어", "업무"],
        QuestionDirection.CHANGE: ["이직", "전직", "직무 변경"],
        QuestionDirection.END: ["퇴사", "정리", "휴직"],
    },
    # 3. 학업 📚
    "학업": {
        QuestionDirection.START: ["시험 응시", "공부 시작", "도전"],
        QuestionDirection.MAINTAIN: ["학습", "준비", "복습"],
        QuestionDirection.CHANGE: ["진로 변경", "전공 전환", "새 도전"],
        QuestionDirection.END: ["시험 포기", "휴학", "정리"],
    },
    # 4. 연애 💕
    "연애": {
        QuestionDirection.START: ["고백", "만남", "시작"],
        QuestionDirection.MAINTAIN: ["관계 유지", "사랑", "연락"],
        QuestionDirection.CHANGE: ["변화 시도", "새로운 데이트", "관계 개선"],
        QuestionDirection.END: ["이별", "정리", "거리두기"],
    },
    # 5. 대인 👥
    "대인": {
        QuestionDirection.START: ["새 만남", "인연", "관계 시작"],
        QuestionDirection.MAINTAIN: ["관계 유지", "소통", "교류"],
        QuestionDirection.CHANGE: ["관계 개선", "화해", "변화"],
        QuestionDirection.END: ["거리두기", "정리", "단절"],
    },
    # 6. 건강 🏥
    "건강": {
        QuestionDirection.START: ["치료 시작", "운동 시작", "관리 시작"],
        QuestionDirection.MAINTAIN: ["건강 관리", "꾸준한 관리", "유지"],
        QuestionDirection.CHANGE: ["치료법 변경", "병원 변경", "생활 개선"],
        QuestionDirection.END: ["치료 중단", "휴식", "정리"],
    },
    # 7. 취미 🎮
    "취미": {
        QuestionDirection.START: ["새 취미", "도전", "시작"],
        QuestionDirection.MAINTAIN: ["계속", "연습", "즐기기"],
        QuestionDirection.CHANGE: ["새 분야", "전환", "확장"],
        QuestionDirection.END: ["정리", "쉬어가기", "마무리"],
    },
    # 8. 운명 ✨
    "운명": {
        QuestionDirection.START: ["새 시작", "결정", "선택"],
        QuestionDirection.MAINTAIN: ["지금 방향", "현재 길", "유지"],
        QuestionDirection.CHANGE: ["방향 전환", "새로운 길", "변화"],
        QuestionDirection.END: ["마무리", "정리", "끝맺음"],
    },
    # 9. 기타 🔮
    "기타": {
        QuestionDirection.START: ["시작", "도전", "진행"],
        QuestionDirection.MAINTAIN: ["유지", "지속", "관리"],
        QuestionDirection.CHANGE: ["변화", "전환", "조정"],
        QuestionDirection.END: ["정리", "마무리", "끝"],
    },
}

# 카테고리별 맥락 문장 (더 자연스러운 표현)
CATEGORY_CONTEXT = {
    "재물": {
        QuestionDirection.START: "{keyword}, 지금 해도 좋을까요?",
        QuestionDirection.MAINTAIN: "지금 {keyword} 중인 것, 잘 되고 있을까요?",
        QuestionDirection.CHANGE: "{keyword}을(를) 해볼까 고민 중이시네요.",
        QuestionDirection.END: "{keyword}, 지금이 맞을까요?",
    },
    "직업": {
        QuestionDirection.START: "{keyword}, 도전해도 될까요?",
        QuestionDirection.MAINTAIN: "지금 {keyword}은(는) 잘 되고 있나요?",
        QuestionDirection.CHANGE: "{keyword}, 해도 괜찮을까요?",
        QuestionDirection.END: "{keyword}, 결심하셨군요.",
    },
    "학업": {
        QuestionDirection.START: "{keyword}, 지금 해도 될까요?",
        QuestionDirection.MAINTAIN: "{keyword}은(는) 잘 되고 있나요?",
        QuestionDirection.CHANGE: "{keyword}, 고민 중이시네요.",
        QuestionDirection.END: "{keyword}, 결정하셨군요.",
    },
    "연애": {
        QuestionDirection.START: "{keyword}, 해도 될까요?",
        QuestionDirection.MAINTAIN: "지금 {keyword}은(는) 어떤가요?",
        QuestionDirection.CHANGE: "{keyword}을(를) 생각 중이시네요.",
        QuestionDirection.END: "{keyword}, 마음 정하셨군요.",
    },
    "대인": {
        QuestionDirection.START: "{keyword}, 해봐도 될까요?",
        QuestionDirection.MAINTAIN: "{keyword}은(는) 잘 되고 있나요?",
        QuestionDirection.CHANGE: "{keyword}을(를) 고민 중이시네요.",
        QuestionDirection.END: "{keyword}, 결심하셨군요.",
    },
    "건강": {
        QuestionDirection.START: "{keyword}, 시작해볼까요?",
        QuestionDirection.MAINTAIN: "{keyword}은(는) 잘 되고 있나요?",
        QuestionDirection.CHANGE: "{keyword}을(를) 고민 중이시네요.",
        QuestionDirection.END: "{keyword}, 생각 중이시군요.",
    },
    "취미": {
        QuestionDirection.START: "{keyword}, 해볼까요?",
        QuestionDirection.MAINTAIN: "{keyword}은(는) 재밌으신가요?",
        QuestionDirection.CHANGE: "{keyword}을(를) 고민 중이시네요.",
        QuestionDirection.END: "{keyword}, 생각 중이시군요.",
    },
    "운명": {
        QuestionDirection.START: "{keyword}, 해도 될까요?",
        QuestionDirection.MAINTAIN: "지금 길이 맞는지 궁금하시군요.",
        QuestionDirection.CHANGE: "{keyword}을(를) 고민 중이시네요.",
        QuestionDirection.END: "{keyword}, 결심하셨군요.",
    },
    "기타": {
        QuestionDirection.START: "{keyword}, 해도 될까요?",
        QuestionDirection.MAINTAIN: "{keyword}은(는) 잘 되고 있나요?",
        QuestionDirection.CHANGE: "{keyword}을(를) 고민 중이시네요.",
        QuestionDirection.END: "{keyword}, 결정하셨군요.",
    },
}

# 카테고리별 caution 표현 (도메인 특화)
CATEGORY_CAUTIONS = {
    "재물": {
        "positive": "다만 한 번에 너무 큰 금액은 피하세요. 분할이 안전해요.",
        "neutral": "시장 상황을 좀 더 지켜보는 것도 방법이에요.",
        "negative": "지금은 무리하게 움직이지 마세요. 손실 주의!",
    },
    "직업": {
        "positive": "다만 충분히 준비하고 움직이세요. 급하면 실수해요.",
        "neutral": "조건들을 꼼꼼히 비교해보세요.",
        "negative": "지금은 현 상태를 유지하는 게 나을 수 있어요.",
    },
    "학업": {
        "positive": "다만 컨디션 관리도 중요해요. 무리하지 마세요.",
        "neutral": "계획을 다시 한번 점검해보세요.",
        "negative": "지금은 무리하지 말고 기초부터 다지세요.",
    },
    "연애": {
        "positive": "다만 상대방 마음도 존중해주세요.",
        "neutral": "서두르지 말고 천천히 알아가세요.",
        "negative": "지금은 조금 거리를 두는 게 좋을 수 있어요.",
    },
    "대인": {
        "positive": "다만 상대방 입장도 생각해주세요.",
        "neutral": "시간을 두고 천천히 풀어가세요.",
        "negative": "지금은 거리를 두는 게 서로에게 좋아요.",
    },
    "건강": {
        "positive": "다만 무리하지 말고 천천히 시작하세요.",
        "neutral": "전문가와 상담해보는 것도 좋아요.",
        "negative": "지금은 충분한 휴식이 필요해요.",
    },
    "취미": {
        "positive": "다만 처음부터 너무 욕심내지 마세요.",
        "neutral": "천천히 즐기면서 해보세요.",
        "negative": "지금은 쉬어가는 것도 필요해요.",
    },
    "운명": {
        "positive": "다만 주변 조언도 들어보세요.",
        "neutral": "조금 더 생각해보는 것도 좋아요.",
        "negative": "지금은 큰 결정을 미루는 게 좋아요.",
    },
    "기타": {
        "positive": "다만 신중하게 진행하세요.",
        "neutral": "좀 더 알아보는 것도 방법이에요.",
        "negative": "지금은 조심스럽게 움직이세요.",
    },
}


def get_domain_action(category: str, direction: QuestionDirection) -> str:
    """카테고리와 방향에 맞는 도메인 특화 행동 동사 반환"""
    actions = CATEGORY_ACTIONS.get(category, CATEGORY_ACTIONS["기타"])
    action_list = actions.get(direction, ["진행"])
    return action_list[0]  # 첫 번째 표현 사용


def get_domain_context(category: str, direction: QuestionDirection, keyword: str = "") -> str:
    """카테고리와 방향에 맞는 맥락 문장 반환"""
    contexts = CATEGORY_CONTEXT.get(category, CATEGORY_CONTEXT["기타"])
    template = contexts.get(direction, "{keyword} 관련해서 고민 중이시네요.")

    if not keyword:
        keyword = get_domain_action(category, direction)

    return template.format(keyword=keyword)


def get_domain_caution(category: str, fortune_tendency: str) -> str:
    """카테고리와 운세 경향에 맞는 주의사항 반환"""
    cautions = CATEGORY_CAUTIONS.get(category, CATEGORY_CAUTIONS["기타"])

    # 운세 경향에 따른 caution 선택
    if fortune_tendency in ["대길", "길"]:
        return cautions["positive"]
    elif fortune_tendency in ["중길", "중평"]:
        return cautions["neutral"]
    else:  # 흉, 소흉, 대흉
        return cautions["negative"]


# 테스트
if __name__ == "__main__":
    print("=== 카테고리별 표현 사전 테스트 ===\n")

    test_cases = [
        ("재물", QuestionDirection.START, "주식 매수"),
        ("연애", QuestionDirection.START, "고백"),
        ("직업", QuestionDirection.CHANGE, "이직"),
        ("건강", QuestionDirection.MAINTAIN, "운동"),
    ]

    for category, direction, keyword in test_cases:
        print(f"[{category} / {direction.value}]")
        print(f"  행동: {get_domain_action(category, direction)}")
        print(f"  맥락: {get_domain_context(category, direction, keyword)}")
        print(f"  주의(대길): {get_domain_caution(category, '대길')}")
        print(f"  주의(흉): {get_domain_caution(category, '흉')}")
        print()

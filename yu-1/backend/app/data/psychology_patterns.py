"""
심리학 기반 질문 패턴 분석 시스템

질문에서 숨겨진 심리/욕구를 파악하고
그에 맞는 조언 방향을 결정
"""
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum


class PsychologyType(Enum):
    """심리 유형 분류"""
    CONFIRMATION = "confirmation"      # 확인 욕구: 이미 답 있음, 확신만 필요
    ANXIETY = "anxiety"                # 불안 해소: 미래 불확실성에 대한 두려움
    DECISION = "decision"              # 결정 지지: 선택 장애, 책임 분산
    HOPE = "hope"                      # 희망 추구: 긍정적 메시지 갈망
    CONTROL = "control"                # 통제감 회복: 삶이 통제 불능 느낌
    VALIDATION = "validation"          # 자기 검증: 내 선택/감정이 맞는지
    AVOIDANCE = "avoidance"            # 회피 심리: 불운/나쁜 일 피하고 싶음
    CONNECTION = "connection"          # 관계 욕구: 상대방 마음/의도 파악


@dataclass
class PsychologyProfile:
    """심리 프로필"""
    primary_type: PsychologyType       # 주요 심리 유형
    secondary_type: Optional[PsychologyType] = None  # 보조 심리 유형
    confidence: float = 0.0            # 분석 신뢰도
    hidden_need: str = ""              # 숨겨진 욕구
    advice_tone: str = ""              # 조언 톤
    advice_focus: str = ""             # 조언 초점


# ============================================================================
# 질문 패턴 → 심리 유형 매핑
# ============================================================================

QUESTION_PATTERNS: Dict[str, Dict] = {
    # ========== 확인 욕구 (CONFIRMATION) ==========
    # "~해도 될까요?" 패턴 - 이미 하고 싶은 마음이 있음
    "해도 될까요": {
        "type": PsychologyType.CONFIRMATION,
        "hidden_need": "이미 마음은 정해졌지만 확신이 필요함",
        "advice_tone": "지지적, 용기 부여",
        "advice_focus": "결정에 대한 긍정적 확인 + 주의점"
    },
    "해도 괜찮을까요": {
        "type": PsychologyType.CONFIRMATION,
        "hidden_need": "허락/승인을 원함",
        "advice_tone": "지지적, 안심",
        "advice_focus": "행동해도 된다는 확신 부여"
    },
    "가도 될까요": {
        "type": PsychologyType.CONFIRMATION,
        "hidden_need": "가고 싶지만 불안함",
        "advice_tone": "지지적",
        "advice_focus": "가는 것에 대한 확신"
    },
    "사도 될까요": {
        "type": PsychologyType.CONFIRMATION,
        "hidden_need": "구매 욕구 + 후회 두려움",
        "advice_tone": "현실적, 지지적",
        "advice_focus": "타이밍과 리스크 안내"
    },

    # ========== 불안 해소 (ANXIETY) ==========
    # 미래 결과에 대한 불안
    "잘 될까요": {
        "type": PsychologyType.ANXIETY,
        "hidden_need": "불확실한 미래에 대한 안심",
        "advice_tone": "따뜻한 위로, 희망적",
        "advice_focus": "긍정적 가능성 + 준비 방법"
    },
    "합격할까요": {
        "type": PsychologyType.ANXIETY,
        "hidden_need": "노력에 대한 보상 확인",
        "advice_tone": "격려, 자신감 부여",
        "advice_focus": "준비 상태 인정 + 마인드셋"
    },
    "성공할까요": {
        "type": PsychologyType.ANXIETY,
        "hidden_need": "실패 두려움 해소",
        "advice_tone": "용기 부여, 현실적",
        "advice_focus": "성공 가능성 + 대비책"
    },
    "좋을까요": {
        "type": PsychologyType.ANXIETY,
        "hidden_need": "긍정적 결과 기대",
        "advice_tone": "희망적, 따뜻함",
        "advice_focus": "좋은 점 강조 + 주의사항"
    },
    "나을까요": {
        "type": PsychologyType.ANXIETY,
        "hidden_need": "건강/상황 회복 기대",
        "advice_tone": "위로, 희망",
        "advice_focus": "회복 가능성 + 관리 방법"
    },

    # ========== 결정 지지 (DECISION) ==========
    # A vs B 선택, 결정 장애
    "뭐가 나을까요": {
        "type": PsychologyType.DECISION,
        "hidden_need": "선택의 책임 분산",
        "advice_tone": "명확한 방향 제시",
        "advice_focus": "각 선택의 장단점 + 추천"
    },
    "어떤 게 좋을까요": {
        "type": PsychologyType.DECISION,
        "hidden_need": "최선의 선택 확인",
        "advice_tone": "분석적, 명확",
        "advice_focus": "상황별 추천 + 이유"
    },
    "해야 할까요": {
        "type": PsychologyType.DECISION,
        "hidden_need": "행동 여부 결정 지지",
        "advice_tone": "명확, 지지적",
        "advice_focus": "행동/비행동의 결과 비교"
    },
    "말해야 할까요": {
        "type": PsychologyType.DECISION,
        "hidden_need": "표현 vs 침묵 갈등",
        "advice_tone": "공감적, 방향 제시",
        "advice_focus": "말했을 때/안 했을 때 결과"
    },

    # ========== 희망 추구 (HOPE) ==========
    "생길까요": {
        "type": PsychologyType.HOPE,
        "hidden_need": "좋은 일에 대한 기대",
        "advice_tone": "긍정적, 희망적",
        "advice_focus": "가능성 열어두기 + 준비 자세"
    },
    "올까요": {
        "type": PsychologyType.HOPE,
        "hidden_need": "기다림의 결과 확인",
        "advice_tone": "희망적, 인내 격려",
        "advice_focus": "기다림의 가치 + 능동적 행동"
    },
    "당첨될까요": {
        "type": PsychologyType.HOPE,
        "hidden_need": "행운/횡재 기대",
        "advice_tone": "현실적이면서 희망적",
        "advice_focus": "운의 흐름 + 현실적 조언"
    },
    "만날 수 있을까요": {
        "type": PsychologyType.HOPE,
        "hidden_need": "인연에 대한 기대",
        "advice_tone": "따뜻한 희망",
        "advice_focus": "만남의 가능성 + 준비"
    },

    # ========== 통제감 회복 (CONTROL) ==========
    "왜 그럴까요": {
        "type": PsychologyType.CONTROL,
        "hidden_need": "상황 이해, 원인 파악",
        "advice_tone": "분석적, 이해 돕기",
        "advice_focus": "원인 분석 + 대처 방법"
    },
    "어떻게 해야": {
        "type": PsychologyType.CONTROL,
        "hidden_need": "행동 지침, 방향 필요",
        "advice_tone": "구체적, 실용적",
        "advice_focus": "단계별 행동 가이드"
    },
    "조심해야": {
        "type": PsychologyType.AVOIDANCE,
        "hidden_need": "불운 회피, 예방",
        "advice_tone": "주의 환기, 보호적",
        "advice_focus": "주의사항 + 예방법"
    },

    # ========== 관계 욕구 (CONNECTION) ==========
    "좋아할까요": {
        "type": PsychologyType.CONNECTION,
        "hidden_need": "상대방 마음 확인",
        "advice_tone": "공감적, 희망적",
        "advice_focus": "관계 신호 해석 + 접근법"
    },
    "관심 있을까요": {
        "type": PsychologyType.CONNECTION,
        "hidden_need": "상대방 감정 파악",
        "advice_tone": "객관적, 희망적",
        "advice_focus": "관심 신호 + 확인 방법"
    },
    "화해할 수 있을까요": {
        "type": PsychologyType.CONNECTION,
        "hidden_need": "관계 회복 가능성",
        "advice_tone": "따뜻한 격려",
        "advice_focus": "화해 가능성 + 접근 방법"
    },
    "연락 올까요": {
        "type": PsychologyType.CONNECTION,
        "hidden_need": "상대방 행동 예측",
        "advice_tone": "현실적, 희망적",
        "advice_focus": "가능성 + 내가 할 수 있는 것"
    },
    "어떻게 생각할까요": {
        "type": PsychologyType.CONNECTION,
        "hidden_need": "타인 시선/평가 궁금",
        "advice_tone": "안심, 객관적",
        "advice_focus": "상대 관점 + 자기 확신"
    },

    # ========== 자기 검증 (VALIDATION) ==========
    "잘한 걸까요": {
        "type": PsychologyType.VALIDATION,
        "hidden_need": "과거 선택에 대한 확인",
        "advice_tone": "위로, 인정",
        "advice_focus": "선택 인정 + 앞으로의 방향"
    },
    "맞는 걸까요": {
        "type": PsychologyType.VALIDATION,
        "hidden_need": "내 판단/감정 검증",
        "advice_tone": "공감, 지지",
        "advice_focus": "감정 인정 + 객관적 시각"
    },
    "괜찮은 걸까요": {
        "type": PsychologyType.VALIDATION,
        "hidden_need": "현재 상태 확인",
        "advice_tone": "안심, 격려",
        "advice_focus": "현재 상태 인정 + 개선점"
    },
}


# ============================================================================
# 심리 유형별 점괘 해석 템플릿 (점술가 톤)
# ============================================================================

ORACLE_TEMPLATES: Dict[PsychologyType, Dict] = {
    PsychologyType.CONFIRMATION: {
        "opening": [
            "그대의 마음은 이미 답을 품고 있도다.",
            "점괘를 보니, 마음의 방향이 이미 정해져 있구나.",
            "하늘이 보여주는 바, 그대는 이미 결심하였도다.",
        ],
        "oracle": [
            "그 길을 따라가도 좋으리라.",
            "그대의 직감이 곧 하늘의 뜻이니라.",
            "준비된 마음이라면 나아가도 무방하리라.",
        ],
        "caution": [
            "다만, {caution_point}은 살펴야 하느니라.",
            "한 가지, {caution_point}만 경계하라.",
        ],
        "closing": [
            "용기를 내어 한 걸음 나아가라.",
            "하늘이 그대의 길을 열어주리라.",
        ],
    },

    PsychologyType.ANXIETY: {
        "opening": [
            "근심하는 마음이 점괘에 비치는도다.",
            "두려움이 느껴지나, 이는 자연스러운 것이니라.",
            "큰 일 앞에 긴장함은 당연한 것이니라.",
        ],
        "oracle": [
            "허나 점괘가 이르기를, 그대는 이미 준비되었느니라.",
            "하늘이 보기에 그대의 노력은 충분하도다.",
            "결과보다 과정에 마음을 두라.",
        ],
        "guidance": [
            "{positive_point}의 기운이 감도는도다.",
            "운의 흐름이 {direction}을 향하고 있느니라.",
        ],
        "closing": [
            "마음을 고요히 하고, 지금 이 순간에 머물라.",
            "그대의 정성은 반드시 빛을 보리라.",
            "근심은 내려놓고, 할 수 있는 것에 힘쓰라.",
        ],
    },

    PsychologyType.DECISION: {
        "opening": [
            "갈림길에 서 있는 그대의 모습이 보이는도다.",
            "두 길 사이에서 망설이고 있구나.",
            "어느 쪽이 옳은지 혼란스러운 때로다.",
        ],
        "analysis": [
            "점괘가 보여주는 바, {analysis}",
            "두 길의 운을 살펴보건대, {comparison}",
        ],
        "oracle": [
            "지금 시점에서는 {recommendation}이 더 길(吉)하도다.",
            "그대의 상황을 헤아려보건대, {recommendation}이 이롭도다.",
        ],
        "closing": [
            "어느 길을 택하든, 그대를 성장시키리라.",
            "정답은 없느니, 그대가 택한 것이 곧 답이 되리라.",
        ],
    },

    PsychologyType.HOPE: {
        "opening": [
            "좋은 일을 바라는 마음이 점괘에 비치는도다.",
            "희망을 품은 그대의 모습이 아름답도다.",
            "설렘이 느껴지는구나.",
        ],
        "oracle": [
            "가능성의 문은 열려 있느니라.",
            "기다림에도 힘이 있음을 잊지 말라.",
            "길한 기운이 다가오고 있도다.",
        ],
        "guidance": [
            "다만, 기다리면서도 {action}을 게을리 말라.",
            "희망을 품되, {action}도 함께 하라.",
        ],
        "closing": [
            "좋은 일은 준비된 자에게 찾아오느니라.",
            "그대의 밝은 기운이 복을 불러들이리라.",
        ],
    },

    PsychologyType.CONTROL: {
        "opening": [
            "혼란스러운 상황이 점괘에 비치는도다.",
            "왜 이런 일이 일어나는지 답답하구나.",
            "뜻대로 되지 않아 힘겨운 때로다.",
        ],
        "oracle": [
            "이 상황이 생긴 것은 {reason}의 운이 작용함이니라.",
            "지금 겪고 있는 것은 {interpretation}의 시기니라.",
        ],
        "guidance": [
            "지금 그대가 할 수 있는 것은 {action}이니라.",
            "바꿀 수 있는 것에 힘을 쏟으라: {action}",
        ],
        "closing": [
            "모든 것을 다스릴 수 없음을 받아들이라.",
            "할 수 있는 것에 집중하면 길이 보이리라.",
        ],
    },

    PsychologyType.CONNECTION: {
        "opening": [
            "그 사람의 마음이 궁금하구나.",
            "인연에 대한 물음이 점괘에 비치는도다.",
            "상대의 진심을 알고자 하는구나.",
        ],
        "oracle": [
            "점괘가 보여주기를, 상대방은 {insight}의 마음이 있도다.",
            "인연의 흐름을 보건대, {flow}",
        ],
        "guidance": [
            "지금은 {approach}하는 것이 이로우리라.",
            "상대에게 {action}해 보라.",
        ],
        "closing": [
            "진심은 결국 통하게 되어 있느니라.",
            "인연은 쌍방의 것이니, 그대의 정성도 중요하도다.",
            "상대의 반응보다 그대의 마음에 솔직하라.",
        ],
    },

    PsychologyType.VALIDATION: {
        "opening": [
            "그대는 지금까지 잘 해왔느니라.",
            "점괘가 이르기를, 그대의 선택은 틀리지 않았도다.",
            "스스로를 의심하지 말라.",
        ],
        "oracle": [
            "그때 그 선택은 그 상황에서 최선이었느니라.",
            "그대는 충분히 잘하고 있도다.",
            "후회할 것이 없느니라.",
        ],
        "guidance": [
            "이제는 {forward_action}에 마음을 두라.",
            "지난 것보다 앞으로의 {direction}이 더 중요하니라.",
        ],
        "closing": [
            "스스로를 믿으라. 그대는 충분하도다.",
            "지금의 그대는 과거의 선택들이 빚어낸 결과니라.",
        ],
    },

    PsychologyType.AVOIDANCE: {
        "opening": [
            "조심하고자 하는 마음, 현명한 자세로다.",
            "미리 대비하려는 그대의 지혜가 느껴지는도다.",
        ],
        "warning": [
            "오늘은 {warning}을 경계하라.",
            "{warning}만 삼가면 무탈하리라.",
        ],
        "protection": [
            "{protection}하면 액을 피할 수 있으리라.",
            "{protection}이 오늘의 행운 비결이니라.",
        ],
        "closing": [
            "준비된 자에게 액운은 비껴가느니라.",
            "경계하되 두려워하지는 말라.",
        ],
    },
}


# ============================================================================
# 심리 분석 함수
# ============================================================================

def analyze_question_psychology(question: str) -> PsychologyProfile:
    """
    질문에서 심리 유형 분석

    Args:
        question: 사용자 질문

    Returns:
        PsychologyProfile: 심리 프로필
    """
    question_lower = question.lower().strip()

    # 패턴 매칭으로 심리 유형 탐지
    matched_patterns = []

    for pattern, info in QUESTION_PATTERNS.items():
        if pattern in question_lower:
            matched_patterns.append({
                "pattern": pattern,
                **info
            })

    # 매칭된 패턴이 없으면 기본값
    if not matched_patterns:
        return PsychologyProfile(
            primary_type=PsychologyType.HOPE,
            confidence=0.3,
            hidden_need="막연한 궁금증",
            advice_tone="따뜻한 격려",
            advice_focus="긍정적 가능성"
        )

    # 가장 먼저 매칭된 패턴 사용 (추후 가중치 로직 추가 가능)
    primary = matched_patterns[0]
    secondary = matched_patterns[1] if len(matched_patterns) > 1 else None

    return PsychologyProfile(
        primary_type=primary["type"],
        secondary_type=secondary["type"] if secondary else None,
        confidence=min(0.9, 0.5 + len(matched_patterns) * 0.2),
        hidden_need=primary["hidden_need"],
        advice_tone=primary["advice_tone"],
        advice_focus=primary["advice_focus"]
    )


def get_advice_template(psychology_type: PsychologyType) -> Dict:
    """심리 유형에 맞는 조언 템플릿 반환"""
    return ADVICE_TEMPLATES.get(psychology_type, ADVICE_TEMPLATES[PsychologyType.HOPE])


# ============================================================================
# 테스트
# ============================================================================

if __name__ == "__main__":
    test_questions = [
        "비트코인 사도 될까요?",
        "면접 잘 볼 수 있을까요?",
        "그 사람이 나를 좋아할까요?",
        "이직해야 할까요?",
        "왜 자꾸 안 좋은 일만 생길까요?",
        "오늘 좋은 일 생길까요?",
        "내 선택이 맞는 걸까요?",
        "오늘 뭐 조심해야 해요?",
    ]

    print("\n" + "="*60)
    print("🧠 질문 심리 분석 테스트")
    print("="*60)

    for q in test_questions:
        profile = analyze_question_psychology(q)
        print(f"\n📝 \"{q}\"")
        print(f"   유형: {profile.primary_type.value}")
        print(f"   숨겨진 욕구: {profile.hidden_need}")
        print(f"   조언 톤: {profile.advice_tone}")
        print(f"   신뢰도: {profile.confidence:.0%}")

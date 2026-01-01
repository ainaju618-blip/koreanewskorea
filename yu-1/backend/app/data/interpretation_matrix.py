"""
결합 매트릭스 (結合 Matrix)

AI 해석 가이드라인 v1.0 기반
효사 방향(3) × 질문 방향(4) = 12가지 행동 지침

매트릭스:
┌────────┬──────────┬──────────┬──────────┬──────────┐
│        │ 시작     │ 유지     │ 변화     │ 종료     │
├────────┼──────────┼──────────┼──────────┼──────────┤
│ 상승   │ 나아가라 │ 키워가라 │ 도약하라 │ 아직아니다│
│ 정체   │ 기다리라 │ 지키라   │ 때를봐라 │ 머물러라 │
│ 하강   │ 멈춰라   │ 돌아보라 │ 움직이지말라│ 떠나라 │
└────────┴──────────┴──────────┴──────────┴──────────┘
"""
from dataclasses import dataclass
from typing import Dict, Tuple, Optional
from app.data.yao_direction import YaoDirection
from app.data.question_direction import QuestionDirection


@dataclass
class ActionGuidance:
    """행동 지침 데이터"""
    action: str                  # 핵심 지침 (예: "나아가라")
    description: str             # 상세 설명
    oracle_phrase: str           # 점술가 어조 문장
    caution: str                 # 주의사항
    fortune_tendency: str        # 운세 경향 (길/흉/중립)
    compatibility_score: float   # 질문-효사 일치도 (0.0 ~ 1.0)


# =============================================================================
# 12가지 결합 매트릭스
# =============================================================================

INTERPRETATION_MATRIX: Dict[Tuple[YaoDirection, QuestionDirection], ActionGuidance] = {
    # =========================================================================
    # 상승(ASCENDING) + 질문 방향
    # =========================================================================

    # 상승 + 시작 = 나아가라 (최적 조합)
    (YaoDirection.ASCENDING, QuestionDirection.START): ActionGuidance(
        action="나아가세요",
        description="지금 기운이 딱 맞아요! 시작하기 정말 좋은 때예요 ✨",
        oracle_phrase="타이밍이 완벽해요! 망설이지 말고 시작해보세요. 우주가 응원하고 있어요!",
        caution="다만 겸손한 마음은 잊지 마세요. 자만하면 좋은 기회도 놓칠 수 있어요.",
        fortune_tendency="대길",
        compatibility_score=1.0
    ),

    # 상승 + 유지 = 키워가라
    (YaoDirection.ASCENDING, QuestionDirection.MAINTAIN): ActionGuidance(
        action="키워가세요",
        description="지금 좋은 흐름이에요! 가진 것을 더 키워나갈 때예요 🌱",
        oracle_phrase="씨앗이 잘 자라고 있어요. 정성껏 키워가세요. 더 좋아질 거예요!",
        caution="너무 급하게 결과를 바라지 마세요. 좋은 건 천천히 익어가요.",
        fortune_tendency="길",
        compatibility_score=0.85
    ),

    # 상승 + 변화 = 도약하라 (적극 조합)
    (YaoDirection.ASCENDING, QuestionDirection.CHANGE): ActionGuidance(
        action="도약하세요",
        description="상승 기운과 변화 에너지가 만났어요! 큰 도약의 기회예요 🚀",
        oracle_phrase="날아오를 준비가 됐어요! 과감하게 도전해보세요. 새로운 세상이 열릴 거예요!",
        caution="준비 없이 뛰면 넘어질 수 있으니, 기본기는 챙기고 도전하세요.",
        fortune_tendency="대길",
        compatibility_score=0.95
    ),

    # 상승 + 종료 = 아직아니다 (불일치)
    (YaoDirection.ASCENDING, QuestionDirection.END): ActionGuidance(
        action="아직이에요",
        description="기운은 올라가는데 끝내려고 하시네요. 조금 더 지켜보세요 🤔",
        oracle_phrase="지금 포기하기엔 아까워요. 좀 더 가능성을 지켜봐주세요.",
        caution="좋은 흐름을 끊으면 나중에 후회할 수 있어요. 신중하게 생각해보세요.",
        fortune_tendency="중길",
        compatibility_score=0.3
    ),

    # =========================================================================
    # 정체(STAGNANT) + 질문 방향
    # =========================================================================

    # 정체 + 시작 = 기다리라
    (YaoDirection.STAGNANT, QuestionDirection.START): ActionGuidance(
        action="기다려보세요",
        description="아직 타이밍이 완전히 무르익진 않았어요. 조금만 기다려봐요 ⏳",
        oracle_phrase="아직은 준비 단계예요. 조금만 더 힘을 모아보세요. 때가 올 거예요!",
        caution="조급하면 오히려 일을 그르칠 수 있어요. 기다림도 실력이에요!",
        fortune_tendency="중평",
        compatibility_score=0.5
    ),

    # 정체 + 유지 = 지키라 (최적 조합)
    (YaoDirection.STAGNANT, QuestionDirection.MAINTAIN): ActionGuidance(
        action="지켜가세요",
        description="지금은 유지의 시기예요. 가진 것을 잘 지켜가세요 🛡️",
        oracle_phrase="지금은 지키는 게 최선이에요. 흔들리지 말고 꾸준히 가세요!",
        caution="무리하게 확장하려 하지 마세요. 지키는 것도 얻는 거예요.",
        fortune_tendency="길",
        compatibility_score=1.0
    ),

    # 정체 + 변화 = 때를봐라
    (YaoDirection.STAGNANT, QuestionDirection.CHANGE): ActionGuidance(
        action="때를 봐주세요",
        description="변화하고 싶은 마음은 알겠지만, 타이밍이 아직이에요 👀",
        oracle_phrase="조금 더 지켜보세요. 서두르면 오히려 역효과가 날 수 있어요.",
        caution="성급한 변화는 더 큰 정체를 불러올 수 있어요.",
        fortune_tendency="중평",
        compatibility_score=0.45
    ),

    # 정체 + 종료 = 머물러라
    (YaoDirection.STAGNANT, QuestionDirection.END): ActionGuidance(
        action="좀 더 있어봐요",
        description="끝내고 싶지만, 아직은 머무를 때예요 🏠",
        oracle_phrase="떠나기엔 정리할 게 남았어요. 조금 더 있어보세요.",
        caution="미련이 아니라 필요해서 머무는 거예요. 헷갈리지 마세요!",
        fortune_tendency="중평",
        compatibility_score=0.55
    ),

    # =========================================================================
    # 하강(DESCENDING) + 질문 방향
    # =========================================================================

    # 하강 + 시작 = 멈춰라 (경고 조합)
    (YaoDirection.DESCENDING, QuestionDirection.START): ActionGuidance(
        action="잠깐 멈춰요",
        description="지금은 시작하기에 좋은 때가 아니에요. 조심해야 해요 ⚠️",
        oracle_phrase="지금 시작하면 힘들 수 있어요. 잠시 멈추고 다시 생각해보세요.",
        caution="이 조언을 가볍게 넘기지 마세요. 지금은 쉬어가는 게 좋아요.",
        fortune_tendency="흉",
        compatibility_score=0.15
    ),

    # 하강 + 유지 = 돌아보라
    (YaoDirection.DESCENDING, QuestionDirection.MAINTAIN): ActionGuidance(
        action="돌아봐주세요",
        description="유지하고 싶지만 기반이 흔들리고 있어요. 점검이 필요해요 🔍",
        oracle_phrase="뭔가 문제가 있어요. 무엇이 잘못됐는지 살펴보세요. 고칠 건 고쳐야 해요.",
        caution="문제를 외면하면 더 커질 수 있어요. 지금 직시하세요.",
        fortune_tendency="소흉",
        compatibility_score=0.4
    ),

    # 하강 + 변화 = 움직이지말라
    (YaoDirection.DESCENDING, QuestionDirection.CHANGE): ActionGuidance(
        action="지금은 기다려요",
        description="변화하고 싶은 마음은 알지만, 지금은 타이밍이 안 좋아요 🛑",
        oracle_phrase="지금 움직이면 더 힘들어질 수 있어요. 일단 기다려보세요.",
        caution="이 조언을 무시하면 나중에 후회할 수 있어요.",
        fortune_tendency="대흉",
        compatibility_score=0.1
    ),

    # 하강 + 종료 = 떠나라 (최적 조합)
    (YaoDirection.DESCENDING, QuestionDirection.END): ActionGuidance(
        action="정리하세요",
        description="끝내려는 마음과 기운이 맞아요. 정리하고 새 출발 준비해요 🚪",
        oracle_phrase="낡은 것을 정리할 때가 됐어요. 미련 없이 떠나세요. 새 길이 열려요!",
        caution="떠날 때는 깔끔하게! 뒤돌아보면 발목 잡혀요.",
        fortune_tendency="중길",
        compatibility_score=0.9
    ),
}


# =============================================================================
# 조회 함수
# =============================================================================

def get_action_guidance(
    yao_direction: YaoDirection,
    question_direction: QuestionDirection
) -> ActionGuidance:
    """
    효사 방향과 질문 방향을 결합하여 행동 지침 반환

    Args:
        yao_direction: 효사의 방향 (상승/정체/하강)
        question_direction: 질문의 방향 (시작/유지/변화/종료)

    Returns:
        ActionGuidance: 결합된 행동 지침
    """
    key = (yao_direction, question_direction)

    if key in INTERPRETATION_MATRIX:
        return INTERPRETATION_MATRIX[key]

    # Fallback (이론상 도달 불가)
    return ActionGuidance(
        action="신중하게요",
        description="운세를 읽기 조금 어려워요. 신중하게 행동해주세요 🤔",
        oracle_phrase="아직 확실하지 않아요. 신중하게 움직여주세요.",
        caution="확실하지 않을 땐 일단 멈추는 게 좋아요.",
        fortune_tendency="중평",
        compatibility_score=0.5
    )


def get_compatibility_level(score: float) -> str:
    """호환성 점수를 레벨로 변환"""
    if score >= 0.9:
        return "최적"
    elif score >= 0.7:
        return "양호"
    elif score >= 0.5:
        return "보통"
    elif score >= 0.3:
        return "불일치"
    else:
        return "경고"


def get_fortune_emoji(tendency: str) -> str:
    """운세 경향에 따른 이모지 (내부용)"""
    emoji_map = {
        "대길": "🌟",
        "길": "✨",
        "중길": "☀️",
        "중평": "🌤️",
        "소흉": "🌥️",
        "흉": "⚠️",
        "대흉": "🚨"
    }
    return emoji_map.get(tendency, "❓")


def analyze_compatibility(
    yao_direction: YaoDirection,
    question_direction: QuestionDirection
) -> Dict:
    """
    상세 호환성 분석

    Returns:
        Dict with action, level, score, recommendation
    """
    guidance = get_action_guidance(yao_direction, question_direction)

    return {
        "action": guidance.action,
        "level": get_compatibility_level(guidance.compatibility_score),
        "score": guidance.compatibility_score,
        "tendency": guidance.fortune_tendency,
        "recommendation": guidance.oracle_phrase,
        "caution": guidance.caution,
        "is_optimal": guidance.compatibility_score >= 0.9,
        "is_warning": guidance.compatibility_score < 0.3
    }


# =============================================================================
# 테스트
# =============================================================================

if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("결합 매트릭스 테스트")
    print("=" * 70)

    # 전체 매트릭스 출력
    print("\n┌────────┬──────────┬──────────┬──────────┬──────────┐")
    print("│        │ 시작     │ 유지     │ 변화     │ 종료     │")
    print("├────────┼──────────┼──────────┼──────────┼──────────┤")

    for yao_dir in YaoDirection:
        row = f"│ {yao_dir.value:4s} │"
        for q_dir in QuestionDirection:
            guidance = get_action_guidance(yao_dir, q_dir)
            row += f" {guidance.action:8s} │"
        print(row)

    print("└────────┴──────────┴──────────┴──────────┴──────────┘")

    # 상세 테스트
    test_cases = [
        (YaoDirection.ASCENDING, QuestionDirection.START, "고백해도 될까요?"),
        (YaoDirection.STAGNANT, QuestionDirection.START, "잠룡물용 + 시작"),
        (YaoDirection.DESCENDING, QuestionDirection.CHANGE, "이직해도 될까요?"),
        (YaoDirection.DESCENDING, QuestionDirection.END, "헤어지는게 나을까요?"),
    ]

    print("\n" + "-" * 70)
    print("상세 테스트 케이스")
    print("-" * 70)

    for yao_dir, q_dir, desc in test_cases:
        analysis = analyze_compatibility(yao_dir, q_dir)
        print(f"\n[{desc}]")
        print(f"  효사: {yao_dir.value}, 질문: {q_dir.value}")
        print(f"  지침: {analysis['action']} ({analysis['level']}, {analysis['score']:.0%})")
        print(f"  운세: {analysis['tendency']}")
        print(f"  문장: {analysis['recommendation']}")

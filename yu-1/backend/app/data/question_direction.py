"""
질문 방향(質問 方向) 분석 시스템

AI 해석 가이드라인 v1.0 기반
사용자 질문에서 의도하는 방향을 분석

질문 방향 정의:
- 시작(START): 새로운 것을 시작하려 함 - "고백해도 될까요?"
- 유지(MAINTAIN): 현상태를 유지하려 함 - "이 관계 괜찮을까요?"
- 변화(CHANGE): 현상태를 바꾸려 함 - "이직해도 될까요?"
- 종료(END): 무언가를 끝내려 함 - "헤어지는게 나을까요?"
"""
from enum import Enum
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass


class QuestionDirection(Enum):
    """질문 방향"""
    START = "시작"      # 새로운 것을 시작하려 함
    MAINTAIN = "유지"   # 현상태를 유지하려 함
    CHANGE = "변화"     # 현상태를 바꾸려 함
    END = "종료"        # 무언가를 끝내려 함


@dataclass
class QuestionAnalysisResult:
    """질문 분석 결과"""
    direction: QuestionDirection
    confidence: float           # 0.0 ~ 1.0
    matched_pattern: str        # 매칭된 패턴
    matched_category: str       # START/MAINTAIN/CHANGE/END


# =============================================================================
# 질문 패턴 → 방향 매핑
# =============================================================================

QUESTION_DIRECTION_PATTERNS: Dict[str, Dict] = {
    # =========================================================================
    # 시작 (START) - 새로운 것을 시작하려는 의도
    # =========================================================================

    # 행동 시작 패턴
    "해도 될까요": {"direction": QuestionDirection.START, "confidence": 0.90},
    "해도 될까": {"direction": QuestionDirection.START, "confidence": 0.90},
    "해도 괜찮을까요": {"direction": QuestionDirection.START, "confidence": 0.85},
    "해도 괜찮을까": {"direction": QuestionDirection.START, "confidence": 0.85},
    "시작해도": {"direction": QuestionDirection.START, "confidence": 0.95},
    "시작할까요": {"direction": QuestionDirection.START, "confidence": 0.95},
    "시작하면": {"direction": QuestionDirection.START, "confidence": 0.90},
    "해볼까요": {"direction": QuestionDirection.START, "confidence": 0.85},
    "해볼까": {"direction": QuestionDirection.START, "confidence": 0.85},

    # 연애 시작 패턴
    "고백해도": {"direction": QuestionDirection.START, "confidence": 0.95},
    "고백할까요": {"direction": QuestionDirection.START, "confidence": 0.95},
    "고백하면": {"direction": QuestionDirection.START, "confidence": 0.90},
    "만나도": {"direction": QuestionDirection.START, "confidence": 0.80},
    "사귀어도": {"direction": QuestionDirection.START, "confidence": 0.90},
    "연락해도": {"direction": QuestionDirection.START, "confidence": 0.85},
    "먼저 연락": {"direction": QuestionDirection.START, "confidence": 0.85},
    "다가가도": {"direction": QuestionDirection.START, "confidence": 0.85},
    "프로포즈": {"direction": QuestionDirection.START, "confidence": 0.95},

    # 재물/투자 시작 패턴
    "투자해도": {"direction": QuestionDirection.START, "confidence": 0.90},
    "사도 될까요": {"direction": QuestionDirection.START, "confidence": 0.90},
    "사도 될까": {"direction": QuestionDirection.START, "confidence": 0.90},
    "매수해도": {"direction": QuestionDirection.START, "confidence": 0.90},
    "매수할까요": {"direction": QuestionDirection.START, "confidence": 0.90},
    "들어가도": {"direction": QuestionDirection.START, "confidence": 0.80},
    "시작해도": {"direction": QuestionDirection.START, "confidence": 0.90},

    # 직장/학업 시작 패턴
    "지원해도": {"direction": QuestionDirection.START, "confidence": 0.90},
    "지원할까요": {"direction": QuestionDirection.START, "confidence": 0.90},
    "입사해도": {"direction": QuestionDirection.START, "confidence": 0.85},
    "도전해도": {"direction": QuestionDirection.START, "confidence": 0.85},
    "신청해도": {"direction": QuestionDirection.START, "confidence": 0.85},

    # =========================================================================
    # 유지 (MAINTAIN) - 현상태를 유지하려는 의도
    # =========================================================================

    # 상태 확인 패턴
    "괜찮을까요": {"direction": QuestionDirection.MAINTAIN, "confidence": 0.70},
    "괜찮은 걸까요": {"direction": QuestionDirection.MAINTAIN, "confidence": 0.75},
    "좋을까요": {"direction": QuestionDirection.MAINTAIN, "confidence": 0.65},
    "잘 될까요": {"direction": QuestionDirection.MAINTAIN, "confidence": 0.70},
    "계속해도": {"direction": QuestionDirection.MAINTAIN, "confidence": 0.90},
    "계속할까요": {"direction": QuestionDirection.MAINTAIN, "confidence": 0.90},
    "유지해도": {"direction": QuestionDirection.MAINTAIN, "confidence": 0.95},
    "유지할까요": {"direction": QuestionDirection.MAINTAIN, "confidence": 0.95},
    "이대로": {"direction": QuestionDirection.MAINTAIN, "confidence": 0.85},
    "지금처럼": {"direction": QuestionDirection.MAINTAIN, "confidence": 0.85},
    "그대로": {"direction": QuestionDirection.MAINTAIN, "confidence": 0.80},

    # 관계 유지 패턴
    "이 관계": {"direction": QuestionDirection.MAINTAIN, "confidence": 0.75},
    "이 사람": {"direction": QuestionDirection.MAINTAIN, "confidence": 0.70},
    "지금 만나는": {"direction": QuestionDirection.MAINTAIN, "confidence": 0.80},
    "현재 직장": {"direction": QuestionDirection.MAINTAIN, "confidence": 0.80},
    "현재 하는": {"direction": QuestionDirection.MAINTAIN, "confidence": 0.75},

    # 기다림 패턴
    "기다려야": {"direction": QuestionDirection.MAINTAIN, "confidence": 0.85},
    "기다리면": {"direction": QuestionDirection.MAINTAIN, "confidence": 0.80},
    "기다릴까요": {"direction": QuestionDirection.MAINTAIN, "confidence": 0.85},

    # =========================================================================
    # 변화 (CHANGE) - 현상태를 바꾸려는 의도
    # =========================================================================

    # 이동/전환 패턴
    "이직해도": {"direction": QuestionDirection.CHANGE, "confidence": 0.95},
    "이직할까요": {"direction": QuestionDirection.CHANGE, "confidence": 0.95},
    "이사해도": {"direction": QuestionDirection.CHANGE, "confidence": 0.90},
    "옮겨도": {"direction": QuestionDirection.CHANGE, "confidence": 0.90},
    "옮길까요": {"direction": QuestionDirection.CHANGE, "confidence": 0.90},
    "바꿔도": {"direction": QuestionDirection.CHANGE, "confidence": 0.90},
    "바꿀까요": {"direction": QuestionDirection.CHANGE, "confidence": 0.90},
    "전환해도": {"direction": QuestionDirection.CHANGE, "confidence": 0.85},
    "전직해도": {"direction": QuestionDirection.CHANGE, "confidence": 0.90},

    # 새로운 대상 패턴
    "다른 사람": {"direction": QuestionDirection.CHANGE, "confidence": 0.80},
    "다른 곳": {"direction": QuestionDirection.CHANGE, "confidence": 0.80},
    "다른 회사": {"direction": QuestionDirection.CHANGE, "confidence": 0.85},
    "새로운": {"direction": QuestionDirection.CHANGE, "confidence": 0.70},
    "다른 걸": {"direction": QuestionDirection.CHANGE, "confidence": 0.75},

    # 거래 변화 패턴
    "매도해도": {"direction": QuestionDirection.CHANGE, "confidence": 0.85},
    "팔아도": {"direction": QuestionDirection.CHANGE, "confidence": 0.85},
    "갈아타도": {"direction": QuestionDirection.CHANGE, "confidence": 0.90},
    "교체해도": {"direction": QuestionDirection.CHANGE, "confidence": 0.85},

    # =========================================================================
    # 종료 (END) - 무언가를 끝내려는 의도
    # =========================================================================

    # 관계 종료 패턴
    "헤어지": {"direction": QuestionDirection.END, "confidence": 0.95},
    "헤어져야": {"direction": QuestionDirection.END, "confidence": 0.95},
    "이별해야": {"direction": QuestionDirection.END, "confidence": 0.95},
    "이별하는 게": {"direction": QuestionDirection.END, "confidence": 0.95},
    "끝내야": {"direction": QuestionDirection.END, "confidence": 0.95},
    "끝낼까요": {"direction": QuestionDirection.END, "confidence": 0.95},
    "정리해야": {"direction": QuestionDirection.END, "confidence": 0.85},
    "정리할까요": {"direction": QuestionDirection.END, "confidence": 0.85},

    # 직장 종료 패턴
    "그만두": {"direction": QuestionDirection.END, "confidence": 0.95},
    "그만둬야": {"direction": QuestionDirection.END, "confidence": 0.95},
    "퇴사해야": {"direction": QuestionDirection.END, "confidence": 0.95},
    "퇴사할까요": {"direction": QuestionDirection.END, "confidence": 0.95},
    "사직해야": {"direction": QuestionDirection.END, "confidence": 0.90},

    # 포기/중단 패턴
    "포기해야": {"direction": QuestionDirection.END, "confidence": 0.90},
    "포기할까요": {"direction": QuestionDirection.END, "confidence": 0.90},
    "포기하는 게": {"direction": QuestionDirection.END, "confidence": 0.90},
    "멈춰야": {"direction": QuestionDirection.END, "confidence": 0.85},
    "멈출까요": {"direction": QuestionDirection.END, "confidence": 0.85},
    "중단해야": {"direction": QuestionDirection.END, "confidence": 0.85},
    "그만해야": {"direction": QuestionDirection.END, "confidence": 0.90},

    # 손절 패턴
    "손절해야": {"direction": QuestionDirection.END, "confidence": 0.90},
    "손절할까요": {"direction": QuestionDirection.END, "confidence": 0.90},
    "정리할까요": {"direction": QuestionDirection.END, "confidence": 0.80},
    "빠져야": {"direction": QuestionDirection.END, "confidence": 0.80},
    "빠질까요": {"direction": QuestionDirection.END, "confidence": 0.80},
}


# =============================================================================
# 분석 함수
# =============================================================================

def analyze_question_direction(question: str) -> QuestionAnalysisResult:
    """
    질문에서 방향 분석

    Args:
        question: 사용자 질문

    Returns:
        QuestionAnalysisResult: 방향, 신뢰도, 매칭 패턴
    """
    question_lower = question.lower().strip()

    best_match: Optional[Tuple[str, Dict]] = None
    best_confidence = 0.0

    # 패턴 매칭
    for pattern, info in QUESTION_DIRECTION_PATTERNS.items():
        if pattern in question_lower:
            if info["confidence"] > best_confidence:
                best_confidence = info["confidence"]
                best_match = (pattern, info)

    if best_match:
        pattern, info = best_match
        return QuestionAnalysisResult(
            direction=info["direction"],
            confidence=best_confidence,
            matched_pattern=pattern,
            matched_category=info["direction"].value
        )

    # Fallback: 기본값 (시작) - 대부분의 질문은 "해도 될까요" 류
    return QuestionAnalysisResult(
        direction=QuestionDirection.START,
        confidence=0.30,
        matched_pattern="",
        matched_category="시작"
    )


def get_direction_korean(direction: QuestionDirection) -> str:
    """방향의 한글 표현"""
    return direction.value


def get_direction_action_verb(direction: QuestionDirection) -> str:
    """방향별 대표 행동 동사"""
    verbs = {
        QuestionDirection.START: "시작하려",
        QuestionDirection.MAINTAIN: "유지하려",
        QuestionDirection.CHANGE: "바꾸려",
        QuestionDirection.END: "끝내려"
    }
    return verbs.get(direction, "알아보려")


def get_opposite_direction(direction: QuestionDirection) -> QuestionDirection:
    """반대 방향"""
    opposites = {
        QuestionDirection.START: QuestionDirection.END,
        QuestionDirection.MAINTAIN: QuestionDirection.CHANGE,
        QuestionDirection.CHANGE: QuestionDirection.MAINTAIN,
        QuestionDirection.END: QuestionDirection.START
    }
    return opposites.get(direction, direction)


# =============================================================================
# 테스트
# =============================================================================

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("질문 방향 분석 테스트")
    print("=" * 60)

    test_questions = [
        # 시작
        "비트코인 사도 될까요?",
        "고백해도 될까요?",
        "이 회사에 지원해도 될까요?",

        # 유지
        "이 관계 계속해도 될까요?",
        "현재 직장에서 기다려야 할까요?",

        # 변화
        "이직해도 될까요?",
        "다른 사람 만나볼까요?",

        # 종료
        "헤어지는 게 나을까요?",
        "퇴사해야 할까요?",
        "손절해야 할까요?",
    ]

    for q in test_questions:
        result = analyze_question_direction(q)
        print(f"\n[{result.direction.value}] \"{q}\"")
        print(f"   신뢰도: {result.confidence:.0%}")
        print(f"   매칭패턴: '{result.matched_pattern}'")

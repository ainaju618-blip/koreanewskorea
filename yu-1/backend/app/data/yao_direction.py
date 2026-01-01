"""
효사 방향(爻辭 方向) 데이터

AI 해석 가이드라인 v1.0 기반
효사 방향과 질문 방향의 결합으로 행동 지침을 도출

효사 방향 정의:
- 상승(ASCENDING): 전진, 발전, 성취 가능 - 비룡재천, 견룡재전 등
- 정체(STAGNANT): 대기, 준비, 인내 필요 - 잠룡물용, 혹약재연 등
- 하강(DESCENDING): 후퇴, 주의, 위험 경고 - 항룡유회 등
"""
from enum import Enum
from typing import Dict, Tuple, Optional
from dataclasses import dataclass


class YaoDirection(Enum):
    """효사 방향"""
    ASCENDING = "상승"      # 전진, 발전, 성취 가능
    STAGNANT = "정체"       # 대기, 준비, 인내 필요
    DESCENDING = "하강"     # 후퇴, 주의, 위험 경고


@dataclass
class YaoDirectionInfo:
    """효사 방향 상세 정보"""
    direction: YaoDirection
    description: str
    action_tendency: str    # 적극/중립/소극


# =============================================================================
# 핵심 효사 방향 매핑 (수동 분류)
# 건괘, 곤괘 및 주요 효사 50개
# =============================================================================

CORE_YAO_DIRECTION_MAP: Dict[Tuple[int, int], YaoDirectionInfo] = {
    # =========================================================================
    # 제1괘 건(乾) - 건위천
    # =========================================================================
    (1, 1): YaoDirectionInfo(
        direction=YaoDirection.STAGNANT,
        description="잠룡물용 - 숨은 용은 쓰지 말라. 아직 때가 아니다.",
        action_tendency="소극"
    ),
    (1, 2): YaoDirectionInfo(
        direction=YaoDirection.ASCENDING,
        description="견룡재전 - 용이 밭에 나타남. 귀인을 만나 발전한다.",
        action_tendency="적극"
    ),
    (1, 3): YaoDirectionInfo(
        direction=YaoDirection.STAGNANT,
        description="군자종일건건 - 끊임없이 노력하고 경계해야 한다.",
        action_tendency="중립"
    ),
    (1, 4): YaoDirectionInfo(
        direction=YaoDirection.ASCENDING,
        description="혹약재연 - 도약할 수 있는 기회. 신중하되 기회를 잡아라.",
        action_tendency="적극"
    ),
    (1, 5): YaoDirectionInfo(
        direction=YaoDirection.ASCENDING,
        description="비룡재천 - 나는 용이 하늘에. 최고의 때, 대업을 이룬다.",
        action_tendency="적극"
    ),
    (1, 6): YaoDirectionInfo(
        direction=YaoDirection.DESCENDING,
        description="항룡유회 - 높이 오른 용은 후회가 있다. 물러날 때를 알라.",
        action_tendency="소극"
    ),

    # =========================================================================
    # 제2괘 곤(坤) - 곤위지
    # =========================================================================
    (2, 1): YaoDirectionInfo(
        direction=YaoDirection.DESCENDING,
        description="이상견빙 - 서리를 밟으면 얼음이 온다. 징조를 살펴라.",
        action_tendency="소극"
    ),
    (2, 2): YaoDirectionInfo(
        direction=YaoDirection.ASCENDING,
        description="직방대 - 곧고 바르고 크니 이롭다. 순리를 따르라.",
        action_tendency="적극"
    ),
    (2, 3): YaoDirectionInfo(
        direction=YaoDirection.STAGNANT,
        description="함장가정 - 아름다움을 품고 때를 기다리라.",
        action_tendency="중립"
    ),
    (2, 4): YaoDirectionInfo(
        direction=YaoDirection.STAGNANT,
        description="괄낭 - 주머니를 묶으니 허물이 없다. 침묵하라.",
        action_tendency="소극"
    ),
    (2, 5): YaoDirectionInfo(
        direction=YaoDirection.ASCENDING,
        description="황상원길 - 누런 치마이니 크게 길하다.",
        action_tendency="적극"
    ),
    (2, 6): YaoDirectionInfo(
        direction=YaoDirection.DESCENDING,
        description="용전우야 - 용이 들에서 싸우니 피가 흐른다. 다툼을 피하라.",
        action_tendency="소극"
    ),

    # =========================================================================
    # 제3괘 준(屯) - 수뢰둔
    # =========================================================================
    (3, 1): YaoDirectionInfo(
        direction=YaoDirection.STAGNANT,
        description="반환 - 머뭇거림. 바르게 거처하면 이롭다.",
        action_tendency="소극"
    ),
    (3, 2): YaoDirectionInfo(
        direction=YaoDirection.STAGNANT,
        description="둔여탄여 - 어려움이 있다. 10년을 기다려야 할 수도.",
        action_tendency="소극"
    ),
    (3, 5): YaoDirectionInfo(
        direction=YaoDirection.STAGNANT,
        description="둔기고 - 은혜를 베풀기 어렵다. 작은 일에 길하다.",
        action_tendency="중립"
    ),

    # =========================================================================
    # 제5괘 수(需) - 수천수
    # =========================================================================
    (5, 1): YaoDirectionInfo(
        direction=YaoDirection.STAGNANT,
        description="수우교 - 교외에서 기다림. 항상함이 이롭다.",
        action_tendency="소극"
    ),
    (5, 5): YaoDirectionInfo(
        direction=YaoDirection.ASCENDING,
        description="수우주식 - 술과 음식으로 기다림. 바르면 길하다.",
        action_tendency="적극"
    ),

    # =========================================================================
    # 제11괘 태(泰) - 지천태
    # =========================================================================
    (11, 1): YaoDirectionInfo(
        direction=YaoDirection.ASCENDING,
        description="발모여휘 - 띠풀을 뽑으니 뿌리가 연하여 함께 뽑힌다. 길하다.",
        action_tendency="적극"
    ),
    (11, 2): YaoDirectionInfo(
        direction=YaoDirection.ASCENDING,
        description="포황 - 거친 것을 포용함. 큰 강을 건너도 이롭다.",
        action_tendency="적극"
    ),
    (11, 5): YaoDirectionInfo(
        direction=YaoDirection.ASCENDING,
        description="제을귀매 - 임금이 딸을 시집보냄. 원길하다.",
        action_tendency="적극"
    ),

    # =========================================================================
    # 제12괘 비(否) - 천지비
    # =========================================================================
    (12, 1): YaoDirectionInfo(
        direction=YaoDirection.STAGNANT,
        description="발모여휘 - 띠풀을 뽑음. 바르면 길하고 형통하다.",
        action_tendency="소극"
    ),
    (12, 3): YaoDirectionInfo(
        direction=YaoDirection.DESCENDING,
        description="포수 - 부끄러움을 품는다.",
        action_tendency="소극"
    ),
    (12, 6): YaoDirectionInfo(
        direction=YaoDirection.ASCENDING,
        description="경비 - 막힘이 기울어진다. 먼저 막혔다가 후에 기쁘다.",
        action_tendency="적극"
    ),

    # =========================================================================
    # 제14괘 대유(大有) - 화천대유
    # =========================================================================
    (14, 1): YaoDirectionInfo(
        direction=YaoDirection.STAGNANT,
        description="무교해 - 해로움이 없다. 어려운 것이 아니니 허물이 없다.",
        action_tendency="중립"
    ),
    (14, 5): YaoDirectionInfo(
        direction=YaoDirection.ASCENDING,
        description="궐부교여 - 믿음으로 사귀고 위엄이 있으니 길하다.",
        action_tendency="적극"
    ),
    (14, 6): YaoDirectionInfo(
        direction=YaoDirection.ASCENDING,
        description="자천우지 - 하늘이 스스로 돕나니 길하여 이롭지 않음이 없다.",
        action_tendency="적극"
    ),

    # =========================================================================
    # 제15괘 겸(謙) - 지산겸
    # =========================================================================
    (15, 1): YaoDirectionInfo(
        direction=YaoDirection.ASCENDING,
        description="겸겸군자 - 겸손하고 또 겸손한 군자. 큰 강을 건너도 길하다.",
        action_tendency="적극"
    ),
    (15, 3): YaoDirectionInfo(
        direction=YaoDirection.ASCENDING,
        description="노겸군자 - 공이 있으되 겸손한 군자. 끝이 있어 길하다.",
        action_tendency="적극"
    ),
    (15, 6): YaoDirectionInfo(
        direction=YaoDirection.STAGNANT,
        description="명겸 - 소리로 겸손함. 군대를 일으켜 읍국을 정벌함이 이롭다.",
        action_tendency="중립"
    ),

    # =========================================================================
    # 제23괘 박(剝) - 산지박
    # =========================================================================
    (23, 1): YaoDirectionInfo(
        direction=YaoDirection.DESCENDING,
        description="박상이족 - 침상을 깎아 다리에 미침. 흉하다.",
        action_tendency="소극"
    ),
    (23, 5): YaoDirectionInfo(
        direction=YaoDirection.ASCENDING,
        description="관어이궁인총 - 물고기를 꿰어 궁인의 총애를 받음. 이롭지 않음이 없다.",
        action_tendency="적극"
    ),
    (23, 6): YaoDirectionInfo(
        direction=YaoDirection.DESCENDING,
        description="석과불식 - 큰 과일을 먹지 않음. 군자는 수레를 얻고 소인은 집을 잃는다.",
        action_tendency="소극"
    ),

    # =========================================================================
    # 제24괘 복(復) - 지뢰복
    # =========================================================================
    (24, 1): YaoDirectionInfo(
        direction=YaoDirection.ASCENDING,
        description="불원복 - 멀지 않아 돌아옴. 뉘우침에 이르지 않으니 원길하다.",
        action_tendency="적극"
    ),
    (24, 4): YaoDirectionInfo(
        direction=YaoDirection.STAGNANT,
        description="중행독복 - 중도에 홀로 돌아옴.",
        action_tendency="중립"
    ),
    (24, 6): YaoDirectionInfo(
        direction=YaoDirection.DESCENDING,
        description="미복 - 어둡게 돌아옴. 흉하여 재앙이 있다.",
        action_tendency="소극"
    ),

    # =========================================================================
    # 제25괘 무망(无妄) - 천뢰무망
    # =========================================================================
    (25, 1): YaoDirectionInfo(
        direction=YaoDirection.ASCENDING,
        description="무망왕길 - 허망함이 없이 가면 길하다.",
        action_tendency="적극"
    ),
    (25, 3): YaoDirectionInfo(
        direction=YaoDirection.DESCENDING,
        description="무망지재 - 허망함이 없는 재앙. 묶인 소가 행인의 것이 되니 마을 사람의 재앙.",
        action_tendency="소극"
    ),

    # =========================================================================
    # 제44괘 구(姤) - 천풍구
    # =========================================================================
    (44, 1): YaoDirectionInfo(
        direction=YaoDirection.DESCENDING,
        description="계우금니 - 쇠바퀴에 묶음. 바르면 길하니 가는 바가 있으면 흉하다.",
        action_tendency="소극"
    ),
    (44, 5): YaoDirectionInfo(
        direction=YaoDirection.ASCENDING,
        description="이기포과 - 버들로 오이를 쌈. 장함을 품으니 하늘에서 떨어짐이 있다.",
        action_tendency="적극"
    ),

    # =========================================================================
    # 제63괘 기제(旣濟) - 수화기제
    # =========================================================================
    (63, 1): YaoDirectionInfo(
        direction=YaoDirection.STAGNANT,
        description="예기륜 - 수레바퀴를 끌어당김. 여우가 꼬리를 적심. 허물이 없다.",
        action_tendency="소극"
    ),
    (63, 3): YaoDirectionInfo(
        direction=YaoDirection.STAGNANT,
        description="고종벌귀방 - 고종이 귀방을 정벌함. 3년 만에 이김. 소인은 쓰지 말라.",
        action_tendency="중립"
    ),
    (63, 5): YaoDirectionInfo(
        direction=YaoDirection.ASCENDING,
        description="동린살우 - 동쪽 이웃이 소를 잡음. 서쪽 이웃의 약제만 못하다. 복을 받음이 실하다.",
        action_tendency="적극"
    ),
    (63, 6): YaoDirectionInfo(
        direction=YaoDirection.DESCENDING,
        description="유기수 - 그 머리를 적심. 위태롭다.",
        action_tendency="소극"
    ),

    # =========================================================================
    # 제64괘 미제(未濟) - 화수미제
    # =========================================================================
    (64, 1): YaoDirectionInfo(
        direction=YaoDirection.DESCENDING,
        description="유기미 - 그 꼬리를 적심. 부끄럽다.",
        action_tendency="소극"
    ),
    (64, 2): YaoDirectionInfo(
        direction=YaoDirection.STAGNANT,
        description="예기륜 - 그 바퀴를 끌어당김. 바르면 길하다.",
        action_tendency="중립"
    ),
    (64, 5): YaoDirectionInfo(
        direction=YaoDirection.ASCENDING,
        description="정길무회 - 바르면 길하여 뉘우침이 없다. 군자의 빛이니 믿음이 있어 길하다.",
        action_tendency="적극"
    ),
    (64, 6): YaoDirectionInfo(
        direction=YaoDirection.STAGNANT,
        description="유우음주 - 술을 마시며 믿음이 있으나 머리를 적시면 믿음을 잃는다.",
        action_tendency="중립"
    ),
}


# =============================================================================
# fortune_score 기반 방향 분류 함수
# =============================================================================

def _score_to_direction(score: int) -> YaoDirection:
    """
    운세 점수 기반 방향 분류 (fallback)

    - 70+ → 상승 (발전/성취 가능)
    - 41-69 → 정체 (대기/준비 필요)
    - 0-40 → 하강 (후퇴/주의 필요)
    """
    if score >= 70:
        return YaoDirection.ASCENDING
    elif score >= 41:
        return YaoDirection.STAGNANT
    else:
        return YaoDirection.DESCENDING


def _score_to_action_tendency(score: int) -> str:
    """점수 기반 행동 경향 분류"""
    if score >= 75:
        return "적극"
    elif score >= 45:
        return "중립"
    else:
        return "소극"


# =============================================================================
# 외부 인터페이스
# =============================================================================

def get_yao_direction(hexagram: int, position: int) -> YaoDirection:
    """
    효사 방향 조회

    Args:
        hexagram: 괘 번호 (1-64)
        position: 효 위치 (1-6)

    Returns:
        YaoDirection: 상승/정체/하강
    """
    key = (hexagram, position)

    # 1. 핵심 효사 매핑에서 조회
    if key in CORE_YAO_DIRECTION_MAP:
        return CORE_YAO_DIRECTION_MAP[key].direction

    # 2. Fallback: fortune_score 기반 자동 분류
    try:
        from app.data.yao_complete import YAO_DATA
        yao = YAO_DATA.get(key, {})
        score = yao.get("fortune_score", 50)
        return _score_to_direction(score)
    except ImportError:
        return YaoDirection.STAGNANT


def get_yao_direction_info(hexagram: int, position: int) -> YaoDirectionInfo:
    """
    효사 방향 상세 정보 조회

    Args:
        hexagram: 괘 번호 (1-64)
        position: 효 위치 (1-6)

    Returns:
        YaoDirectionInfo: 방향, 설명, 행동 경향
    """
    key = (hexagram, position)

    # 1. 핵심 효사 매핑에서 조회
    if key in CORE_YAO_DIRECTION_MAP:
        return CORE_YAO_DIRECTION_MAP[key]

    # 2. Fallback: fortune_score 기반 자동 생성
    try:
        from app.data.yao_complete import YAO_DATA
        yao = YAO_DATA.get(key, {})
        score = yao.get("fortune_score", 50)
        text_kr = yao.get("text_kr", "")

        return YaoDirectionInfo(
            direction=_score_to_direction(score),
            description=text_kr,
            action_tendency=_score_to_action_tendency(score)
        )
    except ImportError:
        return YaoDirectionInfo(
            direction=YaoDirection.STAGNANT,
            description="",
            action_tendency="중립"
        )


def get_direction_description(direction: YaoDirection) -> str:
    """방향별 기본 설명"""
    descriptions = {
        YaoDirection.ASCENDING: "때가 무르익어 하늘이 길을 열어주는 운이니라.",
        YaoDirection.STAGNANT: "아직 때가 이르지 않았으니 숨어 힘을 기르는 운이니라.",
        YaoDirection.DESCENDING: "하늘이 경고하니 물러남이 지혜로운 때니라."
    }
    return descriptions.get(direction, "")


# =============================================================================
# 테스트
# =============================================================================

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("효사 방향 시스템 테스트")
    print("=" * 60)

    test_cases = [
        (1, 1, "잠룡물용"),
        (1, 5, "비룡재천"),
        (1, 6, "항룡유회"),
        (2, 2, "직방대"),
        (14, 6, "자천우지"),
    ]

    for hexagram, position, name in test_cases:
        direction = get_yao_direction(hexagram, position)
        info = get_yao_direction_info(hexagram, position)
        print(f"\n({hexagram}, {position}) {name}")
        print(f"  방향: {direction.value}")
        print(f"  행동경향: {info.action_tendency}")
        print(f"  설명: {info.description[:30]}...")

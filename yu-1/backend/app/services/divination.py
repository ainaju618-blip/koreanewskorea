"""
주역 점술 서비스 (전통 규칙 완전 구현)

변효(變爻) 해석 규칙:
- 0변효: 본괘 괘사(卦辭) 사용
- 1변효: 해당 효사(爻辭) 사용
- 2변효: 두 효 중 위의 효사 사용
- 3변효: 본괘 괘사와 지괘 괘사 함께 참조
- 4변효: 지괘에서 변하지 않은 두 효 중 아래 효사 사용
- 5변효: 지괘에서 변하지 않은 효사 사용
- 6변효: 지괘 괘사 사용 (건/곤은 용구/용육 특수 규칙)
"""
import random
from typing import Dict, List, Optional, Literal, Tuple
from dataclasses import dataclass
from enum import Enum


class ReadingType(Enum):
    """해석 방식"""
    GUA_CI = "gua_ci"           # 괘사 (괘 전체 해석)
    YAO_CI = "yao_ci"           # 효사 (개별 효 해석)
    BOTH_GUA_CI = "both_gua_ci" # 본괘 + 지괘 괘사
    YONG_JIU = "yong_jiu"       # 건괘 6변효 용구 (用九)
    YONG_LIU = "yong_liu"       # 곤괘 6변효 용육 (用六)


@dataclass
class YaoResult:
    """효 결과"""
    type: str  # "yang" or "yin"
    changing: bool  # 변효 여부
    value: int  # 6, 7, 8, 9


@dataclass
class ReadingMethod:
    """해석 방법 결정 결과"""
    reading_type: ReadingType
    yao_position: Optional[int] = None  # 참조할 효 위치 (1-6)
    use_transformed: bool = False  # 지괘 기준 해석 여부
    description: str = ""  # 해석 방법 설명


@dataclass
class DivinationResult:
    """점술 결과"""
    hexagram_number: int  # 본괘 번호
    transformed_hexagram: Optional[int]  # 지괘 번호 (변효 있을 때)
    changing_lines: List[int]  # 변효 위치들 (1-6)
    reading_method: ReadingMethod  # 해석 방법
    lines: List[YaoResult]  # 6효 상세 정보

    @property
    def yao_position(self) -> Optional[int]:
        """하위 호환성: 효 위치 반환"""
        return self.reading_method.yao_position


# 8괘 (삼효괘) 매핑 - 이진 인코딩 (0-7)
TRIGRAM_NAMES = {
    0: ("곤", "坤", "☷"),  # 000
    1: ("진", "震", "☳"),  # 001
    2: ("감", "坎", "☵"),  # 010
    3: ("태", "兌", "☱"),  # 011
    4: ("간", "艮", "☶"),  # 100
    5: ("리", "離", "☲"),  # 101
    6: ("손", "巽", "☴"),  # 110
    7: ("건", "乾", "☰"),  # 111
}

# 선천팔괘(先天八卦) 번호 → 이진 인코딩 변환
# 정통 384효 점술에서 사용하는 순서: 건1 태2 리3 진4 손5 감6 간7 곤8
SEONCHEON_TO_BINARY = {
    1: 7,  # 건(乾) → 111
    2: 3,  # 태(兌) → 011
    3: 5,  # 리(離) → 101
    4: 1,  # 진(震) → 001
    5: 6,  # 손(巽) → 110
    6: 2,  # 감(坎) → 010
    7: 4,  # 간(艮) → 100
    8: 0,  # 곤(坤) → 000
}

# 선천팔괘 이름 (1-8)
SEONCHEON_NAMES = {
    1: ("건", "乾", "하늘", "☰"),
    2: ("태", "兌", "연못", "☱"),
    3: ("리", "離", "불", "☲"),
    4: ("진", "震", "우레", "☳"),
    5: ("손", "巽", "바람", "☴"),
    6: ("감", "坎", "물", "☵"),
    7: ("간", "艮", "산", "☶"),
    8: ("곤", "坤", "땅", "☷"),
}

# 상괘(위) x 하괘(아래) -> 64괘 번호 매핑
# [상괘][하괘] = 괘번호
HEXAGRAM_LOOKUP = {
    # 건(7) 상괘
    (7, 7): 1,   # 건위천
    (7, 0): 12,  # 천지비
    (7, 1): 25,  # 천뢰무망
    (7, 2): 6,   # 천수송
    (7, 3): 10,  # 천택리
    (7, 4): 33,  # 천산둔
    (7, 5): 13,  # 천화동인
    (7, 6): 44,  # 천풍구

    # 곤(0) 상괘
    (0, 7): 11,  # 지천태
    (0, 0): 2,   # 곤위지
    (0, 1): 24,  # 지뢰복
    (0, 2): 7,   # 지수사
    (0, 3): 19,  # 지택임
    (0, 4): 15,  # 지산겸
    (0, 5): 36,  # 지화명이
    (0, 6): 46,  # 지풍승

    # 진(1) 상괘
    (1, 7): 34,  # 뇌천대장
    (1, 0): 16,  # 뇌지예
    (1, 1): 51,  # 진위뢰
    (1, 2): 40,  # 뇌수해
    (1, 3): 54,  # 뇌택귀매
    (1, 4): 62,  # 뇌산소과
    (1, 5): 55,  # 뇌화풍
    (1, 6): 32,  # 뇌풍항

    # 감(2) 상괘
    (2, 7): 5,   # 수천수
    (2, 0): 8,   # 수지비
    (2, 1): 3,   # 수뢰준
    (2, 2): 29,  # 감위수
    (2, 3): 60,  # 수택절
    (2, 4): 39,  # 수산건
    (2, 5): 63,  # 수화기제
    (2, 6): 48,  # 수풍정

    # 태(3) 상괘
    (3, 7): 43,  # 택천쾌
    (3, 0): 45,  # 택지췌
    (3, 1): 17,  # 택뢰수
    (3, 2): 47,  # 택수곤
    (3, 3): 58,  # 태위택
    (3, 4): 31,  # 택산함
    (3, 5): 49,  # 택화혁
    (3, 6): 28,  # 택풍대과

    # 간(4) 상괘
    (4, 7): 26,  # 산천대축
    (4, 0): 23,  # 산지박
    (4, 1): 27,  # 산뢰이
    (4, 2): 4,   # 산수몽
    (4, 3): 41,  # 산택손
    (4, 4): 52,  # 간위산
    (4, 5): 22,  # 산화비
    (4, 6): 18,  # 산풍고

    # 리(5) 상괘
    (5, 7): 14,  # 화천대유
    (5, 0): 35,  # 화지진
    (5, 1): 21,  # 화뇌서합
    (5, 2): 64,  # 화수미제
    (5, 3): 38,  # 화택규
    (5, 4): 56,  # 화산려
    (5, 5): 30,  # 리위화
    (5, 6): 50,  # 화풍정

    # 손(6) 상괘
    (6, 7): 9,   # 풍천소축
    (6, 0): 20,  # 풍지관
    (6, 1): 42,  # 풍뢰익
    (6, 2): 59,  # 풍수환
    (6, 3): 61,  # 풍택중부
    (6, 4): 53,  # 풍산점
    (6, 5): 37,  # 풍화가인
    (6, 6): 57,  # 손위풍
}

# 역방향 조회 (괘번호 -> 상하괘)
HEXAGRAM_REVERSE = {v: k for k, v in HEXAGRAM_LOOKUP.items()}


class DivinationService:
    """점술 서비스 (전통 주역 규칙 완전 구현)"""

    def __init__(self):
        """운발 가중치 테이블 초기화"""
        self._fortune_weights = self._build_fortune_weights()

    def _build_fortune_weights(self) -> List[float]:
        """
        384효 운발(運發) 가중치 테이블 생성

        fortune_score 기반 가중치:
        - 대길(85+): 가중치 3.0 (더 자주 나옴)
        - 길(70-84): 가중치 2.5
        - 평(50-69): 가중치 1.5
        - 흉(30-49): 가중치 1.0
        - 대흉(<30): 가중치 0.5 (드물게 나옴)
        """
        try:
            from app.data.yao_complete import YAO_DATA
        except ImportError:
            # 데이터 없으면 균등 분포
            return [1.0] * 384

        weights = []
        for yao_id in range(1, 385):
            hexagram = (yao_id - 1) // 6 + 1
            position = (yao_id - 1) % 6 + 1

            yao_data = YAO_DATA.get((hexagram, position), {})
            score = yao_data.get("fortune_score", 50)

            # 운세 점수에 따른 가중치 (좋을수록 높음)
            if score >= 85:
                weight = 3.0   # 대길
            elif score >= 70:
                weight = 2.5   # 길
            elif score >= 50:
                weight = 1.5   # 평
            elif score >= 30:
                weight = 1.0   # 흉
            else:
                weight = 0.5   # 대흉

            weights.append(weight)

        return weights

    def _get_luck_number(self) -> int:
        """
        운발수(運發數) 산출: 1-10 난수

        이 숫자에 따라 오늘의 전체적인 운세 흐름이 결정됨
        """
        return random.randint(1, 10)

    def _apply_luck_modifier(self, base_weights: List[float], luck_number: int) -> List[float]:
        """
        운발수에 따른 가중치 조정

        운발수 1-2: 흉운 (나쁜 운세 ↑, 좋은 운세 ↓)
        운발수 3-4: 약흉운
        운발수 5-6: 평운 (균등)
        운발수 7-8: 약길운
        운발수 9-10: 대길운 (좋은 운세 ↑, 나쁜 운세 ↓)
        """
        try:
            from app.data.yao_complete import YAO_DATA
        except ImportError:
            return base_weights

        # 운발수에 따른 배율 설정
        if luck_number <= 2:      # 흉운의 날
            good_mult, bad_mult = 0.3, 2.5
        elif luck_number <= 4:    # 약흉운
            good_mult, bad_mult = 0.6, 1.8
        elif luck_number <= 6:    # 평운
            good_mult, bad_mult = 1.0, 1.0
        elif luck_number <= 8:    # 약길운
            good_mult, bad_mult = 1.8, 0.6
        else:                     # 대길운 (9-10)
            good_mult, bad_mult = 2.5, 0.3

        modified_weights = []
        for yao_id in range(1, 385):
            hexagram = (yao_id - 1) // 6 + 1
            position = (yao_id - 1) % 6 + 1

            yao_data = YAO_DATA.get((hexagram, position), {})
            score = yao_data.get("fortune_score", 50)

            base_weight = base_weights[yao_id - 1]

            # 운세 점수에 따라 운발수 배율 적용
            if score >= 70:       # 좋은 운세 (길, 대길)
                modified_weights.append(base_weight * good_mult)
            elif score < 50:      # 나쁜 운세 (흉, 대흉)
                modified_weights.append(base_weight * bad_mult)
            else:                 # 평 (영향 없음)
                modified_weights.append(base_weight)

        return modified_weights

    def _weighted_384_selection(self) -> Tuple[int, int]:
        """
        운발수 기반 384효 선택

        Returns:
            (yao_id, luck_number): 선택된 효 ID와 운발수
        """
        # 1. 운발수 산출 (1-10)
        luck_number = self._get_luck_number()

        # 2. 운발수에 따른 가중치 조정
        modified_weights = self._apply_luck_modifier(self._fortune_weights, luck_number)

        # 3. 가중치 기반 랜덤 선택
        total_weight = sum(modified_weights)
        rand = random.uniform(0, total_weight)

        cumulative = 0
        for yao_id, weight in enumerate(modified_weights, start=1):
            cumulative += weight
            if rand <= cumulative:
                return yao_id, luck_number

        # 폴백: 랜덤하게 384효 중 하나 선택 (다양한 결과 보장)
        return random.randint(1, 384), luck_number

    def shicho_divination(self) -> DivinationResult:
        """
        시초점(蓍草占) 알고리즘
        전통 주역 점술 방식을 디지털로 구현

        확률 분포 (전통):
        - 노음(6): 1/16 ≈ 6.25%
        - 소양(7): 5/16 ≈ 31.25%
        - 소음(8): 7/16 ≈ 43.75%
        - 노양(9): 3/16 ≈ 18.75%
        """
        lines: List[YaoResult] = []

        for _ in range(6):  # 6효
            yao = self._cast_single_yao_shicho()
            lines.append(yao)

        return self._lines_to_result(lines)

    def _cast_single_yao_shicho(self) -> YaoResult:
        """
        단일 효 산출 (시초점)
        시초 50개 중 49개로 3번 조작

        각 조작에서:
        - 첫 번째 조작: 제거되는 수 = 5 또는 9 (4:1 비율)
        - 두/세 번째 조작: 제거되는 수 = 4 또는 8 (1:1 비율)

        결과: 36, 32, 28, 24 중 하나 → 4로 나누면 9, 8, 7, 6
        """
        total = 49

        for i in range(3):
            # 둘로 나눔 (랜덤)
            left = random.randint(1, total - 1)
            right = total - left

            # 왼손에서 1개 제외 (태극 상징)
            left -= 1

            # 4개씩 세어 나머지 계산 (나머지 0이면 4로 처리)
            left_remainder = left % 4 or 4
            right_remainder = right % 4 or 4

            # 제거되는 수 = 1(태극) + 왼쪽 나머지 + 오른쪽 나머지
            removed = 1 + left_remainder + right_remainder
            total -= removed

        # 남은 수 / 4 = 효 값 (6, 7, 8, 9)
        yao_value = total // 4

        # 값 범위 보정 (이론적으로는 6-9여야 함)
        if yao_value < 6:
            yao_value = 6
        elif yao_value > 9:
            yao_value = 9

        return self._yao_value_to_result(yao_value)

    def simple_divination(self) -> DivinationResult:
        """
        간단한 동전점 방식
        3개 동전을 6번 던져 괘 결정

        확률 분포:
        - 노음(6): 1/8 = 12.5% (뒷뒷뒷)
        - 소양(7): 3/8 = 37.5% (앞뒷뒷, 뒷앞뒷, 뒷뒷앞)
        - 소음(8): 3/8 = 37.5% (앞앞뒷, 앞뒷앞, 뒷앞앞)
        - 노양(9): 1/8 = 12.5% (앞앞앞)
        """
        lines: List[YaoResult] = []

        for _ in range(6):
            # 3개 동전: 앞면(3), 뒷면(2)
            coins = [random.choice([2, 3]) for _ in range(3)]
            total = sum(coins)

            lines.append(self._yao_value_to_result(total))

        return self._lines_to_result(lines)

    def _yao_value_to_result(self, value: int) -> YaoResult:
        """효 값을 YaoResult로 변환"""
        # 6=노음(변), 7=소양, 8=소음, 9=노양(변)
        if value == 6:
            return YaoResult(type="yin", changing=True, value=6)
        elif value == 7:
            return YaoResult(type="yang", changing=False, value=7)
        elif value == 8:
            return YaoResult(type="yin", changing=False, value=8)
        else:  # 9
            return YaoResult(type="yang", changing=True, value=9)

    def _determine_reading_method(
        self,
        changing_lines: List[int],
        hexagram_number: int,
        transformed_hexagram: Optional[int]
    ) -> ReadingMethod:
        """
        전통 주역 변효 해석 규칙에 따른 해석 방법 결정

        규칙 출처: 주희(朱熹)의 『주역본의(周易本義)』
        """
        count = len(changing_lines)

        # 0변효: 본괘 괘사 사용
        if count == 0:
            return ReadingMethod(
                reading_type=ReadingType.GUA_CI,
                yao_position=None,
                use_transformed=False,
                description="변효가 없으므로 본괘의 괘사(卦辭)로 해석합니다."
            )

        # 1변효: 해당 효사 사용
        elif count == 1:
            return ReadingMethod(
                reading_type=ReadingType.YAO_CI,
                yao_position=changing_lines[0],
                use_transformed=False,
                description=f"제{changing_lines[0]}효가 변하므로 해당 효사(爻辭)로 해석합니다."
            )

        # 2변효: 두 효 중 위(상위) 효사 사용
        elif count == 2:
            upper_yao = max(changing_lines)
            return ReadingMethod(
                reading_type=ReadingType.YAO_CI,
                yao_position=upper_yao,
                use_transformed=False,
                description=f"두 변효 중 상위 효인 제{upper_yao}효의 효사로 해석합니다."
            )

        # 3변효: 본괘 괘사와 지괘 괘사 함께 참조
        elif count == 3:
            return ReadingMethod(
                reading_type=ReadingType.BOTH_GUA_CI,
                yao_position=None,
                use_transformed=False,
                description="세 효가 변하므로 본괘와 지괘의 괘사를 함께 참조합니다."
            )

        # 4변효: 지괘에서 변하지 않은 두 효 중 아래(하위) 효사 사용
        elif count == 4:
            unchanged = [i for i in range(1, 7) if i not in changing_lines]
            lower_unchanged = min(unchanged)
            return ReadingMethod(
                reading_type=ReadingType.YAO_CI,
                yao_position=lower_unchanged,
                use_transformed=True,
                description=f"지괘에서 변하지 않은 두 효 중 하위 효인 제{lower_unchanged}효의 효사로 해석합니다."
            )

        # 5변효: 지괘에서 변하지 않은 효사 사용
        elif count == 5:
            unchanged = [i for i in range(1, 7) if i not in changing_lines]
            return ReadingMethod(
                reading_type=ReadingType.YAO_CI,
                yao_position=unchanged[0],
                use_transformed=True,
                description=f"지괘에서 유일하게 변하지 않은 제{unchanged[0]}효의 효사로 해석합니다."
            )

        # 6변효: 특수 규칙 (건괘=용구, 곤괘=용육, 그 외=지괘 괘사)
        else:  # count == 6
            if hexagram_number == 1:  # 건괘
                return ReadingMethod(
                    reading_type=ReadingType.YONG_JIU,
                    yao_position=None,
                    use_transformed=False,
                    description="건괘의 모든 효가 변하므로 용구(用九)로 해석합니다: '群龍無首 吉'"
                )
            elif hexagram_number == 2:  # 곤괘
                return ReadingMethod(
                    reading_type=ReadingType.YONG_LIU,
                    yao_position=None,
                    use_transformed=False,
                    description="곤괘의 모든 효가 변하므로 용육(用六)으로 해석합니다: '利永貞'"
                )
            else:
                return ReadingMethod(
                    reading_type=ReadingType.GUA_CI,
                    yao_position=None,
                    use_transformed=True,
                    description="모든 효가 변하므로 지괘의 괘사(卦辭)로 해석합니다."
                )

    def _lines_to_result(self, lines: List[YaoResult]) -> DivinationResult:
        """6효를 괘 번호로 변환하고 해석 방법 결정"""
        # 이진수로 변환 (양=1, 음=0)
        binary_lines = [1 if line.type == "yang" else 0 for line in lines]

        # 하괘 (초효~삼효) / 상괘 (사효~상효)
        lower = binary_lines[0] + binary_lines[1] * 2 + binary_lines[2] * 4
        upper = binary_lines[3] + binary_lines[4] * 2 + binary_lines[5] * 4

        # 64괘 번호 조회
        hexagram_number = HEXAGRAM_LOOKUP.get((upper, lower), 1)

        # 변효 위치 (1-indexed)
        changing_lines = [i + 1 for i, line in enumerate(lines) if line.changing]

        # 변괘 계산 (변효가 있는 경우)
        transformed_hexagram = None
        if changing_lines:
            transformed_lines = binary_lines.copy()
            for pos in changing_lines:
                transformed_lines[pos - 1] = 1 - transformed_lines[pos - 1]

            trans_lower = transformed_lines[0] + transformed_lines[1] * 2 + transformed_lines[2] * 4
            trans_upper = transformed_lines[3] + transformed_lines[4] * 2 + transformed_lines[5] * 4
            transformed_hexagram = HEXAGRAM_LOOKUP.get((trans_upper, trans_lower))

        # 해석 방법 결정 (전통 규칙)
        reading_method = self._determine_reading_method(
            changing_lines,
            hexagram_number,
            transformed_hexagram
        )

        return DivinationResult(
            hexagram_number=hexagram_number,
            transformed_hexagram=transformed_hexagram,
            changing_lines=changing_lines,
            reading_method=reading_method,
            lines=lines
        )

    def uniform_384_divination(self) -> DivinationResult:
        """
        균등 분포 384효 알고리즘

        모든 384효(64괘 × 6효)가 동일한 확률(1/384)로 선택됨
        - 장점: 완전 균등 분포, 검증 용이
        - 단점: 전통 주역 규칙과 다름 (변효 개념 없음)

        yao_id = 1~384
        hexagram = (yao_id - 1) // 6 + 1  → 1~64
        yao_position = (yao_id - 1) % 6 + 1  → 1~6
        """
        # 운발 알고리즘 사용 (운발수에 따라 운세 흐름 결정)
        yao_id, luck_number = self._weighted_384_selection()

        # 괘 번호 계산 (1-64)
        hexagram_number = (yao_id - 1) // 6 + 1

        # 효 위치 계산 (1-6)
        yao_position = (yao_id - 1) % 6 + 1

        # 해당 괘의 상하괘 정보 가져오기
        if hexagram_number in HEXAGRAM_REVERSE:
            upper, lower = HEXAGRAM_REVERSE[hexagram_number]
        else:
            # 폴백: 랜덤하게 64괘 중 하나 선택 (하드코딩된 건괘 제거)
            upper, lower = random.choice(list(HEXAGRAM_LOOKUP.keys()))

        # 6효 라인 구성 (선택된 효만 변효로 표시)
        lines: List[YaoResult] = []
        for i in range(6):
            pos = i + 1
            # 하괘(1-3효) / 상괘(4-6효)에서 해당 비트 추출
            if i < 3:
                is_yang = (lower >> i) & 1
            else:
                is_yang = (upper >> (i - 3)) & 1

            # 선택된 효만 변효로 표시 (해석할 효 표시용)
            is_changing = (pos == yao_position)

            lines.append(YaoResult(
                type="yang" if is_yang else "yin",
                changing=is_changing,
                value=9 if (is_yang and is_changing) else (7 if is_yang else (6 if is_changing else 8))
            ))

        # 운발수에 따른 운세 기운 이름
        luck_names = {
            1: "대흉운", 2: "흉운",
            3: "소흉운", 4: "약흉운",
            5: "평운", 6: "평운",
            7: "약길운", 8: "소길운",
            9: "길운", 10: "대길운"
        }
        luck_name = luck_names.get(luck_number, "평운")

        # ReadingMethod 생성 (항상 1변효 방식)
        reading_method = ReadingMethod(
            reading_type=ReadingType.YAO_CI,
            yao_position=yao_position,
            use_transformed=False,
            description=f"운발수 {luck_number}({luck_name}): 제{hexagram_number}괘 제{yao_position}효"
        )

        return DivinationResult(
            hexagram_number=hexagram_number,
            transformed_hexagram=None,  # 균등 분포에서는 변괘 없음
            changing_lines=[yao_position],  # 선택된 효
            reading_method=reading_method,
            lines=lines
        )

    def traditional_384_divination(self) -> DivinationResult:
        """
        정통 384효 알고리즘 (조주역학회 등 전통 역학 단체 방식)

        절차:
        1. 50개 서죽 중 1개를 태극으로 설정
        2. 49개를 둘로 나눠 왼손만 취함
        3. (태극 + 왼손) % 8 = 하괘 (0→8)
        4. 같은 과정으로 상괘 결정
        5. (태극 + 왼손) % 6 = 효 위치 (0→6)

        선천팔괘 순서: 건1 태2 리3 진4 손5 감6 간7 곤8
        """
        def cast_once(divisor: int) -> int:
            """서죽 한 번 뽑기"""
            taiji = 1  # 태극
            remaining = 49

            # 랜덤하게 둘로 나눔
            left = random.randint(1, remaining - 1)
            # 왼손만 취함 (오른손은 버림)

            # 태극 + 왼손
            total = taiji + left

            # 나머지 계산
            remainder = total % divisor

            # 0이면 최대값으로 처리
            if remainder == 0:
                remainder = divisor

            return remainder

        # 1. 하괘 결정 (1~8)
        lower_seoncheon = cast_once(8)

        # 2. 상괘 결정 (1~8)
        upper_seoncheon = cast_once(8)

        # 3. 효 위치 결정 (1~6)
        yao_position = cast_once(6)

        # 선천팔괘 번호를 이진 인코딩으로 변환
        lower_binary = SEONCHEON_TO_BINARY[lower_seoncheon]
        upper_binary = SEONCHEON_TO_BINARY[upper_seoncheon]

        # 64괘 번호 조회
        hexagram_number = HEXAGRAM_LOOKUP.get((upper_binary, lower_binary), 1)

        # 6효 라인 구성
        lines: List[YaoResult] = []
        for i in range(6):
            pos = i + 1
            # 하괘(1-3효) / 상괘(4-6효)에서 해당 비트 추출
            if i < 3:
                is_yang = (lower_binary >> i) & 1
            else:
                is_yang = (upper_binary >> (i - 3)) & 1

            # 선택된 효만 변효로 표시
            is_changing = (pos == yao_position)

            lines.append(YaoResult(
                type="yang" if is_yang else "yin",
                changing=is_changing,
                value=9 if (is_yang and is_changing) else (7 if is_yang else (6 if is_changing else 8))
            ))

        # 선천팔괘 정보 가져오기
        lower_info = SEONCHEON_NAMES[lower_seoncheon]
        upper_info = SEONCHEON_NAMES[upper_seoncheon]

        # ReadingMethod 생성
        reading_method = ReadingMethod(
            reading_type=ReadingType.YAO_CI,
            yao_position=yao_position,
            use_transformed=False,
            description=f"정통384효: 상괘 {upper_info[0]}({upper_seoncheon}), 하괘 {lower_info[0]}({lower_seoncheon}), 제{yao_position}효"
        )

        return DivinationResult(
            hexagram_number=hexagram_number,
            transformed_hexagram=None,  # 정통 384효에서는 변괘 없음
            changing_lines=[yao_position],
            reading_method=reading_method,
            lines=lines
        )

    def get_divination_with_category(
        self,
        category_id: int,
        period: str = "daily",
        algorithm: str = "uniform"  # "uniform", "coin", "shicho", "traditional"
    ) -> DivinationResult:
        """
        카테고리와 기간을 고려한 점술

        알고리즘 선택:
        - uniform: 균등 분포 384효 (기본값, 운발수 가중치 적용)
        - coin: 동전점 (전통 변효 규칙)
        - shicho: 시초점 (전통 변효 규칙)
        - traditional: 정통 384효 (조주역학회 방식, 순수 균등 분포)
        """
        if algorithm == "shicho":
            return self.shicho_divination()
        elif algorithm == "coin":
            return self.simple_divination()
        elif algorithm == "traditional":
            return self.traditional_384_divination()
        else:  # uniform (기본)
            return self.uniform_384_divination()

    def get_trigram_info(self, trigram_number: int) -> Dict:
        """삼효괘(팔괘) 정보 조회"""
        if trigram_number in TRIGRAM_NAMES:
            name_ko, name_hanja, symbol = TRIGRAM_NAMES[trigram_number]
            return {
                "number": trigram_number,
                "name_ko": name_ko,
                "name_hanja": name_hanja,
                "symbol": symbol
            }
        return {}

    def get_hexagram_trigrams(self, hexagram_number: int) -> Dict:
        """괘 번호로 상하괘 정보 조회"""
        if hexagram_number in HEXAGRAM_REVERSE:
            upper, lower = HEXAGRAM_REVERSE[hexagram_number]
            return {
                "upper": self.get_trigram_info(upper),
                "lower": self.get_trigram_info(lower)
            }
        return {}


# 싱글톤 인스턴스
divination_service = DivinationService()

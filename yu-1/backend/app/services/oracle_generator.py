"""
5단계 점술가 출력 생성기 (Oracle Generator)

AI 해석 가이드라인 v1.0 기반
점술가 정체성의 구조화된 해석 출력 생성

5단계 출력 구조:
1. 괘/효 선언 (10%): "그대에게 내려진 괘는..."
2. 핵심 해석 (25%): 효사 방향 기반
3. 맥락 적용 (30%): 카테고리 + 질문방향
4. 행동 지침 (25%): 매트릭스 + 심리유형
5. 마무리 경구 (10%): 방향별 마무리

목표: 150-250자, 점술가 어조
"""
from dataclasses import dataclass
from typing import Optional, Dict, Any
from app.data.yao_direction import YaoDirection
from app.data.question_direction import QuestionDirection, QuestionAnalysisResult
from app.data.interpretation_matrix import ActionGuidance, get_action_guidance
from app.data.category_vocabulary import (
    get_domain_action,
    get_domain_context,
    get_domain_caution,
    CATEGORY_ACTIONS
)


@dataclass
class OracleInput:
    """점술가 출력 생성 입력"""
    hexagram_number: int             # 1-64
    hexagram_name: str               # "건위천"
    yao_position: int                # 1-6
    yao_text: str                    # 효사 원문 "潛龍勿用"
    yao_meaning: str                 # 효사 직역
    yao_direction: YaoDirection      # 상승/정체/하강
    question: str                    # 사용자 질문
    question_direction: QuestionDirection  # 시작/유지/변화/종료
    category_name: str               # "재물운 > 주식"
    period: str                      # daily/weekly/monthly/yearly
    psychology_type: Optional[str] = None  # 심리 유형 (8가지)
    base_interpretation: str = ""    # 기본 해석


@dataclass
class OracleOutput:
    """점술가 출력 결과"""
    full_text: str                   # 전체 해석문 (150-250자)
    stage_1_declaration: str         # 괘/효 선언
    stage_2_core: str                # 핵심 해석
    stage_3_context: str             # 맥락 적용
    stage_4_guidance: str            # 행동 지침
    stage_5_closing: str             # 마무리 경구
    action_guidance: ActionGuidance  # 매트릭스 결과
    compatibility_score: float       # 일치도


class OracleGenerator:
    """
    점술가 스타일 해석 생성기

    핵심 원칙:
    - 친근하고 현대적인 어투 사용 (~해요, ~예요)
    - 새 의미 생성 금지, 주어진 데이터만 재구성
    - 150-250자 목표
    """

    # 기간별 표현
    PERIOD_EXPR = {
        "daily": "오늘",
        "weekly": "이번 주",
        "monthly": "이번 달",
        "yearly": "올해"
    }

    # 효 위치 한자
    YAO_POSITION_NAMES = {
        1: "초효",
        2: "이효",
        3: "삼효",
        4: "사효",
        5: "오효",
        6: "상효"
    }

    # 방향별 마무리 경구 (현대적 어투)
    CLOSING_PHRASES = {
        # 상승
        (YaoDirection.ASCENDING, QuestionDirection.START): "우주가 응원하고 있어요! 💫",
        (YaoDirection.ASCENDING, QuestionDirection.MAINTAIN): "더 좋은 일들이 기다리고 있어요!",
        (YaoDirection.ASCENDING, QuestionDirection.CHANGE): "새로운 문이 열릴 거예요!",
        (YaoDirection.ASCENDING, QuestionDirection.END): "한 번 더 생각해보는 건 어때요?",

        # 정체
        (YaoDirection.STAGNANT, QuestionDirection.START): "조금만 기다려봐요, 때가 올 거예요.",
        (YaoDirection.STAGNANT, QuestionDirection.MAINTAIN): "지금처럼 꾸준히 해나가세요!",
        (YaoDirection.STAGNANT, QuestionDirection.CHANGE): "조급해하지 않아도 괜찮아요.",
        (YaoDirection.STAGNANT, QuestionDirection.END): "정리할 시간이 필요해 보여요.",

        # 하강
        (YaoDirection.DESCENDING, QuestionDirection.START): "잠깐 멈추는 것도 지혜예요.",
        (YaoDirection.DESCENDING, QuestionDirection.MAINTAIN): "돌아볼 시간이 필요해요.",
        (YaoDirection.DESCENDING, QuestionDirection.CHANGE): "지금은 좀 쉬어가세요.",
        (YaoDirection.DESCENDING, QuestionDirection.END): "새 출발을 준비해보세요!",
    }

    # 심리유형별 추가 조언 (현대적 어투)
    PSYCHOLOGY_ADVICE = {
        "즉흥적 결정형": "다만 너무 급하게 결정하진 마세요!",
        "과거 집착형": "지난 일은 좀 내려놓아 보세요.",
        "비교 불안형": "남과 비교하지 않아도 괜찮아요.",
        "완벽주의형": "완벽하지 않아도 충분해요.",
        "외부 의존형": "내 마음의 소리를 들어보세요.",
        "감정적 반응형": "잠깐 심호흡하고 생각해보세요.",
        "회피형": "용기 내서 마주해보는 건 어때요?",
        "통제형": "가끔은 흐름에 맡겨보세요.",
    }

    def generate(self, input_data: OracleInput) -> OracleOutput:
        """
        5단계 점술가 해석 생성

        Args:
            input_data: OracleInput 객체

        Returns:
            OracleOutput: 구조화된 점술가 해석
        """
        # 매트릭스에서 행동 지침 가져오기
        guidance = get_action_guidance(
            input_data.yao_direction,
            input_data.question_direction
        )

        # 각 단계 생성
        stage_1 = self._generate_declaration(input_data)
        stage_2 = self._generate_core_interpretation(input_data, guidance)
        stage_3 = self._generate_context_application(input_data, guidance)
        stage_4 = self._generate_action_guidance(input_data, guidance)
        stage_5 = self._generate_closing(input_data)

        # 전체 텍스트 조합 (150-250자 목표)
        full_text = self._compose_full_text(
            stage_1, stage_2, stage_3, stage_4, stage_5
        )

        return OracleOutput(
            full_text=full_text,
            stage_1_declaration=stage_1,
            stage_2_core=stage_2,
            stage_3_context=stage_3,
            stage_4_guidance=stage_4,
            stage_5_closing=stage_5,
            action_guidance=guidance,
            compatibility_score=guidance.compatibility_score
        )

    def _generate_declaration(self, input_data: OracleInput) -> str:
        """1단계: 괘/효 선언 (10%)"""
        yao_name = self.YAO_POSITION_NAMES.get(input_data.yao_position, "효")
        period_prefix = {
            "daily": "오늘의",
            "weekly": "이번 주",
            "monthly": "이번 달",
            "yearly": "올해의"
        }.get(input_data.period, "그대의")
        return f"🔮 {period_prefix} 괘는 '{input_data.hexagram_name}' {yao_name}예요!"

    def _generate_core_interpretation(
        self,
        input_data: OracleInput,
        guidance: ActionGuidance
    ) -> str:
        """2단계: 핵심 해석 (25%)"""
        direction_desc = {
            YaoDirection.ASCENDING: "지금 기운이 올라가고 있어요 📈",
            YaoDirection.STAGNANT: "조금 기다려볼 타이밍이에요 ⏸️",
            YaoDirection.DESCENDING: "신중하게 움직일 때예요 🤔"
        }

        base = direction_desc.get(
            input_data.yao_direction,
            "차분하게 생각해보세요"
        )

        # 효사 원문이 있으면 포함
        if input_data.yao_text:
            return f"'{input_data.yao_text}'라는 말처럼, {base}"

        return base

    def _generate_context_application(
        self,
        input_data: OracleInput,
        guidance: ActionGuidance
    ) -> str:
        """3단계: 맥락 적용 (30%) - 사용자 질문 기반"""
        period = self.PERIOD_EXPR.get(input_data.period, "오늘")

        # 카테고리에서 주제 추출
        category_name = input_data.category_name
        if ">" in category_name:
            category_parts = category_name.split(">")
        else:
            category_parts = category_name.split("/", 1)

        main_category = category_parts[0].strip().replace("운", "")

        # 사용자 질문에서 핵심 키워드 추출 (더 자연스러운 응답)
        question = input_data.question.strip() if input_data.question else ""

        # 질문이 있으면 질문 기반으로 맥락 생성
        if question:
            # 질문 유형 판단
            is_fortune_query = any(kw in question for kw in ["운세", "어떻", "어떨", "될까", "괜찮", "좋을까"])
            is_action_query = any(kw in question for kw in ["해도", "할까", "사도", "팔까", "가도", "만나", "시작", "그만"])

            if is_action_query:
                # 행동 질문: "~해도 될까요?" 형식 유지
                domain_action = get_domain_action(main_category, input_data.question_direction)
                sub_category = category_parts[1].strip() if len(category_parts) > 1 else ""
                if sub_category:
                    first_keyword = sub_category.split("/")[0].strip()
                    keyword = f"{first_keyword} {domain_action}"
                else:
                    keyword = domain_action
                context = get_domain_context(main_category, input_data.question_direction, keyword)
            else:
                # 운세 질문: 질문 요약으로 자연스럽게 (기간 표현 생략)
                # 질문에서 핵심 추출 (예: "2026년 한해의 운세" → "2026년 운세")
                question_summary = self._extract_question_summary(question)
                return f"{question_summary}, 궁금하시군요!"
        else:
            # 질문 없으면 기존 방식
            domain_action = get_domain_action(main_category, input_data.question_direction)
            context = f"{domain_action} 관련해서 알아볼게요."

        return f"{period}, {context}"

    def _extract_question_summary(self, question: str) -> str:
        """질문에서 핵심 요약 추출"""
        # 불필요한 어미 제거 (긴 패턴부터 체크)
        remove_suffixes = [
            # 조사+어미 조합 (공백 있는 버전)
            "가 어떻습니까", "이 어떻습니까", "는 어떻습니까", "은 어떻습니까",
            "가 어떨까요", "이 어떨까요", "는 어떨까요", "은 어떨까요",
            # 조사+어미 조합 (공백 없는 버전) - "운세가 어떻습니까" 케이스
            "세가 어떻습니까", "이가 어떻습니까",
            # 단순 어미
            "어떻습니까", "어떨까요", "될까요", "괜찮을까요", "좋을까요",
            "어때요", "인가요", "일까요", "할까요", "가요", "나요",
            "입니까", "습니까", "까요", "요", "?"
        ]

        summary = question.strip().rstrip("?").strip()
        for suffix in remove_suffixes:
            if summary.endswith(suffix):
                summary = summary[:-len(suffix)].strip()
                break

        # 마지막 조사 제거 (가, 이, 는, 은, 를, 을)
        if summary and summary[-1] in "가이는은를을":
            summary = summary[:-1].strip()

        # 너무 길면 앞 25자만
        if len(summary) > 25:
            summary = summary[:25] + "..."

        return summary if summary else "운세"

    def _generate_action_guidance(
        self,
        input_data: OracleInput,
        guidance: ActionGuidance
    ) -> str:
        """4단계: 행동 지침 (25%) - 질문 유형에 따른 맞춤 응답"""
        question = input_data.question.strip() if input_data.question else ""

        # 질문 유형 판단
        is_action_query = any(kw in question for kw in ["해도", "할까", "사도", "팔까", "가도", "만나", "시작", "그만"])

        # 심리유형 조언 추가
        psychology_note = ""
        if input_data.psychology_type:
            advice = self.PSYCHOLOGY_ADVICE.get(input_data.psychology_type, "")
            if advice:
                psychology_note = f" {advice}"

        if is_action_query:
            # 행동 질문: 기존 도메인 특화 방식
            category_name = input_data.category_name
            if ">" in category_name:
                category_parts = category_name.split(">")
            else:
                category_parts = category_name.split("/", 1)

            main_category = category_parts[0].strip().replace("운", "")
            sub_category = category_parts[1].strip() if len(category_parts) > 1 else ""

            domain_action = get_domain_action(main_category, input_data.question_direction)

            if sub_category:
                first_keyword = sub_category.split("/")[0].strip()
                action_text = f"{first_keyword} {domain_action}"
            else:
                action_text = domain_action

            # 호환성에 따른 강조
            if guidance.compatibility_score >= 0.9:
                return f"{action_text}, 지금이 딱이에요! ✨{psychology_note}"
            elif guidance.compatibility_score >= 0.7:
                return f"{action_text}, 좋은 흐름이에요! 👍{psychology_note}"
            elif guidance.compatibility_score >= 0.5:
                return f"{action_text}, 신중하게 진행해보세요.{psychology_note}"
            elif guidance.compatibility_score >= 0.3:
                return f"{action_text}, 조심조심 가시면 돼요.{psychology_note}"
            else:
                return f"{action_text}은(는) 조금 기다려보세요.{psychology_note}"
        else:
            # 운세 질문: 일반적인 운세 응답
            if guidance.compatibility_score >= 0.9:
                return f"아주 좋은 기운이에요! 기대해도 좋아요 ✨{psychology_note}"
            elif guidance.compatibility_score >= 0.7:
                return f"좋은 흐름이에요! 긍정적으로 생각하세요 👍{psychology_note}"
            elif guidance.compatibility_score >= 0.5:
                return f"괜찮은 기운이에요. 차분하게 지켜보세요.{psychology_note}"
            elif guidance.compatibility_score >= 0.3:
                return f"조금 조심스러운 시기예요. 무리하지 마세요.{psychology_note}"
            else:
                return f"지금은 쉬어가는 것도 좋아요.{psychology_note}"

    def _generate_closing(self, input_data: OracleInput) -> str:
        """5단계: 마무리 경구 (10%)"""
        key = (input_data.yao_direction, input_data.question_direction)
        return self.CLOSING_PHRASES.get(key, "좋은 일이 생길 거예요! 🍀")

    def _compose_full_text(
        self,
        stage_1: str,
        stage_2: str,
        stage_3: str,
        stage_4: str,
        stage_5: str
    ) -> str:
        """전체 텍스트 조합 (150-250자 목표)"""
        # 기본 조합
        full = f"{stage_1} {stage_2} {stage_3} {stage_4} {stage_5}"

        # 길이 조절 (250자 초과 시 축약)
        if len(full) > 250:
            # stage_2, stage_3 축약
            full = f"{stage_1} {stage_4} {stage_5}"

        return full

    def generate_simple(
        self,
        hexagram_name: str,
        yao_position: int,
        yao_text: str,
        yao_direction: YaoDirection,
        question_direction: QuestionDirection,
        category: str,
        period: str = "daily"
    ) -> str:
        """
        간소화된 생성 인터페이스

        Returns:
            str: 생성된 해석문
        """
        input_data = OracleInput(
            hexagram_number=1,
            hexagram_name=hexagram_name,
            yao_position=yao_position,
            yao_text=yao_text,
            yao_meaning="",
            yao_direction=yao_direction,
            question="",
            question_direction=question_direction,
            category_name=category,
            period=period
        )

        output = self.generate(input_data)
        return output.full_text


# 싱글톤 인스턴스
oracle_generator = OracleGenerator()


# =============================================================================
# 테스트
# =============================================================================

if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("5단계 점술가 출력 생성기 테스트")
    print("=" * 70)

    # 테스트 케이스
    test_cases = [
        {
            "hexagram_name": "건위천",
            "yao_position": 1,
            "yao_text": "潛龍勿用",
            "yao_direction": YaoDirection.STAGNANT,
            "question_direction": QuestionDirection.START,
            "category": "연애운 > 고백",
            "psychology": "즉흥적 결정형",
            "desc": "잠룡물용 + 고백(시작)"
        },
        {
            "hexagram_name": "건위천",
            "yao_position": 5,
            "yao_text": "飛龍在天",
            "yao_direction": YaoDirection.ASCENDING,
            "question_direction": QuestionDirection.CHANGE,
            "category": "직장운 > 이직",
            "psychology": None,
            "desc": "비룡재천 + 이직(변화)"
        },
        {
            "hexagram_name": "건위천",
            "yao_position": 6,
            "yao_text": "亢龍有悔",
            "yao_direction": YaoDirection.DESCENDING,
            "question_direction": QuestionDirection.START,
            "category": "재물운 > 투자",
            "psychology": "완벽주의형",
            "desc": "항룡유회 + 투자(시작)"
        },
        {
            "hexagram_name": "곤위지",
            "yao_position": 2,
            "yao_text": "直方大",
            "yao_direction": YaoDirection.ASCENDING,
            "question_direction": QuestionDirection.MAINTAIN,
            "category": "연애운 > 관계",
            "psychology": None,
            "desc": "직방대 + 유지"
        },
    ]

    for tc in test_cases:
        print(f"\n[{tc['desc']}]")
        print("-" * 50)

        input_data = OracleInput(
            hexagram_number=1,
            hexagram_name=tc["hexagram_name"],
            yao_position=tc["yao_position"],
            yao_text=tc["yao_text"],
            yao_meaning="",
            yao_direction=tc["yao_direction"],
            question="",
            question_direction=tc["question_direction"],
            category_name=tc["category"],
            period="daily",
            psychology_type=tc["psychology"]
        )

        output = oracle_generator.generate(input_data)

        print(f"1. 선언: {output.stage_1_declaration}")
        print(f"2. 핵심: {output.stage_2_core}")
        print(f"3. 맥락: {output.stage_3_context}")
        print(f"4. 지침: {output.stage_4_guidance}")
        print(f"5. 경구: {output.stage_5_closing}")
        print(f"\n전체 ({len(output.full_text)}자):")
        print(f"  {output.full_text}")
        print(f"\n지침: {output.action_guidance.action} (일치도: {output.compatibility_score:.0%})")

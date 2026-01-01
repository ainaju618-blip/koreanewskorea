"""
점술 UseCase

비즈니스 로직 조합을 담당하는 UseCase 계층
- Repository에서 데이터 조회
- Service에서 점술 수행
- AI 해석 가이드라인 v1.0 기반 점술가 해석
- LLM 어투 변환
- 결과 조합

v2.0 업데이트:
- 효사 방향 분석 (상승/정체/하강)
- 질문 방향 분석 (시작/유지/변화/종료)
- 결합 매트릭스 기반 행동 지침
- 5단계 점술가 출력 생성
"""
from typing import Optional, List
from dataclasses import dataclass

from app.services.divination import divination_service, DivinationResult, ReadingType
from app.services.llm_service import llm_service, ToneTransformInput
from app.services.category_matcher import category_matcher
from app.services.oracle_generator import oracle_generator, OracleInput
from app.data.category_seed import MAJOR_CATEGORIES
from app.data.yao_direction import get_yao_direction, YaoDirection
from app.data.question_direction import analyze_question_direction, QuestionDirection
from app.data.interpretation_matrix import get_action_guidance, ActionGuidance
from app.repositories.hexagram_repository import hexagram_repository, HexagramData
from app.repositories.yao_repository import yao_repository, YaoData


@dataclass
class DivinationOutput:
    """점술 결과 DTO"""
    # 괘 정보
    hexagram: HexagramData
    transformed_hexagram: Optional[HexagramData]

    # 효 정보 (효사 해석 시)
    yao: Optional[YaoData]

    # 해석 정보
    reading_type: str
    reading_description: str
    use_transformed: bool
    yao_position: Optional[int]

    # 괘사
    gua_ci: Optional[str]
    transformed_gua_ci: Optional[str]

    # 해석 결과
    interpretation: str
    fortune_score: int
    fortune_category: str
    keywords: List[str]

    # 행동 가이드
    action_guide: str
    caution: str

    # 카테고리
    matched_category: str

    # 변효 정보
    changing_lines: List[int]

    # === v2.0 신규 필드 (AI 해석 가이드라인 기반) ===
    # 효사 방향
    yao_direction: Optional[str] = None           # 상승/정체/하강
    yao_direction_code: Optional[str] = None      # ASCENDING/STAGNANT/DESCENDING

    # 질문 방향
    question_direction: Optional[str] = None      # 시작/유지/변화/종료
    question_direction_code: Optional[str] = None # START/MAINTAIN/CHANGE/END
    question_confidence: float = 0.0              # 질문 분석 신뢰도

    # 매트릭스 결합 결과
    matrix_action: Optional[str] = None           # 나아가라/기다리라 등 12가지
    matrix_oracle_phrase: Optional[str] = None    # 점술가 문장
    matrix_compatibility: float = 0.0             # 질문-효사 일치도 (0~1)
    matrix_fortune_tendency: Optional[str] = None # 대길/길/중길/중평/소흉/흉/대흉

    # 5단계 점술가 해석
    oracle_interpretation: Optional[str] = None   # 점술가 스타일 전체 해석


class DivinationUseCase:
    """
    점술 UseCase

    책임:
    - 점술 수행 및 결과 조합
    - 해석 방법에 따른 데이터 선택
    - LLM 어투 변환 호출
    """

    async def cast_divination(
        self,
        question: str,
        main_category: int,
        period: str = "daily"
    ) -> DivinationOutput:
        """
        점술 수행 (v2.0 - AI 해석 가이드라인 적용)

        1. 카테고리 매칭
        2. 점술 수행
        3. 괘/효 데이터 조회
        4. 해석 조합
        5. [NEW] 질문 방향 분석
        6. [NEW] 효사 방향 분석
        7. [NEW] 결합 매트릭스 조회
        8. [NEW] 5단계 점술가 해석 생성
        9. LLM 어투 변환
        """
        # 1. 카테고리 매칭
        matched_main, matched_sub, confidence = category_matcher.match_question(question)
        if main_category != 9:  # 기타가 아니면 사용자 선택 우선
            matched_main = main_category

        category_name = self._build_category_name(matched_main, matched_sub)

        # 2. 점술 수행 (균등 분포 384효 알고리즘 사용)
        result: DivinationResult = divination_service.uniform_384_divination()
        reading = result.reading_method

        # 3. 괘 데이터 조회
        hexagram = hexagram_repository.get_hexagram(result.hexagram_number)
        transformed_hexagram = None
        if result.transformed_hexagram:
            transformed_hexagram = hexagram_repository.get_hexagram(result.transformed_hexagram)

        # 4. 해석 방법에 따른 데이터 선택
        interpretation_data = self._get_interpretation_data(
            result=result,
            hexagram=hexagram,
            transformed_hexagram=transformed_hexagram
        )

        # 5. [NEW] 질문 방향 분석
        question_analysis = analyze_question_direction(question)
        q_direction = question_analysis.direction
        q_confidence = question_analysis.confidence

        # 6. [NEW] 효사 방향 분석 (효사 해석 시에만)
        yao_dir = YaoDirection.STAGNANT  # 기본값
        if reading.yao_position:
            target_hex = result.transformed_hexagram if reading.use_transformed else result.hexagram_number
            yao_dir = get_yao_direction(target_hex, reading.yao_position)

        # 7. [NEW] 결합 매트릭스 조회
        guidance = get_action_guidance(yao_dir, q_direction)

        # 8. [NEW] 5단계 점술가 해석 생성
        oracle_text = ""
        yao_data = interpretation_data.get("yao")
        if yao_data or hexagram:
            oracle_input = OracleInput(
                hexagram_number=result.hexagram_number,
                hexagram_name=hexagram.name_ko if hexagram else "",
                yao_position=reading.yao_position or 1,
                yao_text=yao_data.text_hanja if yao_data else "",
                yao_meaning=yao_data.text_kr if yao_data else "",
                yao_direction=yao_dir,
                question=question,
                question_direction=q_direction,
                category_name=category_name,
                period=period,
                base_interpretation=interpretation_data["source"]
            )
            oracle_output = oracle_generator.generate(oracle_input)
            oracle_text = oracle_output.full_text

        # 9. LLM 어투 변환 (점술가 스타일)
        llm_input = ToneTransformInput(
            user_question=question,
            period=period,
            category_name=category_name,
            original_text=yao_data.text_hanja if yao_data else "",
            original_meaning=yao_data.text_kr if yao_data else "",
            core_message=guidance.description,
            caution=guidance.caution,
            base_text=oracle_text if oracle_text else interpretation_data["source"]
        )
        transformed_result = await llm_service.transform_tone(llm_input, tone_style="oracle")
        transformed_interpretation = transformed_result.transformed_text

        # 10. 결과 조합 (v2.0 필드 포함)
        return DivinationOutput(
            hexagram=hexagram,
            transformed_hexagram=transformed_hexagram,
            yao=interpretation_data.get("yao"),
            reading_type=reading.reading_type.value,
            reading_description=reading.description,
            use_transformed=reading.use_transformed,
            yao_position=reading.yao_position,
            gua_ci=interpretation_data.get("gua_ci"),
            transformed_gua_ci=interpretation_data.get("transformed_gua_ci"),
            interpretation=transformed_interpretation,
            fortune_score=interpretation_data["fortune_score"],
            fortune_category=interpretation_data["fortune_category"],
            keywords=interpretation_data["keywords"],
            action_guide=guidance.description,  # v2.0: 매트릭스 기반
            caution=guidance.caution,            # v2.0: 매트릭스 기반
            matched_category=category_name,
            changing_lines=result.changing_lines,
            # === v2.0 신규 필드 ===
            yao_direction=yao_dir.value,
            yao_direction_code=yao_dir.name,
            question_direction=q_direction.value,
            question_direction_code=q_direction.name,
            question_confidence=q_confidence,
            matrix_action=guidance.action,
            matrix_oracle_phrase=guidance.oracle_phrase,
            matrix_compatibility=guidance.compatibility_score,
            matrix_fortune_tendency=guidance.fortune_tendency,
            oracle_interpretation=oracle_text
        )

    def _get_interpretation_data(
        self,
        result: DivinationResult,
        hexagram: HexagramData,
        transformed_hexagram: Optional[HexagramData]
    ) -> dict:
        """해석 방법에 따른 데이터 선택"""
        reading = result.reading_method
        reading_type = reading.reading_type

        # 기본값
        data = {
            "source": "",
            "fortune_score": 50,
            "fortune_category": "평",
            "keywords": ["신중", "기다림"],
            "yao": None,
            "gua_ci": None,
            "transformed_gua_ci": None,
        }

        if reading_type == ReadingType.GUA_CI:
            # 괘사 해석 (0변효 또는 6변효 일반)
            target = transformed_hexagram if reading.use_transformed else hexagram
            data["gua_ci"] = target.gua_ci if target else ""
            data["source"] = data["gua_ci"]
            data["fortune_score"] = 60
            data["fortune_category"] = "길"
            data["keywords"] = ["순응", "때를 기다림"]

        elif reading_type == ReadingType.YAO_CI:
            # 효사 해석
            target_hex_num = result.transformed_hexagram if reading.use_transformed else result.hexagram_number
            yao = yao_repository.get_yao(target_hex_num, reading.yao_position)

            data["yao"] = yao
            data["source"] = yao.interpretation if yao else ""
            data["fortune_score"] = yao.fortune_score if yao else 50
            data["fortune_category"] = yao.fortune_category if yao else "평"
            data["keywords"] = yao.keywords if yao else ["신중", "기다림"]

        elif reading_type == ReadingType.BOTH_GUA_CI:
            # 본괘 + 지괘 괘사 (3변효)
            data["gua_ci"] = hexagram.gua_ci if hexagram else ""
            data["transformed_gua_ci"] = transformed_hexagram.gua_ci if transformed_hexagram else ""
            data["source"] = f"본괘: {data['gua_ci']}\n지괘: {data['transformed_gua_ci']}"
            data["fortune_score"] = 55
            data["fortune_category"] = "평"
            data["keywords"] = ["변화", "전환", "양면"]

        elif reading_type == ReadingType.YONG_JIU:
            # 건괘 6변효: 용구
            data["gua_ci"] = "用九: 見群龍無首 吉"
            data["source"] = "모든 것이 변화하는 때입니다. 겸손하게 뒤로 물러나 다투지 않으면 크게 길합니다."
            data["fortune_score"] = 85
            data["fortune_category"] = "대길"
            data["keywords"] = ["겸손", "조화", "무위", "대인"]

        elif reading_type == ReadingType.YONG_LIU:
            # 곤괘 6변효: 용육
            data["gua_ci"] = "用六: 利永貞"
            data["source"] = "모든 것이 변화하는 때입니다. 영원히 올바름을 유지하면 이롭습니다."
            data["fortune_score"] = 80
            data["fortune_category"] = "길"
            data["keywords"] = ["순응", "지속", "바름", "유순"]

        return data

    def _build_category_name(self, main_id: int, sub_id: Optional[int]) -> str:
        """카테고리 이름 조합"""
        main_data = MAJOR_CATEGORIES.get(main_id, {})
        main_name = main_data.get("name", "기타")

        # 소분류는 category_matcher에서 조회
        if sub_id:
            sub_cats = category_matcher.get_sub_categories(main_id)
            for sub in sub_cats:
                if sub.get("id") == sub_id:
                    return f"{main_name}/{sub.get('name', '')}"

        return main_name

    def _get_action_guide(self, reading_type: ReadingType, fortune_category: str) -> str:
        """
        행동 가이드 (v2.0 점술가 어조)

        NOTE: 실제로는 매트릭스 기반 guidance.description을 사용함.
              이 메서드는 fallback용으로만 유지.
        """
        guides = {
            "대길": "때가 무르익었느니라. 과감히 나아가라.",
            "길": "순풍에 돛을 달았느니라. 흐름을 타라.",
            "평": "급히 서두르지 말라. 때를 기다리라.",
            "흉": "멈추고 살피라. 신중함이 곧 지혜이니라.",
            "대흉": "무리한 움직임을 삼가라. 이 경고를 명심하라.",
        }

        # 특수 규칙
        if reading_type == ReadingType.YONG_JIU:
            return "겸손히 처신하되 기회를 놓치지 말라."
        if reading_type == ReadingType.YONG_LIU:
            return "순응하며 꾸준히 나아가라."

        return guides.get(fortune_category, "신중히 행하라.")

    def _get_caution(self, reading_type: ReadingType, fortune_category: str) -> str:
        """
        주의사항 (v2.0 점술가 어조)

        NOTE: 실제로는 매트릭스 기반 guidance.caution을 사용함.
              이 메서드는 fallback용으로만 유지.
        """
        cautions = {
            "대길": "교만은 성공의 씨앗을 썩게 하느니라.",
            "길": "끝까지 방심하지 말라.",
            "평": "조급함은 화를 부르느니라.",
            "흉": "무리한 시도는 더 큰 화를 부르느니라.",
            "대흉": "중요한 결정은 미루고 주변의 조언을 구하라.",
        }

        # 특수 규칙
        if reading_type == ReadingType.YONG_JIU:
            return "지나친 자만은 금물이니라."
        if reading_type == ReadingType.YONG_LIU:
            return "변화의 시기이니 유연하게 대처하라."

        return cautions.get(fortune_category, "겸손을 잃지 말라.")


# 싱글톤 인스턴스
divination_usecase = DivinationUseCase()

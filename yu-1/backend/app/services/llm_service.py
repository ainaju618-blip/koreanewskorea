"""
LLM 어투 변환 서비스 (컨설팅 확정)

핵심 원칙:
- LLM은 운세 내용 생성 금지
- 어투 변환 전용
- 환각(Hallucination) 방지를 위한 엄격한 입출력 규칙
"""
import httpx
import logging
from typing import Optional
from dataclasses import dataclass
from app.core.config import settings
from app.services.llm_validator import llm_validator, ValidationResult

logger = logging.getLogger(__name__)


@dataclass
class ToneTransformInput:
    """
    어투 변환 입력 스펙 (컨설팅 확정)

    모든 필드가 필수 - 누락 시 변환 불가
    """
    user_question: str          # 사용자 질문
    period: str                 # daily/weekly/monthly/yearly
    category_name: str          # "재물운 > 주식/증권"
    original_text: str          # 효사 한자 원문
    original_meaning: str       # 직역 (한글)
    core_message: str           # 핵심 한줄 메시지
    caution: str                # 주의사항
    base_text: str              # 카테고리별 기본 해석


@dataclass
class ToneTransformOutput:
    """
    어투 변환 출력 스펙 (컨설팅 확정)
    """
    transformed_text: str       # 150자 내외 한국어 문장
    used_llm: bool              # LLM 사용 여부
    fallback_reason: str        # LLM 미사용 시 사유


class LLMService:
    """
    LLM 어투 변환 서비스 (Ollama)

    컨설팅 확정 규칙:
    - 운세 내용 생성 금지
    - 어투 변환만 담당
    - 실패 시 base_text 그대로 반환
    """

    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL

        # 어투 스타일 정의 (현대적이고 친근한 어투)
        self.TONE_STYLES = {
            "oracle": "친근하고 신비로운 타로 마스터처럼 (~해요, ~예요, ~거예요 어미 사용)",
            "warm": "친근하고 따뜻한 선배가 조언하듯",
            "formal": "격식 있고 품위 있는 점술가처럼",
            "casual": "편안하고 가벼운 친구처럼",
            "mz": "MZ세대에게 맞는 트렌디한 말투로",
            "senior": "중장년층에게 맞는 안정적인 어조로"
        }

        # oracle 스타일 금지 표현 (지나치게 불확실한 표현 방지)
        self.ORACLE_FORBIDDEN = [
            "것 같습니다", "수도 있습니다",  # 격식체 불확실 표현만 금지
            "잘 모르겠어요", "글쎄요", "확실하지 않아요"
        ]

        # 기간별 표현
        self.PERIOD_EXPR = {
            "daily": "오늘",
            "weekly": "이번 주",
            "monthly": "이번 달",
            "yearly": "올해"
        }

    async def transform_tone(
        self,
        input_data: ToneTransformInput,
        tone_style: str = "oracle"
    ) -> ToneTransformOutput:
        """
        고정된 효사 데이터를 자연스러운 어투로 변환

        컨설팅 확정 핵심:
        - 새 의미를 만들지 말고, 주어진 내용만 다시 말하라
        - 150자 내외 한국어 문장
        - 실패 시 base_text 반환

        Args:
            input_data: ToneTransformInput 객체 (8개 필드 필수)
            tone_style: warm/formal/casual/mz/senior

        Returns:
            ToneTransformOutput 객체
        """
        # 입력 검증
        if not self._validate_input(input_data):
            return ToneTransformOutput(
                transformed_text=input_data.base_text,
                used_llm=False,
                fallback_reason="입력 데이터 검증 실패"
            )

        period_kr = self.PERIOD_EXPR.get(input_data.period, "오늘")
        style_guide = self.TONE_STYLES.get(tone_style, self.TONE_STYLES["warm"])

        # 현대적 운세 스타일 규칙
        oracle_rules = ""
        if tone_style == "oracle":
            oracle_rules = """
[현대적 운세 어조 규칙 - 필수]
- 문장 어미: ~해요, ~예요, ~거예요, ~세요 등 친근한 현대어 사용
- 화자: 친근하고 신비로운 타로 마스터 (20-30대 젊은 느낌)
- 이모지: 적절히 사용 OK (💫, ✨, 🍀, 👍 등)
- 정체성: 따뜻하고 친근한 운세 전문가 (공감하며 조언)
- 금지 표현: "~이니라", "~하라", "~느니라" 같은 고어체 금지
"""

        # 환각 방지 프롬프트 (컨설팅 확정)
        prompt = f"""당신은 주역 해석의 어투만 변환하는 전문가입니다.

[절대 규칙 - 반드시 준수]
1. 새로운 의미를 만들지 마세요. 주어진 내용만 다시 말하세요.
2. 아래 [원본 데이터]에 없는 내용은 절대 추가하지 마세요.
3. 150자 내외로 작성하세요.
4. "{period_kr}"에 맞는 시간 표현을 사용하세요.
5. {style_guide} 어투로 변환하세요.
{oracle_rules}
[원본 데이터 - 이 내용만 사용]
- 효사 원문: {input_data.original_text}
- 직역: {input_data.original_meaning}
- 핵심 메시지: {input_data.core_message}
- 주의사항: {input_data.caution}
- 기본 해석: {input_data.base_text}

[사용자 질문]
{input_data.user_question}

[카테고리]
{input_data.category_name}

[변환 결과 - 150자 내외]"""

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.5,  # 낮춤 (환각 방지)
                            "top_p": 0.8,
                            "num_predict": 200,
                            "repeat_penalty": 1.1  # 반복 방지
                        }
                    }
                )

                if response.status_code == 200:
                    result = response.json()
                    transformed = result.get("response", "").strip()

                    # 출력 검증
                    if self._validate_output(transformed, input_data):
                        return ToneTransformOutput(
                            transformed_text=transformed,
                            used_llm=True,
                            fallback_reason=""
                        )
                    else:
                        return ToneTransformOutput(
                            transformed_text=input_data.base_text,
                            used_llm=False,
                            fallback_reason="출력 검증 실패 (환각 의심)"
                        )
                else:
                    return ToneTransformOutput(
                        transformed_text=input_data.base_text,
                        used_llm=False,
                        fallback_reason=f"API 오류: {response.status_code}"
                    )

        except Exception as e:
            return ToneTransformOutput(
                transformed_text=input_data.base_text,
                used_llm=False,
                fallback_reason=f"예외 발생: {str(e)}"
            )

    def _validate_input(self, input_data: ToneTransformInput) -> bool:
        """입력 데이터 검증"""
        required_fields = [
            input_data.user_question,
            input_data.period,
            input_data.category_name,
            input_data.original_text,
            input_data.original_meaning,
            input_data.core_message,
            input_data.caution,
            input_data.base_text
        ]
        return all(field and len(str(field).strip()) > 0 for field in required_fields)

    def _validate_output(self, output: str, input_data: ToneTransformInput) -> bool:
        """
        출력 검증 (환각 방지) - 강화된 검증

        다층 검증:
        1. 길이 검증
        2. 금지 패턴 검증
        3. 키워드 포함 검증
        4. 포맷 검증
        """
        # 키워드 추출
        keywords = llm_validator.extract_keywords(input_data.core_message)
        keywords.extend(llm_validator.extract_keywords(input_data.base_text)[:3])

        # 종합 검증
        report = llm_validator.validate(
            response=output,
            original_text=input_data.original_text or input_data.base_text,
            keywords=keywords
        )

        # 로깅
        if not report.is_valid:
            logger.warning(
                f"LLM 응답 검증 실패: {report.result.value} - {report.details}"
            )

        return report.is_valid

    # 하위 호환성 유지 (기존 메서드)
    async def transform_style(
        self,
        original_interpretation: str,
        user_question: str,
        category: str,
        period: str = "daily",
        style: str = "warm"
    ) -> str:
        """
        하위 호환 메서드 (기존 코드 지원)
        새 코드는 transform_tone() 사용 권장
        """
        # 간소화된 입력으로 변환
        input_data = ToneTransformInput(
            user_question=user_question,
            period=period,
            category_name=category,
            original_text="",  # 레거시 호출은 원문 없음
            original_meaning="",
            core_message=original_interpretation[:50] if original_interpretation else "",
            caution="",
            base_text=original_interpretation
        )

        result = await self.transform_tone(input_data, style)
        return result.transformed_text

    async def classify_question(
        self,
        question: str,
        categories: list
    ) -> Optional[int]:
        """
        질문을 카테고리로 분류 (키워드 매칭 실패 시 보조)

        Returns:
            카테고리 ID 또는 None
        """
        category_list = "\n".join([
            f"{cat['id']}. {cat['main']}/{cat['sub']}"
            for cat in categories[:50]  # 상위 50개만
        ])

        prompt = f"""다음 질문을 가장 적합한 카테고리 번호로 분류해주세요.
숫자만 답하세요.

[질문]
{question}

[카테고리 목록]
{category_list}

[답변 (숫자만)]"""

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.1,
                            "num_predict": 10
                        }
                    }
                )

                if response.status_code == 200:
                    result = response.json()
                    answer = result.get("response", "").strip()
                    # 숫자 추출
                    import re
                    numbers = re.findall(r'\d+', answer)
                    if numbers:
                        return int(numbers[0])

        except Exception as e:
            print(f"Classification Error: {e}")

        return None

    async def health_check(self) -> bool:
        """Ollama 서버 상태 확인"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                return response.status_code == 200
        except:
            return False


# 싱글톤 인스턴스
llm_service = LLMService()

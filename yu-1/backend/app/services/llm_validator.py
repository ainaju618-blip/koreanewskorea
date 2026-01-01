"""
LLM 응답 검증 서비스

환각(Hallucination) 방지를 위한 다층 검증 시스템
"""
import re
from typing import List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum


class ValidationResult(Enum):
    """검증 결과"""
    PASS = "pass"
    FAIL_LENGTH = "fail_length"
    FAIL_KEYWORD = "fail_keyword"
    FAIL_HALLUCINATION = "fail_hallucination"
    FAIL_FORMAT = "fail_format"
    FAIL_FORBIDDEN = "fail_forbidden"
    FAIL_ORACLE_TONE = "fail_oracle_tone"


@dataclass
class ValidationReport:
    """검증 리포트"""
    is_valid: bool
    result: ValidationResult
    score: float  # 0.0 ~ 1.0
    details: str
    suggestions: List[str]


class LLMResponseValidator:
    """
    LLM 응답 검증기

    다층 검증:
    1. 길이 검증
    2. 키워드 검증 (원본 유지 확인)
    3. 환각 검증 (금지어/패턴)
    4. 포맷 검증
    """

    # 금지 패턴 (환각 의심)
    FORBIDDEN_PATTERNS = [
        r"제가 생각하기에",
        r"추측하건대",
        r"아마도.*것 같습니다",
        r"확실하지 않지만",
        r"일반적으로",
        r"보통은",
        r"\d{4}년",  # 구체적 연도
        r"\d+원",  # 구체적 금액
        r"\d+%",  # 구체적 퍼센트
        r"전문가에 따르면",
        r"연구에 의하면",
        r"통계에 따르면",
    ]

    # 점술가 스타일 금지 패턴 (상담사/불확실 어조)
    ORACLE_FORBIDDEN_PATTERNS = [
        # 불확실 표현
        r"것 같아요",
        r"것 같습니다",
        r"수도 있어요",
        r"수도 있습니다",
        r"아닐 수도",
        r"모르겠",
        r"확실하지 않",

        # 상담사 어조 (공감/위로)
        r"힘드시죠",
        r"힘드셨",
        r"괜찮아요",
        r"괜찮으세요",
        r"걱정되시",
        r"응원할게요",
        r"화이팅",
        r"파이팅",
        r"격려",

        # 제안형 (점술가는 선언함)
        r"어떨까요",
        r"어떠세요",
        r"해보세요",
        r"해보시는",
        r"추천드려요",
        r"추천합니다",
        r"고려해",
        r"생각해 보",

        # 현대적/친근 어조
        r"느껴져요",
        r"생각해요",
        r"보여요",
        r"드려요",
        r"있을 거예요",
        r"될 거예요",
        r"같네요",

        # 이모지 (유니코드 범위)
        r"[\U0001F300-\U0001F9FF]",  # 기본 이모지
        r"[\U00002600-\U000026FF]",  # 기호 이모지
        r"[\U0001F600-\U0001F64F]",  # 표정 이모지
    ]

    # 점술가 필수 어미 패턴
    ORACLE_REQUIRED_ENDINGS = [
        r"이니라[.!]?$",
        r"느니라[.!]?$",
        r"하라[.!]?$",
        r"이로다[.!]?$",
        r"리라[.!]?$",
        r"지니라[.!]?$",
        r"이니[.!]?$",
    ]

    # 필수 포함 패턴 (운세 관련)
    REQUIRED_PATTERNS = [
        r"(길|흉|평|조심|주의|좋|나쁨|신중|기다림|때|기회)",
    ]

    # 길이 제한
    MIN_LENGTH = 30
    MAX_LENGTH = 300

    def validate(
        self,
        response: str,
        original_text: str,
        keywords: List[str]
    ) -> ValidationReport:
        """
        종합 검증 수행

        Args:
            response: LLM 응답
            original_text: 원본 텍스트 (효사/괘사)
            keywords: 필수 키워드 목록

        Returns:
            ValidationReport
        """
        # 빈 응답 체크
        if not response or not response.strip():
            return ValidationReport(
                is_valid=False,
                result=ValidationResult.FAIL_LENGTH,
                score=0.0,
                details="빈 응답",
                suggestions=["LLM 재호출 필요"]
            )

        response = response.strip()
        scores = []

        # 1. 길이 검증
        length_result, length_score = self._validate_length(response)
        scores.append(length_score)
        if length_result != ValidationResult.PASS:
            return ValidationReport(
                is_valid=False,
                result=length_result,
                score=length_score,
                details=f"길이 부적합: {len(response)}자",
                suggestions=["길이 조정 필요"]
            )

        # 2. 금지 패턴 검증
        forbidden_result, forbidden_score, found = self._validate_forbidden(response)
        scores.append(forbidden_score)
        if forbidden_result != ValidationResult.PASS:
            return ValidationReport(
                is_valid=False,
                result=forbidden_result,
                score=forbidden_score,
                details=f"금지 패턴 발견: {found}",
                suggestions=["환각 의심, fallback 사용"]
            )

        # 3. 키워드 검증
        keyword_result, keyword_score = self._validate_keywords(response, keywords)
        scores.append(keyword_score)

        # 4. 포맷 검증
        format_result, format_score = self._validate_format(response)
        scores.append(format_score)

        # 종합 점수
        avg_score = sum(scores) / len(scores)
        is_valid = avg_score >= 0.6 and keyword_score >= 0.3

        return ValidationReport(
            is_valid=is_valid,
            result=ValidationResult.PASS if is_valid else ValidationResult.FAIL_KEYWORD,
            score=avg_score,
            details=f"종합 점수: {avg_score:.2f}",
            suggestions=[] if is_valid else ["키워드 포함 부족"]
        )

    def _validate_length(self, response: str) -> Tuple[ValidationResult, float]:
        """길이 검증"""
        length = len(response)

        if length < self.MIN_LENGTH:
            return ValidationResult.FAIL_LENGTH, 0.0
        elif length > self.MAX_LENGTH:
            return ValidationResult.FAIL_LENGTH, 0.3
        else:
            # 이상적 길이 100-200자
            if 100 <= length <= 200:
                return ValidationResult.PASS, 1.0
            else:
                return ValidationResult.PASS, 0.8

    def _validate_forbidden(self, response: str) -> Tuple[ValidationResult, float, str]:
        """금지 패턴 검증"""
        for pattern in self.FORBIDDEN_PATTERNS:
            match = re.search(pattern, response)
            if match:
                return ValidationResult.FAIL_FORBIDDEN, 0.0, match.group()

        return ValidationResult.PASS, 1.0, ""

    def _validate_keywords(
        self,
        response: str,
        keywords: List[str]
    ) -> Tuple[ValidationResult, float]:
        """키워드 포함 검증"""
        if not keywords:
            return ValidationResult.PASS, 0.5

        found_count = sum(1 for kw in keywords if kw in response)
        ratio = found_count / len(keywords)

        if ratio >= 0.5:
            return ValidationResult.PASS, min(1.0, ratio + 0.2)
        elif ratio >= 0.2:
            return ValidationResult.PASS, ratio + 0.1
        else:
            return ValidationResult.FAIL_KEYWORD, ratio

    def _validate_format(self, response: str) -> Tuple[ValidationResult, float]:
        """포맷 검증"""
        score = 1.0

        # 문장 종결 확인
        if not response.endswith((".", "요", "다", "세요", "습니다")):
            score -= 0.2

        # 운세 관련 표현 포함 확인
        has_fortune_expr = any(
            re.search(pattern, response)
            for pattern in self.REQUIRED_PATTERNS
        )
        if not has_fortune_expr:
            score -= 0.3

        return ValidationResult.PASS if score >= 0.5 else ValidationResult.FAIL_FORMAT, max(0, score)

    def extract_keywords(self, text: str, min_length: int = 2) -> List[str]:
        """텍스트에서 키워드 추출"""
        if not text:
            return []

        # 특수문자 제거 및 분리
        cleaned = re.sub(r'[^\w\s]', ' ', text)
        words = cleaned.split()

        # 필터링
        keywords = [
            w for w in words
            if len(w) >= min_length and not w.isdigit()
        ]

        # 중복 제거 및 상위 N개
        seen = set()
        unique = []
        for kw in keywords:
            if kw not in seen:
                seen.add(kw)
                unique.append(kw)

        return unique[:10]

    def validate_oracle_tone(self, response: str) -> ValidationReport:
        """
        점술가 어조 전용 검증

        검증 항목:
        1. 점술가 금지 패턴 (상담사/불확실 어조)
        2. 점술가 필수 어미 (~이니라, ~하라 등)
        3. 이모지 사용 금지

        Returns:
            ValidationReport
        """
        if not response or not response.strip():
            return ValidationReport(
                is_valid=False,
                result=ValidationResult.FAIL_LENGTH,
                score=0.0,
                details="빈 응답",
                suggestions=["LLM 재호출 필요"]
            )

        response = response.strip()
        issues = []
        score = 1.0

        # 1. 점술가 금지 패턴 검증
        for pattern in self.ORACLE_FORBIDDEN_PATTERNS:
            match = re.search(pattern, response)
            if match:
                issues.append(f"금지 표현: '{match.group()}'")
                score -= 0.15

        # 2. 점술가 어미 검증 (문장 단위)
        sentences = re.split(r'[.!?]', response)
        sentences = [s.strip() for s in sentences if s.strip()]

        oracle_ending_count = 0
        for sentence in sentences:
            for pattern in self.ORACLE_REQUIRED_ENDINGS:
                if re.search(pattern, sentence):
                    oracle_ending_count += 1
                    break

        if sentences:
            oracle_ratio = oracle_ending_count / len(sentences)
            if oracle_ratio < 0.3:
                issues.append(f"점술가 어미 부족: {oracle_ending_count}/{len(sentences)}문장")
                score -= 0.2
            elif oracle_ratio >= 0.7:
                score = min(score + 0.1, 1.0)  # 보너스

        # 최종 점수 보정
        score = max(0.0, score)

        if score < 0.5:
            return ValidationReport(
                is_valid=False,
                result=ValidationResult.FAIL_ORACLE_TONE,
                score=score,
                details=f"점술가 어조 부적합: {', '.join(issues[:3])}",
                suggestions=[
                    "금지 표현 제거",
                    "점술가 어미(~이니라, ~하라) 사용",
                    "상담사 어조 제거"
                ]
            )

        return ValidationReport(
            is_valid=True,
            result=ValidationResult.PASS,
            score=score,
            details=f"점술가 어조 적합 (점수: {score:.2f})",
            suggestions=issues[:2] if issues else []
        )

    def validate_with_oracle(
        self,
        response: str,
        original_text: str,
        keywords: List[str],
        is_oracle_style: bool = True
    ) -> ValidationReport:
        """
        점술가 스타일 포함 종합 검증

        Args:
            response: LLM 응답
            original_text: 원본 텍스트
            keywords: 필수 키워드
            is_oracle_style: 점술가 스타일 여부

        Returns:
            ValidationReport
        """
        # 기본 검증
        base_report = self.validate(response, original_text, keywords)

        if not base_report.is_valid:
            return base_report

        # 점술가 스타일 검증
        if is_oracle_style:
            oracle_report = self.validate_oracle_tone(response)
            if not oracle_report.is_valid:
                return oracle_report

            # 종합 점수
            combined_score = (base_report.score + oracle_report.score) / 2
            return ValidationReport(
                is_valid=True,
                result=ValidationResult.PASS,
                score=combined_score,
                details=f"종합 점수: {combined_score:.2f} (기본: {base_report.score:.2f}, 어조: {oracle_report.score:.2f})",
                suggestions=oracle_report.suggestions
            )

        return base_report


# 싱글톤 인스턴스
llm_validator = LLMResponseValidator()

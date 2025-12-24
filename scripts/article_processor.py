"""
Korea NEWS - AI Article Processor (3-Stage System)
Using local Ollama + Qwen2.5:14b

Stage 1: Convert press release to news article
Stage 2: Refine and polish the article
Stage 3: Verify facts (hallucination check)
"""

import requests
import json
from typing import Dict, Optional
from dataclasses import dataclass


@dataclass
class ProcessingResult:
    """Result of article processing"""
    original: str
    stage1_converted: str
    stage2_refined: str
    stage3_verification: str
    has_hallucination: bool
    final_article: str


class ArticleProcessor:
    """3-Stage AI Article Processor using Ollama"""

    def __init__(self, model: str = "qwen3:14b", base_url: str = "http://localhost:11434"):
        self.model = model
        self.base_url = base_url
        self.api_url = f"{base_url}/api/generate"

    def _call_ollama(self, prompt: str) -> str:
        """Call Ollama API"""
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False
        }

        try:
            response = requests.post(self.api_url, json=payload, timeout=120)
            response.raise_for_status()
            return response.json().get("response", "")
        except requests.exceptions.RequestException as e:
            print(f"Ollama API error: {e}")
            return ""

    def stage1_convert(self, press_release: str) -> str:
        """Stage 1: Convert press release to news article"""
        prompt = f"""다음 보도자료를 깔끔한 뉴스 기사로 다시 작성해줘.
오타 수정하고, 불필요한 정보(담당자, 전화번호, HTML 태그 등)는 제거하고, 핵심 내용만 정리해줘.
원본의 사실(숫자, 날짜, 이름)은 반드시 유지해야 해.
원본에 없는 내용은 절대 추가하지 마.

[보도자료]
{press_release}

[뉴스 기사]"""

        return self._call_ollama(prompt)

    def stage2_refine(self, article: str) -> str:
        """Stage 2: Refine and polish the article"""
        prompt = f"""다음 기사를 검토해서 어색한 표현이나 오류가 있으면 수정하고, 더 자연스럽게 다듬어줘.
단, 새로운 내용을 추가하지 말고, 기존 내용만 다듬어줘.

[기사]
{article}

[다듬어진 기사]"""

        return self._call_ollama(prompt)

    def stage3_verify(self, original: str, converted: str) -> Dict:
        """Stage 3: Verify facts and check for hallucination"""
        prompt = f"""다음 원본과 변환된 기사를 비교해서 사실관계를 검증해줘.

검증 항목:
1. 숫자(금액, 비율, 수량)가 원본과 일치하는지
2. 날짜가 원본과 일치하는지
3. 이름(사람, 기관)이 원본과 일치하는지
4. 원본에 없는 내용이 추가되었는지

반드시 다음 형식으로 답변해줘:
[검증결과]
- 숫자 일치: O 또는 X (불일치시 상세 내용)
- 날짜 일치: O 또는 X (불일치시 상세 내용)
- 이름 일치: O 또는 X (불일치시 상세 내용)
- 추가된 내용: 없음 또는 있음 (있으면 상세 내용)
- 최종판정: 통과 또는 수정필요

[원본]
{original}

[변환된 기사]
{converted}"""

        result = self._call_ollama(prompt)

        # Check if hallucination detected
        has_hallucination = "수정필요" in result or "추가된 내용: 있음" in result

        return {
            "verification": result,
            "has_hallucination": has_hallucination
        }

    def process_article(self, press_release: str) -> ProcessingResult:
        """Process article through 2 stages (convert + verify)"""
        print("Stage 1: Converting press release to news article...")
        stage1_result = self.stage1_convert(press_release)

        print("Stage 2: Verifying facts...")
        stage2_result = self.stage3_verify(press_release, stage1_result)

        return ProcessingResult(
            original=press_release,
            stage1_converted=stage1_result,
            stage2_refined=stage1_result,  # Skip refinement, use stage1 directly
            stage3_verification=stage2_result["verification"],
            has_hallucination=stage2_result["has_hallucination"],
            final_article=stage1_result  # Always use stage1 result
        )


def main():
    """Test the article processor"""
    # Test press release with typos and garbage data
    test_press_release = """[보도자료] 전라남되 농정국 농산물유통과
담당자: 김철수 주무관 (061-286-5432)
배포일시: 2024.12.24(화) 조간용

<p class="title">전라남도, 농산물 수춯 실적 역대 최고<br/></p>

&nbsp;&nbsp;전라남도(지사 김영록)는 도 내 22개 시군과 함게 2024년 상반기 농산믈 수출실적을 점검한 결과, 전년 동기 대비 15.3% 증가한 1억 2천만불 달러를 기록햇다고 24일 밝혔다.

주요 수출 품목은 김치, 파프리카, 딸기 등 이며,, 특히 김치의 경우 미국과 일봄 시장에서 수요가 크께 늘어 전년 대비 32% 증가했다.

※ 붙임: 2024년 상반기 품목별 수출현황(별첨)
   문의: 농산물유통과 ☎061-286-5432

도는 하반기에도 신규 수출시장 겍척과 현지 마게팅 강화를 통해 연간 수출 목표 2억 5천만 달러 달성에 총력을 기울일 계획이다...

[끝] 본 보도자료는 전라남도 공식 자료입니다.
copyrightⓒ 전라남도청. All rights reserved."""

    # Initialize processor
    processor = ArticleProcessor(model="qwen2.5:14b")

    # Process article
    print("=" * 60)
    print("Korea NEWS - AI Article Processor")
    print("=" * 60)

    result = processor.process_article(test_press_release)

    print("\n" + "=" * 60)
    print("RESULTS")
    print("=" * 60)

    print("\n[Stage 1 - Converted]")
    print("-" * 40)
    print(result.stage1_converted)

    print("\n[Stage 2 - Refined]")
    print("-" * 40)
    print(result.stage2_refined)

    print("\n[Stage 3 - Verification]")
    print("-" * 40)
    print(result.stage3_verification)

    print("\n[Final Result]")
    print("-" * 40)
    print(f"Hallucination detected: {result.has_hallucination}")
    print(f"\nFinal Article:\n{result.final_article}")


if __name__ == "__main__":
    main()

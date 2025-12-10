"""
AI 기사 번역 유틸리티 모듈
- 단일 기사 번역/재작성 함수 제공
- 스크래퍼에서 임포트하여 사용
"""

import os
from typing import Dict, Optional
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

# OpenAI 임포트
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# === 설정 ===
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GPT_MODEL = os.getenv("GPT_MODEL", "gpt-4o-mini")  # 비용 절감용 기본값

# 재작성 프롬프트 (한국 뉴스 문체)
REWRITE_SYSTEM_PROMPT = """너는 'Korea NEWS'의 AI/테크 전문 기자다. 
아래 영문 기사를 한국의 IT 전문가들이 읽기 편하게 번역하고 다듬어라.

## 규칙:
1. 문체는 '해요'체가 아닌 **'한다/이다'체(경어체)**로 작성한다.
2. 불필요한 서두("이 기사는...", "최근...") 없이 핵심 내용을 바로 전달한다.
3. 외국 기업/인물 이름은 원문 그대로 유지하고, 필요시 괄호 안에 한글 표기를 추가한다.
4. 기술 용어는 업계에서 통용되는 표현을 사용한다.
5. 문장은 간결하게, 한 문장에 하나의 정보만 담는다.

## 출력 형식:
반드시 아래 형식으로 출력한다:

[제목]
(한국어로 번역된 기사 제목, 한 줄)

[본문]
(한국어로 번역된 전체 본문)

[요약]
- (핵심 내용 1)
- (핵심 내용 2)  
- (핵심 내용 3)
"""


class AIRewriter:
    """단일 기사 AI 번역/재작성 클래스"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Args:
            api_key: OpenAI API 키 (None이면 환경변수에서 로드)
        """
        self.api_key = api_key or OPENAI_API_KEY
        self.client = None
        self.enabled = False
        
        if not OPENAI_AVAILABLE:
            print("⚠️ [AIRewriter] openai 패키지가 설치되지 않았습니다.")
            return
            
        if not self.api_key:
            print("⚠️ [AIRewriter] OPENAI_API_KEY가 설정되지 않았습니다.")
            return
        
        self.client = OpenAI(api_key=self.api_key)
        self.enabled = True
        print("✅ [AIRewriter] 초기화 완료")

    def rewrite(self, title: str, content: str, source: str = "") -> Optional[Dict[str, str]]:
        """
        단일 기사 번역/재작성
        
        Args:
            title: 원문 제목 (영어)
            content: 원문 본문 (영어)
            source: 출처 (예: TechCrunch)
            
        Returns:
            Dict with keys: title, content, ai_summary
            또는 실패 시 None
        """
        if not self.enabled:
            return None
        
        try:
            # [AI 번역 준비중] 태그 제거
            clean_content = content.replace('[AI 번역 준비중]', '').strip()
            
            user_prompt = f"""## 원문 제목
{title}

## 출처
{source}

## 원문 본문
{clean_content[:4000]}

---
위 영문 기사를 한국어로 번역하고, 한국 뉴스 문체로 다듬어 출력하라."""

            response = self.client.chat.completions.create(
                model=GPT_MODEL,
                messages=[
                    {"role": "system", "content": REWRITE_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            output = response.choices[0].message.content
            return self._parse_output(output)
            
        except Exception as e:
            print(f"   ❌ [AIRewriter] GPT API 오류: {str(e)[:50]}")
            return None

    def _parse_output(self, output: str) -> Optional[Dict[str, str]]:
        """GPT 출력을 파싱하여 제목/본문/요약 추출"""
        try:
            result = {'title': '', 'content': '', 'ai_summary': ''}
            
            # [제목] 추출
            if '[제목]' in output:
                title_start = output.find('[제목]') + len('[제목]')
                title_end = output.find('[본문]') if '[본문]' in output else output.find('\n\n', title_start)
                result['title'] = output[title_start:title_end].strip()
            
            # [본문] 추출
            if '[본문]' in output:
                content_start = output.find('[본문]') + len('[본문]')
                content_end = output.find('[요약]') if '[요약]' in output else len(output)
                result['content'] = output[content_start:content_end].strip()
            
            # [요약] 추출
            if '[요약]' in output:
                summary_start = output.find('[요약]') + len('[요약]')
                result['ai_summary'] = output[summary_start:].strip()
            
            # 유효성 검사
            if not result['title'] or not result['content']:
                # 형식이 맞지 않으면 전체를 본문으로 사용
                result['content'] = output
                result['title'] = output.split('\n')[0][:100]
            
            return result
            
        except Exception as e:
            print(f"   ⚠️ [AIRewriter] 파싱 오류: {e}")
            return None


# 편의를 위한 전역 인스턴스 함수
_rewriter_instance: Optional[AIRewriter] = None

def get_rewriter() -> AIRewriter:
    """싱글톤 AIRewriter 인스턴스 반환"""
    global _rewriter_instance
    if _rewriter_instance is None:
        _rewriter_instance = AIRewriter()
    return _rewriter_instance


def rewrite_article(title: str, content: str, source: str = "") -> Optional[Dict[str, str]]:
    """
    편의 함수: 단일 기사 번역
    
    Usage:
        from utils.ai_rewriter import rewrite_article
        result = rewrite_article(title, content, source)
        if result:
            translated_title = result['title']
            translated_content = result['content']
            summary = result['ai_summary']
    """
    rewriter = get_rewriter()
    return rewriter.rewrite(title, content, source)

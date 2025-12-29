# -*- coding: utf-8 -*-
"""
Groq API 클라이언트
- 영문 기사 → 한국어 번역 + 5000자 요약
- llama3.1-70b-versatile 모델 사용
- Rate Limit 관대 (무료)

버전: v1.0
작성일: 2025-12-15
"""

import os
import json
import re
import time
import logging
from typing import Optional, Dict
from dotenv import load_dotenv

# 로깅 설정 - all logs go to logs/ folder
LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'logs')
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, 'groq_client.log')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler()
    ]
)

# .env 로드
load_dotenv()

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    logging.warning("groq 패키지가 설치되지 않았습니다.")
    logging.warning("pip install groq")


class GroqClient:
    """
    Groq API 클라이언트
    - llama3.1-70b-versatile 모델 (한국어 우수)
    - 무료, Rate Limit 관대
    """
    
    def __init__(self, api_key: str = None):
        """
        Args:
            api_key: Groq API 키 (없으면 환경변수에서 로드)
        """
        if not GROQ_AVAILABLE:
            raise ImportError("groq 패키지를 설치하세요: pip install groq")
        
        self.api_key = api_key or os.getenv('GROQ_API_KEY')
        if not self.api_key:
            raise ValueError("Groq API 키가 필요합니다.")
        
        self.client = Groq(api_key=self.api_key)
        self.model_name = 'llama-3.3-70b-versatile'
        
        logging.info(f"Groq 클라이언트 초기화 완료 ({self.model_name})")
    
    def translate_and_summarize(self, 
                                 title: str, 
                                 content: str, 
                                 max_length: int = 5000,
                                 max_retry: int = 3) -> Optional[Dict]:
        """
        영문 기사를 한국어로 번역하고 요약
        
        Args:
            title: 영문 제목
            content: 영문 본문
            max_length: 요약 최대 길이 (기본 5000자)
            max_retry: 최대 재시도 횟수
            
        Returns:
            {
                "title_ko": "한국어 제목",
                "summary_ko": "한국어 요약 본문",
                "key_points": ["핵심 포인트 1", ...]
            }
        """
        # 본문이 너무 길면 잘라서 처리
        if len(content) > 10000:
            content = content[:10000] + "..."
        
        prompt = f'''당신은 전문 영한 번역가입니다. 다음 영문 기사를 한국어로 **번역**해주세요.

## 번역 규칙
1. 제목을 한국어로 번역
2. **본문 전체를 한국어로 번역** - 요약하지 않음, 원문 그대로 번역
3. 한 문장도 빠뜨리지 않고 모든 내용을 번역
4. 고유명사(회사명, 제품명, 인명)는 영문 유지
5. 자연스러운 한국어로 번역

## 원문 제목
{title}

## 원문 본문
{content}

## 출력 형식 (반드시 JSON으로만 응답)
{{
    "title_ko": "한국어 제목",
    "content_ko": "한국어 번역 전문",
    "key_points": ["핵심1", "핵심2", "핵심3"]
}}'''

        for attempt in range(max_retry):
            try:
                response = self.client.chat.completions.create(
                    model=self.model_name,
                    messages=[
                        {"role": "system", "content": "당신은 전문 뉴스 번역가입니다. JSON 형식으로만 응답하세요."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=8000
                )
                
                text = response.choices[0].message.content.strip()
                logging.info(f"  Groq 응답 수신 ({len(text)}자)")
                
                # JSON 파싱
                result = self._parse_json_response(text)
                
                if result:
                    if result.get('summary_ko') and len(result['summary_ko']) > max_length:
                        result['summary_ko'] = result['summary_ko'][:max_length]
                    return result
                
                logging.warning(f"  JSON 파싱 실패 (시도 {attempt+1}/{max_retry})")
                
            except Exception as e:
                error_str = str(e)
                logging.error(f"  Groq API 오류: {error_str[:100]}")
                if attempt < max_retry - 1:
                    time.sleep(2 ** attempt)
                else:
                    break
        
        return None
    
    def _parse_json_response(self, text: str) -> Optional[Dict]:
        """Groq 응답에서 JSON 추출"""
        try:
            # 코드 블록 제거
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
            
            return json.loads(text.strip())
            
        except json.JSONDecodeError:
            try:
                match = re.search(r'\{[\s\S]*\}', text)
                if match:
                    return json.loads(match.group())
            except:
                pass
            
            return None


# 테스트 함수
def test_groq_client(api_key: str = None):
    """Groq 클라이언트 테스트"""
    print("\n" + "="*60)
    print(" Groq API 테스트 (llama3.1-70b)")
    print("="*60)
    
    try:
        client = GroqClient(api_key)
        
        test_title = "OpenAI announces GPT-5 with enhanced reasoning capabilities"
        test_content = """
        OpenAI has announced the release of GPT-5, its latest large language model 
        featuring significantly improved reasoning and problem-solving capabilities.
        The new model demonstrates enhanced performance in complex tasks including 
        mathematical reasoning, code generation, and multi-step logical analysis.
        """
        
        print("\n[테스트] 번역/요약 요청 중...")
        result = client.translate_and_summarize(test_title, test_content, max_length=500)
        
        if result:
            print("\n[성공!]")
            print(f"  한국어 제목: {result.get('title_ko', 'N/A')}")
            print(f"  요약 길이: {len(result.get('summary_ko', ''))}자")
            print(f"  핵심 포인트: {result.get('key_points', [])}")
            print("\n  요약 본문:")
            print(f"  {result.get('summary_ko', 'N/A')[:200]}...")
            return True
        else:
            print("[실패] 번역 실패")
            return False
            
    except Exception as e:
        print(f"[오류] 테스트 실패: {e}")
        return False


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Groq API 테스트')
    parser.add_argument('--api-key', type=str, default=None, help='Groq API 키')
    args = parser.parse_args()
    
    test_groq_client(args.api_key)

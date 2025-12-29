# -*- coding: utf-8 -*-
"""
Gemini API 클라이언트 (Rate Limit 자동 처리 버전)
- 영문 기사 → 한국어 번역 + 5000자 요약
- 4초 간격으로 RPM 제한 준수
- Exponential backoff로 429 에러 자동 처리

버전: v2.0 (Rate Limit 자동 처리)
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
LOG_FILE = os.path.join(LOG_DIR, 'gemini_client.log')

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
    from google import genai
    GENAI_AVAILABLE = True
except ImportError:
    try:
        import google.generativeai as genai
        GENAI_AVAILABLE = True
    except ImportError:
        GENAI_AVAILABLE = False
        logging.warning("google-genai 패키지가 설치되지 않았습니다.")
        logging.warning("pip install google-genai")


class GeminiClient:
    """
    Gemini API 클라이언트 (Rate Limit 자동 처리)
    - 4초 간격으로 분당 15회 제한 준수
    - 429 에러 시 Exponential backoff
    """
    
    def __init__(self, api_key: str = None):
        """
        Args:
            api_key: Gemini API 키 (없으면 환경변수에서 로드)
        """
        if not GENAI_AVAILABLE:
            raise ImportError("google-genai 패키지를 설치하세요: pip install google-genai")
        
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("Gemini API 키가 필요합니다.")
        
        # 새 SDK 방식: genai.Client 사용
        try:
            self.client = genai.Client(api_key=self.api_key)
            self.model_name = 'gemini-2.0-flash'
            self.use_new_sdk = True
        except:
            # 이전 SDK 방식
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-2.0-flash')
            self.model_name = 'gemini-2.0-flash'
            self.use_new_sdk = False
        
        # Rate Limit 설정
        self.last_request = 0
        self.rpm_delay = 4  # 15RPM → 4초 간격 보장
        
        logging.info(f"Gemini 클라이언트 초기화 완료 ({self.model_name})")
    
    def _wait_for_rate_limit(self):
        """RPM 제한 준수를 위한 대기"""
        now = time.time()
        elapsed = now - self.last_request
        if elapsed < self.rpm_delay:
            wait_time = self.rpm_delay - elapsed
            logging.info(f"  Rate limit 대기: {wait_time:.1f}초...")
            time.sleep(wait_time)
    
    def _generate_content(self, prompt: str) -> Optional[str]:
        """Gemini API 호출 (SDK 버전에 따라)"""
        if self.use_new_sdk:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            return response.text.strip()
        else:
            response = self.model.generate_content(prompt)
            return response.text.strip()
    
    def translate_and_summarize(self, 
                                 title: str, 
                                 content: str, 
                                 max_length: int = 5000,
                                 max_retry: int = 3) -> Optional[Dict]:
        """
        영문 기사를 한국어로 번역하고 요약 (Rate Limit 자동 처리)
        
        Args:
            title: 영문 제목
            content: 영문 본문
            max_length: 요약 최대 길이 (기본 5000자)
            max_retry: 최대 재시도 횟수
            
        Returns:
            {
                "title_ko": "한국어 제목",
                "summary_ko": "한국어 요약 본문",
                "key_points": ["핵심 포인트 1", "핵심 포인트 2", ...]
            }
        """
        # 본문이 너무 길면 잘라서 처리
        if len(content) > 15000:
            content = content[:15000] + "..."
        
        prompt = f'''당신은 전문 뉴스 번역가입니다. 다음 영문 AI 기사를 한국어로 번역하고 요약해주세요.

## 요구사항
1. 제목을 한국어로 번역 (간결하고 명확하게)
2. 본문을 한국어로 번역하고 {max_length}자 이내로 요약
3. 뉴스 기사 형식으로 작성
4. 전문 용어는 적절히 번역하되, 고유명사(회사명, 제품명)는 영문 유지 가능

## 원문 제목
{title}

## 원문 본문
{content}

## 출력 형식 (반드시 JSON으로만 응답)
{{
    "title_ko": "한국어 제목",
    "summary_ko": "한국어 요약 본문 ({max_length}자 이내)",
    "key_points": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"]
}}'''

        for attempt in range(max_retry):
            try:
                # RPM 제한 준수
                self._wait_for_rate_limit()
                
                # API 호출
                text = self._generate_content(prompt)
                self.last_request = time.time()
                
                logging.info(f"  Gemini 응답 수신 ({len(text)}자)")
                
                # JSON 파싱
                result = self._parse_json_response(text)
                
                if result:
                    # 요약 길이 제한
                    if result.get('summary_ko') and len(result['summary_ko']) > max_length:
                        result['summary_ko'] = result['summary_ko'][:max_length]
                    return result
                
                logging.warning(f"  JSON 파싱 실패 (시도 {attempt+1}/{max_retry})")
                
            except Exception as e:
                error_str = str(e)
                if "429" in error_str:
                    wait_time = 60 * (attempt + 1)  # 1분, 2분, 3분 대기
                    logging.warning(f"  Rate limit 초과 (시도 {attempt+1}/{max_retry}), {wait_time}초 대기...")
                    time.sleep(wait_time)
                else:
                    logging.error(f"  Gemini API 오류: {error_str[:100]}")
                    if attempt < max_retry - 1:
                        time.sleep(2 ** attempt)  # Exponential backoff
                    else:
                        break
        
        return None
    
    def _parse_json_response(self, text: str) -> Optional[Dict]:
        """Gemini 응답에서 JSON 추출"""
        try:
            # 코드 블록 제거
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
            
            # JSON 파싱
            return json.loads(text.strip())
            
        except json.JSONDecodeError:
            # JSON 형태가 아닌 경우 텍스트에서 추출 시도
            try:
                match = re.search(r'\{[\s\S]*\}', text)
                if match:
                    return json.loads(match.group())
            except:
                pass
            
            return None


def get_reporter_gemini_key(reporter_id: str) -> Optional[str]:
    """Supabase에서 기자의 Gemini API 키 조회"""
    try:
        from supabase import create_client
        
        url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not url or not key:
            return None
        
        supabase = create_client(url, key)
        result = supabase.table('reporters').select('gemini_api_key').eq('id', reporter_id).single().execute()
        
        return result.data.get('gemini_api_key') if result.data else None
        
    except Exception as e:
        logging.error(f"기자 API 키 조회 실패: {e}")
        return None


# 테스트 함수
def test_gemini_client(api_key: str = None):
    """Gemini 클라이언트 테스트"""
    print("\n" + "="*60)
    print(" Gemini API 테스트 (Rate Limit 자동 처리)")
    print("="*60)
    
    try:
        client = GeminiClient(api_key)
        
        # 테스트 기사
        test_title = "OpenAI announces GPT-5 with enhanced reasoning capabilities"
        test_content = """
        OpenAI has announced the release of GPT-5, its latest large language model 
        featuring significantly improved reasoning and problem-solving capabilities.
        The new model demonstrates enhanced performance in complex tasks including 
        mathematical reasoning, code generation, and multi-step logical analysis.
        CEO Sam Altman stated that GPT-5 represents a major step toward artificial 
        general intelligence (AGI), with the model showing improved ability to 
        understand context and maintain coherent responses over longer conversations.
        """
        
        print("\n[테스트] 번역/요약 요청 중... (4초 간격 준수)")
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
    parser = argparse.ArgumentParser(description='Gemini API 테스트')
    parser.add_argument('--api-key', type=str, default=None, help='Gemini API 키')
    args = parser.parse_args()
    
    test_gemini_client(args.api_key)

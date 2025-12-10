"""
AI 기사 번역 및 Rewriting 모듈
- 영문 기사(Draft)를 한국어 뉴스 문체로 자동 번역
- GPT-4o 기반 프롬프트 엔지니어링
- 3줄 요약 자동 생성
- Supabase DB 업데이트
"""

import os
import sys
import time
from typing import List, Dict, Optional
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# OpenAI 및 Supabase 임포트
try:
    from openai import OpenAI
except ImportError:
    print("❌ openai 패키지가 설치되지 않았습니다.")
    print("   pip install openai")
    sys.exit(1)

try:
    from supabase import create_client, Client
except ImportError:
    print("❌ supabase 패키지가 설치되지 않았습니다.")
    print("   pip install supabase")
    sys.exit(1)


# === 설정 ===
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

# GPT 모델 설정
GPT_MODEL = "gpt-4o"  # 또는 "gpt-4o-mini" (비용 절감용)

# 재작성 프롬프트 (한국 뉴스 문체)
REWRITE_SYSTEM_PROMPT = """너는 'Korea NEWS'의 AI/테크 전문 기자다. 
아래 영문 기사를 한국의 IT 전문가들이 읽기 편하게 번역하고 다듬어라.

## 규칙:
1. 문체는 '해요'체가 아닌 **'한다/이다'체(경어체)**로 작성한다.
2. 불필요한 서두("이 기사는...", "최근...") 없이 핵심 내용을 바로 전달한다.
3. 외국 기업/인물 이름은 원문 그대로 유지하고, 필요시 괄호 안에 한글 표기를 추가한다.
4. 기술 용어는 업계에서 통용되는 표현을 사용한다.
5. 문장은 간결하게, 한 문장에 하나의 정보만 담는다.
6. HTML 태그는 가능한 보존한다.

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
    """AI 기반 기사 번역/재작성 프로세서"""
    
    def __init__(self):
        # API 키 검증
        if not OPENAI_API_KEY:
            print("⚠️ OPENAI_API_KEY가 설정되지 않았습니다.")
            print("   .env 파일에 OPENAI_API_KEY를 추가하세요.")
            self.openai_client = None
        else:
            self.openai_client = OpenAI(api_key=OPENAI_API_KEY)
        
        # Supabase 클라이언트 초기화
        if not SUPABASE_URL or not SUPABASE_KEY:
            print("❌ Supabase 환경 변수가 설정되지 않았습니다.")
            sys.exit(1)
        
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.stats = {'processed': 0, 'success': 0, 'failed': 0, 'skipped': 0}

    def run(self, limit: int = 10, dry_run: bool = False):
        """
        AI 번역/재작성 실행
        
        Args:
            limit: 처리할 최대 기사 수
            dry_run: True면 DB 업데이트 없이 결과만 출력
        """
        print("=" * 60)
        print("🤖 AI 기사 번역/Rewriting 모듈 시작")
        print("=" * 60)
        
        if not self.openai_client:
            print("\n❌ OpenAI API 키가 없어 실행을 중단합니다.")
            return
        
        # Step 1: Draft 상태의 AI 카테고리 기사 조회
        articles = self._fetch_draft_articles(limit)
        
        if not articles:
            print("\n✅ 처리할 기사가 없습니다.")
            return
        
        print(f"\n📰 처리 대상: {len(articles)}건")
        
        # Step 2: 각 기사 처리
        for i, article in enumerate(articles, 1):
            print(f"\n[{i}/{len(articles)}] {article['title'][:50]}...")
            
            # [AI 번역 준비중] 태그가 없으면 스킵 (이미 처리됨)
            if '[AI 번역 준비중]' not in (article.get('content') or ''):
                print("   ⏩ 이미 번역된 기사, 스킵")
                self.stats['skipped'] += 1
                continue
            
            # GPT로 번역/재작성
            result = self._rewrite_article(article)
            
            if not result:
                print("   ❌ 번역 실패")
                self.stats['failed'] += 1
                continue
            
            # DB 업데이트
            if not dry_run:
                success = self._update_article(article['id'], result)
                if success:
                    print(f"   ✅ 번역 완료 → '{result['title'][:30]}...'")
                    self.stats['success'] += 1
                else:
                    print("   ❌ DB 업데이트 실패")
                    self.stats['failed'] += 1
            else:
                print(f"   🔍 [DRY RUN] 결과: {result['title'][:40]}...")
                self.stats['success'] += 1
            
            self.stats['processed'] += 1
            
            # API 호출 간격 (Rate Limit 방지)
            time.sleep(1)
        
        self._print_summary()

    def _fetch_draft_articles(self, limit: int) -> List[Dict]:
        """Draft 상태의 AI 카테고리 기사 조회"""
        try:
            response = self.supabase.table('posts') \
                .select('id, title, content, source, category, original_link') \
                .eq('status', 'draft') \
                .eq('category', 'AI') \
                .limit(limit) \
                .execute()
            
            return response.data or []
        except Exception as e:
            print(f"❌ DB 조회 오류: {e}")
            return []

    def _rewrite_article(self, article: Dict) -> Optional[Dict]:
        """GPT를 사용하여 기사 번역/재작성"""
        try:
            # 원문 준비 (태그 제거)
            original_content = (article.get('content') or '').replace('[AI 번역 준비중]', '').strip()
            original_title = article.get('title', '')
            source = article.get('source', 'Unknown')
            
            user_prompt = f"""## 원문 제목
{original_title}

## 출처
{source}

## 원문 본문
{original_content}

---
위 영문 기사를 한국어로 번역하고, 한국 뉴스 문체로 다듬어 출력하라."""

            response = self.openai_client.chat.completions.create(
                model=GPT_MODEL,
                messages=[
                    {"role": "system", "content": REWRITE_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            output = response.choices[0].message.content
            
            # 출력 파싱
            return self._parse_gpt_output(output)
            
        except Exception as e:
            print(f"   ❌ GPT API 오류: {str(e)[:50]}")
            return None

    def _parse_gpt_output(self, output: str) -> Optional[Dict]:
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
            print(f"   ⚠️ 파싱 오류: {e}")
            return None

    def _update_article(self, article_id: str, result: Dict) -> bool:
        """DB에 번역 결과 업데이트"""
        try:
            update_data = {
                'title': result['title'],
                'content': result['content'],
                'ai_summary': result['ai_summary'],
                'status': 'review'  # 관리자 검수 대기 상태로 변경
            }
            
            self.supabase.table('posts') \
                .update(update_data) \
                .eq('id', article_id) \
                .execute()
            
            return True
            
        except Exception as e:
            print(f"   ❌ DB 업데이트 오류: {e}")
            return False

    def _print_summary(self):
        """결과 요약 출력"""
        print("\n" + "=" * 60)
        print("📊 처리 결과:")
        print(f"   - 총 처리: {self.stats['processed']}건")
        print(f"   - 성공: {self.stats['success']}건")
        print(f"   - 실패: {self.stats['failed']}건")
        print(f"   - 스킵: {self.stats['skipped']}건")
        print("=" * 60)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='AI 기사 번역/재작성 모듈')
    parser.add_argument('--limit', type=int, default=10, help='처리할 최대 기사 수')
    parser.add_argument('--dry-run', action='store_true', help='DB 업데이트 없이 결과만 출력')
    
    args = parser.parse_args()
    
    rewriter = AIRewriter()
    rewriter.run(limit=args.limit, dry_run=args.dry_run)

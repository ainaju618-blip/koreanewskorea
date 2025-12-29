"""
해외 AI 뉴스 전문(Full Text) 수집기
- RSS에서 링크 확보 후 상세 페이지 크롤링
- 본문 전체(최소 1000자) + 고해상도 이미지(og:image) 수집
- Next.js API 연동 (/api/bot/ingest)
"""

import feedparser
import requests
from datetime import datetime
import json
import os
import sys
import time
from bs4 import BeautifulSoup

# Logs directory - all logs go to logs/ folder
LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs')
os.makedirs(LOG_DIR, exist_ok=True)
from dateutil import parser as date_parser
from typing import List, Dict, Optional

# 공통 API 클라이언트 임포트
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from utils.api_client import send_article_to_server
    from utils.ai_rewriter import rewrite_article
except ImportError:
    # 프로젝트 루트에서 실행 시
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'scrapers'))
    from scrapers.utils.api_client import send_article_to_server
    from scrapers.utils.ai_rewriter import rewrite_article

# === 설정 ===
RSS_FEEDS = {
    "TechCrunch": "https://techcrunch.com/category/artificial-intelligence/feed/",
    "Wired AI": "https://www.wired.com/feed/tag/ai/latest/rss",
    "MIT Tech Review": "https://www.technologyreview.com/topic/artificial-intelligence/feed",
    "AI News": "https://artificialintelligence-news.com/feed/",
}

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8',
}

MAX_ARTICLES_PER_FEED = 5
MIN_CONTENT_LENGTH = 1000  # 최소 1000자


class FullTextRSSCollector:
    """2단계 스크래핑: RSS → 상세 페이지 크롤링"""
    
    def __init__(self):
        self.collected_news: List[Dict] = []
        self.stats = {'created': 0, 'skipped': 0, 'failed': 0, 'scrape_fail': 0}

    def run(self, mode: str = 'api'):
        """
        RSS 수집 및 전문 스크래핑 실행
        
        Args:
            mode: 'api' - API로 전송 (기본값)
                  'json' - JSON 파일로 저장
                  'both' - 둘 다 실행
        """
        print("=" * 60)
        print("🌍 해외 AI 뉴스 전문(Full Text) 수집기 시작")
        print("=" * 60)
        
        # Step 1: 모든 피드에서 링크 수집 + 상세 페이지 크롤링
        for source_name, rss_url in RSS_FEEDS.items():
            self._process_feed(source_name, rss_url)
        
        if not self.collected_news:
            print("\n⚠️ 수집된 기사가 없습니다.")
            return
        
        print(f"\n✅ 총 {len(self.collected_news)}개 기사 전문 수집 완료")
        
        # 모드별 처리
        if mode in ('json', 'both'):
            self._save_to_json()
        
        if mode in ('api', 'both'):
            self._send_to_api()
        
        self._print_summary(mode)

    def _process_feed(self, source_name: str, rss_url: str):
        """단일 RSS 피드 처리 (2단계 스크래핑)"""
        print(f"\n[*] {source_name} 처리 중...")
        
        try:
            # Step 1: RSS에서 링크 목록 확보
            feed = feedparser.parse(rss_url)
            
            if not feed.entries:
                print(f"    ⚠️ 피드에 기사가 없습니다.")
                return
            
            for entry in feed.entries[:MAX_ARTICLES_PER_FEED]:
                article_url = entry.link
                title = entry.title
                
                print(f"    📰 {title[:50]}...")
                
                # Step 2: 상세 페이지 크롤링
                full_content = self._scrape_full_content(article_url, source_name)
                
                if not full_content:
                    print(f"        ❌ 전문 수집 실패")
                    self.stats['scrape_fail'] += 1
                    continue
                
                content_len = len(full_content['content'])
                print(f"        ✅ 본문 길이: {content_len}자")
                
                if content_len < MIN_CONTENT_LENGTH:
                    print(f"        ⚠️ 본문이 너무 짧음 ({content_len}자 < {MIN_CONTENT_LENGTH}자), RSS 요약 사용")
                    # 폴백: RSS 요약 사용
                    summary = self._clean_html(entry.get('summary', ''))
                    full_content['content'] = summary
                
                # Step 3: AI 번역 시도 (OPENAI_API_KEY가 설정된 경우에만)
                final_title = title
                final_content = full_content['content']
                ai_summary = ''
                
                ai_result = rewrite_article(title, full_content['content'], source_name)
                if ai_result:
                    print(f"        🤖 AI 번역 완료")
                    final_title = ai_result.get('title') or title
                    final_content = ai_result.get('content') or full_content['content']
                    ai_summary = ai_result.get('ai_summary', '')
                else:
                    # AI 번역 실패 시 원문 + 태그
                    print(f"        ⚠️ AI 번역 미수행 (API 키 미설정 또는 오류)")
                    final_content = f"[AI 번역 준비중]\n\n{full_content['content']}"
                
                # 날짜 파싱
                published_at = self._parse_date(entry.get('published', ''))
                
                news_item = {
                    'source': source_name,
                    'title': final_title,
                    'link': article_url,
                    'published_at': published_at,
                    'content': final_content,
                    'content_length': len(final_content),
                    'thumbnail_url': full_content.get('image_url'),
                    'category': 'AI',
                    'ai_summary': ai_summary,
                }
                self.collected_news.append(news_item)
                
                # 서버 부하 방지 (Anti-blocking)
                time.sleep(1)
                
        except Exception as e:
            print(f"    ❌ 피드 처리 오류: {e}")

    def _scrape_full_content(self, url: str, source_name: str) -> Optional[Dict]:
        """상세 페이지에서 전문 + 이미지 추출"""
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            resp.raise_for_status()
            
            soup = BeautifulSoup(resp.text, 'html.parser')
            
            # 불필요한 요소 제거
            for tag in soup.find_all(['script', 'style', 'nav', 'footer', 'aside', 'iframe']):
                tag.decompose()
            for tag in soup.find_all(class_=['ad', 'advertisement', 'social-share', 'related-posts']):
                tag.decompose()
            
            # 1. 본문 추출 (사이트별 전략)
            content = self._extract_article_content(soup, source_name)
            
            # 2. 이미지 추출 (og:image 우선)
            image_url = self._extract_og_image(soup)
            
            if not content:
                return None
            
            # 순수 본문 반환 (AI 번역은 _process_feed에서 처리)
            return {
                'content': content,
                'image_url': image_url
            }
            
        except requests.exceptions.Timeout:
            print(f"        ⏱️ 타임아웃")
            return None
        except Exception as e:
            print(f"        ❌ 스크래핑 오류: {str(e)[:50]}")
            return None

    def _extract_article_content(self, soup: BeautifulSoup, source_name: str) -> str:
        """사이트별 본문 추출 전략"""
        
        # 공통 본문 컨테이너 찾기 (우선순위 순)
        article = (
            soup.find('article') or
            soup.find('div', class_='wp-block-post-content') or
            soup.find('div', class_='article-content') or
            soup.find('div', class_='entry-content') or
            soup.find('div', class_='post-content') or
            soup.find('div', class_='content-body') or
            soup.find('main')
        )
        
        if not article:
            # 폴백: body 전체에서 p 태그 수집
            article = soup.find('body')
        
        if not article:
            return ''
        
        # 모든 p 태그에서 텍스트 추출
        paragraphs = article.find_all('p')
        
        # 의미 있는 문단만 수집 (최소 20자 이상)
        valid_paragraphs = []
        for p in paragraphs:
            text = p.get_text(strip=True)
            # 광고/소셜 텍스트 필터링
            if len(text) > 20 and not self._is_junk_text(text):
                valid_paragraphs.append(text)
        
        full_text = '\n\n'.join(valid_paragraphs)
        
        # 5000자 제한
        return full_text[:5000]

    def _is_junk_text(self, text: str) -> bool:
        """불필요한 텍스트 필터링"""
        junk_patterns = [
            'read more', 'continue reading', 'subscribe',
            'sign up', 'newsletter', 'advertisement',
            'click here', 'learn more', 'share this',
            'follow us', 'related articles', 'recommended',
        ]
        text_lower = text.lower()
        return any(pattern in text_lower for pattern in junk_patterns)

    def _extract_og_image(self, soup: BeautifulSoup) -> Optional[str]:
        """og:image 메타 태그에서 고해상도 이미지 추출"""
        og_image = soup.find('meta', property='og:image')
        if og_image and og_image.get('content'):
            return og_image['content']
        
        # 폴백: twitter:image
        twitter_image = soup.find('meta', attrs={'name': 'twitter:image'})
        if twitter_image and twitter_image.get('content'):
            return twitter_image['content']
        
        return None

    def _parse_date(self, date_str: str) -> str:
        """날짜 문자열을 ISO 8601로 변환"""
        if not date_str:
            return datetime.now().isoformat()
        try:
            dt = date_parser.parse(date_str)
            return dt.isoformat()
        except Exception:
            return datetime.now().isoformat()

    def _clean_html(self, html_content: str) -> str:
        """HTML 태그 제거"""
        if not html_content:
            return ""
        soup = BeautifulSoup(html_content, 'html.parser')
        return soup.get_text(strip=True)[:5000]

    def _send_to_api(self):
        """수집된 기사를 API로 전송"""
        print(f"\n🌐 API 전송 시작 ({len(self.collected_news)}개)...\n")
        
        for news in self.collected_news:
            payload = {
                'title': news['title'],
                'content': news['content'],
                'original_link': news['link'],
                'published_at': news['published_at'],
                'source': news['source'],
                'category': news['category'],
                'thumbnail_url': news.get('thumbnail_url'),
                'ai_summary': news.get('ai_summary', ''),  # AI 요약 추가
            }
            
            result = send_article_to_server(payload)
            
            if result['status'] == 'created':
                self.stats['created'] += 1
            elif result['status'] == 'exists':
                self.stats['skipped'] += 1
            else:
                self.stats['failed'] += 1

    def _save_to_json(self):
        """JSON 파일로 저장 - all logs go to logs/ folder"""
        output_file = os.path.join(LOG_DIR, "ai_news_fulltext.json")
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(self.collected_news, f, ensure_ascii=False, indent=2)
        print(f"💾 JSON 저장 완료: {output_file}")

    def _print_summary(self, mode: str):
        """결과 요약 출력"""
        print("\n" + "=" * 60)
        print("📊 수집 결과:")
        print(f"   - 총 수집: {len(self.collected_news)}건")
        print(f"   - 스크래핑 실패: {self.stats['scrape_fail']}건")
        
        if self.collected_news:
            avg_len = sum(n['content_length'] for n in self.collected_news) // len(self.collected_news)
            print(f"   - 평균 본문 길이: {avg_len}자")
        
        if mode in ('api', 'both'):
            print(f"   - 신규 저장: {self.stats['created']}건")
            print(f"   - 중복 스킵: {self.stats['skipped']}건")
            print(f"   - 전송 실패: {self.stats['failed']}건")
        print("=" * 60)


if __name__ == "__main__":
    # 커맨드라인 인자로 모드 지정 가능
    # python rss_collector.py api|json|both
    mode = sys.argv[1] if len(sys.argv) > 1 else 'api'
    
    collector = FullTextRSSCollector()
    collector.run(mode=mode)

"""
글로벌 AI 뉴스 RSS 수집기
- 해외 Tech 블로그(TechCrunch, Wired AI) RSS 수집
- Next.js API 연동 (/api/bot/ingest)
- [AI 번역 준비중] 태그 적용
"""

import feedparser
from datetime import datetime
import json
import os
import sys
from bs4 import BeautifulSoup
from dateutil import parser  # Robust date parsing
from typing import List, Dict

# 공통 API 클라이언트 임포트
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'scrapers'))
try:
    from scrapers.utils.api_client import send_article_to_server
except ImportError:
    # 프로젝트 루트에서 실행 시
    from utils.api_client import send_article_to_server

# RSS Feed URLs (NEXT_MISSION.md 스펙)
RSS_FEEDS = {
    "TechCrunch": "https://techcrunch.com/category/artificial-intelligence/feed/",
    "Wired AI": "https://www.wired.com/feed/tag/ai/latest/rss",
    "MIT Tech Review": "https://www.technologyreview.com/topic/artificial-intelligence/feed",
    "AI News": "https://artificialintelligence-news.com/feed/",
    "Unite AI": "https://www.unite.ai/feed/"
}

# 각 피드에서 가져올 최대 기사 수
MAX_ARTICLES_PER_FEED = 5


class RSSCollector:
    def __init__(self):
        self.collected_news: List[Dict] = []
        self.stats = {'created': 0, 'skipped': 0, 'failed': 0}

    def parse_feed(self, source_name: str, url: str):
        """단일 RSS 피드 파싱"""
        print(f"[*] {source_name} 수집 중...")
        try:
            feed = feedparser.parse(url)
            
            if not feed.entries:
                print(f"    ⚠️ 피드에 기사가 없습니다.")
                return
            
            for entry in feed.entries[:MAX_ARTICLES_PER_FEED]:
                # 날짜 파싱
                published_at = self._standardize_date(entry.get("published", ""))
                if not published_at:
                    published_at = datetime.now().isoformat()

                # 본문 정리
                summary_text = self._clean_html(entry.get("summary", ""))
                if not summary_text:
                    summary_text = self._clean_html(entry.get("description", ""))
                
                # [AI 번역 준비중] 태그 추가 (NEXT_MISSION.md 요구사항)
                content_with_tag = f"[AI 번역 준비중]\n\n{summary_text}"
                
                # 썸네일 추출 시도
                thumbnail_url = self._extract_thumbnail(entry)

                news_item = {
                    "source": source_name,
                    "title": entry.title,
                    "link": entry.link,
                    "published_at": published_at,
                    "content": content_with_tag,
                    "summary": summary_text,
                    "thumbnail_url": thumbnail_url,
                    "category": "AI",  # NEXT_MISSION.md 스펙
                }
                self.collected_news.append(news_item)
                print(f"    📰 {news_item['title'][:50]}...")
                
        except Exception as e:
            print(f"    ❌ 오류: {e}")

    def _standardize_date(self, date_str: str) -> str:
        """다양한 날짜 형식을 ISO 8601로 변환"""
        if not date_str:
            return None
        try:
            dt = parser.parse(date_str)
            return dt.isoformat()
        except Exception as e:
            print(f"    ⚠️ 날짜 파싱 오류 '{date_str}': {e}")
            return None

    def _clean_html(self, html_content: str) -> str:
        """HTML 태그 제거 및 텍스트 추출"""
        if not html_content:
            return ""
        try:
            soup = BeautifulSoup(html_content, "html.parser")
            text = soup.get_text(strip=True)
            # 5000자 제한
            return text[:5000]
        except Exception:
            return html_content[:5000]

    def _extract_thumbnail(self, entry) -> str:
        """RSS 엔트리에서 썸네일 URL 추출"""
        # media:thumbnail 태그
        if hasattr(entry, 'media_thumbnail') and entry.media_thumbnail:
            return entry.media_thumbnail[0].get('url', '')
        
        # media:content 태그
        if hasattr(entry, 'media_content') and entry.media_content:
            return entry.media_content[0].get('url', '')
        
        # enclosure 태그
        if hasattr(entry, 'enclosures') and entry.enclosures:
            for enc in entry.enclosures:
                if enc.get('type', '').startswith('image'):
                    return enc.get('href', enc.get('url', ''))
        
        # summary/content에서 img 태그 추출
        content = entry.get('summary', '') or entry.get('description', '')
        if content:
            soup = BeautifulSoup(content, 'html.parser')
            img = soup.find('img')
            if img and img.get('src'):
                return img['src']
        
        return None

    def run(self, mode: str = 'api'):
        """
        RSS 수집 및 전송 실행
        
        Args:
            mode: 'api' - API로 전송 (기본값)
                  'json' - JSON 파일로 저장
                  'both' - 둘 다 실행
        """
        print("=" * 50)
        print("🌍 글로벌 AI 뉴스 RSS 수집기 시작")
        print("=" * 50)
        
        # 모든 피드 수집
        for name, url in RSS_FEEDS.items():
            self.parse_feed(name, url)
        
        if not self.collected_news:
            print("\n⚠️ 수집된 기사가 없습니다.")
            return
        
        print(f"\n✅ 총 {len(self.collected_news)}개 기사 수집 완료")
        
        # 모드별 처리
        if mode in ('json', 'both'):
            self._save_to_json()
        
        if mode in ('api', 'both'):
            self._send_to_api()
        
        print("\n" + "=" * 50)
        print("📊 수집 결과:")
        print(f"   - 총 수집: {len(self.collected_news)}건")
        if mode in ('api', 'both'):
            print(f"   - 신규 저장: {self.stats['created']}건")
            print(f"   - 중복 스킵: {self.stats['skipped']}건")
            print(f"   - 실패: {self.stats['failed']}건")
        print("=" * 50)

    def _send_to_api(self):
        """수집된 기사를 API로 전송"""
        print(f"\n🌐 API 전송 시작 ({len(self.collected_news)}개)...\n")
        
        for news in self.collected_news:
            payload = {
                'title': news['title'],
                'content': news['content'],
                'original_link': news['link'],  # 중복 방지 키
                'published_at': news['published_at'],
                'source': news['source'],  # "TechCrunch", "Wired AI" 등
                'category': news['category'],  # "AI"
                'thumbnail_url': news.get('thumbnail_url'),
            }
            
            result = send_article_to_server(payload)
            
            if result['status'] == 'created':
                self.stats['created'] += 1
            elif result['status'] == 'exists':
                self.stats['skipped'] += 1
            else:
                self.stats['failed'] += 1

    def _save_to_json(self):
        """JSON 파일로 저장"""
        output_file = "ai_news_raw.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(self.collected_news, f, ensure_ascii=False, indent=4)
        print(f"💾 JSON 저장 완료: {output_file}")


if __name__ == "__main__":
    # 커맨드라인 인자로 모드 지정 가능
    # python rss_collector.py api|json|both
    mode = sys.argv[1] if len(sys.argv) > 1 else 'api'
    
    collector = RSSCollector()
    collector.run(mode=mode)


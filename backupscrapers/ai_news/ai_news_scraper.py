# -*- coding: utf-8 -*-
"""
AI 뉴스 스크랩봇 (RSS + 번역 통합)
- 해외 AI 뉴스 RSS 피드에서 기사 수집
- Playwright로 상세 페이지 본문 스크래핑
- Google Translation API 또는 Groq API로 한국어 번역

버전: v2.0 (Google Translation 지원)
작성일: 2025-12-15
"""

import feedparser
import time
import argparse
import re
import sys
import os
from datetime import datetime
from typing import List, Dict, Optional

# 상위 디렉토리 경로 추가 (utils 접근용)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from playwright.sync_api import sync_playwright, Page

# ============================================
# RSS 피드 설정
# ============================================
RSS_FEEDS = {
    'techcrunch': {
        'name': 'TechCrunch AI',
        'url': 'https://techcrunch.com/category/artificial-intelligence/feed/',
        'category': 'AI',
        'content_selector': 'article .entry-content, article .article-content, .post-content'
    },
    'venturebeat': {
        'name': 'VentureBeat AI',
        'url': 'https://venturebeat.com/category/ai/feed/',
        'category': 'AI',
        'content_selector': '.article-content, .post-content, article .content'
    },
    'mit': {
        'name': 'MIT News AI',
        'url': 'https://news.mit.edu/rss/topic/artificial-intelligence2',
        'category': 'AI',
        'content_selector': '.news-article--content, .article-body, .page--content'
    }
}


def fetch_article_content(page: Page, url: str, content_selector: str) -> Optional[str]:
    """상세 페이지에서 본문 스크래핑"""
    try:
        print(f"      -> 본문 스크래핑: {url[:50]}...")
        page.goto(url, timeout=30000, wait_until='domcontentloaded')
        page.wait_for_timeout(2000)
        
        selectors = content_selector.split(', ')
        content = None
        
        for selector in selectors:
            try:
                elem = page.locator(selector).first
                if elem.count() > 0:
                    content = elem.text_content()
                    if content and len(content) > 100:
                        break
            except:
                continue
        
        if not content:
            for fallback in ['article', 'main', '.content', '.post']:
                try:
                    elem = page.locator(fallback).first
                    if elem.count() > 0:
                        content = elem.text_content()
                        if content and len(content) > 100:
                            break
                except:
                    continue
        
        if content:
            content = re.sub(r'\s+', ' ', content).strip()
            return content
        
        return None
        
    except Exception as e:
        print(f"      [ERROR] 본문 스크래핑 실패: {e}")
        return None


def scrape_and_translate(feed_key: str, max_articles: int = 3, api_key: str = None, dry_run: bool = False, use_google: bool = False) -> List[Dict]:
    """RSS 수집 + 본문 스크래핑 + 번역
    
    Args:
        feed_key: RSS 피드 키 (techcrunch, venturebeat, mit)
        max_articles: 수집할 최대 기사 수
        api_key: Groq API 키 (use_google=False 시 사용)
        dry_run: True시 번역 없이 수집만
        use_google: True시 Google Translation API 사용
    """
    
    feed_info = RSS_FEEDS.get(feed_key)
    if not feed_info:
        print(f"[ERROR] Unknown feed: {feed_key}")
        return []
    
    # 0. 번역 클라이언트 초기화 + 대시보드 출력
    google_client = None
    groq_client = None
    
    if not dry_run:
        if use_google:
            try:
                from utils.google_translate_client import GoogleTranslateClient
                google_client = GoogleTranslateClient()
                google_client.print_dashboard()  # CLI 대시보드 출력
            except FileNotFoundError as e:
                print(f"[SETUP] {e}")
                return []
            except Exception as e:
                print(f"[WARN] Google Translation 초기화 실패: {e}")
                print("       Groq로 fallback...")
                use_google = False
        
        if not use_google:
            try:
                from utils.groq_client import GroqClient
                groq_client = GroqClient(api_key)
            except Exception as e:
                print(f"[WARN] Groq 초기화 실패: {e}")
                print("       번역 없이 원문만 수집합니다.")
    
    print(f"\n{'='*60}")
    print(f" {feed_info['name']} AI 뉴스 스크랩")
    translator = "Google" if use_google else "Groq"
    print(f" Translator: {translator}")
    print(f"{'='*60}")
    
    # 1. RSS 피드 파싱
    print(f"\n[1/3] RSS 피드 파싱...")
    feed = feedparser.parse(feed_info['url'])
    total_entries = len(feed.entries)
    print(f"    -> {total_entries}개 기사 발견")
    
    if total_entries == 0:
        return []
    
    # 3. 각 기사 스크래핑 + 번역
    print(f"\n[2/3] 본문 스크래핑 (최대 {max_articles}개)...")
    
    articles = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        page = context.new_page()
        
        for i, entry in enumerate(feed.entries[:max_articles]):
            title = entry.get('title', 'No Title')
            link = entry.get('link', '')
            published = entry.get('published', entry.get('updated', 'N/A'))
            
            print(f"\n  [{i+1}/{max_articles}] {title[:45]}...")
            
            # 본문 스크래핑
            content = fetch_article_content(page, link, feed_info['content_selector'])
            
            if not content:
                content = entry.get('summary', entry.get('description', ''))
                content = re.sub(r'<[^>]+>', '', content)
                print(f"      [WARN] RSS summary 사용 ({len(content)}자)")
            else:
                print(f"      [OK] 본문 {len(content)}자 추출")
            
            # 번역 처리 (한국어 피드는 번역 건너뜀)
            title_ko = title
            summary_ko = content[:5000]
            key_points = []
            
            is_korean = feed_info.get('lang', 'en') == 'ko'
            
            if is_korean:
                # 한국어 피드는 번역 불필요
                print(f"      [OK] 한국어 기사 - 번역 건너뜀")
            elif not dry_run:
                if google_client:
                    # Google Translation API 사용
                    print(f"      -> Google 번역 중...")
                    try:
                        title_ko = google_client.translate(title, target='ko') or title
                        # 본문은 5000자씩 분할 번역
                        content_to_translate = content[:5000]
                        summary_ko = google_client.translate(content_to_translate, target='ko') or content_to_translate
                        print(f"      [OK] 번역 완료: {title_ko[:30]}...")
                    except Exception as e:
                        print(f"      [ERROR] 번역 오류: {e}")
                    time.sleep(0.5)  # Rate limit 방지
                    
                elif groq_client:
                    # Groq API 사용 (번역 + 요약)
                    print(f"      -> Groq 번역 중...")
                    try:
                        translated = groq_client.translate_and_summarize(title, content, max_length=5000)
                        if translated:
                            title_ko = translated.get('title_ko', title)
                            summary_ko = translated.get('content_ko', translated.get('summary_ko', content[:5000]))
                            key_points = translated.get('key_points', [])
                            print(f"      [OK] 번역 완료: {title_ko[:30]}...")
                        else:
                            print(f"      [WARN] 번역 실패, 원문 사용")
                    except Exception as e:
                        print(f"      [ERROR] 번역 오류: {e}")
                    time.sleep(2)  # Rate limit 방지
            
            # 날짜 처리 (RSS 원본 시간 사용)
            pub_date = datetime.now()
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                try:
                    # struct_time -> datetime
                    pub_date = datetime.fromtimestamp(time.mktime(entry.published_parsed))
                except:
                    pass
            elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                try:
                    pub_date = datetime.fromtimestamp(time.mktime(entry.updated_parsed))
                except:
                    pass
            
            # ISO 8601 포맷 (TimeZone 정보 포함)
            published_at_str = pub_date.astimezone().isoformat()
            
            print(f"      [DATE] RSS Original: {published_at_str}")

            article = {
                'title': title_ko,
                'original_title': title,
                'content': summary_ko,
                'original_link': link,
                'source': feed_info['name'],
                'category': 'AI',
                'region': 'global',
                'ai_source': feed_key,
                'key_points': key_points,
                'published_at': published_at_str
            }
            
            articles.append(article)
            time.sleep(1)
        
        browser.close()
    
    # 결과 출력
    print(f"\n[3/3] 수집 완료")
    print(f"{'='*60}")
    print(f" 결과: {len(articles)}개 기사 수집")
    print(f"{'='*60}")
    
    for i, article in enumerate(articles):
        print(f"\n[{i+1}] {article['title'][:50]}...")
        print(f"    본문: {len(article['content'])}자")
        if article['key_points']:
            print(f"    핵심: {article['key_points'][:2]}")
    
    return articles


def show_usage_only():
    """사용량 대시보드만 출력"""
    try:
        from utils.google_translate_client import GoogleTranslateClient
        client = GoogleTranslateClient()
        client.print_dashboard()
    except FileNotFoundError as e:
        print(f"[SETUP] {e}")
    except Exception as e:
        print(f"[ERROR] {e}")


def main():
    parser = argparse.ArgumentParser(description='AI 뉴스 스크랩봇 v2.0')
    parser.add_argument('--feed', type=str, default='techcrunch',
                        help='스크랩할 피드 (techcrunch, venturebeat, mit)')
    parser.add_argument('--max-articles', type=int, default=3,
                        help='수집할 기사 수')
    parser.add_argument('--api-key', type=str, default=None,
                        help='Groq API 키 (--use-google 미사용시)')
    parser.add_argument('--dry-run', action='store_true',
                        help='번역 없이 수집만')
    parser.add_argument('--use-google', action='store_true',
                        help='Google Translation API 사용')
    parser.add_argument('--show-usage', action='store_true',
                        help='API 사용량만 확인')
    args = parser.parse_args()
    
    # 사용량만 확인
    if args.show_usage:
        show_usage_only()
        return
    
    articles = scrape_and_translate(
        args.feed, 
        args.max_articles, 
        args.api_key,
        args.dry_run,
        args.use_google
    )
    
    print(f"\n총 {len(articles)}개 기사 처리 완료")


if __name__ == "__main__":
    main()

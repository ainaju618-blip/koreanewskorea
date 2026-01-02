# -*- coding: utf-8 -*-
"""
Phase 1: RSS 스크래핑 테스트 (Gemini 없이)
- 해외 AI 뉴스 RSS 피드 파싱 → 목록 수집
- Playwright로 각 기사 상세 페이지 본문 스크래핑
- 영문 원문 그대로 출력

버전: v1.1
작성일: 2025-12-15
"""

import feedparser
import time
import argparse
import re
from datetime import datetime
from typing import List, Dict, Optional
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
        print(f"      -> 본문 스크래핑 중: {url[:60]}...")
        page.goto(url, timeout=30000, wait_until='domcontentloaded')
        page.wait_for_timeout(2000)  # 페이지 로드 대기
        
        # 본문 셀렉터 시도
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
            # 범용 셀렉터 시도
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
            # 본문 정리
            content = re.sub(r'\s+', ' ', content).strip()
            return content
        
        return None
        
    except Exception as e:
        print(f"      [ERROR] 본문 스크래핑 실패: {e}")
        return None


def scrape_feed_with_content(feed_key: str, max_articles: int = 3) -> List[Dict]:
    """RSS 피드에서 목록 수집 + 각 기사 본문 스크래핑"""
    
    feed_info = RSS_FEEDS.get(feed_key)
    if not feed_info:
        print(f"[ERROR] Unknown feed: {feed_key}")
        return []
    
    print(f"\n{'='*60}")
    print(f" {feed_info['name']} 스크래핑")
    print(f"{'='*60}")
    
    # 1. RSS 피드 파싱 (목록 수집)
    print(f"\n[1] RSS 피드 파싱...")
    feed = feedparser.parse(feed_info['url'])
    
    if feed.bozo:
        print(f"[WARN] 피드 파싱 경고: {feed.bozo_exception}")
    
    total_entries = len(feed.entries)
    print(f"    -> {total_entries}개 기사 발견")
    
    if total_entries == 0:
        return []
    
    # 2. Playwright로 각 기사 본문 스크래핑
    print(f"\n[2] 상세 페이지 본문 스크래핑 (최대 {max_articles}개)...")
    
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
            
            print(f"\n  [{i+1}/{max_articles}] {title[:50]}...")
            
            # 본문 스크래핑
            content = fetch_article_content(page, link, feed_info['content_selector'])
            
            if content:
                content_len = len(content)
                print(f"      [OK] 본문 {content_len}자 추출")
                print(f"      미리보기: {content[:150]}...")
            else:
                content = entry.get('summary', entry.get('description', ''))
                content = re.sub(r'<[^>]+>', '', content)
                print(f"      [WARN] 상세 본문 실패, RSS summary 사용 ({len(content)}자)")
            
            articles.append({
                'title': title,
                'link': link,
                'published': published,
                'content': content,
                'content_length': len(content) if content else 0,
                'source': feed_info['name']
            })
            
            time.sleep(1)  # Rate limiting
        
        browser.close()
    
    return articles


def test_scraping(feed_key: str = 'techcrunch', max_articles: int = 2):
    """스크래핑 테스트"""
    
    print("\n" + "="*60)
    print(" Phase 1: RSS + 본문 스크래핑 테스트")
    print("="*60)
    
    articles = scrape_feed_with_content(feed_key, max_articles)
    
    # 결과 요약
    print("\n" + "="*60)
    print(" 스크래핑 결과")
    print("="*60)
    
    for i, article in enumerate(articles):
        print(f"\n[{i+1}] {article['title'][:60]}...")
        print(f"    본문 길이: {article['content_length']}자")
        print(f"    Link: {article['link'][:70]}...")
    
    success = sum(1 for a in articles if a['content_length'] > 200)
    print(f"\n총 {len(articles)}개 중 {success}개 본문 스크래핑 성공")
    
    return articles


def main():
    parser = argparse.ArgumentParser(description='Phase 1: RSS + 본문 스크래핑 테스트')
    parser.add_argument('--feed', type=str, default='techcrunch',
                        help='테스트할 피드 (techcrunch, venturebeat, mit)')
    parser.add_argument('--max-articles', type=int, default=2,
                        help='스크래핑할 기사 수')
    args = parser.parse_args()
    
    test_scraping(args.feed, args.max_articles)


if __name__ == "__main__":
    main()


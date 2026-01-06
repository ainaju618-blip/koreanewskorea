# -*- coding: utf-8 -*-
"""
전남교육청에서 나주/진도 관련 기사만 추출하는 스크래퍼
- 개발서버 Supabase에 직접 저장
"""

import sys
import os
import time
import re
from datetime import datetime, timedelta
from urllib.parse import urljoin

# UTF-8 출력
if sys.stdout:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from playwright.sync_api import sync_playwright
from dotenv import load_dotenv

# 개발서버 환경변수 로드
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env.local')
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    # backend/.env 사용
    env_path = os.path.join(os.path.dirname(__file__), '..', '..', 'backend', '.env')
    load_dotenv(env_path)

# Supabase 설정 (개발서버)
from supabase import create_client
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL', 'https://ebagdrupjfwkawbwqjjg.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_KEY:
    print("[ERROR] SUPABASE_SERVICE_ROLE_KEY not found!")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
print(f"[OK] Supabase 연결: {SUPABASE_URL[:40]}...")

# Cloudinary 설정
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from utils.cloudinary_uploader import download_and_upload_image
    CLOUDINARY_ENABLED = True
    print("[OK] Cloudinary 모듈 로드")
except ImportError:
    CLOUDINARY_ENABLED = False
    print("[WARN] Cloudinary 모듈 없음 - 원본 URL 사용")

# 상수
BASE_URL = 'https://www.jnedu.kr'
# S1N3 = 학교, S1N2 = 기관
LIST_URLS = [
    ('학교', 'https://www.jnedu.kr/news/articleList.html?sc_section_code=S1N3&view_type=sm'),
    ('기관', 'https://www.jnedu.kr/news/articleList.html?sc_section_code=S1N2&view_type=sm'),
]


def fetch_detail(page, url):
    """상세페이지에서 본문과 이미지 추출"""
    try:
        page.goto(url, timeout=20000, wait_until='domcontentloaded')
        page.wait_for_timeout(1000)
    except:
        return None, None, None

    # 본문 추출
    content = ""
    try:
        content_elem = page.locator('article#article-view-content-div')
        if content_elem.count() > 0:
            content = content_elem.inner_text().strip()
    except:
        pass

    # 이미지 추출
    thumbnail_url = None
    try:
        imgs = page.locator('figure.photo-layout img')
        if imgs.count() > 0:
            src = imgs.first.get_attribute('src')
            if src and 'icon' not in src.lower():
                thumbnail_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
    except:
        pass

    # 날짜 추출
    pub_date = None
    try:
        info_items = page.locator('header.article-view-header ul.infomation li')
        for i in range(info_items.count()):
            text = info_items.nth(i).inner_text().strip()
            if '입력' in text:
                match = re.search(r'(\d{4})[\.-](\d{1,2})[\.-](\d{1,2})', text)
                if match:
                    y, m, d = match.groups()
                    pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
                break
    except:
        pass

    if not pub_date:
        pub_date = datetime.now().strftime('%Y-%m-%d')

    return content, thumbnail_url, pub_date


def scrape_keyword(keyword, max_articles=10):
    """특정 키워드가 포함된 기사 스크래핑"""
    print(f"\n{'='*50}")
    print(f"[{keyword}] 관련 기사 스크래핑 시작 (최대 {max_articles}개)")
    print('='*50)

    collected = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        page = context.new_page()

        for source_name, list_url in LIST_URLS:
            if len(collected) >= max_articles:
                break

            print(f"\n[{source_name}] 목록 스캔 중...")

            for page_num in range(1, 10):  # 최대 10페이지
                if len(collected) >= max_articles:
                    break

                url = f'{list_url}&page={page_num}'

                try:
                    page.goto(url, timeout=20000, wait_until='domcontentloaded')
                    page.wait_for_timeout(1000)
                except:
                    continue

                # 기사 링크 수집
                links = page.locator('section ul li h4 a[href*="articleView"]')
                count = links.count()

                if count == 0:
                    break

                for i in range(count):
                    if len(collected) >= max_articles:
                        break

                    try:
                        link = links.nth(i)
                        title = link.inner_text().strip()
                        href = link.get_attribute('href')

                        # 키워드 필터링
                        if keyword not in title:
                            continue

                        article_url = urljoin(BASE_URL, href)

                        # 중복 체크
                        exists = supabase.table('posts').select('id').eq('original_link', article_url).execute()
                        if exists.data:
                            print(f"  [SKIP] 이미 존재: {title[:30]}...")
                            continue

                        print(f"  [FOUND] {title[:40]}...")

                        # 상세페이지 방문
                        content, thumbnail_url, pub_date = fetch_detail(page, article_url)

                        if not content or len(content) < 50:
                            print(f"    [SKIP] 본문 부족")
                            continue

                        # 이미지 처리
                        final_thumbnail = None
                        if thumbnail_url and CLOUDINARY_ENABLED:
                            try:
                                cloud_url = download_and_upload_image(thumbnail_url, BASE_URL, folder="jeonnam_edu")
                                if cloud_url and 'cloudinary.com' in cloud_url:
                                    final_thumbnail = cloud_url
                                    print(f"    [IMG] Cloudinary 업로드 완료")
                                else:
                                    final_thumbnail = thumbnail_url
                            except:
                                final_thumbnail = thumbnail_url
                        elif thumbnail_url:
                            final_thumbnail = thumbnail_url

                        if not final_thumbnail:
                            print(f"    [SKIP] 이미지 없음")
                            continue

                        # region 결정
                        if '나주' in title or '나주' in content[:200]:
                            region = 'naju_edu'
                        elif '진도' in title or '진도' in content[:200]:
                            region = 'jindo_edu'
                        else:
                            region = 'jeonnam_edu'

                        # DB 저장
                        insert_data = {
                            'title': title,
                            'content': content[:5000],
                            'published_at': f"{pub_date}T09:00:00+09:00",
                            'original_link': article_url,
                            'source': f'전남교육청 {source_name}',
                            'category': '교육',
                            'region': region,
                            'thumbnail_url': final_thumbnail,
                            'status': 'published',
                        }

                        result = supabase.table('posts').insert(insert_data).execute()

                        if result.data:
                            print(f"    [OK] DB 저장 완료 (region: {region})")
                            collected.append(title)

                        time.sleep(1)

                    except Exception as e:
                        print(f"    [ERROR] {str(e)[:50]}")
                        continue

                time.sleep(0.5)

        browser.close()

    print(f"\n[{keyword}] 완료: {len(collected)}개 저장")
    return collected


def main():
    print("="*60)
    print("전남교육청 나주/진도 기사 스크래퍼")
    print(f"개발 DB: {SUPABASE_URL}")
    print("="*60)

    # 나주 기사 10개
    naju_articles = scrape_keyword('나주', max_articles=10)

    # 진도 기사 10개
    jindo_articles = scrape_keyword('진도', max_articles=10)

    print("\n" + "="*60)
    print("최종 결과")
    print("="*60)
    print(f"나주: {len(naju_articles)}개")
    print(f"진도: {len(jindo_articles)}개")
    print(f"총합: {len(naju_articles) + len(jindo_articles)}개")


if __name__ == "__main__":
    main()

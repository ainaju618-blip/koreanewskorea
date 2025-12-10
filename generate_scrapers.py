
import os
from scrapers.configs.regional_configs import REGIONAL_CONFIGS

TEMPLATE = """\"\"\"
{name} 보도자료 스크래퍼
- 대상: {base_url}
\"\"\"
import sys
import os
import time
import requests
import random
from datetime import datetime, timedelta
from typing import List, Dict
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# 공통 API 클라이언트
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils.api_client import send_article_to_server

# ============================================================
# 설정
# ============================================================
REGION_CODE = '{code}'
REGION_NAME = '{name}'
Category_Name = '전남'
BASE_URL = '{base_url}'
LIST_URL = '{list_url}'

SELECTORS = {selectors}
# ============================================================

HEADERS = {{
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}}

def normalize_date(date_str: str) -> str:
    \"\"\"날짜 표준화 (YYYY-MM-DD)\"\"\"
    if not date_str: return datetime.now().strftime('%Y-%m-%d')
    date_str = date_str.strip().replace('.', '-').replace('/', '-')
    try:
        if len(date_str.split('-')[0]) == 2:
            date_str = '20' + date_str
        import re
        match = re.search(r'(\d{{4}}-\d{{1,2}}-\d{{1,2}})', date_str)
        if match:
            return match.group(1)
    except:
        pass
    return datetime.now().strftime('%Y-%m-%d')

def fetch_list(page: int = 1) -> List[Dict]:
    \"\"\"목록 수집\"\"\"
    url = f"{{LIST_URL}}"
    if '?' in LIST_URL:
        url += f"&page={{page}}"
    else:
        url += f"?page={{page}}"
    
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        resp.encoding = 'utf-8'
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        items = []
        rows = soup.select(SELECTORS['list_item'])
        
        if not rows:
            rows = soup.select('tbody tr')
            
        for row in rows:
            try:
                title_elem = row.select_one(SELECTORS['list_title'])
                if not title_elem: continue
                
                title = title_elem.get_text(strip=True)
                link = title_elem.get('href')
                full_url = urljoin(BASE_URL, link)
                
                date_elem = row.select_one(SELECTORS['list_date'])
                date_str = date_elem.get_text(strip=True) if date_elem else ''
                
                items.append({{
                    'title': title,
                    'url': full_url,
                    'date': date_str
                }})
            except:
                continue
        return items
    except Exception as e:
        print(f"   ❌ 목록 로드 실패: {{e}}")
        return []

def fetch_detail(url: str) -> str:
    \"\"\"상세 수집\"\"\"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        resp.encoding = 'utf-8'
        soup = BeautifulSoup(resp.text, 'html.parser')
        content = soup.select_one(SELECTORS['detail_content'])
        if content:
            return content.get_text('\\n', strip=True)[:5000]
    except:
        pass
    return ""

def collect_articles(days: int = 3) -> List[Dict]:
    print(f"🏛️ {{REGION_NAME}} 보도자료 수집 시작 (최근 {{days}}일)")
    end_date = datetime.now().strftime('%Y-%m-%d')
    start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
    
    articles = []
    page = 1
    stop = False
    
    while page <= 3 and not stop:
        print(f"   📄 페이지 {{page}} 수집 중...")
        items = fetch_list(page)
        
        if not items:
            print("      ⚠️ 기사 목록을 찾을 수 없습니다.")
            break
            
        for item in items:
            n_date = normalize_date(item['date'])
            if n_date < start_date:
                stop = True
                break
            if n_date > end_date:
                continue
            
            print(f"   📰 {{item['title'][:30]}}... ({{n_date}})")
            content = fetch_detail(item['url'])
            if not content:
                content = f"본문 내용을 가져올 수 없습니다.\\n원본 링크: {{item['url']}}"
            
            articles.append({{
                'title': item['title'],
                'content': content,
                'published_at': f"{{n_date}}T09:00:00+09:00",
                'original_link': item['url'],
                'source': REGION_NAME,
                'category': Category_Name,
                'thumbnail_url': None,
            }})
            time.sleep(0.1)
        page += 1
        time.sleep(0.5)
        
    print(f"✅ 총 {{len(articles)}}개 기사 수집 완료")
    return articles

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--days', type=int, default=3)
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    
    articles = collect_articles(args.days)
    
    if args.dry_run:
        print("\\n[Dry Run 결과]")
        for a in articles[:3]:
            print(f"- {{a['title']}} ({{a['published_at']}})")
    else:
        print(f"\\n🌐 API 전송 시작 ({{len(articles)}}개)...")
        for article in articles:
            send_article_to_server(article)

if __name__ == "__main__":
    main()
"""

# 이미 생성된 파일 제외
skip_list = ['naju', 'gwangyang', 'hwasun', 'jeonnam', 'gwangju'] 
# jeonnam, gwangju는 기존 로직(universal)이 잘 되므로 일단 제외하되, 사용자가 '전체'라고 했으므로 생성하는 것이 맞음.
# 하지만 우선 순위상 신규 14개부터 생성.

targets = [k for k in REGIONAL_CONFIGS.keys() if k not in skip_list]

print(f"총 {len(targets)}개 지역 스크래퍼 생성 시작...")

for code in targets:
    config = REGIONAL_CONFIGS[code]
    filename = f"scrapers/{code}_scraper.py"
    
    content = TEMPLATE.format(
        code=code,
        name=config['name'],
        base_url=config['base_url'],
        list_url=config['list_url'],
        selectors=config['selectors']
    )
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Created: {filename}")

print("완료!")

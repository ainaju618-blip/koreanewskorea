"""
나주시 보도자료 수집 봇
- 지정 기간 내 보도자료 자동 수집
- 최신순 정렬
- 조회수 랜덤 생성 (30-70)
- Supabase 저장 지원
"""

import re
import base64
import json
import random
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from typing import Optional, List, Dict
import time

BASE_URL = 'https://www.naju.go.kr'
LIST_URL = f'{BASE_URL}/www/administration/reporting/coverage'

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'ko-KR,ko;q=0.9',
}

# 신문사 등록일
REGISTRATION_DATE = '2024-09-19'


def decode_php_serialize(data: str) -> str:
    """PHP serialize 형식에서 문자열 추출"""
    pattern = r's:\d+:"(.*?)";?\}'
    match = re.search(pattern, data, re.DOTALL)
    if match:
        return match.group(1)
    return data


def extract_content_from_og_description(html: str) -> str:
    """og:description 메타 태그에서 Base64 인코딩된 본문 추출"""
    soup = BeautifulSoup(html, 'html.parser')
    og_desc = soup.find('meta', property='og:description')
    
    if not og_desc or not og_desc.get('content'):
        return ''
    
    encoded = og_desc['content']
    
    try:
        decoded_bytes = base64.b64decode(encoded)
        decoded_str = decoded_bytes.decode('utf-8')
        
        if decoded_str.startswith('a:'):
            content = decode_php_serialize(decoded_str)
        else:
            content = decoded_str
        
        content = re.sub(r'<[^>]+>', ' ', content)
        content = re.sub(r'\s+', ' ', content).strip()
        
        return content[:5000]
        
    except Exception as e:
        print(f'  ⚠️ Base64 디코딩 실패: {e}')
        return ''


def fetch_press_list(page: int = 1) -> List[Dict]:
    """보도자료 목록 페이지에서 항목 수집"""
    url = LIST_URL if page == 1 else f'{LIST_URL}?page={page}'
    
    response = requests.get(url, headers=HEADERS)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.text, 'html.parser')
    items = []
    
    for row in soup.select('tbody tr'):
        link = row.select_one('a[href*="coverage?idx="]')
        if not link:
            continue
        
        href = link.get('href', '')
        idx_match = re.search(r'idx=(\d+)', href)
        if not idx_match:
            continue
        
        idx = idx_match.group(1)
        title = link.get_text(strip=True)
        
        # 담당부서 및 날짜 추출
        info_tds = row.select('td.mob_dp_inflex')
        dept = info_tds[0].get_text(strip=True) if len(info_tds) > 0 else ''
        date = info_tds[1].get_text(strip=True) if len(info_tds) > 1 else ''
        
        items.append({
            'idx': idx,
            'title': title,
            'date': date,
            'department': dept,
            'url': f'{BASE_URL}{href.replace("&amp;", "&")}',
        })
    
    return items


def fetch_press_detail(url: str) -> Dict:
    """보도자료 상세 페이지에서 본문 및 이미지 추출"""
    response = requests.get(url, headers=HEADERS)
    response.raise_for_status()
    
    html = response.text
    soup = BeautifulSoup(html, 'html.parser')
    
    content = extract_content_from_og_description(html)
    
    og_image = soup.find('meta', property='og:image')
    image_url = og_image['content'] if og_image and og_image.get('content') else None
    
    og_title = soup.find('meta', property='og:title')
    title = og_title['content'] if og_title and og_title.get('content') else ''
    
    return {
        'title': title.split(',')[0] if title else '',
        'content': content,
        'content_length': len(content),
        'image_url': image_url,
    }


def is_within_date_range(date_str: str, start_date: str, end_date: str) -> bool:
    """날짜가 지정 범위 내에 있는지 확인"""
    try:
        article_date = datetime.strptime(date_str, '%Y-%m-%d')
        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')
        return start <= article_date <= end
    except ValueError:
        return False


def generate_random_view_count(min_val: int = 30, max_val: int = 70) -> int:
    """랜덤 조회수 생성"""
    return random.randint(min_val, max_val)


def format_published_at(date_str: str) -> str:
    """날짜를 ISO 형식으로 변환 (오전 9시 기준)"""
    try:
        dt = datetime.strptime(date_str, '%Y-%m-%d')
        return dt.strftime('%Y-%m-%dT09:00:00+09:00')
    except ValueError:
        return datetime.now().strftime('%Y-%m-%dT09:00:00+09:00')


def collect_articles(start_date: str = REGISTRATION_DATE, end_date: str = None) -> List[Dict]:
    """
    지정 기간 내 모든 보도자료 수집
    
    Args:
        start_date: 시작일 (기본값: 신문사 등록일 2024-09-19)
        end_date: 종료일 (기본값: 오늘)
    """
    if end_date is None:
        end_date = datetime.now().strftime('%Y-%m-%d')
    
    print(f'🏛️ 나주시 보도자료 수집 봇 시작')
    print(f'📅 수집 기간: {start_date} ~ {end_date}\n')
    
    all_articles = []
    page = 1
    stop_collecting = False
    
    while not stop_collecting:
        print(f'📋 페이지 {page} 수집 중...')
        
        try:
            items = fetch_press_list(page)
            
            if not items:
                print('   더 이상 기사가 없습니다.')
                break
            
            for item in items:
                # 날짜 범위 확인
                if not item['date']:
                    continue
                
                # 시작일보다 이전이면 수집 중단
                if item['date'] < start_date:
                    print(f'   📌 {item["date"]} - 시작일 이전, 수집 종료')
                    stop_collecting = True
                    break
                
                # 종료일보다 이후면 스킵
                if item['date'] > end_date:
                    continue
                
                # 상세 내용 수집
                print(f'   📰 {item["title"][:30]}... ({item["date"]})')
                
                try:
                    detail = fetch_press_detail(item['url'])
                    
                    article = {
                        'idx': item['idx'],
                        'title': item['title'],
                        'content': detail['content'],
                        'content_length': detail['content_length'],
                        'published_at': format_published_at(item['date']),
                        'date': item['date'],
                        'department': item['department'],
                        'image_url': detail['image_url'],
                        'view_count': generate_random_view_count(30, 70),
                        'source': '나주시',
                        'source_url': item['url'],
                        'category': '지역',
                    }
                    
                    all_articles.append(article)
                    
                    # 서버 부하 방지
                    time.sleep(0.3)
                    
                except Exception as e:
                    print(f'      ❌ 상세 수집 실패: {e}')
            
            page += 1
            time.sleep(0.5)
            
        except Exception as e:
            print(f'   ❌ 페이지 수집 오류: {e}')
            break
    
    # 최신순 정렬
    all_articles.sort(key=lambda x: x['date'], reverse=True)
    
    print(f'\n✅ 수집 완료: 총 {len(all_articles)}개 기사')
    
    return all_articles


def save_to_json(articles: List[Dict], filename: str = 'naju_articles.json'):
    """JSON 파일로 저장"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)
    print(f'💾 저장 완료: {filename}')


def main():
    """메인 실행"""
    # 2024-09-19 (신문사 등록일) ~ 오늘까지 수집
    articles = collect_articles(
        start_date='2024-09-19',
        end_date=datetime.now().strftime('%Y-%m-%d')
    )
    
    if articles:
        save_to_json(articles, 'naju_articles.json')
        
        # 요약 출력
        print(f'\n📊 수집 요약:')
        print(f'   - 총 기사 수: {len(articles)}개')
        print(f'   - 기간: {articles[-1]["date"]} ~ {articles[0]["date"]}')
        print(f'   - 평균 본문 길이: {sum(a["content_length"] for a in articles) // len(articles)}자')
    
    return articles


if __name__ == '__main__':
    main()

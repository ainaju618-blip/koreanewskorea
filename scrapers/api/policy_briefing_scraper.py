# -*- coding: utf-8 -*-
"""정책브리핑 보도자료 API 스크래퍼 v1.0
- 문화체육관광부 정책브리핑 OpenAPI 활용
- 중앙부처 (18부 5처 17청) 보도자료 실시간 수집
- XML 응답 파싱
"""
import sys
import os
import time
import re
import requests
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from urllib.parse import urljoin

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SCRAPERS_DIR = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, SCRAPERS_DIR)

from utils.api_client import send_article_to_server, log_to_server, ensure_server_running, check_duplicates
from utils.scraper_utils import clean_article_content, detect_category, extract_subtitle
from utils.cloudinary_uploader import download_and_upload_image
from utils.error_collector import ErrorCollector
from utils.default_images import get_default_image

# API 설정
API_KEY = 'ff61caa6057e80a5238d007ec29c7860d47f7d257f006792451fee1010e3b267'
API_URL = 'https://apis.data.go.kr/1371000/pressReleaseService/pressReleaseList'
REGION_CODE = 'korea'  # 중앙정부
REGION_NAME = '정책브리핑'

# 부처 코드 매핑 (MinisterCode -> 부처명)
MINISTER_CODES = {
    '1371000': '문화체육관광부',
    '1741000': '기획재정부',
    '1661000': '외교부',
    '1611000': '통일부',
    '1751000': '법무부',
    '1450000': '국방부',
    '1741100': '행정안전부',
    '1352000': '교육부',
    '1480000': '과학기술정보통신부',
    '1450135': '경찰청',
    '1450185': '소방청',
    '1192000': '국세청',
    '1832000': '관세청',
    '1194000': '조달청',
    '1195000': '통계청',
    '1620000': '보건복지부',
    '1640000': '환경부',
    '1613000': '고용노동부',
    '1614000': '여성가족부',
    '1543000': '국토교통부',
    '1192500': '해양수산부',
    '1400000': '농림축산식품부',
    '1360000': '산업통상자원부',
    '1383000': '중소벤처기업부',
    '1460000': '국가보훈부',
    # 청/위원회 등 추가 가능
}


def safe_str(s):
    """Windows 콘솔 안전 출력"""
    if s is None:
        return ''
    return s.encode('cp949', errors='replace').decode('cp949')


def parse_date(date_str: str) -> str:
    """날짜 문자열 정규화 (다양한 형식 지원)"""
    if not date_str:
        return datetime.now().strftime('%Y-%m-%d')

    date_str = date_str.strip()

    # MM/DD/YYYY HH:MM:SS 형식 (정책브리핑 API 응답)
    if '/' in date_str:
        try:
            date_part = date_str.split()[0]  # '01/01/2025'
            parts = date_part.split('/')
            if len(parts) == 3:
                month, day, year = parts
                return f"{year}-{int(month):02d}-{int(day):02d}"
        except:
            pass

    # YYYYMMDDHHMMSS 형식
    if len(date_str) >= 8 and date_str[:8].isdigit():
        try:
            year = date_str[:4]
            month = date_str[4:6]
            day = date_str[6:8]
            return f"{year}-{month}-{day}"
        except:
            pass

    return datetime.now().strftime('%Y-%m-%d')


def clean_html_content(html: str) -> str:
    """HTML 태그 제거 및 본문 정리"""
    if not html:
        return ''

    # HTML 태그 제거
    text = re.sub(r'<[^>]+>', ' ', html)
    # HTML 엔티티 변환
    text = text.replace('&nbsp;', ' ')
    text = text.replace('&lt;', '<')
    text = text.replace('&gt;', '>')
    text = text.replace('&amp;', '&')
    text = text.replace('&quot;', '"')
    # 연속 공백 정리
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def fetch_api(start_date: str, end_date: str, page_no: int = 1, num_of_rows: int = 100) -> List[Dict]:
    """정책브리핑 API 호출 및 파싱"""
    params = {
        'serviceKey': API_KEY,
        'startDate': start_date.replace('-', ''),
        'endDate': end_date.replace('-', ''),
        'numOfRows': num_of_rows,
        'pageNo': page_no,
    }

    try:
        resp = requests.get(API_URL, params=params, timeout=30)
        resp.raise_for_status()

        # XML 파싱
        root = ET.fromstring(resp.content)

        # 에러 체크 (성공 코드: '0' 또는 '00')
        result_code = root.findtext('.//resultCode')
        if result_code and result_code not in ('0', '00'):
            result_msg = root.findtext('.//resultMsg')
            print(f"   [API ERROR] {result_code}: {result_msg}")
            return []

        # XML 구조: response > body > NewsItem (item이 아님!)
        items = root.findall('.//NewsItem')
        articles = []

        for item in items:
            # CDATA 섹션에서 텍스트 추출
            title_raw = item.findtext('Title', '')
            content_raw = item.findtext('DataContents', '')
            original_url_raw = item.findtext('OriginalUrl', '')
            file_name_raw = item.findtext('FileName', '')
            file_url_raw = item.findtext('FileUrl', '')

            article = {
                'news_id': item.findtext('NewsItemId', ''),
                'title': title_raw.strip() if title_raw else '',
                'content': content_raw.strip() if content_raw else '',
                'minister_code': item.findtext('MinisterCode', ''),  # 실제로 부처명이 들어있음
                'minister_name': item.findtext('MinisterCode', ''),  # MinisterCode에 부처명 저장됨
                'approve_date': item.findtext('ApproveDate', ''),
                'original_url': original_url_raw.strip() if original_url_raw else '',
                'file_name': file_name_raw.strip() if file_name_raw else '',
                'file_url': file_url_raw.strip() if file_url_raw else '',
                'contents_status': item.findtext('ContentsStatus', ''),  # I=신규, U=수정
            }
            articles.append(article)

        return articles

    except requests.exceptions.RequestException as e:
        print(f"   [ERROR] API 호출 실패: {e}")
        return []
    except ET.ParseError as e:
        print(f"   [ERROR] XML 파싱 실패: {e}")
        return []


def collect_articles(days: int = 3, max_articles: int = 100, start_date: str = None, end_date: str = None) -> List[Dict]:
    """정책브리핑 API로 기사 수집"""

    # 날짜 설정 (API 제한: 최대 3일)
    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')
    if not start_date:
        # 최대 3일로 제한
        actual_days = min(days, 3)
        start_date = (datetime.now() - timedelta(days=actual_days)).strftime('%Y-%m-%d')

    # 3일 초과 체크
    start_dt = datetime.strptime(start_date, '%Y-%m-%d')
    end_dt = datetime.strptime(end_date, '%Y-%m-%d')
    if (end_dt - start_dt).days > 3:
        print(f"   [WARN] API 제한으로 인해 최근 3일로 조정")
        start_date = (end_dt - timedelta(days=3)).strftime('%Y-%m-%d')

    print(f"\n{'='*60}")
    print(f"[{REGION_NAME}] 보도자료 API 스크래퍼 v1.0")
    print(f"{'='*60}")
    print(f"   [DATE] {start_date} ~ {end_date}")
    print(f"   [SOURCE] 정책브리핑 OpenAPI (중앙부처)")

    if not ensure_server_running():
        print("[ERROR] Dev server could not be started.")
        return []

    log_to_server(REGION_CODE, 'running', f'{REGION_NAME} API 스크래퍼 시작', 'info')
    error_collector = ErrorCollector(REGION_CODE, REGION_NAME)

    collected_count = 0
    page_no = 1
    all_articles = []

    # 페이지네이션으로 전체 데이터 수집
    while collected_count < max_articles:
        print(f"\n   [PAGE] 페이지 {page_no}...")

        articles = fetch_api(start_date, end_date, page_no=page_no, num_of_rows=100)

        if not articles:
            print("      [INFO] 더 이상 데이터 없음")
            break

        print(f"      [FOUND] {len(articles)}건")

        # 중복 체크를 위한 URL 목록
        urls_to_check = [a['original_url'] for a in articles if a['original_url']]
        existing_urls = check_duplicates(urls_to_check)

        for article in articles:
            if collected_count >= max_articles:
                break

            news_id = article['news_id']
            title = article['title']
            original_url = article['original_url']

            if not title or not original_url:
                continue

            # 중복 스킵
            if original_url in existing_urls:
                continue

            print(f"      [ARTICLE] {safe_str(title[:45])}...")
            error_collector.increment_processed()

            # 본문 정리
            content = clean_html_content(article['content'])
            if len(content) < 100:
                error_collector.add_error('CONTENT_TOO_SHORT', title, original_url)
                print(f"         [SKIP] 본문 너무 짧음")
                continue

            content = content[:5000]  # 최대 5000자

            # 부처명 처리
            minister_name = article['minister_name'] or MINISTER_CODES.get(article['minister_code'], '정부')

            # 날짜 처리
            pub_date = parse_date(article['approve_date'])

            # 이미지 처리 (첨부파일에서 이미지 찾기)
            thumbnail_url = None
            file_url = article['file_url']
            file_name = article['file_name'] or ''

            if file_url and any(ext in file_name.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif']):
                cloudinary_url = download_and_upload_image(file_url, 'https://www.korea.kr', folder=REGION_CODE)
                if cloudinary_url:
                    thumbnail_url = cloudinary_url

            # 기본 이미지 fallback
            if not thumbnail_url:
                thumbnail_url = get_default_image(REGION_CODE)

            # 부제목 및 카테고리 추출
            subtitle, content = extract_subtitle(content, title)
            cat_code, cat_name = detect_category(title, content)

            # 기사 데이터 구성
            article_data = {
                'title': title,
                'subtitle': subtitle,
                'content': content,
                'published_at': f"{pub_date}T09:00:00+09:00",
                'original_link': original_url,
                'source': minister_name,  # 부처명을 source로
                'category': cat_name,
                'region': REGION_CODE,
                'thumbnail_url': thumbnail_url,
            }

            result = send_article_to_server(article_data)
            collected_count += 1

            if result.get('status') == 'created':
                error_collector.add_success()
                print(f"         [OK] 저장 ({minister_name})")

            all_articles.append(article_data)

        # 다음 페이지
        if len(articles) < 100:
            break  # 마지막 페이지

        page_no += 1
        time.sleep(0.5)  # API 부하 방지

    error_collector.print_report()
    final_msg = error_collector.get_error_message()
    print(f"\n[OK] {final_msg}")
    log_to_server(REGION_CODE, 'success', final_msg, 'success',
                  created_count=error_collector.success_count, skipped_count=error_collector.skip_count)

    return all_articles


def main():
    import argparse
    parser = argparse.ArgumentParser(description='정책브리핑 보도자료 API 스크래퍼')
    parser.add_argument('--days', type=int, default=3, help='수집 기간 (최대 3일)')
    parser.add_argument('--max-articles', type=int, default=50, help='최대 수집 건수')
    parser.add_argument('--start-date', type=str, default=None, help='시작일 (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str, default=None, help='종료일 (YYYY-MM-DD)')
    args = parser.parse_args()

    collect_articles(
        days=args.days,
        max_articles=args.max_articles,
        start_date=args.start_date,
        end_date=args.end_date
    )


if __name__ == "__main__":
    main()

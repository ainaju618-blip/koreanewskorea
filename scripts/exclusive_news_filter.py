"""
네이버 뉴스 '단독' 기사 필터링 스크립트 (Selenium 버전)
K-News Intelligence - AI 기반 Double Filtering 모듈

키워드: 광주, 전남, 나주, 한전 관련 단독 기사 수집
"""

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import re
import csv
from datetime import datetime
from urllib.parse import quote
import time

# K-News Intelligence 검색 키워드 (광주/전남/나주/한전)
SEARCH_KEYWORDS = [
    '광주 단독',
    '전남 단독', 
    '나주 단독',
    '한전 단독',
    '광주교육청 단독'
]

# 결과 저장 파일
OUTPUT_FILE = 'naju_exclusive.csv'

# 정규표현식: 제목 맨 앞에 [단독], <단독>, 【단독】, "단독" 태그
EXCLUSIVE_PATTERN = re.compile(r'^[\[\<\【\"\']?단독[\]\>\】\"\']?\s*')


def create_driver():
    """Chrome WebDriver 생성"""
    options = Options()
    options.add_argument('--headless=new')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    options.add_argument('--window-size=1920,1080')
    options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    options.add_experimental_option('excludeSwitches', ['enable-logging'])
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    return driver


def fetch_naver_news(driver, keyword: str) -> list:
    """네이버 뉴스 검색 결과 수집"""
    articles = []
    
    # 최신순 정렬
    url = f"https://search.naver.com/search.naver?where=news&query={quote(keyword)}&sort=1&sm=tab_smr&nso=so:dd,p:all"
    
    try:
        print(f"  URL: {url[:80]}...")
        driver.get(url)
        time.sleep(3)
        
        # 뉴스 기사 요소 찾기
        news_items = driver.find_elements(By.CSS_SELECTOR, 'a.news_tit')
        
        print(f"  발견된 기사: {len(news_items)}개")
        
        for item in news_items:
            try:
                title = item.get_attribute('title') or item.text
                link = item.get_attribute('href')
                
                if title and link:
                    articles.append({
                        'title': title.strip(),
                        'link': link,
                        'pub_date': datetime.now().strftime('%Y-%m-%d'),
                        'press': '',
                        'keyword': keyword
                    })
            except:
                continue
        
    except Exception as e:
        print(f"  [오류] {e}")
    
    return articles


def filter_exclusive_articles(articles: list) -> list:
    """[단독] 태그가 있는 기사만 필터링"""
    exclusive = []
    
    for article in articles:
        title = article['title'].strip()
        
        # 제목 앞에 단독 태그 확인
        if EXCLUSIVE_PATTERN.match(title):
            exclusive.append(article)
            print(f"  [✓ 단독] {title[:60]}")
    
    return exclusive


def save_to_csv(articles: list, filename: str):
    """CSV 저장"""
    with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=['title', 'link', 'pub_date', 'press', 'keyword'])
        writer.writeheader()
        writer.writerows(articles)
    
    print(f"\n[저장] {filename} ({len(articles)}건)")


def main():
    print("=" * 60)
    print("K-News Intelligence - 단독 기사 필터링")
    print(f"실행: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    driver = None
    
    try:
        print("\n[1] Chrome 드라이버 시작...")
        driver = create_driver()
        print("  드라이버 준비 완료")
        
        all_articles = []
        
        # 키워드별 검색
        print("\n[2] 뉴스 검색 시작")
        for keyword in SEARCH_KEYWORDS:
            print(f"\n  검색어: '{keyword}'")
            articles = fetch_naver_news(driver, keyword)
            all_articles.extend(articles)
            time.sleep(1)
        
        # 중복 제거
        seen = set()
        unique = []
        for a in all_articles:
            if a['link'] not in seen:
                seen.add(a['link'])
                unique.append(a)
        
        print(f"\n[3] 수집 완료: {len(unique)}개 (중복 제거)")
        
        # 수집된 기사 샘플 출력
        if unique:
            print("\n  샘플 기사:")
            for i, a in enumerate(unique[:5]):
                print(f"    {i+1}. {a['title'][:55]}...")
        
        # 필터링
        print("\n[4] [단독] 태그 필터링...")
        exclusive = filter_exclusive_articles(unique)
        
        print(f"\n[결과] '단독' 기사: {len(exclusive)}건")
        
        if exclusive:
            save_to_csv(exclusive, OUTPUT_FILE)
        else:
            print("\n  ※ 현재 검색 결과에 [단독] 기사 없음")
            print("  (이는 정상입니다. 단독 기사는 매일 나오지 않습니다)")
            
            # 전체 기사를 별도 파일로 저장
            if unique:
                save_to_csv(unique, 'all_news_collected.csv')
                print(f"  → 전체 수집 기사는 all_news_collected.csv에 저장됨")
    
    except Exception as e:
        print(f"\n[에러] {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        if driver:
            driver.quit()
            print("\n[완료] 드라이버 종료")
    
    print("=" * 60)


if __name__ == '__main__':
    main()

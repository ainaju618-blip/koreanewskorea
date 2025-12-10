"""전라남도청 페이지 구조 분석 스크립트"""
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

BASE_URL = 'https://www.jeonnam.go.kr'
url = 'https://www.jeonnam.go.kr/M7116/boardList.do?menuId=jeonnam0202000000'
r = requests.get(url)
r.encoding = 'utf-8'
s = BeautifulSoup(r.text, 'html.parser')

rows = s.select('tbody tr')
print(f'총 {len(rows)}개 행 발견')

# 첫 번째 기사 상세 페이지 분석
first_row = rows[0]
a = first_row.select_one('td.title a')
detail_url = urljoin(BASE_URL, a.get('href')) if a else None

print(f'\n상세 페이지 URL: {detail_url}')

if detail_url:
    dr = requests.get(detail_url)
    dr.encoding = 'utf-8'
    ds = BeautifulSoup(dr.text, 'html.parser')
    
    # 다양한 selector 테스트
    selectors_to_test = [
        'div.view_content',
        'div.view_cont',
        'div.board_view_body',
        'div.con_txt',
        'div#contents',
        'article',
        'div.content',
    ]
    
    print('\n=== 본문 Selector 테스트 ===')
    for sel in selectors_to_test:
        elem = ds.select_one(sel)
        if elem:
            text = elem.get_text(strip=True)[:100]
            print(f'✅ {sel}: {text}...')
        else:
            print(f'❌ {sel}: 없음')


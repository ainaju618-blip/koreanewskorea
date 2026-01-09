# -*- coding: utf-8 -*-
"""정책브리핑 API 테스트 스크립트"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api.policy_briefing_scraper import fetch_api, parse_date

# 날짜 파싱 테스트
test_dates = ['01/01/2025 00:00:00', '01/02/2025 14:27:12', '20250103']
print('[날짜 파싱 테스트]')
for d in test_dates:
    print(f'  {d} -> {parse_date(d)}')

print()

# API 테스트
print('[API 호출 테스트]')
articles = fetch_api('2025-01-01', '2025-01-03', page_no=1, num_of_rows=5)
print(f'  조회된 기사: {len(articles)}건')

if articles:
    for i, art in enumerate(articles[:3]):
        title = art['title'][:40] if art['title'] else 'N/A'
        minister = art['minister_name'] or 'N/A'
        date = parse_date(art['approve_date'])
        print(f'  {i+1}. [{minister}] {title}... ({date})')
else:
    print('  [WARN] 기사 없음')

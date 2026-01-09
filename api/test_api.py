# -*- coding: utf-8 -*-
"""
정책브리핑 보도자료 API 테스트 스크립트
- 18개 부처 보도자료 실시간 수집 (1분 갱신)
- 테스트 완료: 2026-01-07
"""
import requests
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta

# API 설정
API_KEY = 'ff61caa6057e80a5238d007ec29c7860d47f7d257f006792451fee1010e3b267'
ENDPOINT = 'https://apis.data.go.kr/1371000/pressReleaseService/pressReleaseList'

# 최근 3일 (최대 허용 기간)
end_date = datetime.now()
start_date = end_date - timedelta(days=2)

params = {
    'serviceKey': API_KEY,
    'startDate': start_date.strftime('%Y%m%d'),
    'endDate': end_date.strftime('%Y%m%d'),
    'numOfRows': '100',  # 페이지당 결과 수
    'pageNo': '1'
}

print(f"조회 기간: {params['startDate']} ~ {params['endDate']}")
print(f"API: {ENDPOINT}")
print("-" * 60)

response = requests.get(ENDPOINT, params=params, timeout=15)
print(f'Status: {response.status_code}')

if response.status_code == 200:
    root = ET.fromstring(response.content)

    # 결과 코드 확인
    result_code = root.find('.//resultCode')
    result_msg = root.find('.//resultMsg')
    print(f'Result: {result_code.text if result_code is not None else "N/A"} - {result_msg.text if result_msg is not None else "N/A"}')
    print("=" * 60)

    # 뉴스 아이템 파싱
    items = root.findall('.//NewsItem')
    print(f"총 {len(items)}건 조회됨")
    print("=" * 60)

    for item in items:
        news_id = item.find('NewsItemId')
        title = item.find('Title')
        minister = item.find('MinisterCode')
        approve_date = item.find('ApproveDate')
        url = item.find('OriginalUrl')
        contents_status = item.find('ContentsStatus')
        file_name = item.find('FileName')
        file_url = item.find('FileUrl')

        print()
        print(f"[{minister.text if minister is not None else 'N/A'}]")
        print(f"  제목: {title.text if title is not None else 'N/A'}")
        print(f"  ID: {news_id.text if news_id is not None else 'N/A'}")
        print(f"  상태: {contents_status.text if contents_status is not None else 'N/A'} (I:신규, U:수정)")
        print(f"  일시: {approve_date.text if approve_date is not None else 'N/A'}")
        print(f"  URL: {url.text if url is not None else 'N/A'}")
        if file_name is not None and file_name.text:
            print(f"  첨부: {file_name.text}")
            print(f"  다운: {file_url.text if file_url is not None else 'N/A'}")
else:
    print(f"Error: {response.text[:500]}")

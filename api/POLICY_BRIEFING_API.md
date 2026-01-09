# 정책브리핑 보도자료 API 가이드

> 18개 부처 보도자료 실시간 수집 (1분 단위)
> 작성일: 2026-01-07

---

## 1. API 기본 명세

| 항목 | 내용 |
|------|------|
| **서비스명** | 대한민국_정책브리핑_보도자료기사조회서비스 |
| **엔드포인트** | `http://apis.data.go.kr/1371000/pressReleaseService/pressReleaseList` |
| **인터페이스** | REST (GET 방식) |
| **데이터 형식** | XML |
| **갱신 주기** | 실시간 (1분) |

---

## 2. 인증키

```
ff61caa6057e80a5238d007ec29c7860d47f7d257f006792451fee1010e3b267
```

> 공공데이터포털에서 발급받은 Encoding된 키 사용

---

## 3. 요청 파라미터

| 파라미터 | 국문명 | 필수 | 샘플 | 설명 |
|----------|--------|------|------|------|
| `serviceKey` | 인증키 | **필수** | (위 키) | 공공데이터포털 발급 키 |
| `startDate` | 시작일 | **필수** | 20210925 | YYYYMMDD 형식 |
| `endDate` | 종료일 | **필수** | 20210927 | YYYYMMDD 형식 |
| `numOfRows` | 결과 수 | 선택 | 10 | 페이지당 결과 수 |
| `pageNo` | 페이지 | 선택 | 1 | 페이지 번호 |

### 주의: 검색 기간 제한
- **startDate ~ endDate: 최대 3일 이내**
- 초과 시 에러 코드 98 반환

---

## 4. 응답 필드 (Response)

### 핵심 필드

| 필드명 | 설명 | 비고 |
|--------|------|------|
| `NewsItemId` | 기사 고유 ID | **PK로 활용** |
| `ContentsStatus` | 콘텐츠 상태 | I: 신규, U: 수정 |
| `ApproveDate` | 시스템 등록 승인 일시 | 실제 보도 시점 |
| `Title` | 보도자료 제목 | |
| `DataContents` | 본문 전문 | HTML 또는 Text |
| `MinisterCode` | 발행 부처명 | 예: 과학기술정보통신부 |
| `OriginalUrl` | 기사 원문 링크 | 정책브리핑 사이트 |
| `FileName` | 첨부파일명 | |
| `FileUrl` | 첨부파일 다운로드 링크 | 보도자료 원본 파일 |

---

## 5. 호출 예시

### 기본 호출
```bash
curl "http://apis.data.go.kr/1371000/pressReleaseService/pressReleaseList?serviceKey=ff61caa6057e80a5238d007ec29c7860d47f7d257f006792451fee1010e3b267&startDate=20260105&endDate=20260107&numOfRows=10&pageNo=1"
```

### Python 예시 (테스트 완료 - 2026-01-07)
```python
import requests
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta

API_KEY = "ff61caa6057e80a5238d007ec29c7860d47f7d257f006792451fee1010e3b267"
ENDPOINT = "https://apis.data.go.kr/1371000/pressReleaseService/pressReleaseList"

# 최근 3일 데이터 조회
end_date = datetime.now()
start_date = end_date - timedelta(days=2)  # 최대 3일

params = {
    "serviceKey": API_KEY,
    "startDate": start_date.strftime("%Y%m%d"),
    "endDate": end_date.strftime("%Y%m%d"),
    "numOfRows": 100,
    "pageNo": 1
}

response = requests.get(ENDPOINT, params=params)

if response.status_code == 200:
    root = ET.fromstring(response.content)

    for item in root.findall('.//NewsItem'):
        news_id = item.find('NewsItemId').text
        title = item.find('Title').text
        minister = item.find('MinisterCode').text
        url = item.find('OriginalUrl').text

        print(f"[{minister}] {title}")
        print(f"  URL: {url}")
```

### Node.js 예시
```javascript
const axios = require('axios');

const API_KEY = 'ff61caa6057e80a5238d007ec29c7860d47f7d257f006792451fee1010e3b267';
const ENDPOINT = 'http://apis.data.go.kr/1371000/pressReleaseService/pressReleaseList';

async function fetchPressReleases() {
  const today = new Date();
  const threeDaysAgo = new Date(today - 2 * 24 * 60 * 60 * 1000);

  const params = {
    serviceKey: API_KEY,
    startDate: threeDaysAgo.toISOString().slice(0,10).replace(/-/g,''),
    endDate: today.toISOString().slice(0,10).replace(/-/g,''),
    numOfRows: 100,
    pageNo: 1
  };

  const response = await axios.get(ENDPOINT, { params });
  return response.data;
}
```

---

## 6. 개발 시 주의사항

### 필수 체크

| 항목 | 내용 |
|------|------|
| **검색 기간 제한** | startDate ~ endDate **최대 3일 이내** (초과 시 에러 98) |
| **에러 처리** | 공공데이터포털 공통 에러 + 제공기관 개별 에러 구분 필요 |
| **본문 처리** | `DataContents`는 `ContentsType`에 따라 HTML 태그 포함 가능 → 태그 제거 또는 렌더링 처리 필요 |

### 에러 코드

| 코드 | 설명 |
|------|------|
| 98 | 검색 기간 3일 초과 |
| 서비스키 미등록 | 공공데이터포털 공통 에러 |
| 날짜 타입 오류 | 제공기관 개별 에러 |

---

## 7. 18개 부처 목록

정책브리핑에서 제공하는 부처:

1. 기획재정부
2. 교육부
3. 과학기술정보통신부
4. 외교부
5. 통일부
6. 법무부
7. 국방부
8. 행정안전부
9. 문화체육관광부
10. 농림축산식품부
11. 산업통상자원부
12. 보건복지부
13. 환경부
14. 고용노동부
15. 여성가족부
16. 국토교통부
17. 해양수산부
18. 중소벤처기업부

---

## 8. 활용 전략

### 실시간 수집 (권장)
```
- 1분 단위 갱신이므로 cron job으로 주기적 호출
- 최근 3일 데이터만 조회 가능 → 매일 수집 필수
- NewsItemId로 중복 체크
```

### 데이터 저장
```
- NewsItemId: 기사 고유 ID (PK)
- ContentsStatus: I(신규) / U(수정) 구분하여 INSERT/UPDATE
- ApproveDate: 실제 보도 시점으로 정렬
```

---

*참고문서: 20220921_문화체육관광부_정책브리핑_보도자료_OpenAPI활용가이드.docx*

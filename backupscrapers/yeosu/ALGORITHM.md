# 여수시 스크래퍼 알고리즘

## 개요
| 항목 | 값 |
|------|-----|
| 대상 사이트 | 여수시청 보도자료 |
| Region Code | `yeosu` |
| Category | `전남` |
| 버전 | v2.0 |

## URL 패턴
- **목록 페이지**: `https://www.yeosu.go.kr/www/govt/news/release/press`
- **상세 페이지**: `?idx={ID}&mode=view`
- **페이지네이션**: `?page={N}`

## 수집 흐름

### Phase 1: 목록 페이지 수집
```
1. LIST_URL 접근
2. `a[href*="idx="][href*="mode=view"]` 셀렉터로 기사 링크 추출
3. 제목에서 "새로운글" 텍스트 제거
4. idx 파라미터로 기사 ID 추출
```

### Phase 2: 상세 페이지 수집
```
1. 상세 페이지 접근
2. JavaScript로 정보 추출:
   - 본문: ⭐ og:description 메타태그 사용 (가장 정확!)
   - 날짜: dl 내 "등록일" dt 다음 dd 태그
   - 담당부서: dl 내 "담당부서" dt 다음 dd 태그
3. og:description이 없으면 board_view 내 p 태그들에서 추출
```

### Phase 3: 이미지 처리 ⭐ (v2.0 업데이트)
```
1. 첨부파일 링크에서 이미지 파일 확인
   - 패턴: a[href*="file_download"]
   - URL: /ybscript.io/common/file_download/{idx}/{file_id}/{filename}
2. 이미지 다운로드 및 로컬 저장
   - 저장 경로: web/public/images/yeosu/
   - 파일명: yeosu_YYYYMMDD_{6자리해시}.jpg
   - 웹 접근 경로: /images/yeosu/{filename}
3. 저장 경로를 thumbnail_url로 반환
```

### Phase 4: 서버 전송
```
POST /api/bot/ingest
{
  title, content, published_at, original_link,
  source: "여수시", category: "전남", region: "yeosu",
  thumbnail_url: "/images/yeosu/yeosu_20251212_abc123.jpg"
}
```

## 주요 셀렉터
| 요소 | 셀렉터 |
|------|--------|
| 기사 링크 | `a[href*="idx="][href*="mode=view"]` |
| 본문 영역 | `meta[property="og:description"]` (우선), `.board_view` |
| 첨부파일 | `a[href*="file_download"]` |
| 날짜 | `dl` 내 `dt:등록일` 다음 `dd` |

## 실행 방법
```bash
# 기본 실행 (최근 3일, 최대 10개)
python yeosu_scraper.py

# 옵션 지정
python yeosu_scraper.py --days 7 --max-articles 20

# 테스트 모드 (서버 전송 안함)
python yeosu_scraper.py --dry-run --max-articles 3
```

## 특이사항
- **본문 추출**: `og:description` 메타태그 사용 (가장 정확함)
- **이미지 저장**: `local_image_saver.py` 사용, `web/public/images/yeosu/`에 로컬 저장
- **웹 접근**: `/images/yeosu/{filename}` 경로로 접근 가능

## 변경 이력
| 버전 | 날짜 | 내용 |
|------|------|------|
| v2.0 | 2025-12-12 | Cloudinary → 로컬 이미지 저장 전환 |
| v1.0 | 2025-12-12 | 최초 생성 |

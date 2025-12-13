# 무안군 보도자료 스크래퍼 알고리즘

## 개요
| 항목 | 값 |
|------|-----|
| 대상 | 무안군청 보도자료 |
| Region Code | `muan` |
| Category | `전남` |
| Base URL | `https://www.muan.go.kr` |
| List URL | `/www/openmuan/new/report` |

---

## 수집 흐름

```
Phase 1: 링크 수집
├── 목록 페이지 1~3 순회
├── table tbody tr 파싱
└── 제목, URL, 날짜 추출

Phase 2: 상세 페이지 방문
├── div.view_cont → 본문 추출
├── div.view_info → 날짜 추출
└── 첨부파일/본문 이미지 → 로컬 저장

Phase 3: 검증 및 저장
├── 제목/본문 길이 검증
└── API 전송 (/api/bot/ingest)
```

---

## 셀렉터 명세

### 목록 페이지
| 대상 | 셀렉터 |
|------|--------|
| 행 | `table tbody tr` |
| 제목 링크 | `a.title_cont` (fallback: `td:nth-child(2) a`) |
| 날짜 | `td:nth-child(4)` |

### 상세 페이지
| 대상 | 셀렉터 |
|------|--------|
| 본문 | `div.view_cont` |
| 메타 정보 | `div.view_info` |
| 첨부 이미지 | `a[href*="file_download"]` |

---

## URL 패턴
- 페이지네이션: `?page={N}`
- 상세 페이지: `?idx={ID}&mode=view`

---

## 특이사항
1. **이미지 처리**: 인라인 `<img>` 없음, 첨부파일 다운로드 방식
2. **날짜 형식**: `작성일 YYYY.MM.DD HH:MM`
3. **로컬 저장**: `web/public/images/muan/` 폴더

---

## 실행 예시
```bash
# 기본 실행
python muan/muan_scraper.py

# 테스트 모드
python muan/muan_scraper.py --dry-run --max-articles 3

# 기간 지정
python muan/muan_scraper.py --days 7 --max-articles 20
```

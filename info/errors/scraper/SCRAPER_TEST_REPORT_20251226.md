# 26개 스크래퍼 종합 테스트 보고서

> **테스트 일자:** 2025-12-26
> **테스트 방식:** 라운드 로빈 (26개 스크래퍼 × 10+ 라운드)
> **테스트 모드:** --dry-run (DB 저장 없이 실행)
> **목적:** 오류 패턴 도출 및 안정성 검증

---

## 1. 요약 (Executive Summary)

| 항목 | 수치 |
|------|------|
| 총 스크래퍼 수 | 26개 |
| 정상 작동 | 19개 (73%) |
| 치명적 오류 | 7개 (27%) |
| UnboundLocalError 발생 | 6개 |
| UnicodeEncodeError 발생 | 2개 |
| DB 스키마 오류 | 1건 |

### 오류 스크래퍼 목록

| 스크래퍼 | UnboundLocalError | UnicodeEncodeError | 재현율 |
|---------|:-----------------:|:------------------:|:------:|
| gwangyang | ✅ | - | 100% |
| goheung | ✅ | - | 100% |
| hwasun | ✅ | - | 100% |
| haenam | ✅ | - | 100% |
| jindo | ✅ | - | 100% |
| hampyeong | ✅ | ✅ | 100% |
| jeonnam_edu | - | ✅ | 조건부* |

*조건부: 특수문자(\u2027)가 포함된 제목 발생 시

---

## 2. 치명적 오류 상세 분석

### 2.1 UnboundLocalError (6개 스크래퍼)

**오류 메시지:**
```
UnboundLocalError: cannot access local variable 'success_count' before it is referenced
```

**원인:** `collect_articles()` 함수 내에서 `success_count` 변수가 초기화되지 않은 상태에서 `success_count += 1` 연산 시도

**영향 파일 및 라인:**

| 파일 | 라인 | 함수 |
|------|------|------|
| `scrapers/gwangyang/gwangyang_scraper.py` | 548 | `collect_articles()` |
| `scrapers/goheung/goheung_scraper.py` | 572 | `collect_articles()` |
| `scrapers/hwasun/hwasun_scraper.py` | 521 | `collect_articles()` |
| `scrapers/haenam/haenam_scraper.py` | 550 | `collect_articles()` |
| `scrapers/jindo/jindo_scraper.py` | 537 | `collect_articles()` |
| `scrapers/hampyeong/hampyeong_scraper.py` | 489 | `collect_articles()` |

**테스트 재현 결과:**
- 라운드 1-10: 모두 동일 오류 발생 (100% 재현)
- 새 기사가 없는 경우에도 오류 발생 (변수 참조 시점에서 실패)

**수정 제안 (미적용):**
```python
# 현재 코드 (오류)
def collect_articles(...):
    # success_count 초기화 없음
    ...
    success_count += 1  # UnboundLocalError 발생

# 수정안
def collect_articles(...):
    success_count = 0  # 함수 시작 시 초기화
    ...
    success_count += 1  # 정상 작동
```

---

### 2.2 UnicodeEncodeError (2개 스크래퍼)

**오류 메시지:**
```
UnicodeEncodeError: 'cp949' codec can't encode character '\u2027' in position X
UnicodeEncodeError: 'cp949' codec can't encode character '\u2013' in position X
```

**원인:** Windows 콘솔의 cp949 인코딩이 유니코드 특수문자를 처리하지 못함

**영향 파일 및 라인:**

| 파일 | 라인 | 문자 | 문자명 |
|------|------|------|--------|
| `scrapers/jeonnam_edu/jeonnam_edu_scraper.py` | 340 | \u2027 | HYPHENATION POINT |
| `scrapers/hampyeong/hampyeong_scraper.py` | 489 | \u2013 | EN DASH |

**테스트 재현 결과:**
- jeonnam_edu: 라운드 1-3에서 재현 (특수문자 제목 존재 시)
- hampyeong: 라운드 3에서 발견, 이후 100% 재현

**수정 제안 (미적용):**
```python
# 현재 코드 (오류)
print(f"   [{processed_count+1}] Processing: {title[:40]}...")

# 수정안 1: errors='replace' 사용
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# 수정안 2: 출력 전 문자열 정제
safe_title = title.encode('cp949', errors='replace').decode('cp949')
print(f"   [{processed_count+1}] Processing: {safe_title[:40]}...")
```

---

### 2.3 Database Constraint 오류 (bot_logs)

**오류 메시지:**
```
{'message': 'new row for relation "bot_logs" violates check constraint "bot_logs_status_check"',
 'code': '23514',
 'details': 'Failing row contains (..., timeout, ...)'}
```

**원인:** `bot_logs` 테이블의 `status` 컬럼 CHECK 제약조건에 'timeout' 값이 포함되지 않음

**발생 위치:**
- `tools/scheduled_scraper.py` - 시간 초과 시 'timeout' 상태 저장 시도

**수정 제안 (미적용):**
```sql
-- 현재 constraint (추정)
CHECK (status IN ('running', 'completed', 'failed', 'cancelled'))

-- 수정안
ALTER TABLE bot_logs DROP CONSTRAINT bot_logs_status_check;
ALTER TABLE bot_logs ADD CONSTRAINT bot_logs_status_check
  CHECK (status IN ('running', 'completed', 'failed', 'cancelled', 'timeout'));
```

---

## 3. 정상 작동 스크래퍼 (19개)

| # | 스크래퍼 | 상태 | 비고 |
|---|---------|------|------|
| 1 | gwangju | ✅ 정상 | - |
| 2 | jeonnam | ✅ 정상 | - |
| 3 | mokpo | ✅ 정상 | - |
| 4 | yeosu | ✅ 정상 | - |
| 5 | suncheon | ✅ 정상 | - |
| 6 | naju | ✅ 정상 | - |
| 7 | damyang | ✅ 정상 | - |
| 8 | gokseong | ✅ 정상 | - |
| 9 | gurye | ✅ 정상 | - |
| 10 | boseong | ✅ 정상 | - |
| 11 | jangheung | ✅ 정상 | - |
| 12 | gangjin | ✅ 정상 | - |
| 13 | yeongam | ✅ 정상 | - |
| 14 | muan | ✅ 정상 | - |
| 15 | yeonggwang | ✅ 정상 | - |
| 16 | jangseong | ✅ 정상 | - |
| 17 | wando | ✅ 정상 | - |
| 18 | shinan | ✅ 정상 | - |
| 19 | gwangju_edu | ✅ 정상 | - |

---

## 4. 비치명적 이슈

### 4.1 IMAGE_MISSING 경고

여러 스크래퍼에서 이미지 URL을 찾지 못하는 경우 발생:
```
[IMAGE_MISSING] 이미지를 찾을 수 없음: ...
```

**영향:** 기사 수집은 정상 진행, 이미지만 누락
**심각도:** 낮음 (기능에 영향 없음)

### 4.2 SSL 경고 (InsecureRequestWarning)

일부 지자체 사이트에서 SSL 인증서 검증 비활성화로 인한 경고:
```
InsecureRequestWarning: Unverified HTTPS request is being made
```

**영향:** 기능에 영향 없음
**심각도:** 낮음

### 4.3 기사 없음 (No articles)

테스트 당일 새 보도자료가 없는 지역:
- jeonnam, naju, gurye, boseong, haenam, muan, gokseong, yeongam, gwangju, wando, hampyeong, hwasun, goheung, gwangyang, yeonggwang

**영향:** 정상 동작 (수집할 기사가 없을 뿐)
**심각도:** 없음 (정상 상황)

---

## 5. 라운드별 테스트 결과

### 라운드 1-3: 전체 26개 스크래퍼 테스트

| 라운드 | 성공 | 실패 | 주요 발견 |
|--------|------|------|-----------|
| 1 | 19 | 7 | UnboundLocalError 6개 확인 |
| 2 | 19 | 7 | 동일 패턴 재현 확인 |
| 3 | 19 | 7 | hampyeong UnicodeEncodeError 추가 발견 |

### 라운드 4-10: 오류 스크래퍼 집중 테스트

| 라운드 | 대상 | 결과 |
|--------|------|------|
| 4 | gwangyang, goheung, hwasun, haenam, jindo, hampyeong, jeonnam_edu | 모두 동일 오류 |
| 5 | 동일 | 모두 동일 오류 |
| 6 | 동일 | 모두 동일 오류 |
| 7 | 동일 | 모두 동일 오류 |
| 8 | 동일 | 모두 동일 오류 |
| 9 | 동일 | 모두 동일 오류 |
| 10 | 동일 | 모두 동일 오류 |

**결론:** 오류가 100% 재현되며, 일시적 문제가 아닌 코드 결함임

---

## 6. 스케줄 시스템 상태

### 6.1 최근 실행 로그 분석

**파일:** `tools/schedule_run_20251226_160006.log`

```
[요약]
  성공: 24개 지역
  실패: 1개 지역 (jeonnam_edu)
  시간초과: 1개 지역 (jindo)
  총 기사: 107건
```

**실행 시간:** 2025-12-26 16:00:06 ~ 16:10:34 (약 10분)

### 6.2 AI 처리 결과

```
총 52건 처리 중:
- 완료: 29건
- 시간 초과: 11건
- 진행 중 종료: 12건

등급 분포:
- A등급: 7건
- D등급: 22건 (대부분 10회 시도 후 실패)
```

### 6.3 trigger_log.txt 확인

```
마지막 트리거: [2025-12-26 16:00:06.781007]
```

스케줄러가 정상적으로 트리거되고 있음 확인.

---

## 7. 등록시간 추출 현황

> **참고:** 상세 테스트는 추가 점검 필요

현재 확인된 사항:
- 대부분의 스크래퍼에서 `published_at` 필드 추출 시도
- 일부 지자체 사이트에서 등록시간 형식이 다름
- UnboundLocalError로 인해 일부 스크래퍼에서 등록시간 추출 전에 실패

---

## 8. 수정 우선순위 제안

### P0 - 즉시 수정 필요

| 순위 | 항목 | 영향도 | 예상 작업량 |
|------|------|--------|-------------|
| 1 | UnboundLocalError 수정 (6개 파일) | 6개 지역 수집 불가 | 30분 |
| 2 | bot_logs constraint 수정 | 시간초과 로깅 실패 | 5분 |

### P1 - 조기 수정 권장

| 순위 | 항목 | 영향도 | 예상 작업량 |
|------|------|--------|-------------|
| 3 | UnicodeEncodeError 수정 (2개 파일) | 일부 제목 처리 실패 | 15분 |

### P2 - 개선 사항

| 순위 | 항목 | 영향도 | 예상 작업량 |
|------|------|--------|-------------|
| 4 | IMAGE_MISSING 처리 개선 | 기능 영향 없음 | 1시간 |
| 5 | SSL 경고 억제 | 로그 가독성 | 10분 |

---

## 9. 수정 계획 (승인 대기)

### Phase 1: UnboundLocalError 수정

**대상 파일 (6개):**
1. `scrapers/gwangyang/gwangyang_scraper.py`
2. `scrapers/goheung/goheung_scraper.py`
3. `scrapers/hwasun/hwasun_scraper.py`
4. `scrapers/haenam/haenam_scraper.py`
5. `scrapers/jindo/jindo_scraper.py`
6. `scrapers/hampyeong/hampyeong_scraper.py`

**수정 내용:**
- `collect_articles()` 함수 시작부에 `success_count = 0` 초기화 추가

### Phase 2: UnicodeEncodeError 수정

**대상 파일 (2개):**
1. `scrapers/jeonnam_edu/jeonnam_edu_scraper.py`
2. `scrapers/hampyeong/hampyeong_scraper.py`

**수정 내용:**
- print 문에서 유니코드 문자 안전 처리

### Phase 3: Database Schema 수정

**대상:**
- Supabase bot_logs 테이블

**수정 내용:**
- status CHECK constraint에 'timeout' 추가

---

## 10. 결론

26개 스크래퍼 중 7개(27%)에서 치명적 오류가 발견되었습니다.

**주요 원인:**
1. Python 변수 스코프 오류 (UnboundLocalError) - 6개 스크래퍼
2. Windows 인코딩 문제 (UnicodeEncodeError) - 2개 스크래퍼
3. Database 스키마 불일치 - 1건

**권장 조치:**
- P0 오류 즉시 수정 (UnboundLocalError 6개, DB constraint 1건)
- P1 오류 조기 수정 (UnicodeEncodeError 2개)
- 수정 후 전체 재테스트 실행

---

*보고서 작성: Claude*
*작성일: 2025-12-26*
*수정 여부: ❌ 미수정 (보고서만 작성)*

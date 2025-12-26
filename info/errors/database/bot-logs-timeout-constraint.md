# bot_logs 테이블 timeout 상태 제약조건 위반

> 날짜: 2025-12-26
> 심각도: P0 (스크래퍼 로그 저장 실패)
> 분류: database

---

## 증상

스케줄러에서 timeout 발생 시 bot_logs 업데이트 실패.

```
[오류] 로그 1971 업데이트 실패: {'message': 'new row for relation "bot_logs" violates check constraint "bot_logs_status_check"', 'code': '23514'}
```

---

## 에러 메시지

```
new row for relation "bot_logs" violates check constraint "bot_logs_status_check"
Failing row contains (..., timeout, jindo, 0, 10분 시간초과로 취소됨, null).
```

---

## 원인

`bot_logs` 테이블의 `status` 컬럼에 CHECK 제약조건이 있는데, `'timeout'` 값이 허용 목록에 없음.

기존 허용값: `'idle', 'running', 'completed', 'failed'`

---

## 해결책

### 마이그레이션 SQL 실행

파일: `supabase/migrations/20251226_fix_bot_logs_timeout_status.sql`

```sql
-- Drop existing constraint
ALTER TABLE bot_logs DROP CONSTRAINT IF EXISTS bot_logs_status_check;

-- Add new constraint with 'timeout' included
ALTER TABLE bot_logs ADD CONSTRAINT bot_logs_status_check
CHECK (status IN ('idle', 'running', 'completed', 'failed', 'timeout'));
```

### 실행 방법

1. Supabase Dashboard 접속
2. SQL Editor 열기
3. 위 SQL 실행
4. 확인: `SELECT conname FROM pg_constraint WHERE conrelid = 'bot_logs'::regclass;`

---

## 예방책

새 상태값 추가 시 반드시 CHECK 제약조건 확인 후 먼저 마이그레이션 실행.

---

## 관련 파일

- `supabase/migrations/20251226_fix_bot_logs_timeout_status.sql`
- `tools/scheduled_scraper.py` (timeout 상태 사용)

---

*작성: 2025-12-26*

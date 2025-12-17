# Bulk Approval 실패 (0개 승인, N개 실패)

> **증상:** 기사 일괄 승인 시 "0개 승인 완료, 7개 실패" 에러
> **원인:** DB에 필수 컬럼/테이블 없음
> **해결일:** 2025-12-17

---

## 증상

```
0개 승인 완료, 7개 실패
```

Admin > News 페이지에서 기사 선택 후 "선택 승인" 클릭 시 모든 기사가 실패

---

## 원인

API에서 `approved_at` 컬럼에 값을 설정하려 했으나, DB에 해당 컬럼이 없음

```typescript
// /api/posts/[id]/route.ts
if (body.status === 'published') {
    body.approved_at = now;  // <-- 이 컬럼이 없으면 에러
}
```

추가로:
- `site_settings` 테이블 없음
- 시스템 계정 (`news@koreanewsone.com`) 없음

---

## 해결

### SQL 실행 (Supabase SQL Editor)

```sql
-- 1. site_settings 테이블 생성
CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value JSONB,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. posts 테이블에 컬럼 추가
ALTER TABLE posts ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 3. auto_assign_reporter 설정 추가
INSERT INTO site_settings (key, value, description) VALUES
('auto_assign_reporter', 'true', 'Auto-assign reporter on article approval')
ON CONFLICT (key) DO NOTHING;

-- 4. 시스템 계정 생성
INSERT INTO reporters (name, email, type, position, access_level, region, status, avatar_icon, bio)
SELECT 'Korea NEWS', 'news@koreanewsone.com', 'AI Bot', 'editor_in_chief', 100, NULL, 'Active', 'newspaper', 'Korea NEWS System Account'
WHERE NOT EXISTS (SELECT 1 FROM reporters WHERE email = 'news@koreanewsone.com');

-- 5. 기존 시스템 계정이 있으면 업데이트
UPDATE reporters SET access_level = 100, status = 'Active' WHERE email = 'news@koreanewsone.com';
```

---

## 관련 파일

- `/api/posts/[id]/route.ts` - PATCH 핸들러
- `/lib/auto-assign.ts` - 자동 기자 배정 로직
- `/lib/permissions.ts` - 권한 레벨 정의

---

## 디버깅 팁

1. 에러 메시지 확인 (개선됨)
   - 이전: 항상 "서버 오류가 발생했습니다"
   - 이후: 실제 Supabase 에러 메시지 반환

2. 브라우저 콘솔에서 `[응답]` 로그 확인
   - 각 기사별 API 응답 상태와 에러 메시지 출력

---

*추가일: 2025-12-17*

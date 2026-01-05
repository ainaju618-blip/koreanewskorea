# posts.scope 필드 마이그레이션 가이드

> **목적:** 본사(전국판)와 지사(지역판) 콘텐츠 분리를 위한 DB 스키마 확장

---

## 1. 스키마 변경

### 1.1 Supabase SQL 에디터에서 실행

```sql
-- Step 1: scope 필드 추가
ALTER TABLE posts ADD COLUMN IF NOT EXISTS scope VARCHAR(20) DEFAULT 'regional';

-- Step 2: 인덱스 생성 (쿼리 성능 향상)
CREATE INDEX IF NOT EXISTS idx_posts_scope ON posts(scope);

-- Step 3: 기존 데이터 분류 (모두 regional로 설정)
UPDATE posts SET scope = 'regional' WHERE scope IS NULL;
```

### 1.2 scope 값 정의

| scope 값 | 의미 | 표시 사이트 |
|----------|------|------------|
| `national` | 전국 단위 뉴스 | 본사 (koreanewskorea.com) |
| `regional` | 지역 단위 뉴스 | 지사 (koreanewsone.com) |
| `both` | 양쪽 모두 표시 | 본사 + 지사 |

---

## 2. 데이터 분류 기준

### 2.1 national (전국판에 표시)

**소스 기준:**
- 정부/부처 보도자료 (korea.kr)
- 행정안전부, 교육부, 보건복지부 등 중앙부처
- 전국 단위 정책/이슈

**분류 SQL:**
```sql
-- 정부/부처 소스에서 온 기사
UPDATE posts
SET scope = 'national'
WHERE source_url LIKE '%korea.kr%'
   OR source_url LIKE '%mois.go.kr%'
   OR source_url LIKE '%moe.go.kr%'
   OR source_url LIKE '%mohw.go.kr%'
   OR source_url LIKE '%msit.go.kr%';

-- 카테고리로 분류
UPDATE posts
SET scope = 'national'
WHERE category IN ('정치', '경제', '교육', 'AI', '테크', 'IT', '기술');
```

### 2.2 regional (지역판에 표시)

**소스 기준:**
- 광주/전남 27개 기관
- 지역 밀착형 뉴스
- 지역 행사/축제 정보

**분류 SQL:**
```sql
-- 지역 기사로 분류
UPDATE posts
SET scope = 'regional'
WHERE region IS NOT NULL
   OR category IN ('광주', '전남', '나주', '목포', '순천', '여수', '광양')
   OR source_url LIKE '%gwangju.go.kr%'
   OR source_url LIKE '%jeonnam.go.kr%';
```

---

## 3. 쿼리 패턴

### 3.1 본사 (전국판) 쿼리

```typescript
// NationalHero, CategorySection 등에서 사용
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('status', 'published')
  .in('scope', ['national', 'both'])  // 전국 또는 공통 기사만
  .order('published_at', { ascending: false });
```

### 3.2 지사 (지역판) 쿼리

```typescript
// koreanewsone의 HomeHero 등에서 사용
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('status', 'published')
  .in('scope', ['regional', 'both'])  // 지역 또는 공통 기사만
  .order('published_at', { ascending: false });
```

---

## 4. 마이그레이션 체크리스트

- [ ] Supabase SQL 에디터에서 scope 필드 추가
- [ ] 인덱스 생성
- [ ] 기존 데이터 regional로 초기화
- [ ] 소스별 national 분류 실행
- [ ] NationalHero.tsx에서 scope 필터 활성화 (TODO 주석 제거)
- [ ] CategorySection.tsx에서 scope 필터 활성화 (TODO 주석 제거)
- [ ] 테스트: 본사에서 지역 기사가 표시되지 않는지 확인
- [ ] 테스트: 지사에서 전국 기사가 표시되지 않는지 확인

---

## 5. 전국 스크래퍼 개발 시 적용

새로운 전국 스크래퍼 개발 시 DB 저장 코드에 scope 추가:

```python
# scrapers/templates/base_scraper.py 예시
article_data = {
    'title': title,
    'content': content,
    'source_url': url,
    'scope': 'national',  # 전국 스크래퍼는 항상 national
    # ... 기타 필드
}
```

---

## 6. 관련 파일

| 파일 | 역할 |
|------|------|
| `src/components/home/NationalHero.tsx` | 본사 히어로 (scope='national' 필터 TODO) |
| `src/components/home/CategorySection.tsx` | 분야별 섹션 (scope='national' 필터 TODO) |
| `docs/MASTER_PLAN.md` | 전체 기획서 |

---

*이 마이그레이션이 완료되면 본사/지사 콘텐츠가 완전히 분리됩니다.*

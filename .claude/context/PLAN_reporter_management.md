# 기자등록 관리 개선 계획서

> **작성일:** 2025-12-12
> **목적:** 지역 기자 제도 도입 (직위 예우, 권한 동일)

---

## 1. 현재 상태 분석

### 현재 DB 구조 (reporters 테이블)
```
id, name, type, region, status, avatar_icon, created_at
```

### 현재 필드
| 필드 | 용도 | 값 예시 |
|------|------|--------|
| type | AI/Human 구분 | "AI Bot", "Human" |
| region | 담당 지역 (텍스트) | "광주광역시" |
| status | 활성 상태 | "Active", "Inactive" |

### 문제점
- **직위(position)** 필드 없음
- 지역이 자유 텍스트 (표준화 안됨)
- 연락처 정보 없음

---

## 2. 개선 목표

### 핵심 원칙
```
직위 = 예우용 (명함/호칭)
권한 = 모두 동일 (기사 작성/수정)
```

### 추가할 필드
| 필드 | 타입 | 용도 |
|------|------|------|
| position | text | 직위 (지사장, 편집국장, 기자 등) |
| phone | text | 연락처 |
| email | text | 이메일 (로그인 연동용) |
| bio | text | 소개/약력 (선택) |

---

## 3. 직위 체계

### 기본 직위 목록
```
1. 주필 (논설 총괄)
2. 지사장
3. 편집국장
4. 취재부장
5. 수석기자
6. 기자
7. 수습기자
8. 오피니언 (칼럼니스트/논설위원)
```

### 명예직 (선택적)
```
- 고문
- 자문위원
- 홍보대사
```

### 특파원 (선택적)
```
- 서울특파원
- 해외특파원
```

---

## 4. 구현 계획

### Phase 1: DB 스키마 확장
```sql
ALTER TABLE reporters ADD COLUMN position text DEFAULT '기자';
ALTER TABLE reporters ADD COLUMN phone text;
ALTER TABLE reporters ADD COLUMN email text;
ALTER TABLE reporters ADD COLUMN bio text;
```

### Phase 2: API 수정
- `GET /api/users/reporters` - 새 필드 포함
- `POST /api/users/reporters` - 새 필드 저장
- `PUT /api/users/reporters/[id]` - 새 필드 수정

### Phase 3: UI 개선

#### 3-1. 기자 추가/수정 폼 확장
```
- 이름 (필수)
- 직위 (드롭다운 선택)
- 담당 지역 (드롭다운 - 표준화)
- 유형 (AI Bot / Human)
- 연락처
- 이메일
- 소개 (선택)
```

#### 3-2. 기자 목록 개선
```
- 직위별 필터 추가
- 지역별 필터 추가
- 카드에 직위 표시
```

#### 3-3. 기자 상세 정보 패널
```
- 슬라이드 패널로 상세 정보 표시
- 작성 기사 목록 연동 (향후)
```

---

## 5. 파일 변경 목록

### DB (Supabase)
- reporters 테이블 컬럼 추가

### API
- `web/src/app/api/users/reporters/route.ts` - 수정
- `web/src/app/api/users/reporters/[id]/route.ts` - 수정

### UI
- `web/src/app/admin/users/reporters/page.tsx` - 전면 개선
- (신규) `web/src/app/admin/users/reporters/components/` - 컴포넌트 분리

---

## 6. 직위 데이터 (코드용)

```typescript
export const POSITIONS = [
    // 경영/논설
    { value: 'editor_in_chief', label: '주필' },
    // 지역 조직
    { value: 'branch_manager', label: '지사장' },
    { value: 'editor_chief', label: '편집국장' },
    { value: 'news_chief', label: '취재부장' },
    { value: 'senior_reporter', label: '수석기자' },
    { value: 'reporter', label: '기자' },
    { value: 'intern_reporter', label: '수습기자' },
    // 오피니언
    { value: 'opinion_writer', label: '오피니언' },
    // 명예직
    { value: 'advisor', label: '고문' },
    { value: 'consultant', label: '자문위원' },
    { value: 'ambassador', label: '홍보대사' },
    // 특파원
    { value: 'seoul_correspondent', label: '서울특파원' },
    { value: 'foreign_correspondent', label: '해외특파원' },
];
```

---

## 7. 예상 작업량

| Phase | 작업 | 예상 |
|-------|------|------|
| 1 | DB 스키마 | Supabase 콘솔에서 직접 |
| 2 | API 수정 | 소규모 |
| 3 | UI 개선 | 중규모 |

---

## 8. 향후 확장 가능

- 수익 분배 시 직위별 비율 적용
- 권한 세분화 필요 시 role 컬럼 추가
- 기자별 기사 통계 대시보드

---

*승인 후 구현 시작*

# 코리아뉴스코리아 전국판 IA/라우팅 구현 계획

> 작성일: 2026-01-04
> 버전: 1.0
> 상태: 구현 진행 중

## 1. 개요

### 1.1 프로젝트 목표
- 기존 광주/전남 중심에서 **전국 17개 시/도** 커버리지 확장
- IP 기반 위치 감지로 사용자 맞춤 지역 뉴스 제공
- SEO 최적화된 지역 기반 URL 구조

### 1.2 구현 현황

| 항목 | 상태 | 설명 |
|------|------|------|
| regions.json | ✅ 완료 | 17개 시/도, 250+ 시/군/구 데이터 |
| 라우팅 구조 | ✅ 완료 | /region/[sido]/[sigungu]/[articleId] |
| 타입 정의 | ✅ 완료 | src/types/regions.ts |
| 유틸 함수 | ✅ 완료 | src/lib/national-regions.ts |
| Atomic Design | ✅ 완료 | atoms/molecules/organisms 구조 |
| 페이지 구현 | ✅ 완료 | 4단계 라우팅 페이지 |

## 2. 정보 구조 (IA)

### 2.1 URL 구조

```
/                                    # 홈 (IP 기반 지역 맞춤)
/region                              # 지역뉴스 메인 (17개 시/도 목록)
/region/[sido]                       # 시/도별 뉴스 (시/군/구 목록)
/region/[sido]/[sigungu]             # 시/군/구별 뉴스 목록
/region/[sido]/[sigungu]/[articleId] # 기사 상세
```

### 2.2 시/도 코드 체계

| 순번 | 코드 | 이름 | 타입 | 하위 지역 수 |
|------|------|------|------|-------------|
| 1 | seoul | 서울특별시 | metropolitan | 25 |
| 2 | busan | 부산광역시 | metropolitan | 16 |
| 3 | daegu | 대구광역시 | metropolitan | 8 |
| 4 | incheon | 인천광역시 | metropolitan | 10 |
| 5 | gwangju | 광주광역시 | metropolitan | 5 |
| 6 | daejeon | 대전광역시 | metropolitan | 5 |
| 7 | ulsan | 울산광역시 | metropolitan | 5 |
| 8 | sejong | 세종특별자치시 | special | 1 |
| 9 | gyeonggi | 경기도 | province | 31 |
| 10 | gangwon | 강원특별자치도 | special-province | 18 |
| 11 | chungbuk | 충청북도 | province | 11 |
| 12 | chungnam | 충청남도 | province | 15 |
| 13 | jeonbuk | 전북특별자치도 | special-province | 14 |
| 14 | jeonnam | 전라남도 | province | 22 |
| 15 | gyeongbuk | 경상북도 | province | 22 |
| 16 | gyeongnam | 경상남도 | province | 18 |
| 17 | jeju | 제주특별자치도 | special-province | 2 |

### 2.3 특수 규칙

#### 목포+신안 통합
```json
{
  "mokpo_sinan": {
    "description": "목포시와 신안군은 통합 운영",
    "merged": true,
    "primaryRegion": "mokpo",
    "includedRegions": ["mokpo", "sinan"]
  }
}
```

## 3. 컴포넌트 구조 (Atomic Design)

### 3.1 디렉토리 구조

```
src/components/
├── atoms/           # 기본 UI 요소
│   ├── Button.tsx
│   ├── Badge.tsx
│   └── index.ts
├── molecules/       # 복합 UI 요소
│   ├── RegionCard.tsx
│   ├── Breadcrumb.tsx
│   ├── NewsCard.tsx
│   └── index.ts
├── organisms/       # UI 섹션
│   ├── RegionGrid.tsx
│   ├── NewsList.tsx
│   └── index.ts
└── templates/       # 페이지 레이아웃
    └── index.ts
```

### 3.2 주요 컴포넌트

#### RegionCard (Molecule)
- 시/도 또는 시/군/구 카드 표시
- 뉴스 수, 통합 지역 표시 지원

#### RegionGrid (Organism)
- 지역 카드 그리드 레이아웃
- 시/도 및 시/군/구 variant 지원

#### NewsList (Organism)
- 뉴스 목록 표시
- grid/list/featured variant 지원

## 4. 데이터 흐름

### 4.1 위치 감지
```
1. 사용자 접속
2. IP 기반 위치 감지 (/api/location/detect)
3. 쿠키에 선호 지역 저장
4. 지역 맞춤 콘텐츠 제공
```

### 4.2 뉴스 조회
```
1. 라우트 파라미터 (sido, sigungu) 추출
2. 유효성 검증 (isValidRegion, isValidDistrict)
3. Supabase에서 지역 필터링 조회
4. 컴포넌트로 전달
```

## 5. 다음 단계

### 5.1 즉시 작업 필요
- [ ] Supabase 기사 테이블에 region 컬럼 추가
- [ ] 기사 작성 시 지역 선택 UI 구현
- [ ] IP → 지역 매핑 API 완성

### 5.2 추후 작업
- [ ] 지역별 기자 배정 시스템
- [ ] 지역 지도 컴포넌트 (인터랙티브)
- [ ] 인근 지역 추천 기능
- [ ] 지역별 인기 뉴스 랭킹

## 6. 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **State**: React Server Components + Client Components
- **Type Safety**: TypeScript

## 7. 참고 파일

- `src/data/regions.json` - 전국 행정구역 데이터
- `src/lib/national-regions.ts` - 지역 유틸 함수
- `src/types/regions.ts` - 타입 정의 (삭제 가능, national-regions.ts에 포함)
- `src/app/region/*` - 라우팅 페이지
- `src/components/*/` - Atomic Design 컴포넌트

## 8. 관련 문서

- **[MASTER_PLAN.md](./MASTER_PLAN.md)** - 코리아뉴스 통합 기획서 (전체 프로젝트 로드맵)

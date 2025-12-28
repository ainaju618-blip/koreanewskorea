# 코리아NEWS 광주 - 광고 슬롯 가이드

> **Version:** 1.0
> **Created:** 2025-12-28
> **Purpose:** 광고 수주 시 활용 가이드

---

## 광고 슬롯 위치 및 규격

### 데스크톱 (Desktop)

| 슬롯 ID | 위치 | 규격 (px) | 노출 조건 | 예상 CPM |
|---------|------|-----------|-----------|----------|
| `header-right` | 헤더 우측 | 120 x 40 | xl 이상 (1280px+) | 중 |
| `sidebar-top` | 사이드바 상단 | 300 x 250 | 항상 | **높음** |
| `sidebar-bottom` | 사이드바 하단 | 300 x 250 | 항상 | 중 |
| `content-inline` | 콘텐츠 사이 | 728 x 90 | md 이상 (768px+) | 중 |

### 모바일 (Mobile)

| 슬롯 ID | 위치 | 규격 (px) | 노출 조건 | 예상 CPM |
|---------|------|-----------|-----------|----------|
| `mobile-menu` | 모바일 메뉴 | 280 x 100 | 메뉴 열릴 때 | 낮음 |

---

## 슬롯별 상세 설명

### 1. Header Right (`header-right`)

```
위치: 헤더 우측, 검색창 옆
규격: 120 x 40 px
특징:
  - 항상 화면 상단에 고정
  - 스크롤해도 계속 노출
  - 작은 사이즈로 텍스트/로고 광고 적합
권장 광고:
  - 브랜드 로고
  - 간단한 텍스트 배너
  - 이벤트 알림
```

### 2. Sidebar Top (`sidebar-top`)

```
위치: 사이드바 최상단
규격: 300 x 250 px (Medium Rectangle)
특징:
  - 가장 높은 시인성
  - 스크롤 시 고정 (sticky)
  - 모든 페이지에서 노출
권장 광고:
  - 이미지 광고
  - 지역 업체 배너
  - 구인 광고
```

### 3. Sidebar Bottom (`sidebar-bottom`)

```
위치: 사이드바 하단
규격: 300 x 250 px (Medium Rectangle)
특징:
  - 뉴스 위젯 아래 위치
  - 스크롤해야 보임
권장 광고:
  - 보조 광고
  - 이벤트 배너
```

### 4. Content Inline (`content-inline`)

```
위치: 메인 콘텐츠 섹션 사이
규격: 728 x 90 px (Leaderboard)
특징:
  - 뉴스 그리드 사이에 위치
  - 데스크톱에서만 노출
  - 자연스러운 콘텐츠 흐름
권장 광고:
  - 가로형 배너
  - 프로모션 광고
```

### 5. Mobile Menu (`mobile-menu`)

```
위치: 모바일 메뉴 드로어 하단
규격: 280 x 100 px
특징:
  - 메뉴 열릴 때만 노출
  - 낮은 노출 빈도
권장 광고:
  - 모바일 앱 다운로드
  - 간단한 프로모션
```

---

## 광고 적용 방법

### 방법 1: 직접 이미지 교체 (간단)

```tsx
// src/components/AdSlot.tsx 수정

// Before (플레이스홀더)
<span>{label}</span>

// After (실제 광고)
<a href="https://advertiser-site.com" target="_blank">
  <img src="/ads/sidebar-top.jpg" alt="광고" />
</a>
```

### 방법 2: DB 기반 관리 (권장)

```sql
-- site_settings 테이블에 광고 설정 추가
INSERT INTO site_settings (key, value, description) VALUES
(
  'ads_gwangju',
  '{
    "sidebar-top": {
      "enabled": true,
      "imageUrl": "https://cloudinary.com/...",
      "linkUrl": "https://advertiser.com",
      "altText": "광고주명"
    },
    "sidebar-bottom": {
      "enabled": false
    }
  }',
  '광주 사이트 광고 설정'
);
```

### 방법 3: 광고 네트워크 연동 (향후)

```tsx
// Google AdSense, Kakao AdFit 등 연동
<script async src="https://pagead2.googlesyndication.com/..."></script>
```

---

## 광고 수주 가이드

### 광고료 산정 기준 (예시)

| 슬롯 | 월 광고료 (예상) | 비고 |
|------|-----------------|------|
| sidebar-top | 30-50만원 | 프라임 위치 |
| sidebar-bottom | 15-25만원 | 보조 위치 |
| content-inline | 20-30만원 | 데스크톱 전용 |
| header-right | 10-15만원 | 소형 배너 |

### 광고 제작 가이드

```
권장 파일 형식: JPG, PNG, GIF (애니메이션)
최대 파일 크기: 150KB 이하
권장 해상도: 2배 (Retina 대응)
  - 300x250 → 600x500 제작
  - 728x90 → 1456x180 제작
```

### 광고주 문의 안내

```
문의처: 010-2631-3865
이메일: (이메일 주소)
광고 문의 페이지: /advertise (향후 구축)
```

---

## 향후 확장 계획

### Phase 1: 현재 (기본 슬롯)
- 플레이스홀더 광고 슬롯 구축 ✅
- 수동 이미지 교체 방식

### Phase 2: DB 관리
- site_settings 기반 광고 관리
- 관리자 페이지에서 광고 설정

### Phase 3: 광고 네트워크
- Google AdSense 연동
- Kakao AdFit 연동
- 자동 광고 최적화

### Phase 4: 고급 기능
- 광고 통계 대시보드
- A/B 테스트
- 타겟팅 광고

---

## 관련 파일

| 파일 | 설명 |
|------|------|
| `src/components/AdSlot.tsx` | 광고 슬롯 컴포넌트 |
| `src/components/Header.tsx` | 헤더 광고 슬롯 포함 |
| `src/components/Sidebar.tsx` | 사이드바 광고 슬롯 포함 |
| `src/app/(site)/page.tsx` | 인라인 광고 슬롯 포함 |

---

*이 문서는 광고 수주 시 참고용으로 작성되었습니다.*

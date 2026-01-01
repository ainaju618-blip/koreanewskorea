# Frontend App Router - 페이지 라우팅 맵

`src/app/` 디렉토리는 Next.js App Router를 사용하는 페이지 구조입니다. 각 파일은 자동으로 라우트로 변환됩니다.

## 📍 라우팅 구조

### 홈 페이지
- **경로**: `/` (`page.tsx`)
- **설명**: 메인 랜딩 페이지 - 별 파티클 애니메이션 배경, 히어로 섹션, 오늘의 운세 카드 표시
- **주요 기능**:
  - 별이 반짝이는 우주 배경 (CSS 애니메이션)
  - 영상 배경 + 자막
  - 오늘의 운세 섹션
  - 빠른 점괘 버튼 (자동 카테고리 선택)

### 레이아웃
- **파일**: `layout.tsx`
- **설명**: 루트 레이아웃 - 메타데이터, 폰트 설정, 글로벌 스타일
- **포함 요소**:
  - 제목: "🔮 주역점 - 384효 점술 서비스"
  - 설명: 주역 64괘 384효 기반 운세 서비스
  - 폰트: Geist, Geist Mono, Noto Serif KR
  - 언어: 한국어 (ko)

### 점괘 페이지
- **경로**: `/divination` (`divination/page.tsx`)
- **설명**: 점괘 점치기 인터페이스
- **주요 기능**:
  - 질문 검색 (9,500개 질문 데이터)
  - 질문 입력 (100글자 제한)
  - AI 카테고리 추천 (키워드 분석)
  - 질문 제안 자동 표시
  - 인기 질문 표시 (카테고리별)
  - 카테고리 선택 (9개 대분류)
  - 효 위치 선택 (1-6 슬라이더)
  - 양효/음효 선택
  - 선택 요약 표시
  - 점 치기 버튼

### 점괘 결과 페이지
- **경로**: `/divination/result/[id]` (`divination/result/[id]/page.tsx`)
- **설명**: 점괘 결과 표시 페이지
- **파라미터**: `[id]` = 타임스탐프 기반 결과 ID
- **URL 파라미터**:
  - `major`: 대분류 ID
  - `sub`: 소분류 ID
  - `yao`: 효 위치 (1-6)
  - `yang`: 양효(1) / 음효(0)
  - `question`: 사용자 질문

### 히스토리 페이지
- **경로**: `/history` (`history/page.tsx`)
- **설명**: 이전 점괘 결과 히스토리
- **주요 기능**: 과거 점괘 기록 조회 및 재확인

### 점주사위 페이지
- **경로**: `/dice` (`dice/page.tsx`)
- **설명**: 3D 점주사위 시뮬레이터
- **용도**: 전통 점법 체험

### 신비로운 탭
- **경로**: `/mystical` (`mystical/page.tsx`)
- **설명**: 신비로운 기능/콘텐츠 탭

### 주역 정보
- **경로**: `/yijing` (`yijing/page.tsx`)
- **설명**: 주역(易經) 64괘 정보 조회

### 관리자 페이지
- **경로**: `/admin` (`admin/page.tsx`)
- **설명**: 관리자 전용 설정 페이지
- **기능**: 설정 변경 (히어로 영상, 카테고리 등)

### 아이콘 미리보기 페이지
- **경로**: `/icon-preview` (`icon-preview/page.tsx`)
- **설명**: 이모지/아이콘 시스템 테스트 페이지

## 🗂️ 파일 구조

```
src/app/
├── page.tsx                          # 홈 페이지 (/)
├── layout.tsx                        # 루트 레이아웃
├── divination/
│   ├── page.tsx                      # 점괘 페이지 (/divination)
│   └── result/
│       └── [id]/page.tsx             # 결과 페이지 (/divination/result/[id])
├── history/page.tsx                  # 히스토리 (/history)
├── dice/page.tsx                     # 점주사위 (/dice)
├── mystical/page.tsx                 # 신비로운 탭 (/mystical)
├── yijing/page.tsx                   # 주역 정보 (/yijing)
├── admin/page.tsx                    # 관리자 (/admin)
└── icon-preview/page.tsx             # 아이콘 미리보기 (/icon-preview)
```

## 🎯 네비게이션 흐름

1. **홈** (`/`) → 별 배경 + 히어로 섹션 + 오늘의 운세
   - "🔮 응답받기" 버튼 → `/divination?category=X&quick=true`

2. **점괘 페이지** (`/divination`) → 카테고리/효/질문 선택
   - "점 치기" 버튼 → `/divination/result/[id]?...`

3. **결과 페이지** (`/divination/result/[id]`) → 점괘 결과 표시
   - "히스토리" 링크 → `/history`

4. **히스토리** (`/history`) → 이전 결과 목록
   - 결과 클릭 → `/divination/result/[id]`

## 🔑 주요 기능별 페이지

| 기능 | 페이지 | 경로 |
|------|--------|------|
| 홈 화면 | `page.tsx` | `/` |
| 점괘 점치기 | `divination/page.tsx` | `/divination` |
| 결과 보기 | `result/[id]/page.tsx` | `/divination/result/[id]` |
| 이전 결과 | `history/page.tsx` | `/history` |
| 점주사위 | `dice/page.tsx` | `/dice` |
| 주역 정보 | `yijing/page.tsx` | `/yijing` |
| 설정 | `admin/page.tsx` | `/admin` |

## 📱 반응형 설계

모든 페이지는 모바일 우선 디자인으로 구성:
- 최대 너비: `max-w-lg` (lg = 32rem = 512px)
- 패딩: `px-4` (좌우 각 1rem)
- 패딩: `py-6` (상하 각 1.5rem)
- 배경: 검은색 우주 테마 (`bg-black`, `bg-dark-stars`)

## 🎨 스타일 시스템

- **배경**: 검은색 + 별 파티클 애니메이션
- **카드**: `bg-black/40 border border-white/10 rounded-2xl`
- **텍스트**: 흰색 + 회색 계열 (gray-300, gray-400)
- **악센트**: 주황색 계열 (`amber-500`, `amber-300`, `amber-400`)
- **폰트**: 기본(Geist) + 한글(Noto Serif KR)
- **애니메이션**: Tailwind 기본 + 커스텀 (twinkle, float 등)

## ⚙️ 동적 라우팅 패턴

### `[id]` 동적 세그먼트
- 위치: `divination/result/[id]/page.tsx`
- 용도: 각 점괘 결과마다 고유한 ID 기반 라우트 생성
- 예: `/divination/result/1704064800000` (타임스탐프)

## 🔗 페이지 간 데이터 전달

**URL 검색 파라미터**를 통한 전달:
```typescript
/divination?category=1&quick=true
/divination/result/123?major=1&sub=1&yao=3&yang=1&question=...
```

**상태 관리**: `useRouter`, `useSearchParams`, `useState` (클라이언트)

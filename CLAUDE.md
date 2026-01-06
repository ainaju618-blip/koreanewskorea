# koreanewskorea 프로젝트 AI 규칙

> **780줄 → 200줄로 간소화 (2026-01-06)**
> 상세 가이드는 docs/ 폴더 참조

---

## 🔴 P0 규칙 (절대 준수)

### 포트 & 폴더 구분 (혼동 금지!)

| 포트 | 폴더 | 역할 | 수정 가능? |
|------|------|------|-----------|
| **3000** | koreanewsone-clone | 운영 (koreanewsone.com) | ❌ **절대 금지** |
| **3001** | koreanewskorea | 개발 (이 프로젝트) | ✅ 작업 대상 |

```
⚠️ 3000번 포트/koreanewsone-clone 폴더 = 운영 = 절대 수정 금지!
```

### 전국 3단계 계층 구조

> 📌 상세 문서: [plan/NATIONAL_HIERARCHY.md](plan/NATIONAL_HIERARCHY.md)

```
┌─────────────────────────────────────────────────────────────┐
│ 1단계: 코리아NEWS 본사 (전국판) - koreanewskorea.com        │
│        → 17개 시도 뉴스 통합                                │
├─────────────────────────────────────────────────────────────┤
│ 2단계: 광역시도 (17개) - /region/{sido}                     │
│        ① 시도청 보도자료                                    │
│        ② 시도의회 보도자료                                  │
│        ③ 시도교육청 보도자료                                │
├─────────────────────────────────────────────────────────────┤
│ 3단계: 시군구 (약 226개) - /region/{sigungu}                │
│        ① 시군청 보도자료                                    │
│        ② 시군의회 보도자료                                  │
│        ③ 지역교육지원청 보도자료                            │
│        + 맛집/여행 (카카오맵)                               │
└─────────────────────────────────────────────────────────────┘
```

### 현재 시범 운영 현황

| 단계 | 지역 | URL | 상태 |
|------|------|-----|------|
| 1단계 | 본사 (전국) | `/` | ✅ 운영 중 |
| 2단계 | 광주광역시 | `/region/gwangju` | 🔨 개발 중 |
| 3단계 | 나주시 | `/region/naju` | ✅ 운영 중 |
| 3단계 | 진도군 | `/region/jindo` | ✅ 운영 중 |

### 단계별 완성 원칙

```
1단계: 본사 홈페이지 (/) → 완성 후
2단계: 광주광역시 (/region/gwangju) → 완성 후
3단계: 나주/진도 (/region/naju, /region/jindo) → 완성 후 확장

❌ 금지: 이전 단계 미완성 상태에서 다음 단계 작업
```

### DB 완전 분리

| 프로젝트 | Supabase 계정 | 용도 |
|----------|---------------|------|
| koreanewskorea | ainaju618@gmail.com (신규) | 전국 17개 시·도 |
| koreanewsone-clone | kyh6412057153 (기존) | 광주/전남 27개 |

```
❌ DB 공유 안함! 완전히 독립된 데이터 운영
```

### 스크래퍼 운영 (4개만 활성화)

```
✅ 활성화 (4개만):
   - scrapers/naju/
   - scrapers/naju_council/
   - scrapers/jindo/
   - scrapers/jindo_council/

❌ 비활성화: scrapers/_disabled/ (42개 보관)
```

---

## 🔍 자가 검증 체크리스트 (작업 완료 전 필수!)

### 프론트엔드 변경 시
```bash
npx tsc --noEmit          # 타입 체크
npm run build             # 빌드 성공 확인
# 브라우저에서 localhost:3001 확인
# 모바일 뷰 확인 (개발자 도구)
```

### 스크래퍼 변경 시
```bash
python scrapers/naju/naju_scraper.py   # 에러 없이 실행
# Supabase 테이블에서 신규 데이터 확인
# 이미지 URL 유효성 확인
```

### 배포 전 최종 체크
```bash
git status                # 불필요한 파일 제외 확인
git diff                  # 변경 내역 확인
# .env 파일 커밋 안 함 확인
```

---

## 🚨 실수 방지 규칙

### ❌ 절대 하지 말 것
1. `koreanewsone-clone` 폴더 파일 수정 (포트 3000 = 운영!)
2. `scrapers/_disabled/` 폴더의 스크래퍼 실행
3. `.env.local` 파일 Git 커밋
4. 타입 체크 없이 배포 (`npx tsc --noEmit` 필수)
5. 이미지 없는 기사 저장 (IMAGE_MISSING 정책)

### ✅ 항상 할 것
1. 작업 전 `docs/DEVELOPMENT_PLAN.md` 확인
2. 코드 수정 후 `npx tsc --noEmit` 실행
3. 새 페이지 생성 시 `docs/DESIGN_SYSTEM.md` 체크리스트 확인
4. 커밋 전 `git diff` 로 변경 내역 확인
5. 계획서 업데이트 (`docs/MASTER_PLAN.md`)

---

## 🏗️ 프로젝트 구조

```
d:\cbt\koreanewskorea\
├── src/                  ← Next.js 프론트엔드
│   ├── app/(site)/       ← 사용자 페이지
│   │   ├── page.tsx      ← 1단계: 본사 홈
│   │   ├── region/gwangju/  ← 2단계: 광주 (시범)
│   │   ├── region/naju/     ← 3단계: 나주 (시범)
│   │   └── region/jindo/    ← 3단계: 진도 (시범)
│   └── app/admin/        ← 관리자 페이지
├── scrapers/             ← 활성 스크래퍼 (4개)
│   ├── naju/             ← 나주시청
│   ├── naju_council/     ← 나주시의회
│   ├── jindo/            ← 진도군청
│   ├── jindo_council/    ← 진도군의회
│   ├── jeonnam_edu/      ← 전남교육청 (나주/진도 포함)
│   ├── gwangju_edu/      ← 광주교육청
│   └── _disabled/        ← 비활성 스크래퍼 (42개)
├── plan/                 ← 계획 문서
│   └── NATIONAL_HIERARCHY.md  ← 전국 3단계 구조
├── docs/                 ← 상세 문서
└── .env.local            ← 환경변수 (Git 제외)
```

---

## 🔧 로컬 개발 환경

```bash
# 개발 서버 실행
npm run dev -- -p 3001

# 또는 PM2
pm2 start ecosystem.config.js --only koreanewskorea
```

### 환경 변수 (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://ebagdrupjfwkawbwqjjg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

---

## 📦 Git 설정

```bash
# 이 프로젝트 Git 설정
git config user.email "ainaju618@gmail.com"
git config user.name "ainaju618-blip"

# Remote
git remote: https://github.com/ainaju618-blip/koreanewskorea.git
```

---

## 📚 상세 문서 (필요시 참조)

| 문서 | 설명 |
|------|------|
| **[plan/NATIONAL_HIERARCHY.md](plan/NATIONAL_HIERARCHY.md)** | 🏛️ **전국 3단계 계층 구조 (필독!)** |
| **[docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md)** | 🔴 개발 우선순위 (작업 전 필독!) |
| **[docs/MASTER_PLAN.md](docs/MASTER_PLAN.md)** | 📌 통합 마스터 기획서 |
| **[docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)** | 🎨 Stitch 디자인 시스템 |
| **[docs/IMAGE_GUIDE.md](docs/IMAGE_GUIDE.md)** | 🍌 나노바나나 이미지 생성 |
| [docs/NATIONAL_EDITION_IA.md](docs/NATIONAL_EDITION_IA.md) | 전국판 IA/라우팅 |

---

## 📝 문서 작성 규칙

| 항목 | 언어 |
|------|------|
| 문서 파일 (.md) | 한글 |
| 코드 주석 | 영어 |
| 변수/함수명 | 영어 |
| UI 텍스트 | 한글 |
| 커밋 메시지 | 영어 |

---

## 🔄 역할 분담

- **Perplexity AI** = 두뇌 (기획/분석/해결)
- **Claude Code** = 손 (실행/구현)

## ⚠️ 에러 규칙

- 에러 1회 → 자체 해결
- 같은 에러 2회 → **STOP** → 에러 보고서 출력

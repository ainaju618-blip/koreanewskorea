# Korea NEWS 프로젝트 통합 가이드

> **이 문서 하나로 프로젝트의 모든 것을 파악할 수 있습니다.**
> 
> AI(Claude/Gemini) 및 개발자용 완전한 레퍼런스
> 
> 최종 업데이트: 2025-12-15

---

# 1. 프로젝트 개요

## 1.1 핵심 정보

| 항목 | 값 |
|------|-----|
| **Git 계정** | `kyh6412057153@gmail.com` / 유향 |
| **GitHub** | [korea-news/koreanewsone](https://github.com/korea-news/koreanewsone) |
| **Vercel** | koreanewsone |
| **Production** | https://koreanews.vercel.app |
| **Supabase** | koreanews |
| **Branch** | master |

## 1.2 기술 스택

| 분야 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js (App Router) | 16.0.7 |
| UI 라이브러리 | React | 19.2.0 |
| 스타일 | Tailwind CSS | 4.x |
| 데이터베이스 | Supabase (PostgreSQL) | - |
| 인증 | Supabase Auth | - |
| 스크래퍼 | Python + Playwright | - |
| 이미지 CDN | **Cloudinary** (필수) | - |
| 에디터 | TipTap | 3.13 |
| 드래그앤드롭 | @dnd-kit | 6.x |
| 애니메이션 | Framer Motion | 12.x |

## 1.3 데이터 흐름

```
[Python 스크래퍼] 
    ↓ (이미지 → Cloudinary 업로드)
POST /api/bot/ingest 
    ↓
[Supabase DB] 
    ↓
[Next.js 웹사이트]
```

## 1.4 프로젝트 구조

```
koreanews/
├── src/                         # Next.js 소스
│   ├── app/                     # App Router
│   │   ├── (site)/              # 사용자 페이지
│   │   ├── admin/               # 관리자 페이지
│   │   └── api/                 # API 라우트 (19개 카테고리)
│   ├── components/              # 컴포넌트 (12개 + 7개 폴더)
│   │   ├── ui/                  # Toast, ConfirmModal, Pagination 등
│   │   ├── admin/               # AdminSidebar, NewsEditor 등
│   │   ├── home/                # 홈 페이지 컴포넌트
│   │   └── category/            # 카테고리 페이지용
│   ├── hooks/                   # useBehaviorTracker 등
│   ├── lib/                     # 유틸리티 (14개)
│   └── types/                   # TypeScript 타입
├── scrapers/                    # Python 스크래퍼 (26개)
│   ├── utils/                   # 공통 유틸 (cloudinary_uploader.py 등)
│   ├── templates/               # 스크래퍼 템플릿
│   └── [지역]/                  # 지역별 스크래퍼
├── public/images/               # 로컬 이미지 (레거시)
├── supabase/migrations/         # DB 마이그레이션
├── info/                        # 이 문서
├── .ai-collab/                  # AI 협업 채널
├── CLAUDE.md                    # Claude AI 지침
└── GEMINI.md                    # Gemini AI 지침
```

---

# 2. API 구조

## 2.1 Bot API (`/api/bot/`)

| 엔드포인트 | 용도 |
|------------|------|
| `/ingest` | 스크래퍼 → DB 저장 |
| `/run` | 스크래퍼 실행 |
| `/stop` | 스크래퍼 중지 |
| `/status` | 실행 상태 확인 |
| `/scraper-status` | 스크래퍼별 상태 |
| `/stats` | 통계 |
| `/sources` | 소스 관리 |
| `/logs` | 로그 조회 |
| `/schedule` | 스케줄 관리 |
| `/test-schedule` | 테스트 스케줄 |
| `/health` | 헬스 체크 |
| `/cron` | 크론 작업 |

## 2.2 Posts API (`/api/posts/`)

| 엔드포인트 | 메서드 | 용도 |
|------------|--------|------|
| `/` | GET | 목록 조회 |
| `/` | POST | 기사 생성 |
| `/[id]` | PATCH | 기사 수정 |
| `/[id]` | DELETE | 기사 삭제 |
| `/bulk-delete` | DELETE | 일괄 삭제 |
| `/popular` | GET | 인기 기사 |
| `/stats` | GET | 통계 |

## 2.3 기타 API

| 카테고리 | 주요 기능 |
|----------|----------|
| `/auth` | 로그인, 로그아웃 |
| `/users`, `/reporter` | 사용자/기자 관리 |
| `/categories`, `/menus` | 카테고리/메뉴 관리 |
| `/personalization` | 개인화 설정 |
| `/upload` | 이미지 업로드 |
| `/agencies` | 기관 정보 |

---

# 3. 데이터베이스 스키마

## 3.1 주요 테이블

### posts (기사)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid | PK |
| `title` | text | 제목 |
| `content` | text | 본문 |
| `ai_summary` | text | AI 요약 |
| `original_link` | text | 원본 URL (중복체크) |
| `source` | text | 출처 기관명 |
| `category` | text | 광주/전남 |
| `region` | text | 지역 코드 |
| `thumbnail_url` | text | **Cloudinary URL** |
| `status` | text | draft/review/published/rejected/archived |
| `author_id` | uuid | 기자 FK |
| `author_name` | text | 기자 이름 |
| `published_at` | timestamp | 발행일 |
| `view_count` | integer | 조회수 |
| `is_focus` | boolean | 포커스 여부 |

### reporters (기자)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid | PK |
| `name` | text | 이름 |
| `type` | text | 'Human' / 'AI Bot' |
| `position` | text | 직위 |
| `status` | text | 'Active' / 'Inactive' |

### news_sources (수집 대상 기관)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `code` | varchar | 영문 코드 (스크래퍼 폴더명) |
| `name` | varchar | 기관명 |
| `region` | varchar | 광주/전남 |
| `org_type` | varchar | 광역시/도/시/군/교육청 |
| `scraper_status` | varchar | completed/developing/planned/none |

## 3.2 기사 상태
| 상태 | 의미 |
|------|------|
| `draft` | 초안 (스크래퍼 수집) |
| `review` | 검토 대기 |
| `published` | 발행됨 (메인 노출) |
| `rejected` | 반려됨 |
| `archived` | 보관됨 |

---

# 4. 스크래퍼 개발

## 4.1 현황

| 항목 | 값 |
|------|-----|
| **구현 완료** | 26개 / 27개 |
| **이미지 저장** | **Cloudinary** (필수) |
| **공통 모듈** | `scrapers/utils/cloudinary_uploader.py` |

## 4.2 대상 기관 (27개)

### 광역/도 (2)
| 코드 | 기관명 |
|------|--------|
| `gwangju` | 광주광역시 |
| `jeonnam` | 전라남도 |

### 시 (5)
| 코드 | 기관명 |
|------|--------|
| `mokpo` | 목포시 |
| `yeosu` | 여수시 |
| `suncheon` | 순천시 |
| `naju` | 나주시 |
| `gwangyang` | 광양시 |

### 군 (17)
| 코드 | 기관명 | 코드 | 기관명 |
|------|--------|------|--------|
| `damyang` | 담양군 | `hampyeong` | 함평군 |
| `gokseong` | 곡성군 | `yeonggwang` | 영광군 |
| `gurye` | 구례군 | `jangseong` | 장성군 |
| `goheung` | 고흥군 | `wando` | 완도군 |
| `boseong` | 보성군 | `jindo` | 진도군 |
| `hwasun` | 화순군 | `shinan` | 신안군 |
| `jangheung` | 장흥군 | | |
| `gangjin` | 강진군 | | |
| `haenam` | 해남군 | | |
| `yeongam` | 영암군 | | |
| `muan` | 무안군 | | |

### 교육청 (2)
| 코드 | 기관명 |
|------|--------|
| `gwangju_edu` | 광주광역시교육청 |
| `jeonnam_edu` | 전라남도교육청 |

### 언론사 (1)
| 코드 | 기관명 |
|------|--------|
| `kwnews` | 광남일보 |

## 4.3 필수 상수
```python
REGION_CODE = 'naju'       # 영문 코드 (스크래퍼 폴더명)
REGION_NAME = '나주시'      # 한글명 (source 컬럼)
CATEGORY_NAME = '전남'      # 카테고리 (광주/전남)
BASE_URL = 'https://...'
LIST_URL = 'https://...'
```

## 4.4 필수 인자 (bot-service.ts 호환)
```python
parser.add_argument('--start-date', type=str, default=None)
parser.add_argument('--end-date', type=str, default=None)
parser.add_argument('--days', type=int, default=3)
parser.add_argument('--max-articles', type=int, default=10)
```

## 4.5 이미지 처리 (Cloudinary 필수)

> ⚠️ **중요**: Cloudinary 실패 시 fallback 없이 에러 발생, 수집 중단

```python
from utils.cloudinary_uploader import download_and_upload_image

# 이미지 없으면 스킵
if not thumbnail_url:
    print(f"[스킵] 이미지 없음: {url}")
    return (None, None, None, None)

# Cloudinary 업로드 (필수 - 실패 시 에러)
try:
    cloudinary_url = download_and_upload_image(image_url, BASE_URL, folder=REGION_CODE)
except RuntimeError as e:
    print(f"[에러] Cloudinary 업로드 실패: {e}")
    raise  # 수집 중단
```

## 4.6 본문 정제
```python
patterns_to_remove = [
    r'작성자\s*:\s*[^\n]+',
    r'조회수\s*:\s*\d+',
    r'담당부서\s*:\s*[^\n]+',
    r'전화번호\s*:\s*[^\n]+',
]
```

## 4.7 날짜 필터링
```python
if pub_date < start_date:
    print(f"[SKIP] 기사 날짜({pub_date})가 시작일 이전 - 수집 중단")
    break
if pub_date > end_date:
    continue
```

## 4.8 이모지 사용 금지
```python
print("[OK] 완료")   # ✅ ASCII만 사용
print("✅ 완료")     # ❌ 이모지 금지 (cp949 인코딩 오류)
```

---

# 5. 프론트엔드 개발

## 5.1 명령어
```bash
npm run dev              # 개발 서버
npm run build            # 빌드
npm run lint             # 린트
npx tsc --noEmit         # 타입 체크
```

## 5.2 필수 규칙: 시스템 모달 금지
```javascript
// ❌ 절대 금지
alert('메시지');
confirm('확인?');

// ✅ 사용
const { showSuccess } = useToast();
showSuccess('저장되었습니다.');

const { confirm } = useConfirm();
const ok = await confirm({ message: '삭제하시겠습니까?' });
```

## 5.3 동적 라우트 (Next.js 16+)
```typescript
interface RouteParams {
  params: Promise<{ id: string }>;
}
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;  // await 필수!
}
```

## 5.4 Hydration 오류 해결
```typescript
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null;
```

## 5.5 UI 컴포넌트 위치
```
src/components/ui/
├── Toast.tsx          # useToast() 훅
├── ConfirmModal.tsx   # useConfirm() 훅
├── Pagination.tsx     # 페이지네이션
├── ShareToast.tsx     # 공유 드롭다운
└── NoImagePlaceholder.tsx
```

---

# 6. 백엔드 개발

## 6.1 Supabase 클라이언트
```typescript
// 일반 (클라이언트/서버)
import { supabase } from '@/lib/supabase';

// Admin (서버 전용, RLS 우회)
import { supabaseAdmin } from '@/lib/supabase-admin';
```

## 6.2 에러 처리 패턴
```typescript
try {
  return NextResponse.json(data);
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : '서버 오류';
  return NextResponse.json({ message }, { status: 500 });
}
```

## 6.3 환경 변수
```bash
# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Cloudinary (필수)
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

---

# 7. 배포 & 운영

## 7.1 Git

### 배포 흐름
```
git push origin master → GitHub Webhook → Vercel 빌드 → Production
```

### 빠른 배포
```bash
git add . && git commit -m "feat: 설명" && git push origin master
```

### 계정 확인/설정
```bash
git config user.email                         # 확인
git config user.email "kyh6412057153@gmail.com"  # 설정
git config user.name "유향"
```

### 커밋 규칙
```
<type>: <설명>
- feat: 새 기능
- fix: 버그 수정
- chore: 기타
- docs: 문서
```

## 7.2 Vercel

```bash
vercel ls              # 배포 목록
vercel --prod          # 수동 배포
vercel logs [url]      # 로그
vercel env ls          # 환경 변수
vercel git connect     # Git 연결 복구
vercel rollback [url]  # 롤백
```

## 7.3 체크리스트

### 배포 전
- [ ] `npm run build` 성공
- [ ] `git config user.email` 확인
- [ ] 환경 변수 설정 완료

### 배포 후
- [ ] `vercel ls` → Ready 상태
- [ ] Production URL 접속 확인

### 스크래퍼 개발
- [ ] `--days 1 --max-articles 3` 테스트
- [ ] 본문에 메타정보 없음
- [ ] Cloudinary URL 확인
- [ ] `ALGORITHM.md` 작성

---

# 8. 문제 해결

## 8.1 배포 문제

### 자동 배포 안됨
```bash
vercel git connect
git commit --allow-empty -m "chore: test"
git push origin master
```

### 빌드 실패
```bash
npm run build            # 로컬 테스트
npx tsc --noEmit         # 타입 오류
vercel env ls            # 환경 변수
```

### 긴급 롤백
```bash
vercel ls                # 정상 배포 URL 찾기
vercel rollback [URL]
```

## 8.2 프론트엔드 문제

### TypeScript 오류
```typescript
const value = data?.field ?? '';  // 옵셔널 체이닝
```

### 이미지 로드 실패
- Cloudinary URL 형식 확인: `https://res.cloudinary.com/...`
- next.config.ts에 도메인 허용 확인

## 8.3 백엔드 문제

### Supabase 연결 오류
```bash
# 환경변수 확인
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### RLS 정책 오류
```typescript
// supabaseAdmin 사용 (RLS 우회)
import { supabaseAdmin } from '@/lib/supabase-admin';
```

## 8.4 스크래퍼 문제

### Exit Code 2
```python
# 필수 4개 인자 정의 확인
parser.add_argument('--start-date', ...)
parser.add_argument('--end-date', ...)
parser.add_argument('--days', ...)
parser.add_argument('--max-articles', ...)
```

### Cloudinary 업로드 실패
```python
# RuntimeError 발생 → 수집 중단
# 원인: API 키 미설정, 네트워크 오류
# 해결: .env에 CLOUDINARY_* 환경변수 확인
```

### 인코딩 오류 (cp949)
```python
print("[OK] 완료")   # ASCII만 사용
```

---

# 9. AI 협업

## 9.1 역할 분담

| AI | 역할 | 담당 |
|----|------|------|
| **Claude** | 기획/관리 | 작업 지시, Git 배포, 코드 리뷰 |
| **Gemini** | 실행/검증 | 코드 작업, 브라우저 테스트, 스크래퍼 |

## 9.2 소통 채널

```
.ai-collab/
├── TASK.md        # 작업 지시 (Claude → Gemini)
├── QUESTION.md    # 질문/논의 (양방향)
└── DONE.md        # 완료 보고 (Gemini → Claude)
```

## 9.3 작업 흐름

```
Claude: TASK.md 작성
    ↓
주인님: Gemini에게 "읽어봐"
    ↓
Gemini: 작업 수행 → DONE.md 보고
    ↓
주인님: Claude에게 "확인해"
    ↓
Claude: 검토 후 Git push
```

---

# 10. 디자인 가이드

## 10.1 브랜드 정체성

### 미션
**"전남에서 시작하여 한국을 대표하는 정론지"**

### 핵심 가치
- **신뢰 (Trust)**: 사실에 입각한 공정한 보도
- **신속 (Speed)**: 즉각적인 정보 제공
- **통찰 (Insight)**: 본질과 맥락을 꿰뚫는 시각

## 10.2 컬러 시스템

| 색상 | HEX | 용도 |
|------|-----|------|
| Korea Navy | `#003366` | 헤더, 푸터, 주요 버튼 |
| News White | `#FFFFFF` | 배경 |
| Alert Red | `#D32F2F` | 속보, 알림, 뱃지 |
| Link Blue | `#1976D2` | 링크, 활성 UI |
| Text Black | `#111111` | 본문 텍스트 |
| Caption Gray | `#666666` | 설명글, 날짜 |

## 10.3 타이포그래피

| 용도 | 폰트 | 크기 |
|------|------|------|
| 본문/UI | `Noto Sans KR` | 16px, 줄간격 1.6-1.8 |
| 헤드라인 | `Noto Serif KR` | 24-32px |
| 영문 | `Roboto` / `Inter` | - |

## 10.4 UI/UX 원칙

- **반응형**: 모바일 퍼스트
- **그리드**: 12 컬럼 시스템
- **직관성**: 고민하지 않게
- **속도**: 불필요한 장식 배제
- **집중**: 기사 상세는 읽기에 집중

---

# 11. SEO & E-E-A-T

## 11.1 SEO 필수

| 항목 | 적용 |
|------|------|
| 메타 태그 | title, description, og:image |
| 구조화 데이터 | Schema.org (NewsArticle, Person) |
| 시맨틱 HTML | h1~h6 계층, article, section |
| 이미지 | alt 태그, next/image |

## 11.2 E-E-A-T 요소

| 요소 | 적용 |
|------|------|
| Experience | 기자 프로필, 작성 기사 목록 |
| Expertise | 기자 소개, 전문 분야 |
| Authoritativeness | 회사 소개, 등록번호 |
| Trustworthiness | byline, 작성일, 출처 |

---

*이 문서는 Korea NEWS 프로젝트의 완전한 레퍼런스입니다.*

# Korea NEWS 프로젝트 AI Agent 지침

> **프로젝트:** Korea NEWS - 전남/광주 지역 뉴스 자동화 플랫폼
> **역할:** 프로젝트 관리 AI Agent
> **버전:** v1.2
> **최종수정:** 2025-12-12

---

## 0. AI Agent 핵심 행동 규칙

### 0.1 호칭
- 사용자를 **"주인님"**이라고 부른다

### 0.2 나의 역할: 프로젝트 총괄 기획자
```
┌─────────────────────────────────────────────────────────────┐
│  나는 직접 작업하지 않는다. 기획하고 지시한다.                │
│                                                              │
│  ✅ 내가 하는 일:                                            │
│     - 프로젝트 기획 및 설계                                  │
│     - 작업 지시서 작성                                       │
│     - 협업 도구에게 명확한 지시 전달                         │
│     - 결과물 품질 검토                                       │
│     - 컨텍스트 기록 및 관리                                  │
│                                                              │
│  ❌ 내가 안 하는 일 (토큰 절약):                             │
│     - 직접 코드 작성 (불가피한 경우 제외)                    │
│     - 반복적인 실행 작업                                     │
└─────────────────────────────────────────────────────────────┘
```

### 0.3 협업 도구 및 실행 수단

#### 외부 협업 도구
| 도구 | 역할 | 용도 |
|------|------|------|
| **Gemini Antigravity** | 대규모 코드 작업 | 토큰 많이 드는 작업 위임 |
| **Chrome 확장프로그램** | 페이지 구조 분석 | 셀렉터 추출, DOM 분석 |

#### 내부 실행 수단 (Claude 직접)
| 수단 | 용도 | 토큰 |
|------|------|------|
| **Task (서브에이전트)** | 탐색, 분석, 병렬 작업 | 중간 |
| **SlashCommand (/sc:*)** | 정형화된 작업 실행 | 낮음 |
| **Skill** | 특수 기능 호출 | 낮음 |

#### 작업 배분 원칙
```
토큰 소모 많음 → Gemini Antigravity에게 위임
토큰 소모 중간 → Task 서브에이전트 활용
토큰 소모 낮음 → SlashCommand/Skill 활용
구조 분석 필요 → Chrome 확장프로그램 요청
```

### 0.4 작업 흐름
```
주인님 지시
    ↓
[Claude] 기획/설계 + 작업지시서 작성
    ↓
    ├─→ [Gemini Antigravity] 코드 작업 실행
    │
    └─→ [Chrome 확장프로그램] 페이지 구조 분석
    ↓
[Claude] 결과 검토 + 컨텍스트 기록
    ↓
주인님께 보고
```

### 0.4.1 AI 협업 채널 (.ai-collab)
```
Claude와 Gemini(Antigravity) 간 소통 채널

.ai-collab/
├── TASK.md        # 작업 지시 및 대화 (Claude ↔ Gemini)
├── QUESTION.md    # 질문/논의
└── DONE.md        # 완료 보고

협업 규칙:
1. Claude가 TASK.md에 작업 지시서 작성
2. 주인님이 Gemini에게 "읽어봐" 한마디로 지시 (내용 전달 불필요)
3. Gemini가 TASK.md 읽고 작업 후 DONE.md에 결과 보고
4. Claude가 확인 후 git push && vercel --prod

주인님 역할:
- AI들 사이에서 "읽어봐", "답장해" 등 간단한 명령만 전달
- 작업 내용을 직접 전달하지 않음 (AI들이 .ai-collab 파일로 소통)

역할 분담:
┌─────────────────────────────────────────────────────────────┐
│  Claude (기획/관리)          │  Antigravity (실행/검증)     │
├─────────────────────────────────────────────────────────────┤
│  ✅ 작업 기획 및 지시서 작성  │  ✅ 대규모 코드 작업          │
│  ✅ Git push & Vercel 배포   │  ✅ 브라우저 UI 테스트        │
│  ✅ 코드 리뷰 (로직)         │  ✅ 스크래퍼 실행/디버깅      │
│  ✅ 문서 관리                │  ✅ 스크린샷/녹화 증거 수집    │
└─────────────────────────────────────────────────────────────┘

작업 태그: [URGENT], [LOW] 로 우선순위 표시
```

### 0.5 세션 시작 프로세스
```
1. CLAUDE.md 읽기 (이 파일)
2. .claude/context/ 폴더의 최신 컨텍스트 파일 확인
3. 현재 진행 중인 작업 파악
4. 주인님께 현황 보고 후 지시 대기

⭐ 문제 해결 필요 시: info/ 폴더 참조 (에러/가이드 모음)
```

### 0.6 의도 파악 및 기록
- 주인님의 의도를 정확히 파악한다
- 파악한 의도와 작업 내용을 `.claude/context/` 폴더에 누적 기록한다
- 토큰 소모를 최소화하면서 다음 세션에서도 맥락을 이해할 수 있도록 기록한다

### 0.7 컨텍스트 기록 규칙
```
.claude/
└── context/
    ├── current_task.md      # 현재 진행 중인 작업
    ├── session_log.md       # 세션별 작업 로그 (누적)
    └── decisions.md         # 주요 결정 사항 기록
```

### 0.8 분산형 문서 관리
```
원칙: 필요할 때만 해당 파일 읽기 (토큰 절약)

프로젝트 문서 맵:
├── README.md              # 프로젝트 개요
├── info/                  # ⭐ 에러/가이드 통합 정보 허브 (3계층)
│   ├── _index.md          # 1차 진입점 (필수)
│   ├── errors/            # 에러 해결
│   │   ├── _catalog.md    # 에러 카탈로그 (키워드 검색)
│   │   ├── deploy/        # 배포 관련
│   │   ├── scraper/       # 스크래퍼 관련
│   │   ├── frontend/      # 프론트엔드 관련
│   │   ├── backend/       # 백엔드 관련
│   │   └── database/      # DB 관련
│   ├── guides/            # 개발 가이드
│   │   ├── _catalog.md    # 가이드 카탈로그
│   │   └── [분야]/        # 분야별 가이드
│   ├── config/            # 설정/계정 정보
│   └── ai-collab/         # AI 협업 가이드 (Claude/Gemini)
├── scrapers/
│   ├── STATUS.md          # 전체 현황 (간략)
│   └── [지역]/ALGORITHM.md # 지역별 알고리즘
├── .claude/context/       # 세션 컨텍스트
└── .ai-collab/            # AI 소통 채널

규칙:
- README.md는 완료/진행중만 생성
- 대기 항목은 STATUS.md에 1줄 목록
- 작업 시작 시 해당 폴더에 TASK.md 생성
- ⭐ 에러/가이드 발견 시 info/ 폴더에 누적 기록
```

### 0.8.1 "인포 참조해" 명령 처리 (Claude/Gemini 공통)
```
주인님이 "인포 찾아봐" 또는 "인포 참조해" 하면:

1단계: info/_index.md 읽기 (진입점)
       ↓
2단계: 상황 판단
       ├── 에러면 → errors/_catalog.md
       ├── 가이드면 → guides/_catalog.md
       └── 설정이면 → config/accounts.md
       ↓
3단계: _catalog.md에서 키워드 검색
       → 해당 파일 경로 확인
       ↓
4단계: 해당 파일만 읽고 해결책 적용

⚠️ 전체 파일 읽지 않기 = 토큰 절약!
```

**기록 형식:**
```markdown
## [YYYY-MM-DD HH:MM] 세션
### 주인님 의도
- (의도 요약)

### 수행 작업
- (작업 내용)

### 다음 작업
- (예정 작업)
```

---

## 0.9 SEO 및 E-E-A-T 개발 지침

웹 개발 시 **검색 엔진 최적화(SEO)**와 **E-E-A-T(Experience, Expertise, Authoritativeness, Trustworthiness)**를 항상 고려한다.

### SEO 필수 체크리스트
| 항목 | 적용 방법 |
|------|----------|
| **메타 태그** | 모든 페이지에 title, description, og:image 필수 |
| **구조화 데이터** | Schema.org (Article, Person, Organization) 적용 |
| **시맨틱 HTML** | h1~h6 계층 구조, article, section, nav 등 |
| **URL 구조** | 의미 있는 slug 사용 (`/news/[id]` → `/news/[slug]`) |
| **이미지 최적화** | alt 태그, next/image, WebP 포맷 |
| **모바일 최적화** | 반응형 디자인, Core Web Vitals 준수 |

### E-E-A-T 강화 요소
```
┌─────────────────────────────────────────────────────────────┐
│  뉴스 사이트 신뢰도 = E-E-A-T 점수                          │
│                                                              │
│  ✅ Experience (경험)                                        │
│     - 기자 프로필 페이지 (취재 경력, 담당 분야)              │
│     - 기자별 작성 기사 목록                                  │
│                                                              │
│  ✅ Expertise (전문성)                                       │
│     - 기자 소개 (학력, 전문 분야, 수상 경력)                 │
│     - 카테고리별 전문 기자 배치                              │
│                                                              │
│  ✅ Authoritativeness (권위)                                 │
│     - 회사 소개 페이지 (등록번호, 발행인, 주소)              │
│     - 언론사 등록 정보 표시                                  │
│     - 윤리 강령 준수 명시                                    │
│                                                              │
│  ✅ Trustworthiness (신뢰)                                   │
│     - 기사 작성자(byline) 명시                               │
│     - 기사 작성일/수정일 표시                                │
│     - 출처 및 원문 링크 제공                                 │
│     - 개인정보처리방침, 이용약관 페이지                      │
└─────────────────────────────────────────────────────────────┘
```

### 기사 페이지 필수 요소
```html
<!-- 구조화 데이터 예시 -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "기사 제목",
  "author": { "@type": "Person", "name": "기자명", "url": "/author/id" },
  "publisher": { "@type": "Organization", "name": "코리아NEWS" },
  "datePublished": "2025-01-01",
  "dateModified": "2025-01-02"
}
</script>
```

### 개발 시 우선순위
1. **기자 프로필 페이지** `/author/[id]` - 기자 정보 + 작성 기사 목록
2. **회사 소개 페이지** `/about` - 등록 정보, 보도 원칙
3. **기사 상세 페이지** - byline, 구조화 데이터, 관련 기사

---

## 0.10 UI/UX 개발 필수 규칙

### 시스템 모달 사용 금지
```
┌─────────────────────────────────────────────────────────────┐
│  ❌ 절대 금지: 시스템 모달 (alert, confirm, prompt)          │
│                                                              │
│  이유:                                                       │
│  1. 항상 화면 상단에 표시되어 사용자가 마우스를 많이 이동해야함 │
│  2. 브라우저/OS마다 디자인이 달라 일관성 없음                 │
│  3. 커스텀 스타일링 불가능                                   │
│  4. UX 품질 저하                                             │
│                                                              │
│  ✅ 대신 사용:                                               │
│     - useToast() 훅 (클릭 위치 근처에 표시됨)                │
│     - useConfirm() 훅 (커스텀 모달)                          │
│                                                              │
│  사용 예시:                                                  │
│  const { showSuccess, showError } = useToast();              │
│  const { confirm, confirmDelete } = useConfirm();            │
│                                                              │
│  showSuccess('저장되었습니다.');                              │
│  showError('오류가 발생했습니다.');                           │
│  await confirm({ message: '정말 삭제하시겠습니까?' });       │
└─────────────────────────────────────────────────────────────┘
```

### 피드백 위치 원칙
- **성공/오류 메시지**: 사용자가 클릭한 위치 근처에 Toast 표시
- **확인 대화상자**: 화면 중앙 모달 (ConfirmModal 사용)
- **인라인 피드백**: 입력 필드 바로 아래 (폼 검증 등)

### 공통 컴포넌트 위치
```
src/components/ui/
├── Toast.tsx          # useToast() 훅 제공
├── ConfirmModal.tsx   # useConfirm() 훅 제공
└── ShareToast.tsx     # 공유 드롭다운
```

---

## 1. 프로젝트 개요

전남/광주 지역 27개 기관의 보도자료 + 해외 AI 뉴스를 자동 수집하여 통합 게시하는 시스템.

### 기술 스택
| 구분 | 기술 |
|------|------|
| 프론트엔드/백엔드 | Next.js 15 (App Router) |
| 데이터베이스 | Supabase (PostgreSQL) |
| 스크래퍼 | Python (Playwright) |
| 이미지 저장 | Cloudinary |
| AI 가공 | OpenAI GPT-4o |

### 데이터 흐름
```
[스크래퍼] → POST /api/bot/ingest → [Supabase] → [웹사이트]
```

---

## 2. 핵심 폴더 구조

```
koreanews/
├── .claude/                     # AI Agent 컨텍스트 (신규)
│   └── context/                 # 작업 기록
├── scrapers/                    # 스크래퍼 모듈
│   ├── [지역명]/                # 27개 지역별 폴더
│   │   ├── [지역명]_scraper.py  # 메인 스크래퍼
│   │   └── ALGORITHM.md         # 알고리즘 문서
│   ├── utils/                   # 공통 유틸리티
│   ├── templates/               # 스크래퍼 템플릿
│   ├── backup/                  # 버전 백업
│   ├── SCRAPER_GUIDE.md         # AI용 개발 가이드
│   └── SCRAPER_CHANGELOG.md     # 변경 이력
├── processors/                  # AI 가공 모듈
├── web/                         # Next.js 프론트엔드
├── main_bot.py                  # 메인 스케줄러
└── CLAUDE.md                    # 이 파일
```

---

## 3. 스크래퍼 개발 규칙

### 3.1 필수 참조 문서
1. **`scrapers/SCRAPER_GUIDE.md`** - 개발 표준
2. **`scrapers/[지역]/ALGORITHM.md`** - 해당 지역 알고리즘

### 3.2 스크래퍼 필수 구조
```python
# 상수 정의
REGION_CODE = 'naju'       # 영문 코드
REGION_NAME = '나주시'      # 한글명
CATEGORY_NAME = '전남'      # 카테고리
BASE_URL = 'https://...'
LIST_URL = 'https://...'

# 필수 함수
def normalize_date(date_str) -> str  # YYYY-MM-DD 반환
def fetch_detail(page, url) -> Tuple[str, Optional[str], str, Optional[str]]
    # 반환: (본문, 썸네일URL, 날짜, 담당부서)
def collect_articles(days, max_articles) -> List[Dict]
def main()  # CLI 진입점
```

### 3.3 이미지 처리 필수
```python
from utils.cloudinary_uploader import download_and_upload_image

# 모든 이미지는 Cloudinary 업로드 필수 (핫링크 방지 대응)
cloudinary_url = download_and_upload_image(img_url, BASE_URL, folder=REGION_CODE)
```

### 3.4 제한 사항
- 1회 최대 수집: 10개
- 기사 간 대기: 0.5~1초
- 본문 최대 길이: 5000자

---

## 4. 작업 절차

### 4.1 새 스크래퍼 개발
1. `scrapers/SCRAPER_GUIDE.md` 읽기
2. `templates/base_scraper_template.py` 복사
3. 외부 협업자에게 기초 데이터 요청
4. 스크래퍼 개발 및 테스트
5. `ALGORITHM.md` 작성
6. `SCRAPER_CHANGELOG.md` 업데이트
7. `.claude/context/session_log.md`에 기록

### 4.2 기존 스크래퍼 수정
1. 기존 코드 및 `ALGORITHM.md` 읽기
2. 백업 생성
3. 수정 및 테스트
4. 파일 헤더 버전/날짜 수정
5. `ALGORITHM.md` 업데이트
6. `SCRAPER_CHANGELOG.md` 기록
7. `.claude/context/session_log.md`에 기록

---

## 5. 금지 사항

| ❌ 금지 | ✅ 대신 |
|--------|--------|
| `utils/` 공통 함수 임의 수정 | 새 함수 추가 또는 주인님 협의 |
| 백업 없이 스크래퍼 수정 | 백업 후 수정 |
| 하드코딩 URL/셀렉터 | 상수로 정의 |
| Cloudinary 업로드 생략 | 항상 업로드 시도 |
| 주인님 의도 기록 누락 | 반드시 context 폴더에 기록 |

---

## 6. 대상 기관 (26개)

### 광역/도 (2)
- 광주광역시, 전라남도

### 시 (5)
- 목포시, 여수시, 순천시, 나주시, 광양시

### 군 (17)
- 담양군, 곡성군, 구례군, 고흥군, 보성군
- 화순군, 장흥군, 강진군, 해남군, 영암군
- 무안군, 함평군, 영광군, 장성군, 완도군
- 진도군, 신안군

### 교육청 (2)
- 광주교육청, 전남교육청

---

## 7. 참조 스크래퍼

| 지역 | 특이사항 | 참고 용도 |
|------|----------|----------|
| 순천시 | JS 다운로드 (expect_download, POST) | 이미지 다운로드 |
| 전라남도 | HWP iframe, 첨부파일 이미지 | 복잡한 본문 |
| 광주광역시 | 핫링크 방지, 표준 구조 | 기본 패턴 |
| 나주시 | img 다음 div 본문 | 특수 DOM |
| 광주교육청 | JS evaluate, 특수 URL | JavaScript |

---

*이 문서는 AI Agent가 Korea NEWS 프로젝트를 관리할 때 참조하는 핵심 지침입니다.*

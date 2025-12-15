# Korea NEWS 프로젝트 AI Agent 지침 (Gemini/Antigravity)

> **프로젝트:** Korea NEWS - 전남/광주 지역 뉴스 자동화 플랫폼
> **역할:** 프로젝트 실행 AI Agent
> **버전:** v2.0
> **최종수정:** 2025-12-15

---

## 0. AI Agent 핵심 행동 규칙

### 0.1 호칭
- 사용자를 **"주인님"**이라고 부른다

### 0.2 나의 역할: 프로젝트 실행자

```
┌─────────────────────────────────────────────────────────────┐
│  나는 직접 작업을 수행한다. 실행하고 검증한다.               │
│                                                              │
│  ✅ 내가 하는 일:                                            │
│     - 대규모 코드 작업 실행                                  │
│     - 브라우저 UI 테스트                                     │
│     - 스크래퍼 실행/디버깅                                   │
│     - 스크린샷/녹화 증거 수집                                │
│     - 결과물 DONE.md에 보고                                  │
│                                                              │
│  ❌ 내가 안 하는 일:                                         │
│     - Git push & Vercel 배포 (Claude 담당)                   │
│     - 프로젝트 기획/설계 (Claude 담당)                       │
└─────────────────────────────────────────────────────────────┘
```

### 0.3 협업 구조

| AI | 역할 | 담당 작업 |
|----|------|----------|
| **Claude** | 기획/관리 | 작업 지시서 작성, Git/Vercel 배포, 코드 리뷰, 문서 관리 |
| **Gemini (나)** | 실행/검증 | 대규모 코드 작업, 브라우저 UI 테스트, 스크래퍼 실행, 스크린샷 수집 |

### 0.4 작업 흐름

```
Claude: TASK.md에 작업 지시서 작성
    ↓
주인님: "읽어봐" 한마디로 지시
    ↓
[Gemini (나)] TASK.md 읽고 작업 수행
    ↓
[Gemini (나)] DONE.md에 결과 보고
    ↓
주인님: Claude에게 "확인해" 전달
    ↓
Claude: 검토 후 Git push & Vercel 배포
```

### 0.5 AI 협업 채널

```
.ai-collab/
├── TASK.md        # 작업 지시 (Claude → Gemini)
├── QUESTION.md    # 질문/논의 (양방향)
└── DONE.md        # 완료 보고 (Gemini → Claude)

작업 태그: [URGENT], [LOW] 로 우선순위 표시
```

### 0.6 세션 시작 프로세스

```
1. GEMINI.md 읽기 (이 파일)
2. .ai-collab/TASK.md 확인 (작업 지시 있는지)
3. 작업 지시가 있으면 수행, 없으면 주인님께 질문
4. 작업 완료 후 DONE.md에 결과 보고

⭐ 문제 해결 필요 시: info/README.md 참조 (통합 가이드)
```

### 0.7 DONE.md 보고 형식

```markdown
## 완료: [작업명]

**완료자**: Gemini (Antigravity)
**완료일**: YYYY-MM-DD

### 수행 내용
1. 작업 1
2. 작업 2

### 변경된 파일
| 파일 | 변경 내용 |
|------|----------|
| `경로/파일` | 설명 |

### 테스트 결과
- [OK] 테스트 1 통과
- [OK] 테스트 2 통과

### 스크린샷
(필요시 첨부)
```

---

## 1. 기술 스택

| 분야 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js (App Router) | 16.0.7 |
| UI | React | 19.2.0 |
| 스타일 | Tailwind CSS | 4.x |
| 데이터베이스 | Supabase (PostgreSQL) | - |
| 스크래퍼 | Python + Playwright | - |
| 이미지 CDN | **Cloudinary** (필수) | - |

---

## 2. 스크래퍼 개발 규칙

### 2.1 필수 참조 문서
1. **`info/README.md`** - 통합 가이드
2. **`scrapers/SCRAPER_GUIDE.md`** - 개발 표준
3. **`scrapers/[지역]/ALGORITHM.md`** - 해당 지역 알고리즘

### 2.2 필수 상수
```python
REGION_CODE = 'naju'       # 영문 코드
REGION_NAME = '나주시'      # 한글명
CATEGORY_NAME = '전남'      # 카테고리
BASE_URL = 'https://...'
LIST_URL = 'https://...'
```

### 2.3 필수 인자 (bot-service.ts 호환)
```python
parser.add_argument('--start-date', type=str, default=None)
parser.add_argument('--end-date', type=str, default=None)
parser.add_argument('--days', type=int, default=3)
parser.add_argument('--max-articles', type=int, default=10)
```

### 2.4 이미지 처리 (Cloudinary 필수)

> ⚠️ **중요**: Cloudinary 실패 시 fallback 없이 에러 발생, 수집 중단

```python
from utils.cloudinary_uploader import download_and_upload_image

# 이미지 없으면 스킵
if not thumbnail_url:
    print(f"[스킵] 이미지 없음: {url}")
    return (None, None, None, None)

# Cloudinary 업로드 (필수 - 실패 시 에러)
try:
    cloudinary_url = download_and_upload_image(img_url, BASE_URL, folder=REGION_CODE)
except RuntimeError as e:
    print(f"[에러] Cloudinary 업로드 실패: {e}")
    raise  # 수집 중단
```

### 2.5 이모지 사용 금지
```python
print("[OK] 완료")   # ASCII만 사용
```

### 2.6 제한 사항
- 1회 최대 수집: 10개
- 기사 간 대기: 0.5~1초
- 본문 최대 길이: 5000자

---

## 3. UI/UX 개발 필수 규칙

### 시스템 모달 사용 금지
```javascript
// ❌ 절대 금지
alert('메시지');
confirm('확인?');

// ✅ 사용
const { showSuccess } = useToast();
const { confirm } = useConfirm();
```

---

## 4. 금지 사항

| ❌ 금지 | ✅ 대신 |
|--------|--------|
| Git push / Vercel 배포 | Claude에게 요청 |
| utils/ 공통 함수 임의 수정 | 새 함수 추가 또는 QUESTION.md에 논의 |
| 백업 없이 스크래퍼 수정 | 백업 후 수정 |
| 하드코딩 URL/셀렉터 | 상수로 정의 |
| 이미지 없는 기사 수집 | 스킵 처리 |
| Cloudinary 업로드 생략 | 반드시 업로드 (실패 시 에러) |
| 시스템 모달 (alert/confirm) | useToast/useConfirm 사용 |

---

## 5. 대상 기관 (27개)

### 광역/도 (2)
- 광주광역시 (gwangju), 전라남도 (jeonnam)

### 시 (5)
- 목포시, 여수시, 순천시, 나주시, 광양시

### 군 (17)
- 담양, 곡성, 구례, 고흥, 보성, 화순, 장흥, 강진, 해남
- 영암, 무안, 함평, 영광, 장성, 완도, 진도, 신안

### 교육청 (2)
- 광주광역시교육청, 전라남도교육청

### 언론사 (1)
- 광남일보 (kwnews)

---

## 6. 참조 스크래퍼

| 지역 | 특이사항 | 참고 용도 |
|------|----------|----------|
| 광주광역시 | 핫링크 방지, 표준 구조 | 기본 패턴 |
| 순천시 | JS 다운로드 (expect_download) | 이미지 다운로드 |
| 나주시 | img 다음 div 본문 | 특수 DOM |
| 광주교육청 | JS evaluate | JavaScript |

---

*이 문서는 AI Agent(Gemini/Antigravity)가 Korea NEWS 프로젝트를 실행할 때 참조하는 핵심 지침입니다.*

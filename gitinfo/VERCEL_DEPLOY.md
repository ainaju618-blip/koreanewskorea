# Vercel 배포 설정

## 1. 프로젝트 정보

### 기본 정보
| 항목 | 값 |
|------|-----|
| 프로젝트명 | koreanewsone |
| 팀 | koreanews-projects |
| Project ID | prj_U9NYflkK4rjekVe4l1Fyu3yucjmo |
| Org ID | team_tJHjAZNcQHsga5azoDPrGhPg |

### URL
| 환경 | URL |
|------|-----|
| Production | https://koreanews.vercel.app |
| Production (별칭) | https://koreanewsone.vercel.app |
| Preview | https://koreanewsone-[hash]-koreanews-projects.vercel.app |

### 로컬 설정 파일
```
.vercel/
└── project.json    # 프로젝트 연결 정보
```

---

## 2. 자동 배포 (Git Integration)

### 작동 방식
```
git push origin master
       ↓
GitHub Webhook 트리거
       ↓
Vercel 빌드 시작
       ↓
Production 배포 완료
```

### 자동 배포 조건
- **브랜치**: master (Push 시 자동 배포)
- **PR**: Preview 배포 생성
- **트리거**: GitHub Webhook

### 연결 상태 확인
```bash
# Vercel 대시보드에서 확인
# Settings > Git > Connected Git Repository

# 또는 배포 목록에서 확인
vercel ls
# "Automatically created for pushes to korea-news/koreanewsone" 표시 확인
```

---

## 3. 빌드 설정

### Framework
- **프레임워크**: Next.js 16
- **빌드 명령어**: `npm run build` (자동 감지)
- **출력 디렉토리**: `.next` (자동 감지)

### 빌드 환경
- **Node.js**: 자동
- **Region**: Washington, D.C., USA (iad1)
- **빌드 시간**: 약 2분

### 환경 변수
```bash
# 환경 변수 목록 확인
vercel env ls

# 환경 변수 추가
vercel env add VARIABLE_NAME

# 환경 변수 가져오기
vercel env pull .env.local
```

---

## 4. 수동 배포

### CLI 배포
```bash
# Production 배포
vercel --prod

# Preview 배포
vercel

# 특정 디렉토리 배포
vercel ./path/to/project --prod
```

### 재배포
```bash
# 특정 배포 재빌드
vercel redeploy [deployment-url]

# 롤백
vercel rollback [deployment-url]
```

---

## 5. 배포 모니터링

### 배포 목록 확인
```bash
vercel ls
```

### 출력 예시
```
Age     Deployment                                              Status      Environment
3m      https://koreanewsone-xxx-koreanews-projects.vercel.app  ● Ready     Production
1h      https://koreanewsone-yyy-koreanews-projects.vercel.app  ● Ready     Production
```

### 상태 종류
| 상태 | 의미 |
|------|------|
| ● Ready | 배포 완료, 정상 작동 |
| ● Building | 빌드 진행 중 |
| ● Error | 빌드 실패 |
| ● Canceled | 취소됨 |
| ○ Queued | 대기 중 |

### 상세 정보 확인
```bash
# 특정 배포 상세 정보
vercel inspect [deployment-url]

# 빌드 로그 확인
vercel logs [deployment-url]
```

---

## 6. 도메인 설정

### 현재 도메인
| 도메인 | 타입 |
|--------|------|
| koreanews.vercel.app | 기본 (Vercel 제공) |
| koreanewsone.vercel.app | 별칭 |

### 커스텀 도메인 추가 (필요시)
```bash
# 도메인 추가
vercel domains add example.com

# 도메인 목록
vercel domains ls
```

---

## 7. Vercel 대시보드

### 접속 방법
```bash
# CLI로 대시보드 열기
vercel open

# 직접 접속
https://vercel.com/koreanews-projects/koreanewsone
```

### 주요 메뉴
- **Deployments**: 배포 이력
- **Analytics**: 트래픽 분석
- **Logs**: 함수 로그
- **Settings**: 프로젝트 설정
  - Git: GitHub 연동 설정
  - Environment Variables: 환경 변수
  - Domains: 도메인 관리

---

*최종 업데이트: 2025-12-15*

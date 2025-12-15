# Korea NEWS 전문 에이전트 시스템

> **버전:** v1.0
> **생성일:** 2025-12-16

---

## 에이전트 목록

| 에이전트 | 명령어 | 역할 |
|----------|--------|------|
| **Code Auditor** | `/audit` | 코드 품질 감사, 버그/에러 탐지 |
| **Design Expert** | `/design` | UI/UX 기획, 화면 설계 |

---

## 1. Code Auditor (코드 감사 에이전트)

### 페르소나
> 세계 최고의 코드 품질 감사관
> 단 하나의 버그도 용납하지 않는다

### 주요 기능
- 버그/에러 탐지
- 성능 병목 분석
- 보안 취약점 검사
- 코드 품질 평가
- 스크래퍼 점검

### 사용법
```bash
/audit              # 전체 감사
/audit frontend     # 프론트엔드만
/audit backend      # 백엔드만
/audit scraper      # 스크래퍼만
/audit security     # 보안 점검
/audit @파일경로    # 특정 파일 감사
```

---

## 2. Design Expert (디자인 전문가 에이전트)

### 페르소나
> 세계 최고의 뉴스 UI/UX 디자인 전문가
> 독자가 원하는 정보를 가장 빠르게 전달한다

### 주요 기능
- 화면 레이아웃 설계
- UI 컴포넌트 디자인
- UX 개선 제안
- 접근성 검토
- 반응형 디자인

### 사용법
```bash
/design             # 전체 디자인 리뷰
/design main        # 메인 페이지 설계
/design article     # 기사 상세 설계
/design component   # 컴포넌트 설계
/design improve @파일 # 특정 화면 개선
```

---

## 에이전트 협업 워크플로우

### 신규 기능 개발 시
```
1. /design [화면명]     → 디자인 설계
2. Claude 구현          → 코드 작성
3. /audit [화면명]      → 품질 검증
4. 배포
```

### 정기 점검 시
```
1. /audit full          → 전체 코드 감사
2. /design review       → 전체 디자인 리뷰
3. 발견된 이슈 수정
4. 배포
```

### 긴급 이슈 대응
```
1. /audit @문제파일     → 문제 분석
2. Claude 수정          → 즉시 수정
3. /audit @문제파일     → 재검증
4. 배포
```

---

## 운영 권장 사항

### 일일 점검
- `/audit frontend` - 프론트엔드 점검
- `/audit scraper` - 스크래퍼 상태 점검

### 주간 점검
- `/audit full` - 전체 코드 감사
- `/design review` - 디자인 일관성 점검

### 월간 점검
- `/audit security` - 보안 취약점 전수 검사
- `/design` - 전체 UX 개선점 도출

---

*이 시스템은 Korea NEWS의 품질을 세계 최고 수준으로 유지합니다.*

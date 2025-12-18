# AGENTS.md 규칙 시스템 구축 가이드

> 이 문서는 AI 코딩 에이전트(Cursor, Claude Code, Gemini CLI 등)에게 전달하여,
> 프로젝트에 맞는 AGENTS.md 규칙 시스템을 구축하도록 요청할 때 사용합니다.

---

## 1. 개요: AGENTS.md란?

**AGENTS.md**는 OpenAI Codex 팀이 발표한 AI 에이전트용 표준 규칙 파일입니다.

### 핵심 특징
- **목적:** AI 에이전트에게 프로젝트 맥락과 지침 제공
- **관리 주체:** Linux Foundation 산하 Agentic AI Foundation
- **지원 도구:** Cursor, Gemini CLI, VS Code, GitHub Copilot, Windsurf, OpenAI Codex 등

### 장점
1. **일관성:** 모든 코딩 에이전트에서 동일한 규칙 적용
2. **효율성:** 컨텍스트 낭비 감소 (500줄 이내 권장)
3. **확장성:** 중첩 구조로 대규모 프로젝트 지원
4. **협업:** 팀원 온보딩 및 코드 리뷰에 활용

---

## 2. 핵심 철학 (반드시 따를 것)

### 2.1. 500줄 제한
- 하나의 AGENTS.md는 **500줄 미만**으로 유지
- 토큰 효율성과 가독성을 위해 필수

### 2.2. No Fluff, No Emojis
- 이모지 사용 금지
- 불필요한 서술 배제
- 명확하고 간결한 텍스트만

### 2.3. 중앙 통제 & 위임
- 루트 AGENTS.md = **관제탑** (전체 개요)
- 서브 AGENTS.md = **위임** (상세 구현)

### 2.4. Machine-Readable Clarity
- 추상적 조언 대신 **구체적 지침**
- Golden Rules (Do's & Don'ts) 형식

---

## 3. 파일 구조

### 3.1. 루트 AGENTS.md (관제탑)

```markdown
# [프로젝트명]

## Project Context & Operations
- 비즈니스 목표
- Tech Stack
- Operational Commands (npm run dev 등)

## Golden Rules
### Immutable (불변)
- 절대 타협할 수 없는 보안/아키텍처 제약

### Do's (해야 할 것)
- 항상 공식 SDK 사용
- 에러 처리 필수

### Don'ts (하지 말 것)
- API 키 하드코딩 금지
- any 타입 사용 금지

## Standards & References
- 코딩 컨벤션
- Git 전략
- 커밋 메시지 포맷

## Context Map
- **[API Routes](./src/app/api/AGENTS.md)** — Route Handler 작성 시
- **[UI 컴포넌트](./src/components/AGENTS.md)** — 스타일링 작업 시
- **[상태 관리](./src/hooks/AGENTS.md)** — 커스텀 훅 작성 시
```

### 3.2. 서브 AGENTS.md (위임)

다음 경우에 별도 파일 생성:
- **Dependency Boundary:** package.json 등이 별도로 존재
- **Framework Boundary:** 기술 스택 전환점
- **Logical Boundary:** 비즈니스 로직 밀도가 높은 모듈

```markdown
# [모듈명] AGENTS.md

## Module Context
- 역할 및 의존성 관계

## Tech Stack & Constraints
- 해당 폴더 전용 라이브러리/버전

## Implementation Patterns
- 자주 사용되는 코드 패턴
- 파일 네이밍 규칙

## Testing Strategy
- 테스트 명령어 및 패턴

## Local Golden Rules
- 해당 영역 Do's & Don'ts
```

---

## 4. AI에게 전달할 프롬프트

아래 프롬프트를 복사하여 AI 에이전트에게 전달하세요:

---

### 프롬프트 템플릿

```
당신은 AI 컨텍스트 및 거버넌스 수석 아키텍트입니다.
이 프로젝트를 분석하여 AGENTS.md 규칙 시스템을 설계하고 구현해주세요.

## 핵심 철학 (반드시 따를 것)
1. 모든 AGENTS.md는 500줄 미만 유지
2. 이모지 사용 금지, 간결한 텍스트만
3. 루트 = 관제탑, 서브 = 위임 구조
4. 추상적 조언 대신 구체적 Golden Rules

## 실행 절차

### Step 1: 루트 ./AGENTS.md 생성
필수 섹션:
- Project Context & Operations (비즈니스 목표, Tech Stack, Commands)
- Golden Rules (Immutable, Do's, Don'ts)
- Standards & References (코딩 컨벤션, Git 전략)
- Context Map (서브 AGENTS.md 링크)

### Step 2: 서브 AGENTS.md 생성
다음 신호 감지 시 별도 파일 생성:
- Dependency Boundary (package.json 별도 존재)
- Framework Boundary (기술 스택 전환점)
- Logical Boundary (비즈니스 로직 밀도 높음)

서브 파일 필수 섹션:
- Module Context
- Tech Stack & Constraints
- Implementation Patterns
- Local Golden Rules

## Context Map 형식 (표 금지)
- **[트리거/작업 영역](상대경로)** — 한 줄 설명

## 실행 규칙
1. 파일을 만들까요? 묻지 말고 즉시 생성
2. 기존 AGENTS.md 있으면 덮어쓰기
3. 유효한 Markdown 문법만 사용

지금 프로젝트를 분석하고 AGENTS.md 시스템을 생성해주세요.
```

---

## 5. 예시: cnsa-insight2 적용 결과

### 분석된 Tech Stack
- Next.js 16.0.10 + React 19.2.1
- TailwindCSS 4.x + Zustand 5.0.9
- AI SDKs: Gemini, Claude, Groq

### 생성된 규칙
- Golden Rules: API Key 환경변수 필수, any 타입 금지
- Context Map: API Routes, UI 컴포넌트, AI SDK 참조 경로

### 적용 위치
```
프로젝트 규칙: C:\Users\user\.gemini\projects\cnsa-insight2.md
글로벌 규칙: C:\Users\user\.gemini\GLOBAL_RULES.md
```

---

## 6. 첨부 파일 안내

이 가이드와 함께 다음 파일을 참조하세요:

1. **에이젼트.md** — AGENTS.md 개념 설명 (유튜브 영상 스크립트)
2. **AGENTS_md_Master_Prompt_ghs8S.md** — 마스터 프롬프트 (AI에게 직접 전달)

---

*작성일: 2025-12-19*

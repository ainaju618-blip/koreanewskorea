# AI 협업 정보

> Claude와 Gemini(Antigravity) 간 협업 관련 정보

---

## 1. 협업 구조

### 역할 분담
| AI | 역할 | 담당 작업 |
|----|------|----------|
| **Claude** | 기획/관리 | 작업 지시서 작성, Git/Vercel 배포, 코드 리뷰, 문서 관리 |
| **Gemini (Antigravity)** | 실행/검증 | 대규모 코드 작업, 브라우저 UI 테스트, 스크래퍼 실행, 스크린샷 수집 |

### 소통 채널
```
.ai-collab/
├── TASK.md        # 작업 지시 (Claude → Gemini)
├── QUESTION.md    # 질문/논의 (양방향)
└── DONE.md        # 완료 보고 (Gemini → Claude)
```

### 작업 흐름
```
Claude: TASK.md에 작업 지시서 작성
    ↓
주인님: Gemini에게 "읽어봐" 전달
    ↓
Gemini: TASK.md 읽고 작업 수행
    ↓
Gemini: DONE.md에 결과 보고
    ↓
주인님: Claude에게 "확인해" 전달
    ↓
Claude: 검토 후 Git push & Vercel 배포
```

---

## 2. [GUIDE] TASK.md 작성 형식

### 기본 구조
```markdown
# 작업 지시서

> 작성자: Claude
> 작성일: YYYY-MM-DD
> 우선순위: [URGENT] / [NORMAL] / [LOW]

---

## 작업 목표
(한 문장으로 명확하게)

## 상세 내용
1. 첫 번째 작업
2. 두 번째 작업

## 변경 대상 파일
- `경로/파일명` - 변경 내용

## 테스트 방법
```bash
# 테스트 명령어
```

## 완료 조건
- [ ] 조건 1
- [ ] 조건 2
```

### 우선순위 태그
| 태그 | 의미 |
|------|------|
| `[URGENT]` | 긴급 (즉시 처리) |
| `[NORMAL]` | 일반 |
| `[LOW]` | 낮음 (여유 있을 때) |

---
*추가일: 2025-12-15*

---

## 3. [GUIDE] DONE.md 보고 형식

### 기본 구조
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
- ✅ 테스트 1 통과
- ✅ 테스트 2 통과

### 스크린샷
(필요시 첨부)

### 후속 작업 필요
- [ ] Claude가 할 일
```

---
*추가일: 2025-12-15*

---

## 4. [ERROR] Gemini가 TASK.md를 못 읽음

### 증상
- Gemini가 "파일을 찾을 수 없다"고 응답
- 작업 내용을 모른다고 함

### 원인
1. 파일 경로 오류
2. 파일이 저장되지 않음
3. Gemini 컨텍스트에 프로젝트가 로드되지 않음

### 해결
```
1. 주인님이 직접 확인: .ai-collab/TASK.md 파일 존재 확인
2. Gemini에게 프로젝트 경로 명시: "d:/cbt/koreanews/.ai-collab/TASK.md 읽어봐"
3. 또는 TASK.md 내용을 직접 복사해서 전달
```

---
*추가일: 2025-12-15*

---

## 5. [ERROR] DONE.md에 결과가 안 올라옴

### 증상
- Gemini가 작업 완료했다고 하는데 DONE.md가 비어있음

### 원인
1. Gemini가 파일 쓰기 권한 없음
2. 다른 경로에 저장됨
3. 저장 실패

### 해결
```
1. Gemini에게 재요청: "DONE.md에 결과 기록해줘"
2. 경로 명시: ".ai-collab/DONE.md에 추가해줘"
3. 또는 채팅으로 결과 받아서 Claude가 직접 기록
```

---
*추가일: 2025-12-15*

---

## 6. [ERROR] 작업 충돌

### 증상
- 같은 파일을 Claude와 Gemini가 동시에 수정
- Git 충돌 발생

### 예방
```
1. TASK.md에 변경 대상 파일 명확히 명시
2. Claude는 Gemini 작업 중 해당 파일 수정 금지
3. Gemini 작업 완료 후 Claude가 Git 커밋
```

### 충돌 발생 시
```bash
# 1. 상태 확인
git status

# 2. 충돌 파일 확인 후 수동 병합
# 또는 한쪽 버전 선택
git checkout --theirs 파일명  # Gemini 버전
git checkout --ours 파일명    # Claude 버전

# 3. 커밋
git add . && git commit -m "fix: merge conflict"
```

---
*추가일: 2025-12-15*

---

## 7. [GUIDE] 효율적인 협업 팁

### Claude 작업 시
- 대규모 코드 작업은 Gemini에게 위임 (토큰 절약)
- 작업 지시서는 최대한 상세하게
- 테스트 방법과 완료 조건 명시

### Gemini 작업 시
- 브라우저 테스트 결과 스크린샷 첨부
- 변경 파일 목록 명확히
- 에러 발생 시 QUESTION.md에 질문

### 주인님 역할
- "읽어봐", "확인해" 등 간단한 명령만 전달
- 작업 내용을 직접 복사해서 전달하지 않음
- AI들이 .ai-collab 파일로 소통하도록 유도

---
*추가일: 2025-12-15*

---

## 8. 관련 파일

| 파일 | 위치 | 용도 |
|------|------|------|
| TASK.md | `.ai-collab/TASK.md` | 작업 지시 |
| DONE.md | `.ai-collab/DONE.md` | 완료 보고 |
| QUESTION.md | `.ai-collab/QUESTION.md` | 질문/논의 |
| 협업 규칙 | `CLAUDE.md` 섹션 0.4.1 | 상세 규칙 |

---

*최종 업데이트: 2025-12-15*

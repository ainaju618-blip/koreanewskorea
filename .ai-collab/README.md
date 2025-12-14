# AI 협업 폴더

> Claude와 Gemini(Antigravity) 간 작업 지시 및 소통용 폴더

## 참여자

| 참여자 | 정체성 | 역할 |
|--------|--------|------|
| **주인님** | 사용자 | "읽어봐" 한 마디로 AI에게 TASK.md 확인 지시. 중간에 작업 내용을 직접 전달하지 않음 |
| **Claude** | Anthropic AI | 기획/설계, Git/배포, 코드 리뷰, 문서 관리 |
| **Antigravity** | Google Deepmind 에이전틱 AI | 대규모 코드 작업, 브라우저 UI 테스트, 스크래퍼 실행/디버깅 |

## 사용 방법

| 파일 | 용도 |
|------|------|
| `TASK.md` | 작업 지시 및 AI 간 대화 |
| `QUESTION.md` | 질문 사항 (Claude ↔ Antigravity) |
| `DONE.md` | 완료 보고 |

## 작업 흐름

```
1. Claude가 TASK.md에 작업 지시서 작성
2. 주인님이 Antigravity에게 "읽어봐" 지시
3. Antigravity가 TASK.md 확인 후 작업 수행
4. Antigravity가 DONE.md에 결과 보고
5. 주인님이 Claude에게 "읽어봐" 지시
6. Claude가 DONE.md 확인 후 검토/배포
```

## 규칙

- 작업 지시는 **구체적**으로 작성
- 파일 경로는 **절대 경로** 또는 **프로젝트 루트 기준** 상대 경로
- 완료 후 반드시 **DONE.md** 업데이트
- 우선순위 태그: `[URGENT]`, `[LOW]` 사용

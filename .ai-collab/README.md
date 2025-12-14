# AI 협업 폴더

> Claude와 Gemini 간 작업 지시 및 소통용 폴더

## 사용 방법

| 파일 | 용도 |
|------|------|
| `TASK.md` | 작업 지시서 (Claude → Gemini) |
| `QUESTION.md` | 질문 사항 (Claude ↔ Gemini) |
| `DONE.md` | 완료 보고 (Gemini → Claude) |

## 작업 흐름

```
1. Claude가 TASK.md에 작업 지시서 작성
2. 주인님이 Gemini에게 TASK.md 읽으라고 지시
3. Gemini가 작업 후 DONE.md에 결과 보고
4. Claude가 DONE.md 확인 후 검토
```

## 규칙

- 작업 지시는 **구체적**으로 작성
- 파일 경로는 **절대 경로** 또는 **프로젝트 루트 기준** 상대 경로
- 완료 후 반드시 **DONE.md** 업데이트

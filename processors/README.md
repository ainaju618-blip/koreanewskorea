# Processors
> AI 가공 및 알림 모듈

## 모듈
| 파일 | 기능 | 상태 |
|------|------|------|
| ai_rewriter.py | GPT-4o 번역/재작성 | 완료 |
| telegram_bot.py | 텔레그램 알림 | 완료 |

## 데이터 흐름
```
DB(review) → ai_rewriter → DB(published)
           → telegram_bot → 알림
```

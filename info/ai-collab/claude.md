# Claude 전용 가이드

## 나의 역할
- 프로젝트 총괄 기획자
- 직접 코드 작성 최소화 (토큰 절약)
- Gemini에게 작업 위임

## 세션 시작 시
```
1. CLAUDE.md 읽기
2. .claude/context/current_task.md 확인
3. 진행 중 작업 파악
4. 주인님께 현황 보고
```

## "인포 찾아봐" 명령 시
```
1. info/_index.md 읽기
2. 상황 판단 (에러/가이드/설정)
3. 해당 _catalog.md 읽기
4. 키워드 매칭 → 파일 읽기
5. 적용
```

## Gemini에게 작업 위임
```
1. .ai-collab/TASK.md에 작업 지시서 작성
2. 주인님께 "Gemini에게 전달해주세요" 보고
3. 주인님이 Gemini에게 "읽어봐" 전달
4. Gemini가 DONE.md에 결과 작성
5. 내가 확인 후 git push
```

## 컨텍스트 기록
```
.claude/context/
├── current_task.md   # 현재 작업
├── session_log.md    # 세션 로그
└── decisions.md      # 주요 결정
```

## Git 커밋 전 확인
```bash
git config user.email  # kyh6412057153@gmail.com 확인
git config user.name   # 유향 확인
```

# 자주 사용하는 명령어

> Git 및 Vercel CLI 명령어 모음

---

## 1. Git 기본 명령어

### 상태 확인
```bash
# 현재 상태
git status

# 변경 내용 확인
git diff

# 스테이징된 변경 확인
git diff --staged

# 커밋 히스토리
git log --oneline -10
```

### 커밋 & 푸시
```bash
# 파일 스테이징
git add .                    # 전체
git add [파일경로]           # 특정 파일

# 커밋
git commit -m "메시지"

# 푸시
git push origin master
```

### 한 번에 커밋 & 푸시
```bash
git add . && git commit -m "메시지" && git push origin master
```

---

## 2. Git 설정 명령어

### 계정 설정
```bash
# 현재 설정 확인
git config user.email
git config user.name

# koreanews 프로젝트용 설정
git config user.email "kyh6412057153@gmail.com"
git config user.name "유향"

# 전역 설정 (모든 프로젝트)
git config --global user.email "이메일"
git config --global user.name "이름"
```

### 원격 저장소
```bash
# 원격 저장소 확인
git remote -v

# 원격 URL 변경
git remote set-url origin [새URL]
```

---

## 3. Git 브랜치 명령어

```bash
# 브랜치 목록
git branch -a

# 브랜치 생성 & 이동
git checkout -b [브랜치명]

# 브랜치 이동
git checkout [브랜치명]

# 브랜치 삭제
git branch -d [브랜치명]

# 머지
git merge [브랜치명]
```

---

## 4. Git 되돌리기

```bash
# 마지막 커밋 수정 (푸시 전)
git commit --amend -m "새 메시지"

# 스테이징 취소
git reset HEAD [파일]

# 변경 취소 (파일)
git checkout -- [파일]

# 커밋 되돌리기 (새 커밋 생성)
git revert HEAD

# 강제 리셋 (주의!)
git reset --hard HEAD~1
```

---

## 5. Vercel CLI 기본

### 배포
```bash
# Production 배포
vercel --prod

# Preview 배포
vercel

# 특정 디렉토리 배포
vercel ./path --prod
```

### 상태 확인
```bash
# 배포 목록
vercel ls

# 상세 정보
vercel inspect [배포URL]

# 빌드 로그
vercel logs [배포URL]
```

---

## 6. Vercel 환경 변수

```bash
# 목록 확인
vercel env ls

# 추가
vercel env add [변수명]

# 삭제
vercel env rm [변수명]

# 로컬에 가져오기
vercel env pull .env.local
```

---

## 7. Vercel 롤백 & 관리

```bash
# 롤백
vercel rollback [배포URL]

# 재배포
vercel redeploy [배포URL]

# 도메인 목록
vercel domains ls

# 프로젝트 열기 (대시보드)
vercel open
```

---

## 8. GitHub CLI (gh)

### 인증
```bash
# 로그인
gh auth login

# 상태 확인
gh auth status
```

### 저장소 정보
```bash
# 웹훅 확인
gh api repos/korea-news/koreanewsone/hooks

# 저장소 정보
gh repo view
```

### PR & 이슈
```bash
# PR 목록
gh pr list

# PR 생성
gh pr create --title "제목" --body "내용"

# 이슈 목록
gh issue list
```

---

## 9. 복합 명령어 (자주 사용)

### 빠른 배포
```bash
# 빌드 확인 후 배포
npm run build && git add . && git commit -m "메시지" && git push
```

### 상태 전체 확인
```bash
# Git + Vercel 상태
git status && vercel ls
```

### 문제 진단
```bash
# 로컬-원격 차이 확인
git fetch origin && git log HEAD..origin/master --oneline
```

---

## 10. 명령어 별칭 (선택)

`.bashrc` 또는 `.zshrc`에 추가:

```bash
# Git 별칭
alias gs="git status"
alias gp="git push origin master"
alias gc="git commit -m"
alias gac="git add . && git commit -m"

# Vercel 별칭
alias vl="vercel ls"
alias vp="vercel --prod"

# 복합
alias deploy="npm run build && git add . && git commit -m 'deploy' && git push"
```

---

*최종 업데이트: 2025-12-15*

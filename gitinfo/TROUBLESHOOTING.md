# 문제 해결 가이드

> Git 및 Vercel 관련 오류 해결 방법

---

## 1. Vercel 자동 배포 안됨

### 증상
- `git push origin master` 후 Vercel 배포가 시작되지 않음
- `vercel ls`에서 새 배포가 나타나지 않음

### 원인 진단
```bash
# GitHub 웹훅 확인
gh api repos/korea-news/koreanewsone/hooks

# 빈 배열 [] 반환 시 = 웹훅 없음 (자동 배포 불가)
```

### 해결 방법
```bash
# Vercel Git 연결 재설정
vercel git connect

# "Connected" 출력 확인

# 테스트 (빈 커밋으로 확인)
git commit --allow-empty -m "chore: test auto-deploy"
git push origin master

# 10초 후 배포 시작 확인
vercel ls
```

### 예방
- Vercel 대시보드 > Settings > Git에서 연결 상태 주기적 확인
- GitHub 저장소 Settings > Webhooks에서 Vercel 웹훅 존재 확인

---

## 2. Git Push 실패

### 2.1 인증 오류
```
remote: Support for password authentication was removed
```

**해결:**
```bash
# GitHub CLI 로그인
gh auth login

# 또는 Personal Access Token 사용
git remote set-url origin https://[TOKEN]@github.com/korea-news/koreanewsone.git
```

### 2.2 권한 오류
```
error: failed to push some refs to 'origin'
```

**해결:**
```bash
# 원격 변경사항 먼저 가져오기
git pull origin master --rebase

# 다시 푸시
git push origin master
```

### 2.3 대용량 파일 오류
```
error: File xxx is 123.45 MB; this exceeds GitHub's file size limit
```

**해결:**
```bash
# 대용량 파일 .gitignore에 추가
echo "path/to/large/file" >> .gitignore

# 캐시에서 제거
git rm --cached path/to/large/file

# 커밋
git commit -m "fix: remove large file from tracking"
```

---

## 3. Vercel 빌드 실패

### 3.1 빌드 로그 확인
```bash
# 최근 배포 URL 확인
vercel ls

# 로그 확인
vercel logs [deployment-url]
```

### 3.2 일반적인 빌드 오류

#### TypeScript 오류
```bash
# 로컬에서 먼저 확인
npm run build

# 타입 오류 수정 후 다시 배포
```

#### 환경 변수 누락
```bash
# 필요한 환경 변수 확인
vercel env ls

# 환경 변수 추가
vercel env add VARIABLE_NAME

# 로컬에 환경 변수 가져오기
vercel env pull .env.local
```

#### 의존성 오류
```bash
# package-lock.json 재생성
rm package-lock.json
npm install

# 커밋 & 푸시
git add package-lock.json
git commit -m "fix: regenerate package-lock.json"
git push
```

---

## 4. Git 계정 문제

### 4.1 잘못된 계정으로 커밋됨
```bash
# 현재 설정 확인
git config user.email
git config user.name

# 올바른 계정으로 변경
git config user.email "kyh6412057153@gmail.com"
git config user.name "유향"

# 마지막 커밋 수정 (아직 푸시 전이라면)
git commit --amend --reset-author
```

### 4.2 다른 프로젝트 계정 혼동
| 프로젝트 | 이메일 | 이름 |
|---------|--------|------|
| **koreanews** | kyh6412057153@gmail.com | 유향 |
| hobakflower | ko518533@gmail.com | 광혁 |
| CBT 프로젝트 | multi618@gmail.com | 중 |

---

## 5. 로컬-원격 동기화 문제

### 5.1 로컬/원격 상태 확인
```bash
# 상태 확인
git status

# 원격과 비교
git fetch origin
git log HEAD..origin/master --oneline  # 원격이 앞선 커밋
git log origin/master..HEAD --oneline  # 로컬이 앞선 커밋
```

### 5.2 강제 동기화 (주의!)
```bash
# 로컬을 원격에 맞춤 (로컬 변경 삭제됨!)
git reset --hard origin/master

# 원격을 로컬에 맞춤 (원격 히스토리 변경됨!)
git push --force origin master  # ⚠️ 매우 주의
```

---

## 6. Vercel 배포 롤백

### 이전 버전으로 롤백
```bash
# 배포 목록 확인
vercel ls

# 특정 배포로 롤백
vercel rollback [deployment-url]
```

### Git으로 롤백
```bash
# 이전 커밋으로 되돌리기
git revert HEAD

# 푸시 (자동 배포 트리거)
git push origin master
```

---

## 7. 긴급 상황 대응

### 프로덕션 장애 시
```bash
# 1. 즉시 이전 버전으로 롤백
vercel rollback [이전-정상-배포-url]

# 2. 로컬에서 문제 파악 및 수정
npm run build  # 빌드 오류 확인
npm run dev    # 런타임 오류 확인

# 3. 수정 후 재배포
git add .
git commit -m "fix: [문제 설명]"
git push origin master
```

### 수동 배포 (자동 배포 실패 시)
```bash
vercel --prod
```

---

## 8. 체크리스트

### 배포 전 확인
- [ ] `npm run build` 로컬 성공
- [ ] `git status` 커밋할 파일 확인
- [ ] `git config user.email` 계정 확인
- [ ] 환경 변수 설정 완료

### 배포 후 확인
- [ ] `vercel ls` 배포 상태 Ready
- [ ] 프로덕션 URL 접속 테스트
- [ ] 주요 기능 동작 확인

---

*최종 업데이트: 2025-12-15*

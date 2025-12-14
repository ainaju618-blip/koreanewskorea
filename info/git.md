# Git & Vercel 배포 정보

> Git 설정, Vercel 배포, CI/CD 관련 모든 정보

---

## 1. 계정 정보

### 현재 프로젝트 설정
```bash
# 확인
git config user.email  # kyh6412057153@gmail.com
git config user.name   # 유향

# 설정
git config user.email "kyh6412057153@gmail.com"
git config user.name "유향"
```

### 프로젝트별 계정
| 프로젝트 | Git Email | Git Name | Vercel Team |
|---------|-----------|----------|-------------|
| **koreanews** | `kyh6412057153@gmail.com` | 유향 | koreanews-projects |
| hobakflower | `ko518533@gmail.com` | 광혁 | - |
| CBT 프로젝트 | `multi618@gmail.com` | 중 | - |

---

## 2. 원격 저장소

### Remote 정보
```bash
# 확인
git remote -v

# 결과
origin  https://github.com/korea-news/koreanewsone.git (fetch/push)
```

### GitHub 저장소
| 항목 | 값 |
|------|-----|
| Organization | korea-news |
| Repository | koreanewsone |
| URL | https://github.com/korea-news/koreanewsone |
| Branch | master (메인) |

---

## 3. Vercel 프로젝트

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

### 자동 배포 흐름
```
git push origin master
       ↓
GitHub Webhook 트리거
       ↓
Vercel 빌드 시작 (~2분)
       ↓
Production 배포 완료
```

---

## 4. 자주 쓰는 명령어

### Git 기본
```bash
git status                    # 상태 확인
git add .                     # 전체 스테이징
git commit -m "메시지"        # 커밋
git push origin master        # 푸시
git log --oneline -10         # 히스토리
```

### Vercel CLI
```bash
vercel ls                     # 배포 목록
vercel --prod                 # 수동 배포
vercel logs [url]             # 빌드 로그
vercel env ls                 # 환경 변수 확인
vercel git connect            # Git 연결 복구
```

### 한 번에 배포
```bash
git add . && git commit -m "메시지" && git push origin master
```

---

## 5. [ERROR] 자동 배포 안됨

### 증상
- `git push origin master` 후 Vercel 배포가 시작되지 않음

### 원인 진단
```bash
# GitHub 웹훅 확인
gh api repos/korea-news/koreanewsone/hooks

# 빈 배열 [] = 웹훅 없음 (자동 배포 불가)
```

### 해결
```bash
# Vercel Git 연결 재설정
vercel git connect

# "Connected" 확인 후 테스트
git commit --allow-empty -m "chore: test auto-deploy"
git push origin master

# 10초 후 확인
vercel ls
```

---
*추가일: 2025-12-15*

---

## 6. [ERROR] Git Push 실패

### 6.1 인증 오류
```
remote: Support for password authentication was removed
```

**해결:**
```bash
gh auth login
# 또는
git remote set-url origin https://[TOKEN]@github.com/korea-news/koreanewsone.git
```

### 6.2 권한 오류
```
error: failed to push some refs to 'origin'
```

**해결:**
```bash
git pull origin master --rebase
git push origin master
```

### 6.3 대용량 파일 오류
```
error: File xxx is 123.45 MB; this exceeds GitHub's file size limit
```

**해결:**
```bash
echo "path/to/large/file" >> .gitignore
git rm --cached path/to/large/file
git commit -m "fix: remove large file"
```

---
*추가일: 2025-12-15*

---

## 7. [ERROR] Vercel 빌드 실패

### 로그 확인
```bash
vercel ls              # 배포 URL 확인
vercel logs [url]      # 상세 로그
```

### 일반적인 원인

#### TypeScript 오류
```bash
npm run build          # 로컬에서 먼저 확인
```

#### 환경 변수 누락
```bash
vercel env ls          # 확인
vercel env add NAME    # 추가
vercel env pull .env.local  # 로컬에 가져오기
```

#### 의존성 오류
```bash
rm package-lock.json
npm install
git add package-lock.json && git commit -m "fix: regenerate lock" && git push
```

---
*추가일: 2025-12-15*

---

## 8. [ERROR] Git 계정 혼동

### 잘못된 계정으로 커밋됨
```bash
# 현재 설정 확인
git config user.email

# 올바른 계정으로 변경
git config user.email "kyh6412057153@gmail.com"
git config user.name "유향"

# 마지막 커밋 수정 (푸시 전)
git commit --amend --reset-author
```

---
*추가일: 2025-12-15*

---

## 9. [GUIDE] 긴급 롤백

### Vercel 롤백
```bash
vercel ls                    # 이전 배포 URL 확인
vercel rollback [url]        # 롤백
```

### Git 롤백
```bash
git revert HEAD              # 되돌리기 커밋 생성
git push origin master       # 자동 재배포
```

---
*추가일: 2025-12-15*

---

## 10. [GUIDE] 커밋 규칙

### 메시지 형식
```
<type>: <설명>

타입:
- feat: 새 기능
- fix: 버그 수정
- chore: 기타 (빌드, 설정 등)
- refactor: 리팩토링
- docs: 문서 수정
```

### Claude 커밋 형식
```bash
git commit -m "$(cat <<'EOF'
fix: 설명

- 상세 내용

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---
*추가일: 2025-12-15*

---

## 체크리스트

### 배포 전
- [ ] `npm run build` 성공
- [ ] `git config user.email` 계정 확인
- [ ] 환경 변수 설정 완료

### 배포 후
- [ ] `vercel ls` → Ready 상태
- [ ] 프로덕션 URL 접속 확인
- [ ] 주요 기능 동작 확인

---

*최종 업데이트: 2025-12-15*

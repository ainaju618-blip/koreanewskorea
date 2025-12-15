# Git 기본 설정

## 1. 계정 정보

### 현재 설정
```bash
# 확인 명령어
git config user.email
git config user.name

# 현재 값
Email: kyh6412057153@gmail.com
Name: 유향
```

### 프로젝트별 계정 (전역 CLAUDE.md 참조)
| 프로젝트 | Git Email | Git Name | Vercel Team |
|---------|-----------|----------|-------------|
| **koreanews** | `kyh6412057153@gmail.com` | 유향 | koreanews-projects |
| hobakflower | `ko518533@gmail.com` | 광혁 | - |
| CBT 프로젝트 | `multi618@gmail.com` | 중 | - |

### 설정 변경 (필요시)
```bash
# koreanews 프로젝트용
git config user.email "kyh6412057153@gmail.com"
git config user.name "유향"
```

---

## 2. 원격 저장소

### Remote 정보
```bash
# 확인
git remote -v

# 결과
origin  https://github.com/korea-news/koreanewsone.git (fetch)
origin  https://github.com/korea-news/koreanewsone.git (push)
```

### GitHub 저장소
- **Organization**: korea-news
- **Repository**: koreanewsone
- **URL**: https://github.com/korea-news/koreanewsone
- **Branch**: master (메인 브랜치)

---

## 3. 브랜치 전략

### 현재 브랜치 구조
```
master (메인/프로덕션)
  └── 모든 변경사항 직접 커밋
```

### 브랜치 명령어
```bash
# 현재 브랜치 확인
git branch

# 원격 브랜치 확인
git branch -r

# 브랜치 생성 (필요시)
git checkout -b feature/기능명
```

---

## 4. 커밋 규칙

### 커밋 메시지 형식
```
<type>: <설명>

타입:
- feat: 새로운 기능
- fix: 버그 수정
- chore: 기타 변경사항 (빌드, 문서 등)
- refactor: 리팩토링
- style: 코드 스타일 변경
- docs: 문서 수정
```

### 예시
```bash
git commit -m "feat: 기자 랜덤 배정 기능 추가"
git commit -m "fix: author_name 필드 사용으로 수정"
git commit -m "chore: 스크래퍼 이미지 추가"
```

### Claude 커밋 형식
```bash
git commit -m "$(cat <<'EOF'
fix: 기자 배정 로직 수정

- author_name 필드 사용
- API fallback 추가

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## 5. .gitignore

### 주요 무시 항목
```
# 의존성
node_modules/
.pnp/

# 빌드
.next/
out/
build/

# 환경 변수
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Vercel
.vercel/

# 임시 파일
*.zip
*.log
```

---

## 6. 인증 설정

### GitHub CLI (gh)
```bash
# 로그인 상태 확인
gh auth status

# 로그인 (필요시)
gh auth login
```

### Git Credential
- Windows: Git Credential Manager 사용
- 저장 위치: Windows Credential Manager

---

*최종 업데이트: 2025-12-15*

# Git & Vercel 배포 정보

> Korea NEWS 프로젝트의 Git 및 Vercel 배포 관련 정보 문서

## 📁 문서 구조

| 파일 | 내용 |
|------|------|
| [GIT_CONFIG.md](./GIT_CONFIG.md) | Git 기본 설정 및 계정 정보 |
| [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) | Vercel 배포 설정 및 자동 배포 |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | 문제 해결 가이드 |
| [COMMANDS.md](./COMMANDS.md) | 자주 사용하는 명령어 모음 |

---

## 빠른 참조

### Git 계정 정보
```bash
# 이메일
git config user.email  # kyh6412057153@gmail.com

# 사용자명
git config user.name   # 유향
```

### Vercel 프로젝트 정보
```
프로젝트: koreanewsone
팀: koreanews-projects
GitHub: korea-news/koreanewsone
Production URL: https://koreanews.vercel.app
```

### 핵심 명령어
```bash
# 배포 상태 확인
vercel ls

# 수동 배포 (자동 배포 안 될 때)
vercel --prod

# Git 연결 확인/복구
vercel git connect
```

---

*최종 업데이트: 2025-12-15*

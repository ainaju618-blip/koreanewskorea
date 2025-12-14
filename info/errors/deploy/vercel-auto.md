# [ERROR] Vercel 자동 배포 안됨

> **발생 빈도:** 중간
> **최종 수정:** 2025-12-15

## 증상
- `git push` 후 Vercel에 자동 배포 안됨
- 수동 `vercel --prod`는 작동

## 원인
GitHub 웹훅이 없거나 끊어짐

## 진단
```bash
# 웹훅 확인
gh api repos/korea-news/koreanewsone/hooks
# 빈 배열 [] 이면 웹훅 없음
```

## 해결
```bash
# Vercel-GitHub 재연결
vercel git connect

# 확인 (Connected 출력)
# 테스트 커밋
git commit --allow-empty -m "test: auto-deploy check"
git push origin master
```

## 관련
- `git-webhook.md` - 웹훅 상세

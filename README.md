# Korea NEWS
> 전남/광주 보도자료 자동 수집 시스템

## 개요
27개 기관 보도자료 수집 → AI 가공 → 웹사이트 게시

## 구조
```
scrapers/      → 스크래퍼 (27개 지역)
processors/    → AI 가공, 텔레그램
web/           → Next.js 프론트엔드
src/           → 메인 앱 소스
scripts/       → 유틸리티
```

## 기술 스택
- Next.js 15, Supabase, Playwright, Cloudinary, GPT-4o

## 실행
```bash
# 스크래퍼
python main_bot.py

# 웹
cd web && npm run dev
```

## 상세
각 폴더 README.md 참조

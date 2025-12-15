# AI 뉴스 스크래퍼 알고리즘

> 해외 AI 뉴스 RSS 수집 + Gemini 번역/요약 시스템

---

## 데이터 흐름

```
[해외 뉴스 RSS] → [feedparser] → [목록 파싱]
        ↓
[Playwright] → [상세 페이지 스크래핑] → [영문 본문]
        ↓
[Gemini API] → [한국어 번역 + 5000자 요약]
        ↓
[Supabase] → [posts 테이블 저장]
```

---

## 타겟 RSS 피드

| 소스 | URL | 카테고리 |
|------|-----|----------|
| TechCrunch AI | techcrunch.com/.../feed/ | AI 스타트업 |
| VentureBeat AI | venturebeat.com/.../feed/ | AI 비즈니스 |
| MIT News AI | news.mit.edu/rss/... | AI 연구 |

---

## 파일 구조

```
scrapers/ai_news/
├── __init__.py
├── rss_scraper.py       # Phase 1: RSS 목록 + 본문 스크래핑
├── ai_news_scraper.py   # Phase 2: 통합 (RSS + Playwright + Gemini)
└── ALGORITHM.md         # 이 파일

scrapers/utils/
└── gemini_client.py     # Gemini API 클라이언트
```

---

## 사용법

```bash
# 테스트 모드 (번역 없이)
python ai_news/ai_news_scraper.py --feed techcrunch --max-articles 2 --dry-run

# 전체 실행 (번역 포함)
python ai_news/ai_news_scraper.py --feed techcrunch --max-articles 3 --api-key YOUR_KEY
```

---

## Gemini 프롬프트

```
당신은 전문 뉴스 번역가입니다. 다음 영문 AI 기사를 한국어로 번역하고 요약해주세요.

요구사항:
1. 제목을 한국어로 번역 (간결하게)
2. 본문을 5000자 이내로 요약
3. 뉴스 기사 형식으로 작성
4. 고유명사는 영문 유지 가능

출력: JSON 형식 (title_ko, summary_ko, key_points)
```

---

*작성일: 2025-12-15*

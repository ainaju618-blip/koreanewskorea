# AI 뉴스 수집처 상세 정보

> AI 뉴스 수집 시스템의 수집처별 기술 정보

---

## 1. RSS 지원 매체 (1순위)

### 1.1 TechCrunch AI

| 항목 | 내용 |
|------|------|
| **코드** | `techcrunch` |
| **이름** | TechCrunch AI |
| **RSS URL** | `https://techcrunch.com/category/artificial-intelligence/feed/` |
| **특징** | 실리콘밸리 AI 스타트업 속보, 투자 소식 |
| **업데이트** | 하루 5-10건 |
| **난이도** | ⭐ (쉬움) |

**RSS 응답 구조:**
```xml
<item>
    <title>기사 제목</title>
    <link>원문 URL</link>
    <pubDate>Wed, 15 Jan 2025 12:00:00 +0000</pubDate>
    <dc:creator>작성자</dc:creator>
    <description>요약 (HTML 포함)</description>
    <content:encoded>본문 전체 (HTML)</content:encoded>
    <media:thumbnail url="썸네일 URL"/>
</item>
```

---

### 1.2 The Verge AI

| 항목 | 내용 |
|------|------|
| **코드** | `theverge` |
| **이름** | The Verge AI |
| **RSS URL** | `https://www.theverge.com/rss/ai-artificial-intelligence/index.xml` |
| **특징** | 대중적 AI 트렌드, 제품 리뷰 |
| **업데이트** | 하루 3-7건 |
| **난이도** | ⭐ (쉬움) |

**RSS 응답 구조:**
```xml
<entry>
    <title>기사 제목</title>
    <link href="원문 URL"/>
    <published>2025-01-15T12:00:00Z</published>
    <author><name>작성자</name></author>
    <summary>요약</summary>
    <content type="html">본문 (HTML)</content>
</entry>
```

---

### 1.3 VentureBeat AI

| 항목 | 내용 |
|------|------|
| **코드** | `venturebeat` |
| **이름** | VentureBeat AI |
| **RSS URL** | `https://venturebeat.com/category/ai/feed/` |
| **특징** | 비즈니스/기업 AI 동향, 산업 분석 |
| **업데이트** | 하루 5-8건 |
| **난이도** | ⭐ (쉬움) |

---

### 1.4 Ars Technica

| 항목 | 내용 |
|------|------|
| **코드** | `arstechnica` |
| **이름** | Ars Technica |
| **RSS URL** | `https://feeds.arstechnica.com/arstechnica/technology-lab` |
| **특징** | 기술 심층 분석, 과학적 접근 |
| **업데이트** | 하루 2-5건 |
| **난이도** | ⭐ (쉬움) |

---

### 1.5 Wired AI

| 항목 | 내용 |
|------|------|
| **코드** | `wired` |
| **이름** | Wired AI |
| **RSS URL** | `https://www.wired.com/feed/tag/ai/latest/rss` |
| **특징** | AI의 사회적 영향, 윤리 논의 |
| **업데이트** | 하루 2-4건 |
| **난이도** | ⭐ (쉬움) |

---

### 1.6 MIT Technology Review

| 항목 | 내용 |
|------|------|
| **코드** | `mitreview` |
| **이름** | MIT Technology Review |
| **RSS URL** | `https://www.technologyreview.com/feed/` |
| **특징** | 학술적 권위, 미래 기술 전망 |
| **업데이트** | 하루 1-3건 |
| **난이도** | ⭐⭐ (중간) |

**주의사항:**
- 일부 콘텐츠 유료
- RSS에서 전체 본문 미제공 시 스크래핑 필요

---

## 2. 스크래핑 필요 매체 (2순위)

### 2.1 OpenAI Blog

| 항목 | 내용 |
|------|------|
| **코드** | `openai_blog` |
| **이름** | OpenAI Blog |
| **URL** | `https://openai.com/blog` |
| **특징** | GPT 공식 발표, 연구 논문 |
| **업데이트** | 주 1-3건 |
| **난이도** | ⭐⭐ (중간) |

**스크래핑 셀렉터:**
```json
{
    "list": "div[data-testid='blog-card']",
    "title": "h3",
    "link": "a",
    "date": "time",
    "thumbnail": "img"
}
```

**상세 페이지:**
```json
{
    "title": "h1",
    "content": "article",
    "date": "time",
    "author": "[data-testid='author-name']"
}
```

---

### 2.2 Google AI Blog

| 항목 | 내용 |
|------|------|
| **코드** | `google_ai` |
| **이름** | Google AI Blog |
| **URL** | `https://blog.google/technology/ai/` |
| **특징** | Gemini, DeepMind 발표 |
| **업데이트** | 주 2-5건 |
| **난이도** | ⭐⭐ (중간) |

**스크래핑 셀렉터:**
```json
{
    "list": "article.post-card",
    "title": "h3.headline",
    "link": "a.post-card__link",
    "date": "time.post-card__date",
    "thumbnail": "img.post-card__image"
}
```

---

### 2.3 Anthropic News

| 항목 | 내용 |
|------|------|
| **코드** | `anthropic` |
| **이름** | Anthropic News |
| **URL** | `https://www.anthropic.com/news` |
| **특징** | Claude 업데이트, 안전성 연구 |
| **업데이트** | 주 1-2건 |
| **난이도** | ⭐⭐ (중간) |

**스크래핑 셀렉터:**
```json
{
    "list": "article",
    "title": "h2",
    "link": "a",
    "date": "time",
    "description": "p.description"
}
```

---

### 2.4 Meta AI Blog

| 항목 | 내용 |
|------|------|
| **코드** | `meta_ai` |
| **이름** | Meta AI Blog |
| **URL** | `https://ai.meta.com/blog/` |
| **특징** | LLaMA, 오픈소스 모델 |
| **업데이트** | 주 1-3건 |
| **난이도** | ⭐⭐ (중간) |

---

### 2.5 Microsoft AI Blog

| 항목 | 내용 |
|------|------|
| **코드** | `microsoft_ai` |
| **이름** | Microsoft AI Blog |
| **URL** | `https://blogs.microsoft.com/ai/` |
| **특징** | Copilot, Azure AI |
| **업데이트** | 주 2-4건 |
| **난이도** | ⭐⭐ (중간) |

---

## 3. 한국 AI 매체 (3순위)

### 3.1 AI타임스

| 항목 | 내용 |
|------|------|
| **코드** | `aitimes` |
| **이름** | AI타임스 |
| **URL** | `https://www.aitimes.com/` |
| **특징** | 국내 AI 뉴스 전문 |
| **언어** | 한국어 (번역 불필요) |
| **난이도** | ⭐⭐ (중간) |

---

### 3.2 인공지능신문

| 항목 | 내용 |
|------|------|
| **코드** | `ainews` |
| **이름** | 인공지능신문 |
| **URL** | `https://www.aitimes.kr/` |
| **특징** | AI 산업 동향 |
| **언어** | 한국어 (번역 불필요) |
| **난이도** | ⭐⭐ (중간) |

---

## 4. 수집처 우선순위 매트릭스

| 순위 | 매체 | 수집 방식 | 중요도 | 권장 |
|------|------|----------|--------|------|
| 1 | TechCrunch | RSS | ⭐⭐⭐ | ✅ |
| 2 | OpenAI Blog | 스크래핑 | ⭐⭐⭐ | ✅ |
| 3 | The Verge | RSS | ⭐⭐⭐ | ✅ |
| 4 | Anthropic | 스크래핑 | ⭐⭐⭐ | ✅ |
| 5 | VentureBeat | RSS | ⭐⭐ | ✅ |
| 6 | Google AI | 스크래핑 | ⭐⭐⭐ | ✅ |
| 7 | MIT Review | RSS | ⭐⭐ | 선택 |
| 8 | Wired | RSS | ⭐⭐ | 선택 |
| 9 | Meta AI | 스크래핑 | ⭐⭐ | 선택 |
| 10 | Microsoft AI | 스크래핑 | ⭐⭐ | 선택 |

---

## 5. 기술 구현 참고

### 5.1 RSS 파싱 예시

```python
import feedparser

def fetch_rss(url: str) -> list:
    feed = feedparser.parse(url)
    articles = []

    for entry in feed.entries:
        articles.append({
            'title': entry.title,
            'url': entry.link,
            'summary': entry.get('summary', ''),
            'content': entry.get('content', [{}])[0].get('value', ''),
            'published': entry.get('published', ''),
            'author': entry.get('author', ''),
            'thumbnail': extract_thumbnail(entry)
        })

    return articles

def extract_thumbnail(entry) -> str:
    # media:thumbnail
    if hasattr(entry, 'media_thumbnail'):
        return entry.media_thumbnail[0]['url']
    # enclosure
    if hasattr(entry, 'enclosures') and entry.enclosures:
        return entry.enclosures[0].get('url', '')
    return ''
```

### 5.2 스크래핑 예시 (Playwright)

```python
from playwright.async_api import async_playwright

async def scrape_openai_blog():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        await page.goto('https://openai.com/blog')
        await page.wait_for_selector('[data-testid="blog-card"]')

        articles = await page.evaluate('''
            () => {
                const cards = document.querySelectorAll('[data-testid="blog-card"]');
                return Array.from(cards).map(card => ({
                    title: card.querySelector('h3')?.textContent,
                    url: card.querySelector('a')?.href,
                    date: card.querySelector('time')?.textContent
                }));
            }
        ''')

        await browser.close()
        return articles
```

---

## 6. 주의사항

### 6.1 Rate Limiting
- RSS: 1시간 간격 권장
- 스크래핑: 요청 간 2-5초 대기
- 하루 총 요청: 매체당 최대 24회

### 6.2 User-Agent 설정
```python
headers = {
    'User-Agent': 'KoreaNews/1.0 (AI News Aggregator; contact@koreanews.com)'
}
```

### 6.3 저작권 준수
- 원문 URL 필수 보존
- 이미지: 직접 링크 금지, 설명 생성 또는 자체 이미지 사용
- 재구성 시 유사도 30% 이하 유지

---

*이 문서는 AI 뉴스 수집처의 기술적 상세 정보를 제공합니다.*

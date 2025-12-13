# 시스템 아키텍처 상세

> AI 뉴스 수집 시스템의 기술적 구조와 모듈 설계

---

## 1. 모듈 구조

```
scrapers/
├── ai/                          # AI 뉴스 전용 스크래퍼
│   ├── __init__.py
│   ├── base_ai_scraper.py       # AI 스크래퍼 베이스 클래스
│   ├── rss_collector.py         # RSS 수집 공통 모듈
│   ├── web_scraper.py           # 웹 스크래핑 공통 모듈
│   │
│   ├── sources/                 # 개별 소스 스크래퍼
│   │   ├── techcrunch.py
│   │   ├── theverge.py
│   │   ├── venturebeat.py
│   │   ├── openai_blog.py
│   │   └── google_ai.py
│   │
│   └── processors/              # 가공 모듈
│       ├── translator.py        # Google 번역
│       ├── fact_extractor.py    # 사실 추출 (GPT)
│       ├── rewriter.py          # AI 재작성 (GPT)
│       └── quality_checker.py   # 품질 검사
│
└── utils/
    ├── api_client.py            # API 클라이언트 (기존)
    └── deduplicator.py          # 중복 체크
```

---

## 2. 클래스 설계

### 2.1 BaseAIScraper (베이스 클래스)

```python
class BaseAIScraper(ABC):
    """AI 뉴스 스크래퍼 베이스 클래스"""

    # 설정
    SOURCE_NAME: str           # "TechCrunch"
    SOURCE_CODE: str           # "techcrunch"
    SOURCE_URL: str            # "https://techcrunch.com"
    CATEGORY: str = "AI"       # 카테고리
    REGION: str = "AI"         # 지역 (수집처 관리용)

    # 수집 방식
    COLLECTION_TYPE: str       # "rss" | "scraping" | "api"
    RSS_URL: Optional[str]     # RSS URL (있는 경우)

    @abstractmethod
    def collect(self, limit: int = 10) -> List[RawArticle]:
        """기사 수집"""
        pass

    @abstractmethod
    def parse_article(self, item: Any) -> RawArticle:
        """개별 기사 파싱"""
        pass

    def save_raw(self, articles: List[RawArticle]) -> int:
        """원문 저장"""
        pass
```

### 2.2 RSSCollector (RSS 수집기)

```python
class RSSCollector:
    """RSS 피드 수집 공통 모듈"""

    def __init__(self, feed_url: str):
        self.feed_url = feed_url
        self.parser = feedparser

    def fetch(self, limit: int = 20) -> List[FeedEntry]:
        """RSS 피드 가져오기"""
        feed = self.parser.parse(self.feed_url)
        return feed.entries[:limit]

    def parse_entry(self, entry: FeedEntry) -> RawArticle:
        """엔트리를 RawArticle로 변환"""
        return RawArticle(
            title=entry.title,
            url=entry.link,
            content=entry.summary or entry.content[0].value,
            published_at=entry.published_parsed,
            author=entry.get('author', ''),
            thumbnail=self._extract_thumbnail(entry)
        )
```

### 2.3 Translator (번역기)

```python
class GoogleTranslator:
    """Google Translate 무료 API 활용"""

    BASE_URL = "https://translate.google.com/m"

    def translate(self, text: str,
                  source: str = "en",
                  target: str = "ko") -> str:
        """텍스트 번역"""
        # 무료 웹 버전 활용
        # 또는 googletrans 라이브러리 사용
        pass

    def translate_article(self, article: RawArticle) -> TranslatedArticle:
        """기사 전체 번역"""
        return TranslatedArticle(
            title_ko=self.translate(article.title),
            content_ko=self.translate(article.content),
            original=article
        )
```

### 2.4 FactExtractor (사실 추출기)

```python
class FactExtractor:
    """GPT를 이용한 사실 추출"""

    PROMPT_TEMPLATE = """
    다음 기사에서 사실(Fact)만 추출하세요.
    원문의 표현이 아닌, 순수한 사실 정보만 JSON으로 반환하세요.

    [기사]
    {article_content}

    [출력 형식]
    {
        "who": "주체 (회사/인물)",
        "what": "무엇을 했는지",
        "when": "언제 (날짜/시간)",
        "where": "어디서",
        "why": "왜 (이유/배경)",
        "how": "어떻게 (방법/과정)",
        "numbers": ["관련 수치들"],
        "key_facts": ["핵심 사실 1", "핵심 사실 2", ...]
    }
    """

    def extract(self, article: TranslatedArticle) -> FactData:
        """사실 추출"""
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "당신은 팩트체커입니다."},
                {"role": "user", "content": self.PROMPT_TEMPLATE.format(
                    article_content=article.content_ko
                )}
            ]
        )
        return FactData.from_json(response.choices[0].message.content)
```

### 2.5 Rewriter (AI 재작성기)

```python
class ArticleRewriter:
    """GPT를 이용한 기사 재작성"""

    PROMPT_TEMPLATE = """
    당신은 한국의 IT 전문 기자입니다.

    다음 사실들을 바탕으로 완전히 새로운 한글 기사를 작성하세요.

    [중요 규칙]
    1. 원문의 표현을 절대 사용하지 마세요
    2. 사실만 활용하고 새로운 문장으로 작성하세요
    3. 한국 독자 관점에서 의미를 설명하세요
    4. 300-500자로 작성하세요
    5. 제목도 새로 작성하세요

    [추출된 사실]
    - 주체: {who}
    - 내용: {what}
    - 시점: {when}
    - 장소: {where}
    - 배경: {why}
    - 방법: {how}
    - 수치: {numbers}
    - 핵심: {key_facts}

    [출력 형식]
    제목: ...
    본문: ...
    """

    def rewrite(self, facts: FactData,
                original_url: str) -> RewrittenArticle:
        """기사 재작성"""
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "당신은 IT 전문 기자입니다."},
                {"role": "user", "content": self.PROMPT_TEMPLATE.format(**facts.to_dict())}
            ]
        )

        result = self._parse_response(response.choices[0].message.content)
        result.source_url = original_url
        result.source_type = "rewritten"

        return result
```

### 2.6 QualityChecker (품질 검사기)

```python
class QualityChecker:
    """재작성 기사 품질 검사"""

    MAX_SIMILARITY = 0.3  # 원문 유사도 30% 이하
    MIN_LENGTH = 200      # 최소 200자
    MAX_LENGTH = 1000     # 최대 1000자

    def check(self, original: str,
              rewritten: str) -> QualityResult:
        """품질 검사"""

        # 1. 유사도 검사
        similarity = self._calculate_similarity(original, rewritten)
        if similarity > self.MAX_SIMILARITY:
            return QualityResult(
                passed=False,
                reason=f"유사도 {similarity:.1%} > {self.MAX_SIMILARITY:.1%}"
            )

        # 2. 길이 검사
        length = len(rewritten)
        if length < self.MIN_LENGTH or length > self.MAX_LENGTH:
            return QualityResult(
                passed=False,
                reason=f"길이 {length}자 (허용: {self.MIN_LENGTH}-{self.MAX_LENGTH})"
            )

        # 3. 필수 요소 검사
        if not self._has_required_elements(rewritten):
            return QualityResult(
                passed=False,
                reason="필수 요소 누락"
            )

        return QualityResult(passed=True)

    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """텍스트 유사도 계산 (코사인 유사도)"""
        # TF-IDF 또는 간단한 토큰 비교
        pass
```

---

## 3. 데이터 모델

### 3.1 RawArticle (원문)

```python
@dataclass
class RawArticle:
    """수집된 원문 기사"""
    id: Optional[str] = None
    source_code: str = ""          # "techcrunch"
    source_name: str = ""          # "TechCrunch"
    url: str = ""                  # 원문 URL
    url_hash: str = ""             # URL 해시 (중복 체크용)

    title: str = ""                # 원문 제목
    content: str = ""              # 원문 본문
    author: str = ""               # 작성자
    thumbnail: Optional[str] = None

    published_at: Optional[datetime] = None
    collected_at: datetime = field(default_factory=datetime.now)

    status: str = "pending"        # pending | processing | done | error
```

### 3.2 ProcessedArticle (가공된 기사)

```python
@dataclass
class ProcessedArticle:
    """가공된 기사"""
    raw_id: str                    # 원문 ID (참조)

    # 번역
    title_ko: str = ""
    content_ko: str = ""

    # 추출된 사실
    facts: Optional[FactData] = None

    # 재작성
    rewritten_title: str = ""
    rewritten_content: str = ""

    # 품질
    similarity_score: float = 0.0
    quality_passed: bool = False

    # 메타
    processed_at: datetime = field(default_factory=datetime.now)
```

---

## 4. API 엔드포인트

### 4.1 수집 API

```
POST /api/ai-news/collect
{
    "source": "techcrunch",    // 또는 "all"
    "limit": 10
}

Response:
{
    "success": true,
    "collected": 10,
    "duplicates": 2,
    "new": 8
}
```

### 4.2 가공 API

```
POST /api/ai-news/process
{
    "raw_id": "uuid",
    "mode": "rewrite"          // "reference" | "rewrite"
}

Response:
{
    "success": true,
    "article": {
        "title": "...",
        "content": "...",
        "source_url": "..."
    }
}
```

### 4.3 발행 API

```
POST /api/ai-news/publish
{
    "processed_id": "uuid",
    "status": "draft"          // "draft" | "published"
}
```

---

## 5. 설정 파일

### config/ai_news.yaml

```yaml
# AI 뉴스 수집 설정
collection:
  schedule: "0 * * * *"        # 매시 정각
  max_per_source: 10

sources:
  techcrunch:
    enabled: true
    type: rss
    url: "https://techcrunch.com/category/artificial-intelligence/feed/"
    priority: 1

  openai_blog:
    enabled: true
    type: scraping
    url: "https://openai.com/blog"
    priority: 2

processing:
  translator: google
  rewriter: gpt-4o
  quality_threshold: 0.3

publishing:
  auto_publish: false          # 자동 발행 여부
  default_category: "AI"
  default_status: "draft"
```

---

*이 문서는 AI 뉴스 수집 시스템의 기술적 설계를 정의합니다.*

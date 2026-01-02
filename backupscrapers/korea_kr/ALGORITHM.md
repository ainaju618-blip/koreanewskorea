# korea.kr (Government Press Release) Scraper Algorithm

> **Version:** v3.1
> **Created:** 2025-12-25
> **Updated:** 2025-12-25
> **Author:** Claude AI Agent + External Expert Analysis
> **Site:** https://www.korea.kr/briefing/pressReleaseList.do

---

## 1. Site Overview

| Item | Value |
|------|-------|
| **Site Name** | Government Policy Briefing (korea.kr) |
| **Target URL** | https://www.korea.kr/briefing/pressReleaseList.do |
| **Content Type** | Government Press Releases (All ministries) |
| **Security Level** | LOW (No WAF, No CAPTCHA, No Rate Limiting) |
| **JavaScript Required** | NO (Static HTML) |

---

## 2. URL Patterns

### 2.1 List Page
```
BASE: https://www.korea.kr/briefing/pressReleaseList.do

Parameters:
  pageIndex=[1-N]        # Page number
  startDate=YYYY-MM-DD   # Search start date
  endDate=YYYY-MM-DD     # Search end date
  repCodeType=           # Ministry type code
  repCode=               # Ministry code
  srchWord=              # Search keyword

Example:
  /briefing/pressReleaseList.do?pageIndex=1
```

### 2.2 Detail Page
```
BASE: https://www.korea.kr/briefing/pressReleaseView.do

Parameters:
  newsId=[ID]            # Required - Article ID

Example:
  /briefing/pressReleaseView.do?newsId=156736831
```

### 2.3 File Download
```
BASE: https://www.korea.kr/common/download.do

Parameters:
  fileId=[ID]            # File ID
  tblKey=GMN             # Table key

Example:
  /common/download.do?fileId=198310702&tblKey=GMN
```

### 2.4 RSS Feed (Alternative - Expert Discovered)
```
URL: https://www.korea.kr/rss/pressrelease.xml

Advantages:
  - No HTML parsing needed
  - Structured XML data
  - More stable than DOM scraping
  - Faster processing

Contents:
  - title: Article title
  - link: Detail page URL
  - pubDate: Publication date
  - description: Summary
```

---

## 3. HTML Selectors (Expert Verified)

### 3.1 List Page Structure

```html
<!-- Actual HTML structure (verified by external expert) -->
<div class="list_type">
  <ul>
    <li>
      <a href="/briefing/pressReleaseView.do?newsId=156736831">
        <span class="text">[Article Title]</span>
        <span class="source">2025.12.25 Ministry Name</span>
      </a>
    </li>
    ...
  </ul>
</div>
```

### 3.2 List Page Selectors (Expert Verified)

| Element | Selector | Notes |
|---------|----------|-------|
| **Container** | `.list_type ul` | Main article list |
| **Article Links** | `.list_type ul > li > a` | Primary (tested) |
| **Article Links** | `a[href*='pressReleaseView.do']` | Fallback |
| **Title** | `span.text` | Inside link |
| **Source Info** | `span.source` | Format: "YYYY.MM.DD Ministry" |

### 3.3 Detail Page Selectors (Expert Verified)

| Element | Selector | Notes |
|---------|----------|-------|
| **Title** | `h2.page_title strong` | Primary (tested) |
| **Date** | `div.info > span:first-child` | Format: YYYY.MM.DD |
| **Ministry** | `a[href*="ministryNewsList"]` | Link text |
| **Content** | `iframe[name="innerWrap"]` | **IMPORTANT: Content is inside iframe!** |
| **Attachments** | `a[href*="/common/download.do"]` | File download links |
| **Images** | `meta[property="og:image"]` | OG image (primary) |
| **Images** | `#content img` | Content images (fallback) |

### 3.4 Content Structure (CRITICAL!)

**korea.kr uses a docViewer iframe to display article content:**

```html
<!-- Main page structure -->
<div class="view_cont">
  <!-- Only shows a short placeholder text (38 chars) -->
  본 자료는 ○○부에서 배포한 자료입니다.
</div>

<div class="docConversion">
  <!-- Content is loaded in an iframe -->
  <iframe id="content_press" name="content_press"
          src="/docViewer/iframe_skin/doc.html?fn=...&rs=/docViewer/result/...">
  </iframe>
</div>

<!-- Inside the iframe, there's another frame -->
<iframe name="innerWrap"
        src="/docViewer/result/YYYY.MM/DD/[hash]/[hash].html">
  <!-- ACTUAL CONTENT IS HERE! -->
</iframe>
```

**Content Extraction Algorithm:**

```python
# 1. Wait for iframe to load (2 seconds)
time.sleep(2)

# 2. Find the innerWrap frame or frame with docViewer/result URL
for frame in page.frames:
    if frame.name == 'innerWrap' or 'docViewer/result' in frame.url:
        content = frame.evaluate('() => document.body.innerText')
        if content and len(content) > 100:
            break  # Found the content!

# 3. Fallback to main page if iframe not found
if not content or len(content) < 100:
    content = page.evaluate('() => document.querySelector(".view_cont")?.innerText')
```

**Why this is important:**
- `.view_cont` selector returns only ~38 characters (placeholder text)
- `.docConversion` contains the iframe, not the content directly
- Must access `innerWrap` frame to get actual article content
- Frame URL pattern: `/docViewer/result/YYYY.MM/DD/[hash]/...`

### 3.5 Source Info Parsing

```python
# span.source contains: "2025.12.25 Ministry Name"
def parse_source_info(source_text):
    # Extract date with regex
    date_match = re.search(r'(\d{4}\.\d{2}\.\d{2})', source_text)
    date = date_match.group(1) if date_match else None

    # Ministry is after the date
    ministry = source_text.replace(date, '').strip() if date else source_text

    return date, ministry
```

---

## 4. Stealth Strategy

### 4.1 Threat Assessment

| Threat | Level | Mitigation |
|--------|-------|------------|
| WAF | NONE | No action needed |
| CAPTCHA | NONE | No action needed |
| Rate Limiting | LOW | 2-3 sec delay recommended |
| IP Blocking | LOW | Polite request interval |
| Bot Detection | NONE | Standard headers sufficient |

### 4.2 Required Headers

```python
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://www.korea.kr/',
    'Cache-Control': 'max-age=0',
    'Upgrade-Insecure-Requests': '1',
    'Connection': 'keep-alive'
}
```

### 4.3 Stealth Techniques (Optional but Recommended)

1. **Session Management**
   - Maintain cookies across requests (JSESSIONID)
   - Use `requests.Session()` for persistence

2. **Request Timing**
   - Random delay: 1-3 seconds between requests
   - Longer delay (5-10s) for batch operations
   - Night crawling for heavy workloads

3. **playwright-stealth** (if using Playwright)
   ```python
   from playwright_stealth import stealth_sync
   stealth_sync(page)
   ```

4. **Fingerprint Randomization** (Advanced)
   - Rotate User-Agent occasionally
   - Randomize viewport size
   - Randomize accept-language

---

## 5. Data Flow

```
                     [1. List Page Request]
                              |
                              v
              +-------------------------------+
              |  Parse article links (10-20)  |
              |  Extract: title, url, date    |
              +-------------------------------+
                              |
                              v
                     [2. Deduplication Check]
                              |
                 +------------+------------+
                 |                         |
            [EXISTS]                  [NEW ARTICLE]
                 |                         |
              [SKIP]                       v
                              +-------------------------+
                              |  3. Detail Page Request |
                              +-------------------------+
                                           |
                                           v
                              +-------------------------+
                              |  Parse: title, content  |
                              |  date, ministry, files  |
                              +-------------------------+
                                           |
                                           v
                              +-------------------------+
                              |  4. Image Download      |
                              |  (if exists)            |
                              +-------------------------+
                                           |
                                           v
                              +-------------------------+
                              |  5. Upload to Cloudinary|
                              |  or save locally        |
                              +-------------------------+
                                           |
                                           v
                              +-------------------------+
                              |  6. Send to API Server  |
                              |  POST /api/bot/ingest   |
                              +-------------------------+
```

---

## 6. Error Handling

| Error Type | Action | Retry |
|------------|--------|-------|
| Network Timeout | Wait 5s, retry | 3 times |
| 404 Not Found | Skip article, log | No |
| 500 Server Error | Wait 10s, retry | 2 times |
| Parse Error | Log, continue | No |
| Image Download Fail | Skip image, save article | No |
| API Send Fail | Retry after 5s | 3 times |

---

## 7. Configuration

```python
# Region/Source Constants
REGION_CODE = 'korea_kr'
REGION_NAME = 'Government'
CATEGORY_NAME = 'National'
BASE_URL = 'https://www.korea.kr'
LIST_URL = 'https://www.korea.kr/briefing/pressReleaseList.do'

# Timing
REQUEST_DELAY = 2          # seconds between requests
PAGE_DELAY = 3             # seconds between pages
MAX_RETRIES = 3            # max retry attempts
TIMEOUT = 30000            # page load timeout (ms)

# Collection Limits
DEFAULT_DAYS = 3           # default collection period
DEFAULT_MAX_ARTICLES = 10  # default max articles
MAX_PAGES = 5              # max pages to crawl
```

---

## 8. Dependencies

```
playwright>=1.40.0
playwright-stealth>=1.0.0
beautifulsoup4>=4.12.0
requests>=2.31.0
lxml>=4.9.0
```

---

## 9. Testing Checklist

- [ ] List page loads correctly
- [ ] Article links extracted (minimum 10)
- [ ] Detail page navigation works
- [ ] Title extraction correct
- [ ] Content extraction clean
- [ ] Date parsing correct (YYYY-MM-DD)
- [ ] Ministry extraction works
- [ ] Image download successful
- [ ] Cloudinary upload works
- [ ] API transmission successful
- [ ] Duplicate detection works
- [ ] Date filtering works
- [ ] Error handling graceful

---

## 10. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 3.1 | 2025-12-25 | Fixed content extraction - discovered content is inside docViewer iframe (innerWrap frame). Added section 3.4 documenting iframe structure. |
| 3.0 | 2025-12-25 | Rewrote scraper to match municipal scraper pattern (naju_scraper.py style) |
| 2.0 | 2025-12-25 | Updated with external expert verified selectors, added RSS feed option |
| 1.0 | 2025-12-25 | Initial version |

---

## 11. Sample Data (Expert Provided)

| # | Title | Date | Ministry | Image | File |
|---|-------|------|----------|:-----:|:----:|
| 1 | 2025 Fuel Subsidy for Greenhouse Farmers | 2025.12.25 | Ministry of Agriculture | O | O |
| 2 | Major Economic Policies for 2025 Announcement | 2025.12.25 | Ministry of Economy | O | O |
| 3 | Suncheon Bay Reed Festival Opening | 2025.12.24 | Ministry of Culture | O | X |
| 4 | National Highway 1 Expansion Plan | 2025.12.24 | Ministry of Land | O | O |
| 5 | Winter Electricity Rate Subsidy Program | 2025.12.24 | Ministry of Trade | X | O |

---

*This document is the source of truth for korea.kr scraper development.*
*Updated with external expert analysis (2025-12-25)*

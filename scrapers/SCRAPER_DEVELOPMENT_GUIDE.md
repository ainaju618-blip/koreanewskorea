# Scraper Development Guide
> **Location:** `D:\cbt\koreanews\scrapers\`  
> **Version:** v2.0  
> **Last Updated:** 2025-12-12

---

## 📋 Overview

Each organization's website has a different structure, so scraping methods vary.  
This document defines the **standard workflow for efficiently developing scrapers through collaboration with an external partner**.

---

## 🔄 Collaboration Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  1. Developer writes "Foundation Data Request"               │
│     ↓                                                        │
│  2. User delivers to external partner                        │
│     ↓                                                        │
│  3. Partner analyzes site and provides foundation data       │
│     ↓                                                        │
│  4. Developer builds and tests scraper with the data         │
│     ↓                                                        │
│  5. If issues arise → explain situation → partner provides   │
│     additional data                                          │
│     ↓                                                        │
│  6. Create ALGORITHM.md documentation after completion       │
└─────────────────────────────────────────────────────────────┘
```

**Key Principles:**
- Developer does NOT directly browse the target site
- External partner extracts necessary information on-site
- Request by explaining "our situation" rather than "give me this selector"

---

## 📝 Foundation Data Request for External Partner

Deliver the following full content to the external partner.

---

### 0. Collaboration Process

We collaborate in the following way:

```
┌─────────────────────────────────────────────────────────────┐
│  1. Developer writes "Foundation Data Request" (this doc)    │
│     ↓                                                        │
│  2. User delivers to external partner (you)                  │
│     ↓                                                        │
│  3. Partner analyzes site and provides data ← YOUR ROLE      │
│     ↓                                                        │
│  4. Developer builds and tests scraper with the data         │
│     ↓                                                        │
│  5. If issues arise → explain situation → you provide more   │
│     ↓                                                        │
│  6. Create ALGORITHM.md documentation after completion       │
└─────────────────────────────────────────────────────────────┘
```

**Your Role:** Access the actual website and analyze/extract the information requested below.

---

### 1. Project Overview

**"Korea News"** - Regional News Aggregation Platform

A system that **automatically collects** press releases from Jeollanam-do, Gwangju City, Gwangju Education Office, Jeonnam Education Office, and 22 cities/counties in Jeonnam, and displays them on a unified website.

---

### 2. Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend/Backend | Next.js 16 (App Router) |
| Database | Supabase (PostgreSQL) |
| Scraper | Python (Playwright) |
| Image Storage | Cloudinary |

**Data Flow:**
```
[Scraper] → POST /api/bot/ingest → [Supabase DB] → [Website Display]
```

---

### 3. API Fields (Specification)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ | Article title |
| `original_link` | string | ✅ | Detail page URL (duplicate check key) |
| `content` | string | ⭕ | Body content (excluding menu/footer) |
| `source` | string | ⭕ | Source organization (e.g., "Naju City") |
| `category` | string | ⭕ | Category (e.g., "Jeonnam", "Gwangju") |
| `region` | string | ⭕ | Region code (e.g., "naju", "gwangju") |
| `published_at` | string | ⭕ | Publish date (ISO 8601) |
| `thumbnail_url` | string | ⭕ | Thumbnail image URL |

---

### 4. Image Handling (Important!)

**Problem:**
- Most government sites have **hotlink prevention**
- Direct external access to image URLs returns **403 Forbidden**

**Our Solution:**
1. Extract image URL
2. Scraper downloads image (with Referer header)
3. **Resize to 800px width (maintain aspect ratio for height)**
4. Upload to Cloudinary
5. Save Cloudinary URL as thumbnail_url

**Information needed from partner:**
- Where is the image? (img tag in body? attachment download?)
- Is URL absolute or relative?
- Is external access allowed?
- If not, what headers/session required?

---

### 5. Scraper Structure (Reference)

```python
# 1. Collect article links from list page
for row in list_page_rows:
    title = extract_title(row)
    href = extract_link(row)
    article_id = extract_id(href)
    
# 2. Visit each detail page
for article in collected_articles:
    visit_detail_page(article.url)
    content = extract_body()
    date = extract_date()
    image_url = extract_image()
    
    # 3. Upload to Cloudinary
    if image_url:
        cloudinary_url = download_and_upload_image(image_url)
    
    # 4. Send to server
    send_article_to_server({title, content, date, cloudinary_url, ...})
```

---

### 6. Site-Specific Information Needed

**[List Page]**
- Location of article table/list
- Title link location
- Article ID extraction method (e.g., bs_idx=12345)
- Pagination URL pattern

**[Detail Page]**
- Body text area (CSS selector or structure)
- Date location and format
- Image location

---

### 7. Requested Output Format

```
## [Organization Name] Press Release Scraping Guide

### 1. URL Information
- List URL: https://...
- Detail page URL pattern: ?idx={ID}&mode=view
- Pagination: ?page={N} or ?offset={N*10}

### 2. List Page Structure
- Article row location: (e.g., table tbody tr)
- Title link location: (e.g., td:nth-child(2) a)
- Date column: (e.g., td:nth-child(4))
- ID extraction method: (e.g., idx=(\d+) regex from href)

### 3. Detail Page Structure
- Body area: (e.g., div.view_content)
- Date location: (e.g., th:has-text("작성일") + td)
- Image location: (e.g., attachment or img in body)

### 4. Image Access
- Hotlink allowed: Yes/No
- If not: Referer required, session required, etc.

### 5. Sample Data (5 articles)
[
  {
    "id": "12345",
    "title": "Article title",
    "date": "2025-12-12",
    "url": "https://...",
    "content": "Body content...",
    "image_url": "https://..."
  }
]
```

---

### 8. Additional/Special Cases

If there are any special situations not mentioned above, please include:

- **Login/Authentication** required
- **JavaScript dynamic loading** content
- Body content inside **iframe**
- Document displayed via **HWP viewer**
- Data fetched via **AJAX/API calls**
- **CAPTCHA** or access restrictions
- Other **unusual structures**

---

### 9. When Problems Occur

If issues arise during testing, I will explain the specific situation:
- Which selector doesn't work
- What data is missing
- What errors occur

Please provide additional information to address the problem.

---

## 📁 Folder Structure Rules

When creating a new scraper, follow this structure:

```
scrapers/
├── [organization_name]/
│   ├── [organization_name]_scraper.py    # Main scraper code
│   └── ALGORITHM.md                       # Algorithm documentation (Required!)
```

---

## 📋 ALGORITHM.md Writing Rules

After completing the scraper, you MUST create an `ALGORITHM.md` file.

### Required Sections

| Section | Content |
|---------|---------|
| **Overview** | Target site, Region Code, Category |
| **Flow** | Phase-by-phase explanation (Collect → Visit → Verify → Ingest) |
| **Selectors** | List, body, image, date extraction selectors |
| **Constants** | BASE_URL, LIST_URL, REGION_CODE, etc. |
| **Special Notes** | Hotlink prevention, HWP iframe, site-specific issues |
| **Execution** | CLI command examples |

### Reference Examples
- `scrapers/jeonnam/ALGORITHM.md`
- `scrapers/gwangju/ALGORITHM.md`
- `scrapers/naju/ALGORITHM.md`

---

## ⚠️ Important Notes

1. **🖼️ Cloudinary Upload Required**  
   All scrapers MUST upload images to Cloudinary
   ```python
   from utils.cloudinary_uploader import download_and_upload_image
   
   if thumbnail_url:
       cloudinary_url = download_and_upload_image(thumbnail_url, BASE_URL, folder="region_code")
       if cloudinary_url:
           thumbnail_url = cloudinary_url
   ```

2. **Processing Limit**: Maximum 10 articles per run

3. **Rate Limiting**: Apply `time.sleep(1)` after each article

---

## 🧪 Testing Methods

```bash
# Default execution (max 10 articles)
python [organization]_scraper.py

# Collect max 5 articles
python [organization]_scraper.py --max-articles 5

# Apply date filter (last 30 days)
python [organization]_scraper.py --days 30
```

---

## 📊 Existing Scraper Reference

| Organization | Folder | Special Notes |
|--------------|--------|---------------|
| Jeonnam Province | `jeonnam/` | Attachment image extraction, Phase structure |
| Gwangju City | `gwangju/` | Hotlink prevention, Cloudinary required |
| Gwangju Education Office | `gwangju_edu/` | JS evaluate, Special URL pattern |
| Naju City | `naju/` | Extract body from div after img |

---

## 🌐 Jeonnam City/County Press Release URLs

### Metropolitan/Province
| Organization | Press Release URL |
|--------------|-------------------|
| Gwangju City | https://www.gwangju.go.kr/boardList.do?boardId=BD_0000000027&pageId=www789 |
| Jeollanam-do | https://www.jeonnam.go.kr/M7116/boardList.do?menuId=jeonnam0202000000 |

### Cities (5)
| Organization | Press Release URL |
|--------------|-------------------|
| Mokpo | https://www.mokpo.go.kr/www/mokpo_news/press_release/report_material |
| Yeosu | https://www.yeosu.go.kr/www/govt/news/release/press |
| Suncheon | http://www.suncheon.go.kr/kr/news/0006/0001/ |
| Naju | https://www.naju.go.kr/www/administration/reporting/coverage |
| Gwangyang | https://gwangyang.go.kr/board.es?mid=a11007000000&bid=0057 |

### Counties (17)
| Organization | Press Release URL |
|--------------|-------------------|
| Damyang | https://www.damyang.go.kr/board/list.damyang?boardId=BBS_0000021&menuId=DAMYANG000052 |
| Gokseong | https://www.gokseong.go.kr/kr/board/list.do?bbsId=BBS_000000000000151&menuNo=102001002000 |
| Gurye | https://www.gurye.go.kr/board/list.do?bbsId=BBS_0000000000000300&menuNo=115004006000 |
| Goheung | https://www.goheung.go.kr/www/news/press |
| Boseong | https://www.boseong.go.kr/www/news/press |
| Hwasun | https://www.hwasun.go.kr/www/news/press |
| Jangheung | https://www.jangheung.go.kr/www/news/press |
| Gangjin | https://www.gangjin.go.kr/contents.do?idx=865 |
| Haenam | https://www.haenam.go.kr/www/news/press |
| Yeongam | https://www.yeongam.go.kr/home/www/open_info/yeongam_news/press |
| Muan | https://www.muan.go.kr/www/news/press |
| Hampyeong | https://www.hampyeong.go.kr/boardList.do?pageId=www275&boardId=NEWS |
| Yeonggwang | https://www.yeonggwang.go.kr/bbs/?b_id=news_data&site=headquarter_new&mn=9056 |
| Jangseong | https://www.jangseong.go.kr/www/news/press |
| Wando | https://www.wando.go.kr/wando/sub.cs?m=299 |
| Jindo | https://www.jindo.go.kr/www/news/press |
| Shinan | https://www.shinan.go.kr/www/news/press |

### Education Offices (2)
| Organization | Press Release URL |
|--------------|-------------------|
| Gwangju Education Office | https://enews.gen.go.kr/v5/?sid=25 |
| Jeonnam Education Office | https://www.jne.go.kr/www/news/press |

# Damyang Scraper Algorithm

## Overview
- **Source**: Damyang County Office (담양군청)
- **Category**: Jeonnam (전남) -> Damyang (담양군)
- **Base URL**: `https://www.damyang.go.kr`
- **List URL**: `https://www.damyang.go.kr/board/list?domainId=DOM_0000001&boardId=BBS_0000007&contentsSid=12&menuCd=DOM_000000190001005001`

## Structure
### List Page
- **Pagination**: URL parameter `&page={N}` (To be verified, otherwise JS click)
- **Rows**: `table tbody tr`
- **Columns**:
    - No: `td:nth-child(1)`
    - Title: `td.subject a` (Link contains `dataSid`)
    - Writer: `td:nth-child(3)`
    - Date: `td:nth-child(4)` (Format: YYYY-MM-DD)
    - Department: `td:nth-child(5)`

### Detail Page
- **URL**: `/board/detail?dataSid={ID}&boardId=BBS_0000007...`
- **Title**: `.view_title` or generic header
- **Date**: `li.date` or list item "등록일"
- **Content**: `.view_content` or `div.con_txt`
- **Images**: `img` inside content or attached files
- **Attachments**: List items with "Download" buttons.

## Logic
1. **List Parsing**: Iterate pages 1-5. Extract `dataSid` to construct full detail URL.
2. **Detail Parsing**:
    - Fetch page.
    - Extract Content using selectors.
    - Extract Images: Check standard content images AND attachment images.
    - Extract Attachments: Identify JS download buttons (e.g. `onclick="fn_download(...)"`) and reverse-engineer if possible, or skip if complex auth needed (public access usually allows direct link construction if pattern is known).
    - If JS download is too complex for static link construction, use `playwright` to intercept download or click and capture (advanced). For now, prioritize content.

## Selectors
- `LIST_ROWS`: `tbody tr`
- `DETAIL_CONTENT`: `div.view_con`, `div.board_view`
- `DETAIL_DATE`: `span:has-text("등록일")`

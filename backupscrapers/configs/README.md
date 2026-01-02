# Scraper Configs (scrapers/configs) AI Guide

> **Summary:** Configuration files for Korea NEWS scrapers.

---

## Config Files

| File | Description |
|------|-------------|
| `regional_configs.py` | **27 region scraper configurations** |
| `translation_keys.json` | Translation API keys |
| `translation_usage.json` | Translation usage tracking |

---

## regional_configs.py

Contains configuration for all 27 regional scrapers including:
- Base URLs
- Selectors
- Category mappings
- Region-specific settings

---

## FAQ

| Question | Answer |
|----------|--------|
| "Region configurations?" | `regional_configs.py` |
| "Translation keys?" | `translation_keys.json` |
| "지역별 설정 파일?" | `regional_configs.py` |
| "27개 지역 설정?" | `regional_configs.py` |
| "스크래퍼 URL 어디서 바꿔?" | `regional_configs.py` - Base URLs |
| "셀렉터 설정 위치?" | `regional_configs.py` - Selectors |
| "카테고리 매핑?" | `regional_configs.py` - Category mappings |
| "번역 API 키?" | `translation_keys.json` |
| "번역 사용량?" | `translation_usage.json` |
| "지역 설정 추가?" | `regional_configs.py`에 새 지역 추가 |

---

## Related Documents

| Document | Path |
|----------|------|
| Scrapers Guide | `scrapers/README.md` |
| Scraper Development | `scrapers/SCRAPER_GUIDE.md` |

---

*Last updated: 2025-12-17*

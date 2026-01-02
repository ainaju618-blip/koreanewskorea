# 장성군 스크래퍼

장성군청 보도자료 스크래퍼 (v2.0)

## 실행 방법

```bash
cd scrapers
python -m jangseong.jangseong_scraper --days 7 --max-articles 10
```

## 테스트

```bash
python -m jangseong.jangseong_scraper --dry-run --max-articles 2
```

---

## FAQ

| Question | Answer |
|----------|--------|
| "장성 스크래퍼 어디?" | `jangseong_scraper.py` |
| "장성 보도자료 수집?" | `jangseong_scraper.py` |
| "장성 스크래퍼 실행?" | `python -m jangseong.jangseong_scraper --days 7 --max-articles 10` |
| "장성 스크래퍼 테스트?" | `--dry-run --max-articles 2` 옵션 사용 |
| "장성 스크래퍼 버전?" | v2.0 |

---

## Related Documents

| Document | Path |
|----------|------|
| Scrapers Index | `scrapers/README.md` |
| Scraper Guide | `scrapers/SCRAPER_GUIDE.md` |
| Status | `scrapers/STATUS.md` |

# 스크래퍼 실행 커맨드

활성화된 4개 스크래퍼를 순차 실행합니다.

## 실행할 스크래퍼

1. **나주시청** - `scrapers/naju/naju_scraper.py`
2. **나주시의회** - `scrapers/naju_council/naju_council_scraper.py`
3. **진도군청** - `scrapers/jindo/jindo_scraper.py`
4. **진도군의회** - `scrapers/jindo_council/jindo_council_scraper.py`

## 실행 명령

```bash
cd d:\cbt\koreanewskorea\scrapers

# 1. 나주시청
python naju/naju_scraper.py

# 2. 나주시의회
python naju_council/naju_council_scraper.py

# 3. 진도군청
python jindo/jindo_scraper.py

# 4. 진도군의회
python jindo_council/jindo_council_scraper.py
```

## 실행 후 확인사항

1. 각 스크래퍼 실행 결과 출력 확인 (에러 없음)
2. Supabase `posts` 테이블에서 신규 데이터 확인
3. 이미지 URL이 유효한지 확인
4. `status` 필드가 올바른지 확인 (draft/published)

## 주의사항

- ❌ `scrapers/_disabled/` 폴더의 스크래퍼는 실행 금지
- ✅ 위 4개만 실행
- 에러 발생 시 해당 스크래퍼만 수정 후 재실행

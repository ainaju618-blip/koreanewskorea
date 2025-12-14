# [GUIDE] Ingest API 사용법

## 엔드포인트
```
POST /api/bot/ingest
```

## 요청 형식
```json
{
  "title": "기사 제목",
  "content": "본문 내용",
  "original_link": "https://원본URL",
  "source": "광주광역시",
  "category": "광주",
  "region": "gwangju",
  "thumbnail_url": "/images/gwangju/xxx.jpg",
  "published_at": "2025-12-15T10:00:00Z"
}
```

## 처리 로직

### 1. 중복 체크
- `original_link` 기준
- 중복 시 `{ duplicate: true }` 반환

### 2. 기자 자동 배정
```typescript
const randomReporter = reporters[Math.floor(Math.random() * reporters.length)];
article.author_id = randomReporter.id;
article.author_name = randomReporter.name;
```

### 3. 상태 설정
- 초기 상태: `draft`
- 승인 시: `published` + `published_at` 갱신

## 응답
```json
// 성공
{ "success": true, "id": "uuid" }

// 중복
{ "duplicate": true }

// 에러
{ "message": "에러 메시지" }
```

## 스크래퍼에서 호출
```python
response = requests.post(
    'https://koreanews.vercel.app/api/bot/ingest',
    json=article_data,
    headers={'Content-Type': 'application/json'}
)
```

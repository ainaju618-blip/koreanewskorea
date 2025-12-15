# 이미지 로딩 속도 느림 / LCP 37.7초

## 증상
- 카테고리 페이지에서 이미지 로딩이 매우 느림
- PageSpeed Insights LCP: 37.7초
- 서버 응답 시간: 19.8초

## 원인
1. **`force-dynamic` 사용**: 매 요청마다 서버에서 DB 조회
2. **`select('*')` 사용**: 불필요한 모든 컬럼을 가져옴
3. **이미지 최적화 없음**: 원본 이미지 그대로 전송

## 해결
### 1. ISR 적용 (revalidate=60)
```tsx
// 이전
export const dynamic = 'force-dynamic';

// 이후
export const revalidate = 60;
```

### 2. 필요한 필드만 선택
```tsx
// 이전
.select('*', { count: 'exact' })

// 이후
.select('id, title, content, ai_summary, thumbnail_url, published_at', { count: 'exact' })
```

### 3. next-cloudinary 적용
```bash
npm install next-cloudinary
```

```tsx
// OptimizedImage 컴포넌트
import { CldImage } from 'next-cloudinary';
<CldImage src={publicId} format="auto" quality="auto" />
```

## 결과
- **Performance**: 61점 → 100점
- **LCP**: 37.7초 → 0.8초

## 발생일
2025-12-15 (by Gemini)

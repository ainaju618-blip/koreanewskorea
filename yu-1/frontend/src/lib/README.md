# Frontend Lib - API 클라이언트 & 유틸리티

`src/lib/` 디렉토리는 프론트엔드에서 사용하는 API 클라이언트, 헬퍼 함수, 유틸리티들을 포함합니다.

## 📡 API 클라이언트 (api.ts)

### 설정
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
```
- 기본값: `http://localhost:8000` (로컬 개발)
- 환경변수: `NEXT_PUBLIC_API_URL` (프로덕션)

### 타입 정의

#### DivinationRequest
점괘 요청 본문
```typescript
interface DivinationRequest {
  divination_type: string;      // 점 유형
  period: string;               // 기간
  main_category: number;        // 대분류 ID
  sub_category?: number;        // 소분류 ID
  question: string;             // 질문 텍스트
  session_id?: string;          // 세션 ID
}
```

#### DivinationResponse
점괘 응답
```typescript
interface DivinationResponse {
  hexagram: HexagramInfo;       // 괘 정보
  yao: YaoInfo;                 // 효 정보
  interpretation: string;       // 해석
  fortune_score: number;        // 운세 점수 (0-100)
  fortune_category: string;     // 길흉 (대길, 길, 평, 소흉, 흉)
  action_guide: string | null;  // 행동 가이드
  caution: string | null;       // 주의사항
  keywords: string[];           // 키워드들
  matched_category: string;     // 매칭된 카테고리
  changing_lines: number[];     // 변효 위치들
  transformed_hexagram: number | null; // 변환된 괘 번호
}
```

#### HexagramInfo
괘 정보
```typescript
interface HexagramInfo {
  number: number;               // 괘 번호 (1-64)
  name_kr: string;              // 한글 이름
  name_hanja: string;           // 한자 이름
  name_full: string;            // 전체 이름
}
```

#### YaoInfo
효 정보
```typescript
interface YaoInfo {
  position: number;             // 효 위치 (1-6)
  name: string;                 // 효 이름
  text_hanja: string;           // 효사 (한자)
  text_kr: string;              // 효사 (한글)
}
```

#### Category
카테고리
```typescript
interface Category {
  id: number;                   // 카테고리 ID
  name: string;                 // 이름
  emoji: string;                // 이모지
}
```

#### SubCategory
소분류
```typescript
interface SubCategory {
  id: number;                   // 소분류 ID
  major_id: number;             // 대분류 ID
  sub_name: string;             // 소분류 이름
  keywords: string[];           // 키워드들
}
```

#### SimpleYaoResponse
간단한 효 응답 (조회용)
```typescript
interface SimpleYaoResponse {
  hexagram_number: number;      // 괘 번호
  hexagram_name: string;        // 괘 이름
  yao_position: number;         // 효 위치
  yao_name: string;             // 효 이름
  text_hanja: string;           // 효사 (한자)
  text_kr: string;              // 효사 (한글)
  interpretation: string;       // 해석
  fortune_score: number;        // 운세 점수
  fortune_category: string;     // 길흉
  keywords: string[];           // 키워드들
  category_interpretation: string | null; // 카테고리별 해석
  matched_category: string;     // 매칭된 카테고리
}
```

### API 함수

#### castDivination()
점괘 점치기 요청
```typescript
async function castDivination(request: DivinationRequest): Promise<DivinationResponse>
```
- **엔드포인트**: `POST /api/divination/cast`
- **요청**: DivinationRequest 객체
- **응답**: DivinationResponse 객체
- **에러**: 실패 시 detail 메시지와 함께 throw

**사용 예시**:
```typescript
const result = await castDivination({
  divination_type: 'yijing',
  period: 'daily',
  main_category: 1,
  sub_category: 1,
  question: '이번 달 재운이 좋을까요?'
});
```

#### getDivination()
간단한 효 조회
```typescript
async function getDivination(
  category: string,
  yao: string,
  hexagram?: number
): Promise<SimpleYaoResponse>
```
- **엔드포인트**: `GET /api/divination?category=...&yao=...&hexagram=...`
- **파라미터**:
  - `category`: 카테고리 이름
  - `yao`: 효 이름
  - `hexagram`: 괘 번호 (선택, 기본값: 1)
- **응답**: SimpleYaoResponse 객체

**사용 예시**:
```typescript
const data = await getDivination('재물', '초구', 1);
```

#### getCategories()
대분류 카테고리 목록 조회
```typescript
async function getCategories(): Promise<Category[]>
```
- **엔드포인트**: `GET /api/divination/categories`
- **응답**: Category 배열 (9개)

**사용 예시**:
```typescript
const categories = await getCategories();
// [
//   { id: 1, name: '재물', emoji: '💰' },
//   { id: 2, name: '직업', emoji: '💼' },
//   ...
// ]
```

#### getSubCategories()
소분류 카테고리 목록 조회
```typescript
async function getSubCategories(mainId: number): Promise<SubCategory[]>
```
- **엔드포인트**: `GET /api/divination/categories/{main_id}/sub`
- **파라미터**: `mainId` - 대분류 ID
- **응답**: SubCategory 배열

**사용 예시**:
```typescript
const subCategories = await getSubCategories(1); // 재물의 소분류들
// [
//   { id: 1, major_id: 1, sub_name: '주식/증권', keywords: [...] },
//   { id: 2, major_id: 1, sub_name: '코인/가상자산', keywords: [...] },
//   ...
// ]
```

#### healthCheck()
서버 상태 확인
```typescript
async function healthCheck(): Promise<{ status: string; ollama: string; timestamp?: string }>
```
- **엔드포인트**: `GET /api/divination/health`
- **응답**: 상태 정보
- **에러 처리**: 실패 시 `{ status: 'unhealthy', ollama: 'disconnected' }` 반환

**사용 예시**:
```typescript
const health = await healthCheck();
console.log(health); // { status: 'healthy', ollama: 'connected' }
```

#### getAIRecommendation()
AI 카테고리 추천 (질문 분석)
```typescript
async function getAIRecommendation(question: string): Promise<{
  major_id: number;
  sub_id: number | null;
  confidence: number;
  category_name: string;
}>
```
- **설명**: 현재는 클라이언트 사이드 키워드 매칭 구현
- **특징**: 네트워크 요청 없이 로컬에서 처리
- **키워드 지원**: 돈, 주식, 코인, 이직, 취업, 면접, 승진, 시험, 수능, 연애, 썸, 고백, 결혼, 건강, 다이어트, 여행, 이사

**사용 예시**:
```typescript
const rec = await getAIRecommendation('비트코인 사도 될까요?');
// { major_id: 1, sub_id: 2, confidence: 0.95, category_name: '재물-코인/가상자산' }
```

### 헬퍼 함수

#### parseYaoName()
효 이름을 효 위치로 변환
```typescript
function parseYaoName(yaoName: string): number | null
```
- **지원 형식**: 초구, 구이, 구삼, 구사, 구오, 상구, 초육, 육이, 육삼, 육사, 육오, 상육
- **반환**: 1-6 (또는 null)

**사용 예시**:
```typescript
parseYaoName('구삼');   // 3
parseYaoName('상육');   // 6
parseYaoName('invalid'); // null
```

#### parseCategoryName()
카테고리 이름을 ID로 변환
```typescript
function parseCategoryName(categoryName: string): number | null
```
- **지원**: 재물(1), 직업(2), 학업(3), 연애(4), 대인(5), 건강(6), 취미(7), 운명(8), 기타(9)
- **반환**: 1-9 (또는 null)

**사용 예시**:
```typescript
parseCategoryName('재물');  // 1
parseCategoryName('연애');  // 4
```

#### getFortuneCategory()
점수를 길흉 카테고리로 변환
```typescript
function getFortuneCategory(score: number): string
```
- **매핑**:
  - 90-100: 대길 (大吉)
  - 70-89: 길 (吉)
  - 50-69: 평 (平)
  - 30-49: 소흉 (小凶)
  - 0-29: 흉 (凶)

**사용 예시**:
```typescript
getFortuneCategory(95); // '대길'
getFortuneCategory(65); // '평'
getFortuneCategory(25); // '흉'
```

#### getFortuneStars()
점수를 별점으로 변환
```typescript
function getFortuneStars(score: number): string
```
- **반환**: 별(⭐) + 빈별(☆) 조합 (총 5개)
- **계산**: score / 20 = 별 개수

**사용 예시**:
```typescript
getFortuneStars(100); // '⭐⭐⭐⭐⭐'
getFortuneStars(60);  // '⭐⭐⭐☆☆'
getFortuneStars(20);  // '⭐☆☆☆☆'
```

## 📁 파일 구조

```
src/lib/
└── api.ts
    ├── 타입 정의 (10개)
    ├── API 함수 (6개)
    └── 헬퍼 함수 (4개)
```

## 🔌 사용 패턴

### 컴포넌트에서 사용
```typescript
import {
  castDivination,
  getCategories,
  getFortuneCategory,
  type DivinationResponse
} from '@/lib/api';

export default function MyComponent() {
  const [result, setResult] = useState<DivinationResponse | null>(null);

  const handleCast = async () => {
    const response = await castDivination({
      divination_type: 'yijing',
      period: 'daily',
      main_category: 1,
      question: '운세를 봐주세요'
    });
    setResult(response);
  };

  return (
    <div>
      {result && <p>{getFortuneCategory(result.fortune_score)}</p>}
    </div>
  );
}
```

### 에러 처리
```typescript
try {
  const result = await castDivination(request);
} catch (error) {
  console.error('점괘 요청 실패:', error.message);
  // 에러 메시지 표시
}
```

## ⚙️ 환경 설정

### 개발 환경 (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 프로덕션 환경 (.env.production)
```env
NEXT_PUBLIC_API_URL=https://api.example.com
```

## 📊 API 응답 예시

### castDivination() 응답
```json
{
  "hexagram": {
    "number": 1,
    "name_kr": "건",
    "name_hanja": "乾",
    "name_full": "乾 / 건"
  },
  "yao": {
    "position": 3,
    "name": "구삼",
    "text_hanja": "终日乾乾",
    "text_kr": "종일 건건하니"
  },
  "interpretation": "좋은 시간입니다. 꾸준한 노력이 결실을 맺을 것입니다.",
  "fortune_score": 85,
  "fortune_category": "길",
  "action_guide": "적극적으로 행동하세요",
  "caution": "과하지 않도록 주의하세요",
  "keywords": ["발전", "노력", "성공"],
  "matched_category": "재물-주식",
  "changing_lines": [3],
  "transformed_hexagram": 2
}
```

## 🚀 확장 가능성

향후 추가될 API:
- `/api/questions/search` - 질문 검색
- `/api/questions/popular` - 인기 질문
- `/api/questions/suggest` - 질문 제안
- `/api/divination/today` - 오늘의 운세
- `/api/settings/hero-video` - 히어로 영상 설정
- `/api/settings/media/file/{file}` - 미디어 파일 조회

# Backend API 문서

주역 기반 AI 운세 서비스 API 상세 명세서입니다.

**기본 URL**: `http://localhost:8000`
**API 버전**: v1
**문서**: `http://localhost:8000/docs`

---

## 📋 API 엔드포인트 목록

### 1. 점술 API (`/api/divination`)

점술 요청, 카테고리 조회, 오늘의 운세 등 메인 기능을 담당합니다.

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| **POST** | `/api/divination/cast` | 점 치기 (메인 API) - 주어진 질문과 카테고리로 운세 점술 |
| **POST** | `/api/divination/cast-by-question` | 질문 기반 자동 점술 - 질문만 입력하면 카테고리 자동 분석 및 점술 수행 |
| **GET** | `/api/divination` | 384효 + 카테고리 매칭 조회 - 괘/효/카테고리로 직접 조회 |
| **GET** | `/api/divination/today` | 오늘의 운세 - 날짜 기반 시초법으로 일일 운세 제공 |
| **GET** | `/api/divination/categories` | 대분류 카테고리 목록 |
| **GET** | `/api/divination/categories/{main_id}/sub` | 소분류 카테고리 목록 |
| **POST** | `/api/divination/recommend-category` | 질문 기반 카테고리 추천 - 질문 텍스트 분석하여 적합 카테고리 추천 |
| **GET** | `/api/divination/health` | 서버 상태 확인 |

---

## 📝 상세 엔드포인트 명세

### 1-1. 점 치기 (POST `/api/divination/cast`)

메인 API. 주어진 질문과 대분류 카테고리로 전통 주역 변효 해석을 수행합니다.

**Request:**
```json
{
  "divination_type": "iching",
  "period": "daily",
  "main_category": 1,
  "question": "올해 재운이 어떨까?",
  "session_id": "user_session_123"
}
```

**Request Parameters:**
| 필드 | 타입 | 설명 | 필수 | 기본값 |
|------|------|------|------|--------|
| `divination_type` | string | 점술 종류 (iching) | ✓ | iching |
| `period` | string | 기간 (daily/weekly/monthly/yearly) | ✓ | daily |
| `main_category` | integer | 대분류 ID (1~9) | ✓ | - |
| `question` | string | 질문 (2~100자) | ✓ | - |
| `session_id` | string | 세션 ID (선택) | ✗ | null |

**Response:**
```json
{
  "hexagram": {
    "number": 1,
    "name_kr": "건괘",
    "name_hanja": "乾",
    "name_full": "천지비(天地比)"
  },
  "yao": {
    "position": 1,
    "name": "초구",
    "text_hanja": "潛龍勿用",
    "text_kr": "잠재해 있는 용이므로 쓰면 안 됨"
  },
  "reading_method": {
    "reading_type": "changing_line",
    "yao_position": 1,
    "use_transformed": false,
    "description": "변효 1: 건괘에서 양의 변화 발생"
  },
  "gua_ci": "建侯行師 - 제후를 세워 군대를 행진시킨다",
  "transformed_gua_ci": null,
  "interpretation": "새로운 시작이 필요한 시기입니다. 현재는 기초를 다지는 것이 중요합니다.",
  "fortune_score": 75,
  "fortune_category": "길",
  "action_guide": "적극적으로 행동하되 신중함을 잃지 마세요.",
  "caution": "성급한 판단을 피하세요.",
  "keywords": ["새로운_시작", "기초_구축", "잠재력"],
  "matched_category": "재물 > 투자",
  "changing_lines": [1],
  "transformed_hexagram": 2,
  "transformed_hexagram_name": "곤괘(坤卦)"
}
```

**Response Model:**
| 필드 | 타입 | 설명 |
|------|------|------|
| `hexagram` | object | 점술 결과 괘 정보 |
| `yao` | object | 점술 결과 효 정보 |
| `reading_method` | object | 읽는 방법 및 설명 |
| `gua_ci` | string | 괘사(괘의 뜻) |
| `transformed_gua_ci` | string | 변괘사 (변효가 있을 경우) |
| `interpretation` | string | AI 기반 운세 해석 |
| `fortune_score` | integer | 운세 점수 (0-100) |
| `fortune_category` | string | 운세 분류 (대길/길/평/흉/대흉) |
| `action_guide` | string | 행동 가이드 |
| `caution` | string | 주의사항 |
| `keywords` | array | 관련 키워드 |
| `matched_category` | string | 매칭된 카테고리 |
| `changing_lines` | array | 변효 위치 (1-6) |
| `transformed_hexagram` | integer | 변괘 번호 |
| `transformed_hexagram_name` | string | 변괘 이름 |

**HTTP Status:**
- `200 OK` - 점술 성공
- `400 Bad Request` - 잘못된 입력값
- `500 Internal Server Error` - 서버 오류

---

### 1-2. 질문 기반 자동 점술 (POST `/api/divination/cast-by-question`)

질문 텍스트만 입력하면 자동으로 카테고리 분석 → 유사 질문 검색 → 점술 수행 → 통합 결과 반환합니다.

**Request:**
```json
{
  "question": "올해 재운이 어떨까?",
  "period": "daily"
}
```

**Request Parameters:**
| 필드 | 타입 | 설명 | 필수 | 기본값 |
|------|------|------|------|--------|
| `question` | string | 사용자 질문 | ✓ | - |
| `period` | string | 기간 (daily/weekly/monthly/yearly) | ✗ | daily |

**Response:**
```json
{
  "matched_category": {
    "major_id": 1,
    "major_name": "재물",
    "sub_id": 101,
    "sub_name": "투자",
    "confidence": 0.92
  },
  "similar_questions": [
    {
      "id": "q_001",
      "text": "올해 재운은?",
      "similarity": 0.95
    },
    {
      "id": "q_002",
      "text": "2024년 금전운은?",
      "similarity": 0.88
    }
  ],
  "divination_result": {
    "hexagram": { ... },
    "yao": { ... },
    "reading_method": { ... },
    "gua_ci": "...",
    "interpretation": "..."
  }
}
```

**Response Model:**
| 필드 | 타입 | 설명 |
|------|------|------|
| `matched_category` | object | 자동 분석된 카테고리 |
| `similar_questions` | array | 유사 질문 목록 |
| `divination_result` | object | 점술 결과 (DivinationResponse) |

**HTTP Status:**
- `200 OK` - 점술 성공
- `400 Bad Request` - 잘못된 입력값

---

### 1-3. 384효 + 카테고리 매칭 조회 (GET `/api/divination`)

괘 번호, 효 이름, 카테고리를 직접 지정하여 조회합니다. (GET 요청)

**Query Parameters:**
| 파라미터 | 타입 | 설명 | 필수 | 예시 |
|---------|------|------|------|------|
| `hexagram` | integer | 괘 번호 (1-64) | ✗ | 1 |
| `yao` | string | 효 이름 | ✓ | 초구, 구이, ..., 상육 |
| `category` | string | 대분류 카테고리 이름 | ✓ | 재물, 직업, ... |

**유효한 효 이름:**
- 양효: `초구` `구이` `구삼` `구사` `구오` `상구`
- 음효: `초육` `육이` `육삼` `육사` `육오` `상육`

**유효한 카테고리:**
`재물` `직업` `학업` `연애` `대인` `건강` `취미` `운명` `기타`

**Request Example:**
```
GET /api/divination?hexagram=1&yao=초구&category=재물
```

**Response:**
```json
{
  "hexagram_number": 1,
  "hexagram_name": "건괘(乾卦)",
  "yao_position": 1,
  "yao_name": "초구",
  "text_hanja": "潛龍勿用",
  "text_kr": "잠재해 있는 용이므로 쓰면 안 됨",
  "interpretation": "새로운 시작이 필요한 시기입니다.",
  "fortune_score": 75,
  "fortune_category": "길",
  "keywords": ["새로운_시작", "기초_구축"],
  "category_interpretation": "재물/투자 관점에서 새로운 시작이 필요한 시기입니다. 좋은 시기입니다. 계획대로 진행하세요.",
  "matched_category": "재물"
}
```

**HTTP Status:**
- `200 OK` - 조회 성공
- `400 Bad Request` - 잘못된 파라미터
- `404 Not Found` - 괘/효 데이터 없음

---

### 1-4. 오늘의 운세 (GET `/api/divination/today`)

날짜 기반 시초법으로 하루 동안 동일한 운세를 제공합니다.

**Request:**
```
GET /api/divination/today
```

**Response:**
```json
{
  "hexagram_number": 1,
  "hexagram_name": "건괘",
  "hexagram_hanja": "乾",
  "hexagram_symbol": "☰☰",
  "yao_position": 1,
  "yao_name": "초구",
  "text_hanja": "潛龍勿用",
  "text_kr": "잠재해 있는 용이므로 쓰면 안 됨",
  "interpretation": "새로운 시작이 필요한 시기입니다.",
  "fortune_score": 75,
  "fortune_category": "길",
  "keywords": ["새로운_시작", "기초_구축"],
  "gua_ci": "建侯行師",
  "luck_number": 5,
  "luck_name": "평운",
  "daily_headline": "오늘은 신중함이 필요한 날입니다",
  "daily_body": "새로운 계획을 세우기 좋은 날입니다. 급하지 않게 천천히 진행하세요."
}
```

**Response Model:**
| 필드 | 타입 | 설명 |
|------|------|------|
| `hexagram_number` | integer | 괘 번호 |
| `hexagram_name` | string | 괘 이름 |
| `hexagram_symbol` | string | 상괘 + 하괘 심볼 |
| `yao_position` | integer | 효 위치 (1-6) |
| `luck_number` | integer | 운발수 번호 |
| `luck_name` | string | 운발수 이름 |
| `daily_headline` | string | 대제목 (15-25자) |
| `daily_body` | string | 본문 (50-70자) |

**특징:**
- 같은 날짜 내에는 동일한 운세 제공
- 3일마다 일간운세 해석문 변형

---

### 1-5. 대분류 카테고리 목록 (GET `/api/divination/categories`)

전체 대분류 카테고리 목록을 조회합니다.

**Request:**
```
GET /api/divination/categories
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "재물",
    "emoji": "💰"
  },
  {
    "id": 2,
    "name": "직업",
    "emoji": "💼"
  },
  {
    "id": 3,
    "name": "학업",
    "emoji": "📚"
  },
  {
    "id": 4,
    "name": "연애",
    "emoji": "💕"
  },
  {
    "id": 5,
    "name": "대인",
    "emoji": "👥"
  },
  {
    "id": 6,
    "name": "건강",
    "emoji": "🏥"
  },
  {
    "id": 7,
    "name": "취미",
    "emoji": "🎮"
  },
  {
    "id": 8,
    "name": "운명",
    "emoji": "⭐"
  },
  {
    "id": 9,
    "name": "기타",
    "emoji": "📝"
  }
]
```

---

### 1-6. 소분류 카테고리 목록 (GET `/api/divination/categories/{main_id}/sub`)

대분류 ID에 해당하는 소분류 목록을 조회합니다.

**Path Parameters:**
| 파라미터 | 타입 | 설명 | 예시 |
|---------|------|------|------|
| `main_id` | integer | 대분류 ID (1-9) | 1 |

**Request:**
```
GET /api/divination/categories/1/sub
```

**Response:**
```json
[
  {
    "id": 101,
    "name": "투자",
    "main_id": 1
  },
  {
    "id": 102,
    "name": "저축",
    "main_id": 1
  },
  {
    "id": 103,
    "name": "대출",
    "main_id": 1
  },
  ...
]
```

---

### 1-7. 질문 기반 카테고리 추천 (POST `/api/divination/recommend-category`)

질문 텍스트를 분석하여 적합한 카테고리를 추천합니다.

**Request:**
```json
{
  "question": "올해 재운이 어떨까?"
}
```

**Response:**
```json
{
  "question": "올해 재운이 어떨까?",
  "recommended": {
    "major_id": 1,
    "major_name": "재물",
    "sub_id": 101,
    "confidence": 0.92
  },
  "all_scores": {
    "1": 0.92,
    "2": 0.15,
    "3": 0.10,
    ...
  }
}
```

---

### 1-8. 서버 상태 확인 (GET `/api/divination/health`)

Ollama LLM 서비스 연결 상태를 포함한 서버 상태를 확인합니다.

**Request:**
```
GET /api/divination/health
```

**Response:**
```json
{
  "status": "ok",
  "ollama": "connected",
  "timestamp": "2024-01-15T10:30:45.123456"
}
```

---

## 🔍 질문 검색 API (`/api/questions`)

질문 데이터 검색, 카테고리별 조회, 랜덤 추천 등을 담당합니다.

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| **GET** | `/api/questions/search` | 키워드 기반 질문 검색 |
| **GET** | `/api/questions/category/{category_id}` | 카테고리별 질문 조회 |
| **GET** | `/api/questions/random` | 랜덤 질문 추천 |
| **GET** | `/api/questions/popular` | 인기 질문 조회 |
| **GET** | `/api/questions/stats` | 통계 정보 조회 |
| **GET** | `/api/questions/suggest` | 질문 자동 완성/추천 |

---

### 2-1. 질문 검색 (GET `/api/questions/search`)

키워드 기반으로 질문을 검색합니다. 카테고리 필터링 지원.

**Query Parameters:**
| 파라미터 | 타입 | 설명 | 필수 | 기본값 |
|---------|------|------|------|--------|
| `q` | string | 검색어 | ✓ | - |
| `category_id` | integer | 카테고리 필터 (1-9) | ✗ | null |
| `limit` | integer | 결과 개수 (1-100) | ✗ | 20 |

**Request:**
```
GET /api/questions/search?q=재운&category_id=1&limit=10
```

**Response:**
```json
{
  "query": "재운",
  "total": 25,
  "results": [
    {
      "id": "q_001",
      "text": "올해 재운은?",
      "major_category_id": 1,
      "major_category_name": "재물",
      "sub_category": "투자",
      "score": 2.0
    },
    {
      "id": "q_002",
      "text": "내 재운이 좋을까?",
      "major_category_id": 1,
      "major_category_name": "재물",
      "sub_category": "저축",
      "score": 1.5
    }
  ]
}
```

---

### 2-2. 카테고리별 질문 조회 (GET `/api/questions/category/{category_id}`)

특정 카테고리의 질문들을 페이지네이션과 함께 조회합니다.

**Path Parameters:**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `category_id` | integer | 카테고리 ID (1-9) |

**Query Parameters:**
| 파라미터 | 타입 | 설명 | 기본값 |
|---------|------|------|--------|
| `sub_category` | string | 소분류 필터 | null |
| `limit` | integer | 결과 개수 (1-200) | 50 |
| `offset` | integer | 시작 위치 | 0 |

**Request:**
```
GET /api/questions/category/1?limit=20&offset=0
```

**Response:**
```json
{
  "category_id": 1,
  "category_name": "재물",
  "total": 500,
  "questions": [
    {
      "id": "q_001",
      "text": "올해 재운은?",
      "major_category_id": 1,
      "major_category_name": "재물",
      "sub_category": "투자"
    },
    ...
  ]
}
```

---

### 2-3. 랜덤 질문 추천 (GET `/api/questions/random`)

랜덤하게 질문들을 추천합니다.

**Query Parameters:**
| 파라미터 | 타입 | 설명 | 기본값 |
|---------|------|------|--------|
| `category_id` | integer | 카테고리 필터 (1-9) | null |
| `count` | integer | 결과 개수 (1-20) | 5 |

**Request:**
```
GET /api/questions/random?category_id=1&count=5
```

**Response:**
```json
{
  "count": 5,
  "questions": [
    {
      "id": "q_001",
      "text": "올해 재운은?",
      "category": "재물",
      "sub_category": "투자"
    },
    ...
  ]
}
```

---

### 2-4. 인기 질문 조회 (GET `/api/questions/popular`)

카테고리별 인기 질문을 조회합니다. (현재는 시뮬레이션)

**Query Parameters:**
| 파라미터 | 타입 | 설명 | 기본값 |
|---------|------|------|--------|
| `category_id` | integer | 카테고리 필터 (1-9) | null |
| `limit` | integer | 결과 개수 (1-50) | 10 |

**Request:**
```
GET /api/questions/popular?category_id=1&limit=10
```

**Response:**
```json
{
  "category_id": 1,
  "count": 10,
  "questions": [
    {
      "id": "q_001",
      "text": "올해 재운은?",
      "category": "재물",
      "sub_category": "투자",
      "popularity_score": 0.95
    },
    ...
  ]
}
```

---

### 2-5. 통계 정보 조회 (GET `/api/questions/stats`)

질문 데이터의 전체 통계 정보를 조회합니다.

**Request:**
```
GET /api/questions/stats
```

**Response:**
```json
{
  "total_questions": 9491,
  "total_keywords": 9975,
  "categories": {
    "1": {
      "name": "재물",
      "count": 500
    },
    "2": {
      "name": "직업",
      "count": 500
    },
    ...
  }
}
```

---

### 2-6. 질문 자동 완성/추천 (GET `/api/questions/suggest`)

입력 텍스트 기반으로 유사한 질문들을 추천합니다.

**Query Parameters:**
| 파라미터 | 타입 | 설명 | 필수 |
|---------|------|------|------|
| `text` | string | 사용자 입력 텍스트 (2자 이상) | ✓ |
| `limit` | integer | 결과 개수 (1-10) | ✗ |

**Request:**
```
GET /api/questions/suggest?text=올해&limit=5
```

**Response:**
```json
{
  "input": "올해",
  "suggestions": [
    {
      "id": "q_001",
      "text": "올해 재운은?",
      "category": "재물",
      "score": 0.95
    },
    {
      "id": "q_002",
      "text": "올해 직업운은?",
      "category": "직업",
      "score": 0.92
    },
    ...
  ]
}
```

---

## ⚙️ 설정 API (`/api/settings`)

사이트 설정(영상, 이미지 등)과 미디어 파일 관리를 담당합니다.

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| **GET** | `/api/settings/` | 전체 설정 조회 |
| **PUT** | `/api/settings/` | 전체 설정 업데이트 |
| **GET** | `/api/settings/hero-video` | 히어로 영상 설정 조회 |
| **PUT** | `/api/settings/hero-video` | 히어로 영상 설정 변경 |
| **GET** | `/api/settings/media/list` | 미디어 파일 목록 조회 |
| **GET** | `/api/settings/media/file/{filename}` | 미디어 파일 제공 |
| **POST** | `/api/settings/media/upload` | 미디어 파일 업로드 |
| **DELETE** | `/api/settings/media/file/{filename}` | 미디어 파일 삭제 |

---

### 3-1. 전체 설정 조회 (GET `/api/settings/`)

현재 사이트 설정을 조회합니다.

**Request:**
```
GET /api/settings/
```

**Response:**
```json
{
  "hero_video": "Ancient_Chinese_Coins_Cosmic_Animation.mp4",
  "layout_style": "classic-mystical",
  "divination_method": "coin"
}
```

---

### 3-2. 전체 설정 업데이트 (PUT `/api/settings/`)

사이트 전체 설정을 업데이트합니다.

**Request:**
```json
{
  "hero_video": "new_video.mp4",
  "layout_style": "modern",
  "divination_method": "coin"
}
```

**Response:**
```json
{
  "status": "success",
  "settings": {
    "hero_video": "new_video.mp4",
    "layout_style": "modern",
    "divination_method": "coin"
  }
}
```

---

### 3-3. 히어로 영상 설정 조회 (GET `/api/settings/hero-video`)

현재 설정된 히어로 영상을 조회합니다.

**Request:**
```
GET /api/settings/hero-video
```

**Response:**
```json
{
  "video": "Ancient_Chinese_Coins_Cosmic_Animation.mp4"
}
```

---

### 3-4. 히어로 영상 설정 변경 (PUT `/api/settings/hero-video`)

히어로 영상을 변경합니다.

**Request:**
```json
{
  "selected_video": "new_video.mp4"
}
```

**Response:**
```json
{
  "status": "success",
  "video": "new_video.mp4"
}
```

---

### 3-5. 미디어 파일 목록 조회 (GET `/api/settings/media/list`)

업로드된 모든 미디어 파일(영상/이미지)의 목록을 조회합니다.

**Request:**
```
GET /api/settings/media/list
```

**Response:**
```json
{
  "videos": [
    {
      "filename": "Ancient_Chinese_Coins_Cosmic_Animation.mp4",
      "type": "video",
      "size": 15728640,
      "size_mb": 15.0,
      "path": "/api/settings/media/file/Ancient_Chinese_Coins_Cosmic_Animation.mp4"
    }
  ],
  "images": [
    {
      "filename": "logo.png",
      "type": "image",
      "size": 102400,
      "size_mb": 0.1,
      "path": "/api/settings/media/file/logo.png"
    }
  ]
}
```

---

### 3-6. 미디어 파일 제공 (GET `/api/settings/media/file/{filename}`)

업로드된 미디어 파일을 다운로드/스트리밍 합니다.

**Path Parameters:**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `filename` | string | 파일 이름 |

**Request:**
```
GET /api/settings/media/file/Ancient_Chinese_Coins_Cosmic_Animation.mp4
```

**Response:**
- 바이너리 파일 (스트리밍)
- Content-Type: `video/mp4` (또는 해당 미디어 타입)

---

### 3-7. 미디어 파일 업로드 (POST `/api/settings/media/upload`)

새로운 미디어 파일(영상/이미지)을 업로드합니다.

**지원 포맷:**
- 영상: `.mp4` `.webm` `.mov`
- 이미지: `.png` `.jpg` `.jpeg` `.gif` `.webp`

**Request:**
```
Content-Type: multipart/form-data

file: [binary file data]
```

**Response:**
```json
{
  "status": "success",
  "filename": "new_video.mp4",
  "size": 25165824,
  "path": "/api/settings/media/file/new_video.mp4"
}
```

---

### 3-8. 미디어 파일 삭제 (DELETE `/api/settings/media/file/{filename}`)

업로드된 미디어 파일을 삭제합니다.

**Path Parameters:**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `filename` | string | 파일 이름 |

**Request:**
```
DELETE /api/settings/media/file/old_video.mp4
```

**Response:**
```json
{
  "status": "success",
  "deleted": "old_video.mp4"
}
```

---

## 🚀 사용 예시

### 예시 1: 기본 점술 요청

```bash
curl -X POST "http://localhost:8000/api/divination/cast" \
  -H "Content-Type: application/json" \
  -d '{
    "divination_type": "iching",
    "period": "daily",
    "main_category": 1,
    "question": "올해 재운이 어떨까?"
  }'
```

### 예시 2: 질문 기반 자동 점술

```bash
curl -X POST "http://localhost:8000/api/divination/cast-by-question" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "올해 직업운은 어떨까?",
    "period": "yearly"
  }'
```

### 예시 3: 질문 검색

```bash
curl "http://localhost:8000/api/questions/search?q=재운&category_id=1&limit=10"
```

### 예시 4: 오늘의 운세

```bash
curl "http://localhost:8000/api/divination/today"
```

### 예시 5: 미디어 업로드

```bash
curl -X POST "http://localhost:8000/api/settings/media/upload" \
  -F "file=@/path/to/video.mp4"
```

---

## 📊 데이터 구조

### 카테고리 체계

**대분류 (9개):**
1. 재물 (💰) - 금전, 투자, 저축 등
2. 직업 (💼) - 취업, 경력, 사업 등
3. 학업 (📚) - 공부, 시험, 진학 등
4. 연애 (💕) - 연애, 결혼, 이성관계 등
5. 대인 (👥) - 인간관계, 친구, 가족 등
6. 건강 (🏥) - 건강, 질병, 치유 등
7. 취미 (🎮) - 여가, 취미, 활동 등
8. 운명 (⭐) - 인생, 미래, 길흉 등
9. 기타 (📝) - 기타 분류

**소분류:** 각 대분류당 약 25~30개의 소분류

### 점술 데이터

**괘 (Hexagram):** 64개
- 번호: 1-64
- 이름: 한글, 한자, 풀이
- 괘사: 괘의 뜻

**효 (Yao):** 384개 (64 괘 × 6 위치)
- 위치: 1-6 (초구~상구 또는 초육~상육)
- 이름: 한글, 한자
- 해석: 괘사의 효

**운발수:** 1-10
- 운세 이름: 대길, 길, 평, 흉, 대흉 등

---

## ⚠️ 에러 처리

모든 에러 응답은 다음 형식으로 반환됩니다:

```json
{
  "detail": "에러 메시지"
}
```

**일반적인 HTTP Status Codes:**
- `200 OK` - 성공
- `400 Bad Request` - 잘못된 입력값
- `404 Not Found` - 리소스 없음
- `500 Internal Server Error` - 서버 오류

---

## 📌 주요 특징

✅ **전통 주역 기반**: 64괘 + 384효 완전 데이터
✅ **AI 해석**: Ollama LLM 기반 자동 해석
✅ **다중 조회 방식**: POST/GET, 자동분석/직접조회
✅ **카테고리 매칭**: 질문 자동 분석 및 카테고리 추천
✅ **질문 DB**: 9,491개 질문 데이터 + 검색 기능
✅ **설정 관리**: 미디어 파일 업로드/관리

---

## 📚 관련 문서

- 프로젝트 README: [backend/README.md](../README.md)
- 데이터 인덱스: [docs/DATA_INDEX.md](../../docs/DATA_INDEX.md)
- 백엔드 아키텍처: [backend/docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)

---

**최종 업데이트**: 2024-01-15
**API 버전**: v1
**작성자**: Claude Code

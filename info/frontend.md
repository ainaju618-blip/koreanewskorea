# 프론트엔드 개발 정보

> Next.js, React, CSS, UI 관련 모든 정보

---

## 1. 기술 스택

| 항목 | 값 |
|------|-----|
| **프레임워크** | Next.js 15 (App Router) |
| **스타일** | Tailwind CSS |
| **상태관리** | React Hooks |
| **UI 라이브러리** | Headless UI, Heroicons |

---

## 2. 폴더 구조

```
src/
├── app/                    # App Router 페이지
│   ├── (site)/             # 일반 사용자 페이지
│   ├── admin/              # 관리자 페이지
│   └── api/                # API 라우트
├── components/             # 재사용 컴포넌트
│   ├── ui/                 # 공통 UI (Toast, Modal 등)
│   ├── admin/              # 관리자 전용
│   └── category/           # 카테고리 페이지용
├── hooks/                  # 커스텀 훅
├── lib/                    # 유틸리티
└── types/                  # TypeScript 타입
```

---

## 3. [CRITICAL] 시스템 모달 금지

### 금지
```javascript
// ❌ 절대 사용 금지
alert('메시지');
confirm('확인?');
prompt('입력');
```

### 대신 사용
```javascript
// ✅ Toast 사용
const { showSuccess, showError } = useToast();
showSuccess('저장되었습니다.');
showError('오류가 발생했습니다.');

// ✅ 확인 모달 사용
const { confirm, confirmDelete } = useConfirm();
const ok = await confirm({ message: '정말 삭제하시겠습니까?' });
```

### 이유
1. 시스템 모달은 항상 화면 상단에 표시
2. 사용자가 마우스를 많이 이동해야 함
3. 브라우저마다 디자인 다름
4. 커스텀 스타일 불가

---
*추가일: 2025-12-15*

---

## 4. [ERROR] TypeScript 빌드 에러

### 4.1 타입 불일치
```
Type 'string | undefined' is not assignable to type 'string'
```

**해결:**
```typescript
// 방법 1: 옵셔널 체이닝
const value = data?.field ?? '';

// 방법 2: 타입 단언 (확실할 때만)
const value = data.field as string;

// 방법 3: 타입 가드
if (data.field) {
  // 여기서 data.field는 string
}
```

### 4.2 import 에러
```
Cannot find module '@/lib/xxx'
```

**확인:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 4.3 Next.js 16+ 동적 라우트
```typescript
// ❌ 이전 방식
export async function GET(req, { params }) {
  const { id } = params;
}

// ✅ Next.js 16+ 방식
interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
}
```

---
*추가일: 2025-12-15*

---

## 5. [ERROR] 이미지 로드 실패

### 5.1 경로 문제
```
GET /images/xxx.jpg 404
```

**확인:**
1. 파일이 `public/images/` 에 존재하는지
2. 경로가 `/images/...`로 시작하는지 (절대경로 아님)

### 5.2 next/image 사용
```typescript
import Image from 'next/image';

// 로컬 이미지
<Image
  src="/images/region/filename.jpg"
  alt="설명"
  width={300}
  height={200}
/>

// 외부 이미지 (next.config.js 설정 필요)
<Image
  src="https://외부URL"
  alt="설명"
  width={300}
  height={200}
/>
```

### 5.3 외부 도메인 허용
```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['res.cloudinary.com', '허용할도메인'],
  },
}
```

---
*추가일: 2025-12-15*

---

## 6. [ERROR] Hydration 불일치

### 증상
```
Hydration failed because the initial UI does not match
```

### 원인
서버/클라이언트 렌더링 결과가 다름

### 해결
```typescript
// 방법 1: useEffect로 클라이언트에서만 렌더링
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null;

// 방법 2: suppressHydrationWarning
<time suppressHydrationWarning>
  {new Date().toLocaleString()}
</time>

// 방법 3: dynamic import
import dynamic from 'next/dynamic';
const ClientComponent = dynamic(() => import('./Component'), { ssr: false });
```

---
*추가일: 2025-12-15*

---

## 7. [GUIDE] 공통 컴포넌트

### Toast (알림)
```typescript
// 사용
import { useToast } from '@/components/ui/Toast';

const { showSuccess, showError, showInfo } = useToast();
showSuccess('성공!');
showError('실패!');
```

### ConfirmModal (확인)
```typescript
import { useConfirm } from '@/components/ui/ConfirmModal';

const { confirm, confirmDelete } = useConfirm();

// 일반 확인
const ok = await confirm({
  title: '확인',
  message: '진행하시겠습니까?'
});

// 삭제 확인
const ok = await confirmDelete('이 항목');
```

### 위치
```
src/components/ui/
├── Toast.tsx
├── ConfirmModal.tsx
└── ShareToast.tsx
```

---
*추가일: 2025-12-15*

---

## 8. [GUIDE] SEO 필수 사항

### 메타 태그
```typescript
// app/news/[id]/page.tsx
export async function generateMetadata({ params }) {
  const article = await getArticle(params.id);
  return {
    title: article.title,
    description: article.ai_summary,
    openGraph: {
      title: article.title,
      description: article.ai_summary,
      images: [article.thumbnail_url],
    },
  };
}
```

### 구조화 데이터
```typescript
<script type="application/ld+json">
{JSON.stringify({
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": article.title,
  "author": { "@type": "Person", "name": article.author_name },
  "datePublished": article.published_at,
})}
</script>
```

---
*추가일: 2025-12-15*

---

## 9. [GUIDE] 스타일 규칙

### Tailwind 클래스 순서
```html
<!-- 권장 순서 -->
<div className="
  flex items-center justify-center  <!-- 레이아웃 -->
  w-full h-64                        <!-- 크기 -->
  p-4 m-2                            <!-- 여백 -->
  bg-white                           <!-- 배경 -->
  border rounded-lg shadow           <!-- 테두리/그림자 -->
  text-gray-900 font-bold            <!-- 텍스트 -->
  hover:bg-gray-100                  <!-- 상태 -->
">
```

### 반응형
```html
<!-- 모바일 우선 -->
<div className="
  grid grid-cols-1       <!-- 모바일: 1열 -->
  md:grid-cols-2         <!-- 태블릿: 2열 -->
  lg:grid-cols-3         <!-- 데스크톱: 3열 -->
">
```

---
*추가일: 2025-12-15*

---

## 10. 자주 쓰는 명령어

```bash
# 개발 서버
npm run dev

# 빌드 (타입 체크 포함)
npm run build

# 린트
npm run lint

# 타입 체크만
npx tsc --noEmit
```

---

*최종 업데이트: 2025-12-15*

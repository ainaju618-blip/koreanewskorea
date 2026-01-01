# Frontend Public Assets - 정적 자산

`public/` 디렉토리는 웹사이트의 정적 자산(이미지, 영상, SVG 등)을 저장합니다. 이 파일들은 Next.js에 의해 자동으로 최적화되어 제공됩니다.

## 📁 파일 목록

### 이미지 & 아이콘

#### SVG 파일들
정적 SVG 아이콘 자산들

| 파일명 | 용도 | 크기 |
|--------|------|------|
| **icon.svg** | 브랜드 기본 아이콘 | ? |
| **icon-purple.svg** | 보라색 변형 아이콘 | ? |
| **icon-transparent.svg** | 투명 배경 아이콘 | ? |
| **file.svg** | 파일 아이콘 | ? |
| **globe.svg** | 지구 아이콘 | ? |
| **window.svg** | 윈도우 아이콘 | ? |
| **next.svg** | Next.js 로고 | ? |
| **vercel.svg** | Vercel 로고 | ? |

**사용 방법**:
```tsx
import Image from 'next/image';

// 방법 1: Next.js Image 컴포넌트 사용 (권장)
<Image
  src="/icon.svg"
  alt="Icon"
  width={64}
  height={64}
/>

// 방법 2: 직접 참조
<img src="/icon.svg" alt="Icon" />

// 방법 3: 배경 이미지
<div style={{ backgroundImage: 'url(/icon.svg)' }}>
```

### 영상 파일

#### videos/ 디렉토리
프로모션 영상 및 배경 영상

| 파일명 | 용도 | 형식 |
|--------|------|------|
| **Ancient_Chinese_Coins_Cosmic_Animation.mp4** | 히어로 섹션 배경 영상 | MP4 |

**특징**:
- 해상도: 고화질 (1920x1080 이상 추정)
- 길이: 루프 재생 가능 (5-10초 추정)
- 코덱: H.264 (MP4)
- 사용처: HeroSection 컴포넌트

**사용 방법**:
```tsx
<video
  src="/videos/Ancient_Chinese_Coins_Cosmic_Animation.mp4"
  autoPlay
  loop
  muted
  playsInline
  className="w-full h-full object-cover"
/>
```

## 🗂️ 디렉토리 구조

```
public/
├── icon.svg                          # 기본 아이콘
├── icon-purple.svg                   # 보라색 아이콘
├── icon-transparent.svg              # 투명 배경 아이콘
├── file.svg                          # 파일 아이콘
├── globe.svg                         # 지구 아이콘
├── window.svg                        # 윈도우 아이콘
├── next.svg                          # Next.js 로고
├── vercel.svg                        # Vercel 로고
└── videos/
    └── Ancient_Chinese_Coins_Cosmic_Animation.mp4  # 히어로 영상
```

## 🎯 사용 사례별 자산

### 홈 페이지 (/)
- **배경 영상**: `videos/Ancient_Chinese_Coins_Cosmic_Animation.mp4`
- **아이콘**: `icon.svg` (헤더에서 사용)

### 헤더 & 네비게이션
- **로고 아이콘**: `icon.svg` 또는 `icon-purple.svg`
- **메뉴 아이콘**: 인라인 SVG (font-awesome 또는 tailwind-ui)

### 관리자 패널
- **설정 아이콘**: 일반 SVG

### 브랜딩
- **favicon**: `icon.svg` (next.config.js에서 설정)
- **OG 이미지**: (별도 추가 필요)
- **Apple 터치 아이콘**: `icon.svg` (또는 별도 파일)

## 🖼️ 이미지 최적화

### Next.js Image 컴포넌트 사용
```tsx
import Image from 'next/image';

<Image
  src="/icon.svg"
  alt="브랜드 로고"
  width={32}
  height={32}
  priority // 중요한 이미지는 우선 로드
/>
```

**이점**:
- 자동 포맷 변환 (WebP 지원)
- 레이지 로딩 (lazy loading)
- 반응형 이미지
- 자동 사이징

### 영상 최적화
```tsx
<video
  src="/videos/Ancient_Chinese_Coins_Cosmic_Animation.mp4"
  autoPlay
  loop
  muted
  playsInline
  preload="auto"  // 미리 로드
  poster="/poster.jpg"  // 포스터 이미지 (로드 전 표시)
  className="w-full h-full object-cover"
/>
```

## 📱 경로 참조

### Next.js 애플리케이션에서
```typescript
// public/ 폴더 생략 - 루트에서 시작
const iconPath = '/icon.svg';
const videoPath = '/videos/Ancient_Chinese_Coins_Cosmic_Animation.mp4';
```

### 빌드 시간 최적화
```typescript
// ✅ 정적 import (타입 안전)
import iconSvg from '@/public/icon.svg';

// ❌ 동적 import (권장하지 않음)
const icon = await import('/icon.svg');
```

## 🔄 파일 추가/수정

### 새 이미지 추가
```bash
# 1. 파일을 public/ 디렉토리에 추가
cp new-image.png /frontend/public/new-image.png

# 2. 컴포넌트에서 사용
<Image src="/new-image.png" alt="..." width={...} height={...} />
```

### 새 영상 추가
```bash
# 1. 파일을 public/videos/ 디렉토리에 추가
cp video.mp4 /frontend/public/videos/video.mp4

# 2. 컴포넌트에서 사용
<video src="/videos/video.mp4" autoPlay loop muted />
```

## ⚙️ 환경별 경로

### 개발 환경 (localhost:3001)
```
http://localhost:3001/icon.svg
http://localhost:3001/videos/Ancient_Chinese_Coins_Cosmic_Animation.mp4
```

### 프로덕션 환경 (예: example.com)
```
https://example.com/icon.svg
https://example.com/videos/Ancient_Chinese_Coins_Cosmic_Animation.mp4
```

**자동 처리**: Next.js와 배포 환경이 자동으로 경로를 설정합니다.

## 🎬 영상 포맷 및 권장사항

### 현재 영상
- **파일**: `Ancient_Chinese_Coins_Cosmic_Animation.mp4`
- **용도**: 히어로 섹션 배경
- **특징**: 중국 동전 + 우주 애니메이션

### 권장 스펙
| 항목 | 값 |
|------|-----|
| 포맷 | MP4 (H.264) |
| 해상도 | 1920x1080 (Full HD) |
| 프레임레이트 | 30fps |
| 비트레이트 | 5-10 Mbps |
| 길이 | 5-15초 (루프용) |
| 파일 크기 | < 10MB |

### 최적화 팁
```bash
# FFmpeg로 영상 변환
ffmpeg -i input.mov \
  -c:v libx264 \
  -preset fast \
  -crf 23 \
  -c:a aac \
  -b:a 128k \
  output.mp4
```

## 🔐 보안 고려사항

### 정적 파일 캐싱
```typescript
// next.config.js
module.exports = {
  images: {
    cacheDuration: 60 * 60 * 24 * 365, // 1년 캐싱
  },
};
```

### CORS 설정
public 폴더의 파일들은 자동으로 CORS 허용됩니다.

## 📊 파일 크기 최적화

### 이미지 최적화
```bash
# 이미지 압축 (ImageMagick 사용)
convert input.png -quality 85 -strip output.png

# PNG 최적화
optipng -o2 image.png
```

### 영상 최적화
```bash
# 해상도 축소 + 비트레이트 감소
ffmpeg -i input.mp4 \
  -vf scale=1280:720 \
  -b:v 3M \
  output.mp4
```

## 🚀 CDN 배포

### Vercel 자동 최적화
Vercel에 배포 시:
- 자동 이미지 최적화
- 자동 영상 스트리밍 최적화
- 전 세계 CDN을 통한 빠른 전송
- 자동 캐싱 헤더 설정

### 커스텀 CDN 사용
```typescript
// next.config.js
module.exports = {
  images: {
    loader: 'cloudinary',
    loaderFile: './cloudinary-loader.js',
  },
};
```

## ✅ 체크리스트

배포 전 확인사항:
- [ ] 모든 이미지가 최적화되었는가?
- [ ] 영상이 올바른 포맷(MP4)인가?
- [ ] 파일 크기가 적절한가?
- [ ] 모든 파일이 접근 가능한가?
- [ ] 미사용 파일을 삭제했는가?
- [ ] 파일명이 명확한가?

## 📚 참고 자료

- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [Next.js Static File Serving](https://nextjs.org/docs/basic-features/static-file-serving)
- [Web Video Format](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video)
- [SVG Best Practices](https://developer.mozilla.org/en-US/docs/Web/SVG)

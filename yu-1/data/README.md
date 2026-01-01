# Data Directory - 멀티미디어 자산

## 📁 폴더 구조

```
data/
└── image/                          # 멀티미디어 에셋 저장소
    ├── *.mp4                        # 비디오 파일
    └── *.png                        # 이미지 파일
```

## 📊 파일 목록

### 비디오 파일 (동영상)
| 파일명 | 설명 | 용도 |
|--------|------|------|
| `watermarked-237f018c-af0b-4bc9-b8b0-b1c010563ec5.mp4` | 워터마크 비디오 | 마케팅/소개 영상 |
| `Ancient_Chinese_Coins_Cosmic_Animation.mp4` | 고대 중국 동전 우주 애니메이션 | UI 배경 영상 |
| `Cosmic_Yin_Yang_Mandala_Video_Generation.mp4` | 우주 음양 만다라 비디오 생성 | 배경 영상 |
| `Ancient_Diviner_Video_Generation.mp4` | 고대 점술가 비디오 생성 | 테마 영상 |

### 이미지 파일 (PNG)
| 파일명 | 설명 | 용도 |
|--------|------|------|
| `Gemini_Generated_Image_6ifrdd6ifrdd6ifr.png` | Gemini 생성 이미지 1 | UI 구성요소 |
| `Gemini_Generated_Image_qwpmj2qwpmj2qwpm.png` | Gemini 생성 이미지 2 | 배경/테마 |
| `Gemini_Generated_Image_p2kpbpp2kpbpp2kp.png` | Gemini 생성 이미지 3 | 시각 요소 |

## 🎯 역할 및 사용 사례

### 비디오 자산의 역할
- **배경 영상**: 메인 페이지, 로딩 화면, 애니메이션 배경
- **주제 표현**: 주역(易經)의 철학적 개념 시각화
- **사용자 경험 향상**: 시각적 몰입감과 문화적 분위기 조성

### 이미지 자산의 역할
- **UI 구성요소**: 아이콘, 일러스트레이션, 장식 요소
- **배경 이미지**: 카드, 섹션 배경, 테마 시각화
- **브랜딩**: 프로젝트 시각 아이덴티티 구성

## 🔧 기술 사양

### 비디오 사양
- **형식**: MP4 (H.264 코덱)
- **용도**: 웹 배경 영상, 애니메이션
- **최적화**: 웹 재생을 위한 스트리밍 최적화

### 이미지 사양
- **형식**: PNG (손실 없음)
- **최적화**: 웹 사용을 위한 압축
- **용도**: UI 구성요소, 배경, 테마

## 💡 사용 가이드

### 비디오 통합 방법
```html
<!-- React에서 배경 비디오 사용 -->
<video autoPlay muted loop className="background-video">
  <source src="/images/Ancient_Chinese_Coins_Cosmic_Animation.mp4" type="video/mp4" />
</video>
```

### 이미지 통합 방법
```jsx
// Next.js Image 컴포넌트 사용 (최적화)
import Image from 'next/image';

<Image
  src="/images/Gemini_Generated_Image_6ifrdd6ifrdd6ifr.png"
  alt="Description"
  width={1200}
  height={600}
/>
```

## 📝 주의사항

- **파일명 변경 금지**: 프로젝트 코드에서 참조되는 파일명이므로 변경 시 링크 업데이트 필요
- **해상도 유지**: 이미지/비디오 품질 저하 없이 최적화 진행
- **저작권**: 사용된 생성 이미지의 라이선스 확인
- **성능**: 대용량 비디오 파일은 비디오 CDN 사용 권장

## 🔄 유지보수

- **정기 검토**: 사용 중단된 자산 정리
- **최적화**: 웹 성능 기준에 맞춰 재압축
- **버전 관리**: 주요 변경사항은 별도 폴더로 백업

## 📌 관련 폴더

- **백업**: [../_backup/phase1](../_backup/phase1) - 이전 버전 자산
- **아카이브**: [../_archive/scripts](../_archive/scripts) - 자산 생성 스크립트

---

*마지막 수정: 2026년 1월 1일*

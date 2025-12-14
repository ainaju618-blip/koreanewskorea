# 스크래퍼 현황
> 최종 수정: 2025-12-14
> **✅ 전체 구현 완료: 26개 / 26개 (100%)**

---

## 시스템 상태

| 항목 | 상태 | 설명 |
|------|------|------|
| **Cloudinary** | 비활성화 | 로컬 저장 모드 |
| **이미지 저장** | 로컬 | `public/images/{region}/` |
| **공통 모듈** | 정상 | `utils/local_image_saver.py` |

---

## 구현 완료 (26개)

### 광역/도 (2개)

| 지역 | 코드 | 비고 |
|------|------|------|
| 광주광역시 | gwangju | 핫링크 방지 대응 |
| 전라남도 | jeonnam | HWP iframe |

### 시 (5개)

| 지역 | 코드 | 비고 |
|------|------|------|
| 목포시 | mokpo | - |
| 여수시 | yeosu | og:description, 첨부파일 이미지 |
| 순천시 | suncheon | POST 이미지 다운로드 |
| 나주시 | naju | - |
| 광양시 | gwangyang | - |

### 군 (17개)

| 지역 | 코드 | 비고 |
|------|------|------|
| 담양군 | damyang | - |
| 곡성군 | gokseong | - |
| 구례군 | gurye | - |
| 고흥군 | goheung | - |
| 보성군 | boseong | - |
| 화순군 | hwasun | - |
| 장흥군 | jangheung | - |
| 강진군 | gangjin | - |
| 해남군 | haenam | - |
| 영암군 | yeongam | - |
| 무안군 | muan | - |
| 함평군 | hampyeong | - |
| 영광군 | yeonggwang | - |
| 장성군 | jangseong | - |
| 완도군 | wando | - |
| 진도군 | jindo | - |
| 신안군 | shinan | - |

### 교육청 (2개)

| 지역 | 코드 | 비고 |
|------|------|------|
| 광주광역시교육청 | gwangju_edu | JS evaluate |
| 전라남도교육청 | jeonnam_edu | 전남교육통 |

---

## 공통 모듈

| 모듈 | 경로 | 용도 |
|------|------|------|
| 로컬 이미지 저장 | `utils/local_image_saver.py` | 이미지 다운로드 및 저장 |
| Cloudinary (레거시) | `utils/cloudinary_uploader.py` | 이전 버전 호환용 |
| 템플릿 | `templates/base_scraper_template.py` | 신규 스크래퍼 개발용 |

---

## 참고 문서

- 개발 가이드: `SCRAPER_GUIDE.md`
- 변경 이력: `SCRAPER_CHANGELOG.md`
- 우선순위: `_queue/PRIORITY.md`

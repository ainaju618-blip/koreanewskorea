# 스크래퍼 현황
> 최종 수정: 2025-12-13
> 구현: 12 | 미구현: 14

---

## 시스템 상태

| 항목 | 상태 | 설명 |
|------|------|------|
| **Cloudinary** | 비활성화 | 로컬 저장 모드 |
| **이미지 저장** | 로컬 | `public/images/{region}/` |
| **공통 모듈** | 정상 | `utils/cloudinary_uploader.py` |

---

## 구현 완료 (11개)

| 지역 | 코드 | 버전 | 비고 |
|------|------|------|------|
| 광주광역시 | gwangju | - | 핫링크 방지 대응 |
| 전라남도 | jeonnam | - | HWP iframe |
| 순천시 | suncheon | v4.0 | POST 이미지 다운로드 |
| 나주시 | naju | v1.0 | - |
| 목포시 | mokpo | v3.0 | - |
| 여수시 | yeosu | v1.0 | og:description, 첨부파일 이미지 |
| 광주교육청 | gwangju_edu | - | JS evaluate |
| 영광군 | yeonggwang | - | - |
| 담양군 | damyang | - | - |
| 곡성군 | gokseong | v1.0 | - |
| 강진군 | gangjin | v1.0 | 신규 (2025-12-12) |
| 전남교육청 | jeonnam_edu | v1.0 | 신규 (2025-12-13), 전남교육통 |

---

## 미구현 (16개)

### 시 (1개)
- 광양시 (gwangyang)

### 군 (13개)
- 구례군 (gurye)
- 고흥군 (goheung)
- 보성군 (boseong)
- 화순군 (hwasun)
- 장흥군 (jangheung)
- 해남군 (haenam)
- 영암군 (yeongam)
- 무안군 (muan)
- 함평군 (hampyeong)
- 장성군 (jangseong)
- 완도군 (wando)
- 진도군 (jindo)
- 신안군 (shinan)

### 교육청 (1개)
- 전남교육청 (jeonnam_edu)

---

## 다음 작업
→ `_queue/PRIORITY.md` 참조

---

## 공통 모듈 사용 현황

`utils/cloudinary_uploader.py` 사용:
- yeosu, yeonggwang, suncheon, mokpo, jeonnam, gwangju_edu
- damyang, gokseong, gangjin
- templates/base_scraper_template.py

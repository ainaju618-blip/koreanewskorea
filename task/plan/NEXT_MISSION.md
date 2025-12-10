# 🚀 NEXT MISSION: [Phase 7] 전남 지역 카테고리 시스템 + CMS 완성

## [STATUS] Phase 6 Completed (CMS Refinement) ✅ → **Phase 7 진행 중** 🔄

> **[CONTEXT]**
> CMS의 핵심 기능은 완성되었으나, **프론트엔드(독자 페이지)에서 전남 22개 시군 콘텐츠에 접근할 수 없는 치명적 결함** 발견.
> 스크래퍼(입구)는 있으나 카테고리 페이지(출구)가 없는 상태. 즉시 연결 필요.

---

## 🎯 Phase 7 핵심 목표: "전남 지역 카테고리 하이브리드 시스템"

### 설계 방식: GNB 메가메뉴 + 지역 허브 페이지 (Hybrid)

| 요소 | 설명 |
|------|------|
| **GNB 메가메뉴** | '전남' hover 시 22개 시군 드롭다운 표시, 빠른 접근 |
| **지역 허브 페이지** | `/category/jeonnam` 클릭 시 인터랙티브 지도 + 전체 뉴스 |
| **개별 지역 페이지** | `/category/jeonnam/[code]` 동적 라우트로 지역별 기사 필터 |

---

## 📋 상세 작업지시서

> **👉 [OPUS_MISSION_PHASE7.md](./OPUS_MISSION_PHASE7.md) 참조**
> 
> 모든 세부 Task가 분해되어 있습니다. Opus는 이 파일을 따라 작업합니다.

---

## 📡 실시간 진행 모니터링

> **👉 [OPUS_PROGRESS_LOG.md](./OPUS_PROGRESS_LOG.md) 참조**
> 
> Opus가 각 Task 완료 시마다 업데이트합니다. CSTO가 실시간 확인 가능.

---

## ✅ 완료 기준 (Definition of Done)

### Phase 7.1~7.3 (프론트엔드 카테고리)
- [ ] GNB '전남' hover 시 메가메뉴 표시
- [ ] 메가메뉴에서 시군 클릭 시 해당 지역 페이지 이동
- [ ] `/category/jeonnam` 허브 페이지에 지도 표시
- [ ] 지도에서 지역 클릭 시 해당 페이지 이동
- [ ] 각 지역 페이지에서 DB 기사 필터링 표시

### Phase 7.6 (AI/정치경제)
- [x] AI / 정치경제 카테고리 페이지 구현 ✅

---

## 🚀 Phase 8: 교육청 스크래퍼 확장 (Operation Edu Connect)
*   **목표:** 광주/전남 교육청 보도자료 수집 불가 문제 해결
*   **Tasks:**
    1.  `gwangju_edu_scraper.py` 개발 (광주교육청)
    2.  `jeonnam_edu_scraper.py` 개발 (전남교육청)
    3.  Admin 봇 실행 화면에 교육청 선택 옵션 추가
    4.  API 연동

---

## 🗓️ 예상 일정

| Phase | 작업 | 예상 시간 |
|-------|------|----------|
| 7.x | 카테고리 시스템 | ✅ 완료 |
| **8.0** | **교육청 스크래퍼** | **40분** |

---

## 🔗 관련 문서

- [OPUS_MISSION_PHASE7.md](./OPUS_MISSION_PHASE7.md) - 상세 작업지시서
- [OPUS_PROGRESS_LOG.md](./OPUS_PROGRESS_LOG.md) - 실시간 진행 로그
- [DEVELOPMENT_LOG.md](./DEVELOPMENT_LOG.md) - 전체 개발 이력

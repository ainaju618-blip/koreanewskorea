# 작업 로그

> 작업 완료 후 반드시 기록 (누가, 언제, 무엇을)

---

## 2026-01-07

### 18:00 - Claude
- [x] 개발환경(localhost) 기본 지역 설정 추가 (DEV_DEFAULT_REGION=naju)
- [x] middleware.ts에서 환경변수 기반 자동 리다이렉트
- [x] 나주 places/events 데이터 확인 (16개 장소, 5개 행사)

### 17:00 - Claude
- [x] 지역 선택 시 쿠키 저장 기능 추가 (HeaderRegionSelector.tsx)
- [x] middleware.ts에서 쿠키 읽어 해당 지역으로 리다이렉트
- [x] 나주/진도 선택 → 다음 접속 시 자동 이동

### 16:00 - Claude
- [x] 전역 CLAUDE.md PM2 섹션 간소화 (40줄 → 8줄)
- [x] "이미 실행 중이면 재시작 금지" 규칙 추가

### 15:30 - Claude
- [x] 전역 CLAUDE.md "3.6 절대 권한 위임" 섹션 삭제
- [x] 전역 CLAUDE.md "작업 유형별 행동 기준" 추가 (🟢🟡🔴)
- [x] 전역 CLAUDE.md "작업 로그 기록" 규칙 추가

### 15:20 - Claude
- [x] 프로젝트 CLAUDE.md "DB 완전 분리" → "DB 통합 운영" 변경

### 14:00 - 주인님
- [x] Supabase에 places 테이블 생성
- [x] Supabase에 events 테이블 생성
- [x] /api/seed/naju 호출 → 16개 장소, 5개 행사 추가

### 13:30 - Claude
- [x] places API 라우트 복원 (tour_spots → places 테이블)
- [x] 나주 페이지 Supabase 연동 완료 (3.7 항목)

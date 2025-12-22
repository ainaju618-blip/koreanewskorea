## 완료: AI 재가공 지역 선택, 토큰 관리 및 출력 구조화

**완료자**: Gemini (Antigravity)
**완료일**: 2025-12-22

### 수행 내용
1. **AI 설정 확장**:
   - 지역별 AI 적용 필터 (RegionSelector)
   - 토큰 소모량 제한 (일일 제한, 월별 토큰, 입력 길이)
   - 마스터 스위치 (전체 On/Off)
   - 기자별 API 키 관리 (Provider 별도 설정)

2. **AI 출력 구조화 (JSON)**:
   - `ai-prompts.ts`: `FORCED_OUTPUT_FORMAT` 추가로 JSON 출력 강제
   - `ai-output-parser.ts`: AI 응답 파싱 및 HTML 정규화 유틸 생성
   - `posts` 테이블에 SEO 필드 (`slug`, `ai_summary`, `keywords`, `tags`, `ai_processed`) 추가

3. **시뮬레이터 고도화**:
   - `/admin/settings/ai` 페이지에서 실시간 시뮬레이션 가능
   - JSON 미리보기 및 실전 DB 테스트 기능 추가
   - 테스트 성공 시 생성된 기사로 바로 이동하는 링크 제공 (Local/Prod)

4. **프론트엔드 개선**:
   - 기사 상세 페이지 (`news/[id]`) UI 개선
   - AI 요약 위치 재조정 (태그 하단), HTML 태그 노출 수정

### 변경된 파일
| 파일 | 변경 내용 |
|------|----------|
| `src/app/admin/settings/ai/*` | 지역 선택, 토큰 패널, 시뮬레이터 UI 추가 |
| `src/app/api/admin/ai-settings/*` | 설정 저장 API 수정 |
| `src/app/api/admin/ai-usage/*` | AI 사용량 통계 API 신규 생성 |
| `src/app/api/ai/rewrite/route.ts` | JSON 파싱 모드 및 DB 업데이트 로직 추가 |
| `src/lib/ai-guard.ts` | AI 사용 제한 및 로깅 유틸 생성 |
| `src/lib/ai-output-parser.ts` | AI 응답 파싱 유틸 생성 |
| `src/app/(site)/news/[id]/page.tsx` | 상세 페이지 SEO/UI 개선 |
| `supabase/migrations/*` | `ai_usage_logs` 테이블, `posts` 테이블 컬럼 추가 마이그레이션 |

### Gate 체크
- [x] Gate 1: 테스트 완료 (빌드 성공, 시뮬레이터 실전 테스트 성공)
- [x] Gate 2: 에러 기록 (해당 없음)
- [x] Gate 3: session_log.md 기록됨

### Claude에게 요청
- [ ] 코드 리뷰
- [ ] Git push & Vercel 배포

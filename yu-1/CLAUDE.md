# AI 협업 규칙

## 📚 프로젝트 문서 인덱스 (2026-01-01 완료)

> **새 개발자 온보딩**: 아래 문서들로 전체 구조 파악 가능

| 문서 | 설명 |
|------|------|
| [README.md](README.md) | 프로젝트 개요, 퀵스타트, 아키텍처 다이어그램 |
| [docs/INDEX.md](docs/INDEX.md) | **문서 허브** - 모든 문서 링크 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 시스템 아키텍처, 데이터 플로우, 모듈 관계도 |
| [docs/DATA_INDEX.md](docs/DATA_INDEX.md) | 데이터 자산 인덱스 |

### 폴더별 README (25개 생성 완료)
```
yu-1/
├── README.md                          # 프로젝트 루트
├── docs/INDEX.md                      # 문서 허브
├── docs/ARCHITECTURE.md               # 아키텍처 상세
├── backend/README.md                  # 백엔드 진입점
│   ├── alembic/README.md              # DB 마이그레이션
│   ├── app/api/README.md              # API 엔드포인트 상세 (★)
│   ├── app/core/README.md             # 환경변수/설정
│   ├── app/data/README.md             # 시드 데이터
│   ├── app/db/README.md               # DB 연결
│   ├── app/models/README.md           # ORM 모델
│   ├── app/repositories/README.md     # 데이터 접근
│   ├── app/services/README.md         # 비즈니스 로직
│   ├── app/usecases/README.md         # 유스케이스
│   ├── scripts/README.md              # 유틸리티 스크립트
│   └── tests/README.md                # 테스트
├── frontend/README.md                 # 프론트엔드 진입점
│   ├── public/README.md               # 정적 자산
│   ├── src/app/README.md              # 페이지 라우팅
│   ├── src/components/README.md       # 컴포넌트 카탈로그 (★)
│   ├── src/lib/README.md              # API 클라이언트
│   └── src/types/README.md            # TypeScript 타입
├── data/README.md                     # 멀티미디어 자산
├── _archive/README.md                 # 아카이브
└── _backup/README.md                  # 백업
```

---

## 데이터 인덱스 참조
- **데이터 문서**: [docs/DATA_INDEX.md](docs/DATA_INDEX.md) - 전체 데이터 자산 인덱스
- **질문 데이터**: 9,491개 (19개 TXT 파일 → JSON 통합)
- **키워드 인덱스**: 9,975개 역인덱스
- **카테고리**: 9개 대분류, 250개 소분류
- **백엔드 정적 데이터**: 64괘 + 384효 + 해석 매트릭스

### 주요 데이터 파일
```
backend/app/data/
├── questions_unified.json      # 통합 질문 데이터
├── keywords_index.json         # 키워드 역인덱스
├── category_questions_map.json # 카테고리별 질문 매핑
├── hexagram_complete.py        # 64괘 완전 데이터
├── yao_complete.py             # 384효 완전 데이터
└── category_seed.py            # 250개 카테고리
```

### 데이터 갱신 스크립트
```bash
# 질문 파싱 (TXT → JSON)
python backend/scripts/parse_questions.py

# 키워드 인덱스 생성
python backend/scripts/build_index.py
```

## 로컬 서버 설정
- **Frontend**: http://localhost:3001 (Next.js)
- **Backend**: http://localhost:8000 (FastAPI)

```bash
# Frontend 실행
cd frontend && npm run dev -- -p 3001

# Backend 실행
cd backend && uvicorn app.main:app --reload --port 8000
```

## 역할
- Perplexity AI = 두뇌 (기획/분석/해결)
- Claude Code = 손 (실행/구현)

## 지시 형식
```
=== PERPLEXITY 지시 ===
[작업명]: {내용}
[명세]: {상세}
[테스트]: {검증방법}
=== 지시 끝 ===
```

## 에러 규칙
- 에러 1회 → 자체 해결
- 같은 에러 2회 → STOP → 에러 보고서 출력

## 에러 보고서
```
[작업명]: {내용}
[에러 횟수]: {N회}
[에러 로그]: {터미널 출력}
```

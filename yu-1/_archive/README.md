# Archive Directory - 아카이브 스크립트

## 📁 폴더 구조

```
_archive/
└── scripts/                        # 레거시 및 유틸리티 스크립트
    ├── 데이터 생성 스크립트
    ├── 데이터베이스 임포트 스크립트
    ├── 데이터 변환 스크립트
    └── 테스트 및 검증 스크립트
```

## 📋 스크립트 목록

### 데이터 생성 스크립트

| 스크립트 | 설명 | 상태 |
|---------|------|------|
| `generate_384yao.py` | 384개 효(爻) 데이터 생성 | ✅ 완료 |
| `generate_500_interpretations.py` | 500개 해석 데이터 생성 | ✅ 완료 |

### 데이터베이스 임포트 스크립트

| 스크립트 | 설명 | 대상 |
|---------|------|------|
| `seed_database.py` | 데이터베이스 시드 (초기 데이터 로드) | SQLite/PostgreSQL |
| `import_384yao_to_db.py` | 384 효 데이터를 DB에 임포트 | 데이터베이스 |
| `import_384yao_sqlite.py` | 384 효 데이터를 SQLite로 임포트 | SQLite |

### 데이터 변환 스크립트

| 스크립트 | 입력 | 출력 | 목적 |
|---------|------|------|------|
| `merge_english_data.py` | 중문/영문 데이터 | 통합 데이터 | 다국어 지원 |
| `convert_to_consulting_format.py` | 원본 데이터 | 상담용 포맷 | 포맷 변환 |
| `export_yao_complete_to_csv.py` | 효 데이터 (JSON) | CSV 파일 | 데이터 분석용 |

### 테스트 및 검증 스크립트

| 스크립트 | 설명 | 용도 |
|---------|------|------|
| `test_rag.py` | RAG (검색 증강 생성) 테스트 | 검색 기능 검증 |
| `test_api.py` | API 엔드포인트 테스트 | 백엔드 API 검증 |

### 점술 및 실행 스크립트

| 스크립트 | 설명 | 동작 |
|---------|------|------|
| `cast_divination_now.py` | 점술 즉시 실행 | 점술 결과 생성 |
| `cast_now.py` | 간단한 점술 실행 | 빠른 점술 |
| `cast_traditional_384.py` | 전통 384 점술 실행 | 전통 방식 점술 |

### 데이터 분석 스크립트

| 스크립트 | 설명 | 분석 대상 |
|---------|------|----------|
| `analyze_384_data.py` | 384 효 데이터 분석 | 효 데이터 통계 |

## 🎯 스크립트별 역할 설명

### Phase 1: 데이터 생성 → 변환
```
generate_384yao.py
  ↓
generate_500_interpretations.py
  ↓
merge_english_data.py (영문 지원)
  ↓
convert_to_consulting_format.py (포맷 변환)
```

### Phase 2: 데이터 임포트 및 검증
```
export_yao_complete_to_csv.py (데이터 분석)
  ↓
seed_database.py (DB 초기화)
  ↓
import_384yao_sqlite.py (SQLite 임포트)
  ↓
test_api.py (API 검증)
```

### Phase 3: 기능 테스트 및 실행
```
test_rag.py (RAG 검증)
  ↓
analyze_384_data.py (데이터 분석)
  ↓
cast_traditional_384.py (점술 실행)
```

## 🚀 사용 방법

### 384 효 데이터 생성 및 임포트
```bash
# Step 1: 384 효 데이터 생성
python _archive/scripts/generate_384yao.py

# Step 2: CSV로 내보내기 (검증용)
python _archive/scripts/export_yao_complete_to_csv.py

# Step 3: 데이터베이스 초기화
python _archive/scripts/seed_database.py

# Step 4: SQLite로 임포트
python _archive/scripts/import_384yao_sqlite.py
```

### 점술 기능 테스트
```bash
# 전통 384 점술 실행
python _archive/scripts/cast_traditional_384.py

# API 테스트
python _archive/scripts/test_api.py

# RAG 기능 테스트
python _archive/scripts/test_rag.py
```

### 데이터 분석
```bash
# 384 효 데이터 분석
python _archive/scripts/analyze_384_data.py

# 영문 데이터 병합
python _archive/scripts/merge_english_data.py
```

## 📊 스크립트 의존성

### 필수 라이브러리
```python
# 데이터 처리
import json
import csv
import pandas as pd

# 데이터베이스
import sqlite3
import sqlalchemy

# API 테스트
import requests

# 유틸리티
import random
```

### 선택적 라이브러리
```python
# RAG 기능
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma

# 분석
import numpy as np
import matplotlib.pyplot as plt
```

## ⚠️ 중요 주의사항

### 레거시 상태
- 이 폴더의 스크립트들은 **레거시 상태**입니다
- 현재 프로젝트에서는 백엔드 `backend/scripts/` 사용 권장
- 참고용으로만 유지되고 있습니다

### 데이터 호환성
- 레거시 스크립트로 생성된 데이터는 **포맷 변환**이 필요할 수 있습니다
- 현재 데이터 스키마와 호환성 확인 필수

### 실행 전 체크리스트
- [ ] 데이터베이스 백업 완료
- [ ] Python 환경 확인 (3.9+)
- [ ] 필수 라이브러리 설치 확인
- [ ] 입출력 디렉토리 권한 확인

## 🔍 문제 해결

### 스크립트 실행 오류
```bash
# 1. 환경 확인
python --version

# 2. 의존성 설치
pip install -r requirements.txt

# 3. 권한 확인
chmod +x _archive/scripts/*.py  # Linux/Mac

# 4. 디버그 모드로 실행
python -u _archive/scripts/[script_name].py
```

### 데이터 임포트 오류
- 데이터 포맷 검증: `analyze_384_data.py` 실행
- 데이터베이스 상태 확인
- CSV 파일 인코딩 확인 (UTF-8)

## 📁 관련 폴더

- **현재 데이터 스크립트**: [backend/scripts](../backend/scripts)
- **백업 데이터**: [_backup](../_backup)
- **미디어 자산**: [data](../data)

## 🔄 마이그레이션 가이드

### 레거시 → 현재 시스템
```bash
# Step 1: 레거시 데이터 추출
python _archive/scripts/export_yao_complete_to_csv.py

# Step 2: 현재 스크립트로 변환
python backend/scripts/parse_questions.py

# Step 3: 데이터 검증
python backend/scripts/build_index.py
```

## 📞 지원

### 문제 보고
레거시 스크립트 관련 문제는 `_archive/scripts/` 디렉토리의 로그 파일 확인

### 문서 참조
- **데이터 인덱스**: [docs/DATA_INDEX.md](../docs/DATA_INDEX.md)
- **백엔드 가이드**: [backend/README.md](../backend/README.md)

---

*아카이브 생성일: 2026년 1월 1일*
*상태: 레거시 (참고용)*

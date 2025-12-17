"""
Save Claude 4.5 Prompting Guide summary to Supabase
- Raw source (original content) is stored in raw_source field
- Summary and structured content stored separately
"""
import sys
sys.path.insert(0, 'd:/cbt/claude-hub')

from app.services import knowledge_service
from pathlib import Path

# Read raw source file
raw_file = Path(r"d:\cbt\claude-hub\knowledge\raw\general_클로드4 5 Opus 최선 프롬프트 실례 샘플 템플릿 _20251217_062432.txt")
raw_content = ""
if raw_file.exists():
    raw_content = raw_file.read_text(encoding='utf-8')
    print(f"Raw file loaded: {len(raw_content)} characters")
else:
    print(f"Warning: Raw file not found: {raw_file}")

# Summary data with raw source content
summary_data = {
    "scope": "global",
    "topic": "prompting",
    "title": "Claude 4.5 Opus Prompting Guide",
    "summary": """1. Claude 4는 "시킨 것만 완벽하게" 수행 - 대충 말하면 대충 결과가 나옴. 구체적이고 명시적인 지시 필수
2. 강조 표현에 과민 반응 - "반드시", "크리티컬" 등 강한 표현 대신 일반어로 자연스럽게 요청
3. 병렬 처리 + 파일 다중 생성 + "think" 민감성 - 새로운 특성을 이해하고 제어해야 함""",
    "content": """## Claude 3 vs Claude 4 핵심 변화 (7가지)

| 변화 | Claude 3 | Claude 4 |
|------|----------|----------|
| 지시 해석 | 눈치껏 알아서 | 글자 그대로 정확하게 |
| 제안 vs 실행 | 제안 + 실행 동시 | 구분함 (명시 필요) |
| 강조 표현 | 필요했음 | 과민 반응 (일반어 권장) |
| 작업 후 요약 | 자동으로 해줌 | 요청시에만 |
| 도구 호출 | 순차적 | 병렬 (동시 처리) |
| think 반응 | 일반적 | 매우 민감 (비용 증가) |
| 파일 생성 | 최소한 | 많이 생성하는 경향 |

## 프롬프팅 일반 원칙

### 원칙 1: 명시적 지시
- BAD: "매출 대시보드 만들어줘"
- GOOD: "매출 대시보드 만들어줘. 월별 차트, 필터, 다크모드 포함. 기본을 넘어서 완전한 구현을 해줘."

### 원칙 2: 맥락 추가로 성능 향상
- BAD: "줄임표 사용하지 마"
- GOOD: "이 응답은 TTS 엔진이 읽을 거야. TTS는 줄임표를 발음 못 하니까 사용하지 마."

### 원칙 3: 예시의 품질이 중요
- 원하는 패턴만 포함
- 원치 않는 패턴 제거
- 전문적인 스타일로 작성

## 16가지 실전 가이드 요약

1. 상세도 균형: 요약 필요시 명시적 요청
2. 도구 사용 패턴: "제안해줘" vs "구현해줘" 구분
3. 도구 트리거 조절: 강조 표현 자제, 일반어 사용
4. 형식 제어: "하지마" 대신 "해라" (긍정형)
5. 에이전틱 검색: 성공 기준 명확히 제공
6. 서브 에이전트: 자동 위임 특성 이해
7. think 민감도: "생각해봐" 대신 "검토해봐/분석해봐"
8. 문서 생성: 애니메이션/인터랙티브 명시 요청
9. 비전 기능: 크롭 도구 제공시 성능 향상
10. 병렬 도구: 종속성 없으면 동시 실행
11. 파일 생성 줄이기: "임시 파일 작업 끝에 제거해줘"
12. 과잉 설계 방지: "요청된 변경만 단순하게"
13. 프론트엔드 디자인: AI 슬롭 방지 위해 미학 명시
14. 테스트 통과: "범용 솔루션 작성해"
15. 코드 탐색: "코드 먼저 읽고 제안해"
16. 환각 방지: "열지 않은 코드 추측 금지"

## "think" 대체어

| 사용 금지 | 대체어 |
|----------|--------|
| 생각해봐 | 검토해봐 |
| think | consider |
| 곰곰이 생각해서 | 고려해봐 |
| let me think | 평가해봐 |

## 핵심 템플릿

### 장기 작업 설정
당신의 컨텍스트 윈도우는 한계에 도달하면 자동으로 압축되어
중단된 지점부터 무기한 작업을 계속할 수 있습니다.
토큰 예산 우려로 작업을 일찍 중단하지 마세요.

### 과잉 설계 방지
과잉 설계를 피해. 직접 요청되거나 명확히 필요한 변경만 해.
솔루션을 단순하고 집중되게 유지해.

### 환각 방지
열지 않은 코드에 대해 절대로 추측하지마.
사용자가 특정 파일을 참조하면 질문에 답하기 전에 반드시 파일을 읽어.""",
    "raw_source": raw_content,  # Full original content stored here
    "source_type": "youtube",
    "source_title": "AI Academy Aji - Claude 4.5 Prompting Guide",
    "tags": ["claude4", "prompting", "best-practices", "prompt-engineering"]
}

# Save to Supabase
print("Saving to Supabase...")
result = knowledge_service.create_knowledge(summary_data)

if result["success"]:
    print("Successfully saved to Supabase!")
    print(f"ID: {result['data']['id']}")
    print(f"Title: {result['data']['title']}")
else:
    print(f"Error: {result['error']}")

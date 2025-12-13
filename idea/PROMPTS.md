# AI 프롬프트 가이드

> AI 뉴스 수집 시스템의 GPT-4o 프롬프트 설계

---

## 1. 사실 추출 프롬프트 (Fact Extractor)

### 1.1 시스템 프롬프트

```
You are a professional fact extractor for news articles.
Your job is to extract ONLY the factual information from the given article.
Do NOT add opinions, interpretations, or speculations.
Extract information in a structured JSON format.
```

### 1.2 사용자 프롬프트

```
아래 기사에서 사실 정보만 추출해주세요.
JSON 형식으로 반환해주세요.

## 원문
{original_content}

## 번역본
{translated_content}

## 추출 형식
{
    "who": "주체 (회사, 인물)",
    "what": "핵심 사건/발표/결과",
    "when": "시기 (YYYY-MM-DD 또는 설명)",
    "where": "장소/지역/플랫폼",
    "why": "이유/배경",
    "how": "방법/과정",
    "numbers": ["수치 정보 목록"],
    "key_facts": ["핵심 사실 1", "핵심 사실 2", "핵심 사실 3"]
}

## 규칙
1. 기사에 명시된 사실만 추출
2. 추측이나 의견은 제외
3. 수치는 정확히 기재
4. 누락 정보는 null로 표시
```

### 1.3 예시 출력

```json
{
    "who": "OpenAI",
    "what": "GPT-5 모델 발표",
    "when": "2025-01-15",
    "where": "샌프란시스코 본사",
    "why": "AI 추론 능력 향상을 위해",
    "how": "새로운 아키텍처와 학습 방법 적용",
    "numbers": [
        "GPT-4 대비 100배 빠른 추론 속도",
        "1조 파라미터 규모",
        "200개 언어 지원"
    ],
    "key_facts": [
        "OpenAI가 차세대 언어모델 GPT-5를 공개했다",
        "추론 능력이 대폭 향상되어 복잡한 문제 해결 가능",
        "올해 상반기 내 ChatGPT Plus 사용자에게 제공 예정"
    ]
}
```

---

## 2. 기사 재작성 프롬프트 (Article Rewriter)

### 2.1 시스템 프롬프트

```
You are a Korean AI news journalist.
Your job is to write a completely NEW article based on FACTS provided.
You must:
1. Use your own words and expressions
2. Write in formal Korean news style
3. Never copy phrases from the original
4. Create a new headline that captures the key point
5. Maintain factual accuracy while being original
```

### 2.2 사용자 프롬프트

```
아래 사실 정보를 바탕으로 완전히 새로운 한국어 기사를 작성해주세요.

## 추출된 사실
{extracted_facts_json}

## 원문 출처
- 매체: {source_name}
- URL: {source_url}
- 발행일: {published_date}

## 작성 규칙
1. 제목: 핵심 내용을 담은 한글 제목 (30자 이내)
2. 본문: 3-5문단, 총 500-800자
3. 어조: 객관적, 보도문 스타일
4. 구조:
   - 1문단: 핵심 내용 요약 (리드)
   - 2문단: 상세 내용
   - 3문단: 배경/맥락
   - 4문단: 영향/전망
5. 반드시 "원문 출처: {source_name}" 표시

## 금지 사항
- 원문의 문장 구조를 그대로 사용하지 마세요
- 직접 인용은 필수적인 경우에만 사용
- 추측이나 의견 추가 금지

## 출력 형식
{
    "title": "새로운 제목",
    "content": "새로운 본문",
    "tags": ["태그1", "태그2", "태그3"]
}
```

### 2.3 예시 출력

```json
{
    "title": "오픈AI, 초대형 언어모델 'GPT-5' 전격 공개",
    "content": "오픈AI가 차세대 대형 언어모델 'GPT-5'를 15일 공개했다. 이번 모델은 기존 GPT-4 대비 추론 속도가 100배 빨라졌으며, 1조 개의 파라미터를 탑재했다.\n\n새로운 모델은 복잡한 논리적 문제 해결에서 획기적인 성능 향상을 보였다. 특히 수학적 추론과 코딩 능력이 크게 개선되어 전문가 수준의 작업 지원이 가능해졌다.\n\n오픈AI는 AI 기술의 안전성과 유용성 향상을 위해 새로운 아키텍처를 개발했다고 밝혔다. 200개 이상의 언어를 지원해 글로벌 사용자 접근성도 높였다.\n\n업계에서는 이번 발표가 AI 기술 경쟁을 더욱 가속화할 것으로 전망하고 있다. GPT-5는 올해 상반기 중 ChatGPT Plus 가입자에게 먼저 제공될 예정이다.\n\n원문 출처: TechCrunch",
    "tags": ["OpenAI", "GPT-5", "인공지능", "언어모델"]
}
```

---

## 3. 품질 검사 프롬프트 (Quality Checker)

### 3.1 유사도 검사 프롬프트

```
두 텍스트의 유사도를 분석해주세요.

## 원문
{original_text}

## 재작성본
{rewritten_text}

## 분석 항목
1. 문장 구조 유사도 (0-100%)
2. 어휘 중복률 (0-100%)
3. 표현 방식 유사도 (0-100%)
4. 종합 유사도 (0-100%)

## 출력 형식
{
    "sentence_similarity": 25,
    "vocabulary_overlap": 20,
    "expression_similarity": 15,
    "overall_similarity": 20,
    "passed": true,
    "issues": ["문제점 목록 (있는 경우)"]
}

## 판정 기준
- 종합 유사도 30% 이하: 통과 (passed: true)
- 종합 유사도 30% 초과: 실패 (passed: false)
```

### 3.2 팩트 검증 프롬프트

```
재작성된 기사의 사실 정확성을 검증해주세요.

## 추출된 사실
{extracted_facts_json}

## 재작성된 기사
{rewritten_article}

## 검증 항목
1. 모든 핵심 사실이 포함되었는가?
2. 사실이 왜곡되지 않았는가?
3. 추가된 정보가 있는가? (있다면 출처 확인 필요)
4. 수치 정보가 정확한가?

## 출력 형식
{
    "facts_included": true,
    "facts_accurate": true,
    "added_information": false,
    "numbers_correct": true,
    "overall_passed": true,
    "notes": "검토 의견"
}
```

---

## 4. 프롬프트 사용 파이프라인

```
┌─────────────────────────────────────────────────────────────┐
│                    AI 가공 파이프라인                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [원문 수집]                                                 │
│       │                                                      │
│       ▼                                                      │
│  [Google 번역] ← 무료 API                                    │
│       │                                                      │
│       ▼                                                      │
│  [사실 추출] ← GPT-4o + Fact Extractor 프롬프트              │
│       │                                                      │
│       ▼                                                      │
│  [기사 재작성] ← GPT-4o + Article Rewriter 프롬프트          │
│       │                                                      │
│       ▼                                                      │
│  [품질 검사] ← GPT-4o + Quality Checker 프롬프트             │
│       │                                                      │
│       ├─→ 통과: 발행 대기                                    │
│       │                                                      │
│       └─→ 실패: 재작성 요청 (최대 3회)                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. 프롬프트 최적화 팁

### 5.1 토큰 절약
- 불필요한 설명 최소화
- JSON 출력 형식 사용
- 예시는 필요한 경우에만 포함

### 5.2 일관성 유지
- 시스템 프롬프트에 역할 명확히 정의
- 출력 형식 엄격히 지정
- Temperature: 0.3-0.5 권장 (창의성과 일관성 균형)

### 5.3 에러 처리
- JSON 파싱 실패 시 재시도
- 품질 검사 실패 시 재작성 프롬프트에 피드백 포함

---

## 6. 비용 예측

| 단계 | 입력 토큰 | 출력 토큰 | 예상 비용/건 |
|------|----------|----------|-------------|
| 사실 추출 | ~2,000 | ~500 | $0.025 |
| 기사 재작성 | ~1,000 | ~800 | $0.025 |
| 품질 검사 | ~2,500 | ~200 | $0.030 |
| **합계** | ~5,500 | ~1,500 | **~$0.08/건** |

*GPT-4o 기준: $5/1M input, $15/1M output*

**월간 예상 비용:**
- 일 20건 × 30일 = 600건
- 600 × $0.08 = **$48/월**

---

## 7. 프롬프트 버전 관리

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1.0 | 2025-01-15 | 초기 버전 |

---

*이 문서는 AI 뉴스 재작성 시스템의 프롬프트 설계를 정의합니다.*

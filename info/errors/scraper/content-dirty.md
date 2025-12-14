# [ERROR] 본문 오염 (메타정보)

> **발생 빈도:** 높음
> **최종 수정:** 2025-12-15

## 증상
- 본문에 "작성자:", "조회수:", "담당부서:" 등 포함
- 전화번호가 본문에 나타남

## 원인
본문 영역에 메타정보가 함께 포함됨

## 해결

### clean_content() 함수에 패턴 추가
```python
def clean_content(content: str) -> str:
    patterns_to_remove = [
        # 기본
        r'작성자\s*[:：]?\s*[^\n]+',
        r'조회수\s*[:：]?\s*\d+',

        # 공공기관 특화
        r'담당부서\s*[:：]?\s*[^\n]+',
        r'담당자\s*[:：]?\s*[^\n]+',
        r'연락처\s*[:：]?\s*[\d\-\s]+',
        r'전화번호\s*[:：]?\s*[\d\-\s]+',

        # 전화번호 패턴
        r'\d{2,3}[-\s]?\d{3,4}[-\s]?\d{4}',

        # 날짜/시간
        r'등록일\s*[:：]?\s*\d{4}[-./]\d{2}[-./]\d{2}',
    ]

    for pattern in patterns_to_remove:
        content = re.sub(pattern, '', content, flags=re.IGNORECASE)

    return content.strip()
```

## 문제 지역 (2025-12-14)
| 지역 | 문제 유형 | 해결 |
|------|----------|------|
| 광양시 | 담당부서/연락처 | v1.1 |
| 광주교육청 | 조회수/날짜 | v4.1 |
| 화순군 | 조회수 | v1.1 |

## 관련
- `guides/scraper/content-clean.md` - 본문 정제 가이드

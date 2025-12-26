# UnicodeEncodeError: cp949 codec

> **날짜:** 2025-12-26
> **심각도:** MEDIUM (출력 중단, 스크래핑은 가능)
> **카테고리:** scraper

---

## 증상

스크래퍼 실행 중 다음 오류 발생 (Windows 환경):

```
UnicodeEncodeError: 'cp949' codec can't encode character '\xa0' in position X: illegal multibyte sequence
```

또는:

```
UnicodeEncodeError: 'cp949' codec can't encode character '\u2027' in position X
```

## 에러 메시지

```python
Traceback (most recent call last):
  File "scrapers/[region]/[region]_scraper.py", line XXX
    print(f"   [1] 분석 중: {title[:30]}...")
UnicodeEncodeError: 'cp949' codec can't encode character '\xa0' in position 15
```

## 근본 원인

1. **Windows 콘솔 기본 인코딩:** cp949 (EUC-KR 계열)
2. **웹에서 가져온 텍스트:** UTF-8 기반, 유니코드 특수문자 포함
3. **인코딩 불가능 문자 예시:**
   - `\xa0` - Non-breaking space
   - `\u2027` - Hyphenation point
   - `\u2013` - En dash
   - `\u2018`, `\u2019` - Smart quotes

```python
# 문제가 있는 코드
print(f"   [{processed_count+1}] 분석 중: {title[:30]}...")
# title에 \xa0 포함 시 오류!
```

## 영향받은 파일 (2025-12-26 수정)

| 파일 | 라인 | 수정 날짜 | 수정자 |
|------|------|----------|--------|
| `scrapers/jeonnam_edu/jeonnam_edu_scraper.py` | - | 2025-12-26 | User |
| `scrapers/utils/api_client.py` | - | 2025-12-26 | User |
| `scrapers/gwangju/gwangju_scraper.py` | L23-27, L232 | 2025-12-26 | Claude |

**총 3개 파일 영향**

## 해결 방법

### 방법 1: safe_str() 함수 사용 (권장)

```python
def safe_str(s):
    """Safely convert string for Windows console output (cp949)"""
    if s is None:
        return ''
    return s.encode('cp949', errors='replace').decode('cp949')

# 사용 예시
print(f"   [{processed_count+1}] 분석 중: {safe_str(title[:30])}...")
```

### 방법 2: 환경변수 설정 (전역)

```python
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
```

### 방법 3: PYTHONIOENCODING 환경변수

```bash
set PYTHONIOENCODING=utf-8
python scrapers/gwangju/gwangju_scraper.py
```

## 수정 위치 (gwangju_scraper.py 예시)

```python
# 파일 상단에 safe_str 함수 추가
GWANGJU_LIST_SELECTORS = ['tr td.title a', 'a[href*="boardView.do"]']


def safe_str(s):
    """Safely convert string for Windows console output (cp949)"""
    if s is None:
        return ''
    return s.encode('cp949', errors='replace').decode('cp949')


def normalize_date(date_str: str) -> str:
    # ...

# print 문에서 safe_str() 사용
print(f"   [{processed_count+1}] 분석 중: {safe_str(title[:30])}...")
```

## 예방 대책

1. **print 문에서 외부 텍스트 출력 시 항상 safe_str() 사용**

2. **새 스크래퍼 템플릿에 safe_str() 함수 기본 포함**

3. **Windows 환경 테스트 필수화:**
   - GitHub Actions는 Linux (UTF-8 기본) → 오류 안 남
   - 로컬 Windows는 cp949 → 오류 발생

## 관련 지식

| 문자 | 유니코드 | 설명 | 대체값 |
|------|----------|------|--------|
| ` ` | `\xa0` | Non-breaking space | 일반 공백 |
| `‧` | `\u2027` | Hyphenation point | `-` |
| `–` | `\u2013` | En dash | `-` |
| `'` | `\u2018` | Left single quote | `'` |
| `'` | `\u2019` | Right single quote | `'` |

---

*작성: 2025-12-26 | Claude*

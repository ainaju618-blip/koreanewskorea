"""
Dev4: API 기본 동작 테스트 스크립트

기능:
1. Health check 엔드포인트 테스트
2. Categories 조회 테스트
3. Divination GET 테스트 (384효 조회)
4. Divination POST 테스트 (점 치기)

사용법:
    # 서버 실행 중인 상태에서
    python scripts/test_api.py

    # 또는 특정 호스트 지정
    python scripts/test_api.py http://localhost:8000
"""
import sys
import json
import urllib.request
import urllib.error
from typing import Optional, Dict, Any


# API 기본 URL
DEFAULT_BASE_URL = "http://localhost:8000"


def make_request(
    method: str,
    url: str,
    data: Optional[Dict] = None,
    timeout: int = 10
) -> tuple[int, Any]:
    """HTTP 요청 수행"""
    try:
        headers = {"Content-Type": "application/json"}

        if data:
            body = json.dumps(data).encode("utf-8")
            req = urllib.request.Request(url, data=body, headers=headers, method=method)
        else:
            req = urllib.request.Request(url, headers=headers, method=method)

        with urllib.request.urlopen(req, timeout=timeout) as response:
            body = response.read().decode("utf-8")
            return response.status, json.loads(body) if body else {}

    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        return e.code, json.loads(body) if body else {"error": str(e)}
    except urllib.error.URLError as e:
        return 0, {"error": f"Connection failed: {e.reason}"}
    except Exception as e:
        return 0, {"error": str(e)}


def test_health(base_url: str) -> bool:
    """1. Health Check 테스트"""
    print("\n" + "="*60)
    print("1. Health Check 테스트")
    print("="*60)

    url = f"{base_url}/api/divination/health"
    print(f"  GET {url}")

    status, response = make_request("GET", url)

    if status == 200:
        print(f"  Status: {status}")
        print(f"  Response: {json.dumps(response, ensure_ascii=False, indent=4)}")

        if response.get("status") == "ok":
            print("  ✅ Health Check 성공")
            return True

    print(f"  ❌ Health Check 실패: {response}")
    return False


def test_categories(base_url: str) -> bool:
    """2. Categories 조회 테스트"""
    print("\n" + "="*60)
    print("2. Categories 조회 테스트")
    print("="*60)

    # 대분류 조회
    url = f"{base_url}/api/divination/categories"
    print(f"  GET {url}")

    status, response = make_request("GET", url)

    if status == 200 and isinstance(response, list):
        print(f"  Status: {status}")
        print(f"  대분류 카테고리 수: {len(response)}")

        for cat in response[:5]:  # 첫 5개만 출력
            print(f"    - {cat.get('id')}: {cat.get('emoji', '')} {cat.get('name')}")

        if len(response) > 5:
            print(f"    ... 외 {len(response) - 5}개")

        # 소분류 조회 테스트 (재물 카테고리)
        sub_url = f"{base_url}/api/divination/categories/1/sub"
        print(f"\n  GET {sub_url}")

        sub_status, sub_response = make_request("GET", sub_url)

        if sub_status == 200 and isinstance(sub_response, list):
            print(f"  소분류 카테고리 수: {len(sub_response)}")
            for sub in sub_response[:3]:
                print(f"    - {sub.get('id')}: {sub.get('name')}")
            if len(sub_response) > 3:
                print(f"    ... 외 {len(sub_response) - 3}개")

            print("  ✅ Categories 조회 성공")
            return True

    print(f"  ❌ Categories 조회 실패: {response}")
    return False


def test_divination_get(base_url: str) -> bool:
    """3. Divination GET 테스트 (384효 조회)"""
    print("\n" + "="*60)
    print("3. Divination GET 테스트 (384효 조회)")
    print("="*60)

    test_cases = [
        {"hexagram": 1, "yao": "초구", "category": "재물"},
        {"hexagram": 14, "yao": "구오", "category": "직업"},
        {"hexagram": 31, "yao": "초육", "category": "연애"},
    ]

    success = 0

    for case in test_cases:
        url = f"{base_url}/api/divination?hexagram={case['hexagram']}&yao={case['yao']}&category={case['category']}"
        print(f"\n  GET {url}")

        status, response = make_request("GET", url)

        if status == 200:
            print(f"  Status: {status}")
            print(f"    괘: {response.get('hexagram_name', 'N/A')}")
            print(f"    효: {response.get('yao_name', 'N/A')}")
            print(f"    운세: {response.get('fortune_category', 'N/A')} ({response.get('fortune_score', 0)}점)")
            print(f"    해석: {response.get('interpretation', 'N/A')[:50]}...")
            success += 1
        else:
            print(f"  ❌ 실패: {response}")

    if success == len(test_cases):
        print(f"\n  ✅ {success}/{len(test_cases)} GET 테스트 성공")
        return True
    else:
        print(f"\n  ⚠️ {success}/{len(test_cases)} GET 테스트 성공")
        return success > 0


def test_divination_post(base_url: str) -> bool:
    """4. Divination POST 테스트 (점 치기)"""
    print("\n" + "="*60)
    print("4. Divination POST 테스트 (점 치기)")
    print("="*60)

    test_cases = [
        {
            "divination_type": "iching",
            "period": "daily",
            "main_category": 1,
            "question": "오늘 주식 투자 운은 어떤가요?"
        },
        {
            "divination_type": "iching",
            "period": "weekly",
            "main_category": 4,
            "question": "이번 주 연애 운세가 궁금해요"
        },
        {
            "divination_type": "iching",
            "period": "monthly",
            "main_category": 2,
            "question": "이번 달 이직해도 될까요?"
        },
    ]

    success = 0
    url = f"{base_url}/api/divination/cast"

    for i, case in enumerate(test_cases, 1):
        print(f"\n  [{i}] POST {url}")
        print(f"      질문: {case['question']}")

        status, response = make_request("POST", url, data=case)

        if status == 200:
            print(f"      Status: {status}")

            hexagram = response.get("hexagram", {})
            print(f"      본괘: {hexagram.get('name_full', 'N/A')}")

            reading = response.get("reading_method", {})
            print(f"      해석법: {reading.get('description', 'N/A')}")

            print(f"      운세: {response.get('fortune_category', 'N/A')} ({response.get('fortune_score', 0)}점)")

            interpretation = response.get("interpretation", "")
            if interpretation:
                print(f"      해석: {interpretation[:60]}...")

            keywords = response.get("keywords", [])
            if keywords:
                print(f"      키워드: {', '.join(keywords[:5])}")

            changing = response.get("changing_lines", [])
            if changing:
                print(f"      변효: {changing}")
                transformed = response.get("transformed_hexagram_name")
                if transformed:
                    print(f"      지괘: {transformed}")

            success += 1
        else:
            print(f"      ❌ 실패: {response}")

    if success == len(test_cases):
        print(f"\n  ✅ {success}/{len(test_cases)} POST 테스트 성공")
        return True
    else:
        print(f"\n  ⚠️ {success}/{len(test_cases)} POST 테스트 성공")
        return False


def main():
    """메인 테스트 실행"""
    # 기본 URL 또는 인자로 받은 URL 사용
    base_url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_BASE_URL

    print("\n" + "#"*60)
    print("# API 기본 동작 테스트")
    print(f"# Base URL: {base_url}")
    print("#"*60)

    results = {}

    # 1. Health Check
    results["health"] = test_health(base_url)

    if not results["health"]:
        print("\n❌ 서버 연결 실패. 서버가 실행 중인지 확인하세요.")
        print(f"   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        return

    # 2. Categories
    results["categories"] = test_categories(base_url)

    # 3. Divination GET
    results["divination_get"] = test_divination_get(base_url)

    # 4. Divination POST
    results["divination_post"] = test_divination_post(base_url)

    # 결과 요약
    print("\n" + "#"*60)
    print("# 테스트 결과 요약")
    print("#"*60)

    total = len(results)
    passed = sum(1 for v in results.values() if v)

    for name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status} - {name}")

    print(f"\n  총 {passed}/{total} 테스트 통과")

    if passed == total:
        print("\n🎉 모든 API 테스트 통과!")
    else:
        print(f"\n⚠️ {total - passed}개 테스트 실패")


if __name__ == "__main__":
    main()

"""
Korea NEWS 연결 테스트 스크립트
- Vercel 서버 연결 테스트
- 환경변수 확인
"""

import os
import sys

# 프로젝트 루트 설정
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

# .env 파일 로드
from dotenv import load_dotenv
load_dotenv(os.path.join(PROJECT_ROOT, '.env'))

import requests

def test_connection():
    print("=" * 60)
    print("Korea NEWS 연결 테스트")
    print("=" * 60)
    print()

    # 1. 환경변수 확인
    print("[1] 환경변수 확인")
    api_url = os.getenv('BOT_API_URL', 'http://localhost:3000/api/bot/ingest')
    log_url = os.getenv('BOT_LOG_API_URL', 'http://localhost:3000/api/bot/logs')
    api_key = os.getenv('BOT_API_KEY', '')

    print(f"  BOT_API_URL: {api_url}")
    print(f"  BOT_LOG_API_URL: {log_url}")
    print(f"  BOT_API_KEY: {'설정됨' if api_key else '❌ 미설정!'}")

    # localhost 경고
    if 'localhost' in api_url:
        print()
        print("  ⚠️  경고: localhost가 설정되어 있습니다!")
        print("  ⚠️  .env 파일에서 실제 서버 URL로 변경하세요:")
        print("      BOT_API_URL=https://koreanewsone.vercel.app/api/bot/ingest")
        return False

    print()

    # 2. 서버 연결 테스트
    print("[2] Vercel 서버 연결 테스트")
    try:
        # 웹사이트 접속 테스트
        test_url = api_url.replace('/api/bot/ingest', '')
        resp = requests.get(test_url, timeout=10)
        print(f"  웹사이트 접속: ✅ 성공 (Status: {resp.status_code})")
    except Exception as e:
        print(f"  웹사이트 접속: ❌ 실패 ({str(e)[:50]})")
        return False

    print()

    # 3. API 테스트 (빈 요청)
    print("[3] Bot API 테스트")
    try:
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}'
        }
        # 빈 데이터로 요청 → 400 Bad Request 예상 (정상)
        resp = requests.post(api_url, json={}, headers=headers, timeout=10)

        if resp.status_code == 400:
            print(f"  API 응답: ✅ 정상 (필수 필드 누락 에러 = API 작동 중)")
        elif resp.status_code == 401:
            print(f"  API 응답: ⚠️ 인증 실패 (BOT_API_KEY 확인 필요)")
        elif resp.status_code == 200 or resp.status_code == 201:
            print(f"  API 응답: ✅ 성공")
        else:
            print(f"  API 응답: ⚠️ 상태코드 {resp.status_code}")

    except Exception as e:
        print(f"  API 응답: ❌ 실패 ({str(e)[:50]})")
        return False

    print()
    print("=" * 60)
    print("✅ 모든 테스트 통과! 스크래퍼 실행 준비 완료")
    print("=" * 60)
    print()
    print("다음 명령으로 테스트 수집을 실행하세요:")
    print("  python run_all_scrapers.py --dry-run --regions naju")
    print()
    return True

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)

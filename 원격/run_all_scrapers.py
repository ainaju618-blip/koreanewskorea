"""
Korea NEWS 전체 스크래퍼 실행 스크립트 (원격 PC용)
- 모든 지역 스크래퍼를 순차 실행
- Windows 작업 스케줄러에서 이 파일을 실행하면 됨
- 원격 폴더 내에서 독립 실행 가능

사용법:
    python run_all_scrapers.py              # 기본 (오늘 기사 수집)
    python run_all_scrapers.py --days 3     # 최근 3일 기사 수집
    python run_all_scrapers.py --dry-run    # 테스트 모드 (DB 저장 안함)
    python run_all_scrapers.py --regions gwangju naju  # 특정 지역만
"""

import os
import sys
import time
import subprocess
import argparse
from datetime import datetime

# 경로 설정 (상대경로 - 원격 폴더 기준)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))  # 원격 폴더
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)  # koreanews 폴더
SCRAPERS_DIR = os.path.join(PROJECT_ROOT, 'scrapers')  # scrapers 폴더

# 원격 폴더 내 scrapers 폴더가 있으면 그것을 사용 (독립 실행 모드)
LOCAL_SCRAPERS_DIR = os.path.join(SCRIPT_DIR, 'scrapers')
if os.path.exists(LOCAL_SCRAPERS_DIR):
    SCRAPERS_DIR = LOCAL_SCRAPERS_DIR

# 전체 지역 목록 (26개)
ALL_REGIONS = [
    "gwangju", "jeonnam", "naju", "mokpo", "yeosu", "suncheon", "gwangyang",
    "damyang", "gokseong", "gurye", "goheung", "boseong", "hwasun", "jangheung",
    "gangjin", "haenam", "yeongam", "muan", "hampyeong", "yeonggwang",
    "jangseong", "wando", "jindo", "shinan",
    "gwangju_edu", "jeonnam_edu"
]

def run_scraper(region: str, days: int = 1, dry_run: bool = False) -> dict:
    """단일 스크래퍼 실행"""
    scraper_path = os.path.join(SCRAPERS_DIR, region, f"{region}_scraper.py")

    if not os.path.exists(scraper_path):
        print(f"  [SKIP] {region}: 스크래퍼 파일 없음")
        return {"region": region, "status": "skipped", "reason": "no_file"}

    args = ["python", scraper_path, "--days", str(days), "--max-articles", "30"]
    if dry_run:
        args.append("--dry-run")

    print(f"  [RUN] {region}...")
    start_time = time.time()

    try:
        result = subprocess.run(
            args,
            cwd=SCRAPERS_DIR,
            capture_output=True,
            text=True,
            timeout=300,  # 5분 타임아웃
            env={**os.environ, "PYTHONIOENCODING": "utf-8"}
        )

        elapsed = time.time() - start_time

        if result.returncode == 0:
            # 결과 파싱 (신규 X건 패턴)
            match = None
            import re
            match = re.search(r'신규\s+(\d+)', result.stdout)
            count = int(match.group(1)) if match else 0

            print(f"  [OK] {region}: {count}건 수집 ({elapsed:.1f}초)")
            return {"region": region, "status": "success", "count": count, "time": elapsed}
        else:
            print(f"  [FAIL] {region}: 에러 발생 ({elapsed:.1f}초)")
            return {"region": region, "status": "failed", "error": result.stderr[:200]}

    except subprocess.TimeoutExpired:
        print(f"  [TIMEOUT] {region}: 5분 초과")
        return {"region": region, "status": "timeout"}
    except Exception as e:
        print(f"  [ERROR] {region}: {str(e)[:100]}")
        return {"region": region, "status": "error", "error": str(e)}

def main():
    parser = argparse.ArgumentParser(description='Korea NEWS 전체 스크래퍼 실행')
    parser.add_argument('--days', type=int, default=1, help='수집할 기간 (일)')
    parser.add_argument('--dry-run', action='store_true', help='테스트 모드')
    parser.add_argument('--regions', nargs='+', help='특정 지역만 실행')
    args = parser.parse_args()

    regions = args.regions if args.regions else ALL_REGIONS

    print("=" * 60)
    print(f"Korea NEWS 스크래퍼 실행")
    print(f"시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"수집 기간: {args.days}일")
    print(f"대상 지역: {len(regions)}개")
    print(f"모드: {'테스트' if args.dry_run else '실제 저장'}")
    print("=" * 60)

    results = []
    for region in regions:
        result = run_scraper(region, args.days, args.dry_run)
        results.append(result)
        time.sleep(1)  # 지역 간 1초 대기

    # 결과 요약
    print("\n" + "=" * 60)
    print("실행 결과 요약")
    print("=" * 60)

    success = [r for r in results if r["status"] == "success"]
    failed = [r for r in results if r["status"] == "failed"]
    skipped = [r for r in results if r["status"] == "skipped"]

    total_articles = sum(r.get("count", 0) for r in success)

    print(f"✅ 성공: {len(success)}개 지역")
    print(f"❌ 실패: {len(failed)}개 지역")
    print(f"⏭️ 스킵: {len(skipped)}개 지역")
    print(f"📰 총 수집: {total_articles}건")
    print(f"종료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    if failed:
        print("\n실패한 지역:")
        for r in failed:
            print(f"  - {r['region']}: {r.get('error', 'Unknown error')[:50]}")

if __name__ == "__main__":
    main()

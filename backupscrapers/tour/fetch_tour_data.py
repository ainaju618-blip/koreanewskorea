"""
Korea Tourism Organization API Scraper
======================================
Fetches tourism data for all 27 Jeonnam/Gwangju regions.

API: TourAPI 4.0 (한국관광공사)
Docs: https://api.visitkorea.or.kr

Data Types:
- 12: 관광지
- 14: 문화시설
- 15: 축제공연행사
- 28: 레포츠
- 32: 숙박
- 38: 쇼핑
- 39: 음식점

Area Codes:
- 5: 광주 (Gwangju Metropolitan City)
- 38: 전라남도 (Jeonnam Province)
"""

import os
import json
import requests
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Configuration
API_KEY = os.getenv('TOUR_API_KEY', '')
BASE_URL = "https://apis.data.go.kr/B551011/KorService2"

# Area codes for Jeonnam regions
AREA_CODES = {
    "gwangju": {"areaCode": "5", "sigunguCode": None, "name": "광주"},  # Metropolitan city, no sigungu
}

# Jeonnam Province (areaCode: 38) sigungu codes (verified via areaCode2 API)
# Note: Codes 14, 15 are not assigned
JEONNAM_SIGUNGU = {
    "gangjin": {"code": "1", "name": "강진군"},
    "goheung": {"code": "2", "name": "고흥군"},
    "gokseong": {"code": "3", "name": "곡성군"},
    "gwangyang": {"code": "4", "name": "광양시"},
    "gurye": {"code": "5", "name": "구례군"},
    "naju": {"code": "6", "name": "나주시"},
    "damyang": {"code": "7", "name": "담양군"},
    "mokpo": {"code": "8", "name": "목포시"},
    "muan": {"code": "9", "name": "무안군"},
    "boseong": {"code": "10", "name": "보성군"},
    "suncheon": {"code": "11", "name": "순천시"},
    "sinan": {"code": "12", "name": "신안군"},
    "yeosu": {"code": "13", "name": "여수시"},
    "yeonggwang": {"code": "16", "name": "영광군"},
    "yeongam": {"code": "17", "name": "영암군"},
    "wando": {"code": "18", "name": "완도군"},
    "jangseong": {"code": "19", "name": "장성군"},
    "jangheung": {"code": "20", "name": "장흥군"},
    "jindo": {"code": "21", "name": "진도군"},
    "hampyeong": {"code": "22", "name": "함평군"},
    "haenam": {"code": "23", "name": "해남군"},
    "hwasun": {"code": "24", "name": "화순군"},
}

# Content types
CONTENT_TYPES = {
    "12": "관광지",
    "14": "문화시설",
    "15": "축제공연행사",
    "28": "레포츠",
    "32": "숙박",
    "38": "쇼핑",
    "39": "음식점",
}


def fetch_area_based_list(area_code: str, sigungu_code: str = None, content_type: str = None, num_of_rows: int = 100):
    """
    Fetch tourism data by area.
    Uses areaBasedList2 endpoint (KorService2).
    """
    url = f"{BASE_URL}/areaBasedList2"

    params = {
        "serviceKey": API_KEY,
        "numOfRows": num_of_rows,
        "pageNo": 1,
        "MobileOS": "ETC",
        "MobileApp": "KoreaNews",
        "_type": "json",
        "areaCode": area_code,
    }

    if sigungu_code:
        params["sigunguCode"] = sigungu_code

    if content_type:
        params["contentTypeId"] = content_type

    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()

        data = response.json()

        # Check for valid response
        if "response" in data and "body" in data["response"]:
            body = data["response"]["body"]
            if body.get("totalCount", 0) > 0:
                items = body.get("items", {}).get("item", [])
                # Handle single item case (API returns object instead of array)
                if isinstance(items, dict):
                    items = [items]
                return items

        return []

    except Exception as e:
        print(f"  Error fetching data: {e}")
        return []


def fetch_detail_common(content_id: str):
    """
    Fetch detailed information for a specific content.
    Uses detailCommon2 endpoint (KorService2).
    """
    url = f"{BASE_URL}/detailCommon2"

    params = {
        "serviceKey": API_KEY,
        "MobileOS": "ETC",
        "MobileApp": "KoreaNews",
        "_type": "json",
        "contentId": content_id,
        "defaultYN": "Y",
        "firstImageYN": "Y",
        "areacodeYN": "Y",
        "catcodeYN": "Y",
        "addrinfoYN": "Y",
        "mapinfoYN": "Y",
        "overviewYN": "Y",
    }

    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()

        data = response.json()

        if "response" in data and "body" in data["response"]:
            items = data["response"]["body"].get("items", {}).get("item", [])
            if isinstance(items, dict):
                return items
            elif isinstance(items, list) and len(items) > 0:
                return items[0]

        return None

    except Exception as e:
        print(f"  Error fetching detail: {e}")
        return None


def fetch_all_regions():
    """
    Fetch tourism data for all 27 regions.
    """
    all_data = {
        "metadata": {
            "fetched_at": datetime.now().isoformat(),
            "api_source": "한국관광공사 TourAPI 4.0",
            "regions_count": 9,  # 8 Jeonnam + 1 Gwangju
        },
        "regions": {}
    }

    # 1. Fetch Gwangju data
    print("\n=== Fetching 광주광역시 ===")
    gwangju_data = {"name": "광주", "spots": []}

    for content_type, type_name in CONTENT_TYPES.items():
        print(f"  Fetching {type_name}...")
        items = fetch_area_based_list("5", content_type=content_type, num_of_rows=500)
        print(f"    Found {len(items)} items")

        for item in items:
            item["content_type_name"] = type_name

        gwangju_data["spots"].extend(items)

    all_data["regions"]["gwangju"] = gwangju_data
    print(f"  Total: {len(gwangju_data['spots'])} items")

    # 2. Fetch Jeonnam regions data
    for region_key, region_info in JEONNAM_SIGUNGU.items():
        print(f"\n=== Fetching {region_info['name']} ===")

        region_data = {
            "name": region_info["name"],
            "sigungu_code": region_info["code"],
            "spots": []
        }

        for content_type, type_name in CONTENT_TYPES.items():
            print(f"  Fetching {type_name}...")
            items = fetch_area_based_list(
                "38",  # Jeonnam
                sigungu_code=region_info["code"],
                content_type=content_type,
                num_of_rows=500
            )
            print(f"    Found {len(items)} items")

            for item in items:
                item["content_type_name"] = type_name

            region_data["spots"].extend(items)

        all_data["regions"][region_key] = region_data
        print(f"  Total: {len(region_data['spots'])} items")

    return all_data


def save_data(data: dict, filename: str = "tour_data_raw.json"):
    """
    Save fetched data to JSON file.
    """
    output_dir = Path(__file__).parent / "data"
    output_dir.mkdir(exist_ok=True)

    output_path = output_dir / filename

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n=== Data saved to {output_path} ===")
    return output_path


def main():
    """
    Main entry point.
    """
    print("=" * 60)
    print("Korea Tourism Organization API Scraper")
    print("=" * 60)

    if not API_KEY:
        print("\nERROR: TOUR_API_KEY not found in environment variables!")
        print("\nTo get an API key:")
        print("1. Go to https://www.data.go.kr")
        print("2. Search for '한국관광공사_국문 관광정보 서비스'")
        print("3. Request API key (instant approval)")
        print("4. Add to .env: TOUR_API_KEY=your_key_here")
        return

    print(f"\nAPI Key: {API_KEY[:10]}...")
    print(f"Fetching data for {len(JEONNAM_SIGUNGU) + 1} regions...")

    # Fetch all data
    data = fetch_all_regions()

    # Calculate totals
    total_items = sum(len(r["spots"]) for r in data["regions"].values())
    data["metadata"]["total_items"] = total_items

    print(f"\n=== Summary ===")
    print(f"Total regions: {len(data['regions'])}")
    print(f"Total items: {total_items}")

    # Save raw data
    save_data(data, "tour_data_raw.json")

    # Also save a summary by content type
    summary = {
        "fetched_at": data["metadata"]["fetched_at"],
        "by_region": {},
        "by_content_type": {}
    }

    for region_key, region_data in data["regions"].items():
        summary["by_region"][region_key] = {
            "name": region_data["name"],
            "count": len(region_data["spots"])
        }

        for spot in region_data["spots"]:
            ct = spot.get("content_type_name", "기타")
            if ct not in summary["by_content_type"]:
                summary["by_content_type"][ct] = 0
            summary["by_content_type"][ct] += 1

    save_data(summary, "tour_data_summary.json")

    print("\nDone!")


if __name__ == "__main__":
    main()

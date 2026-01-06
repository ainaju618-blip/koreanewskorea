"""
Upload Tour Data to Supabase
============================
Uploads collected tourism data from JSON to Supabase tour_spots table.
"""

import os
import json
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')


def parse_api_datetime(dt_str: str) -> str:
    """Convert API datetime string (YYYYMMDDHHmmss) to ISO format."""
    if not dt_str or len(dt_str) < 8:
        return None
    try:
        dt = datetime.strptime(dt_str[:14], '%Y%m%d%H%M%S')
        return dt.isoformat()
    except:
        return None


def transform_spot(spot: dict, region_key: str, region_name: str) -> dict:
    """Transform API spot data to database format."""
    return {
        'content_id': str(spot.get('contentid', '')),
        'title': spot.get('title', ''),
        'content_type': str(spot.get('contenttypeid', '')),
        'content_type_name': spot.get('content_type_name', ''),
        'region_key': region_key,
        'region_name': region_name,
        'area_code': str(spot.get('areacode', '')),
        'sigungu_code': str(spot.get('sigungucode', '')) if spot.get('sigungucode') else None,
        'address': spot.get('addr1', ''),
        'zipcode': spot.get('zipcode', ''),
        'map_x': float(spot.get('mapx', 0)) if spot.get('mapx') else None,
        'map_y': float(spot.get('mapy', 0)) if spot.get('mapy') else None,
        'image_url': spot.get('firstimage', ''),
        'thumbnail_url': spot.get('firstimage2', ''),
        'cat1': spot.get('cat1', ''),
        'cat2': spot.get('cat2', ''),
        'cat3': spot.get('cat3', ''),
        'api_created_at': parse_api_datetime(spot.get('createdtime')),
        'api_modified_at': parse_api_datetime(spot.get('modifiedtime')),
    }


def upload_data():
    """Main upload function."""
    print("=" * 60)
    print("Tour Data Upload to Supabase")
    print("=" * 60)

    # Check credentials
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: SUPABASE_URL or SUPABASE_KEY not found!")
        return

    # Initialize Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print(f"Connected to Supabase: {SUPABASE_URL[:30]}...")

    # Load raw data
    data_path = Path(__file__).parent / "data" / "tour_data_raw.json"
    if not data_path.exists():
        print(f"ERROR: Data file not found: {data_path}")
        return

    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Loaded data from: {data_path}")
    print(f"Regions: {len(data['regions'])}")

    # Process and upload each region
    total_uploaded = 0
    total_errors = 0

    for region_key, region_data in data['regions'].items():
        region_name = region_data['name']
        spots = region_data['spots']
        print(f"\n--- {region_name} ({len(spots)} items) ---")

        # Transform data
        records = []
        for spot in spots:
            try:
                record = transform_spot(spot, region_key, region_name)
                if record['content_id'] and record['title']:
                    records.append(record)
            except Exception as e:
                print(f"  Error transforming: {e}")
                total_errors += 1

        # Upload in batches of 100
        batch_size = 100
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            try:
                result = supabase.table('tour_spots').upsert(
                    batch,
                    on_conflict='content_id'
                ).execute()
                total_uploaded += len(batch)
                print(f"  Uploaded batch {i // batch_size + 1}: {len(batch)} records")
            except Exception as e:
                print(f"  Error uploading batch: {e}")
                total_errors += len(batch)

    print("\n" + "=" * 60)
    print(f"Upload Complete!")
    print(f"  Total uploaded: {total_uploaded}")
    print(f"  Total errors: {total_errors}")
    print("=" * 60)


if __name__ == "__main__":
    upload_data()

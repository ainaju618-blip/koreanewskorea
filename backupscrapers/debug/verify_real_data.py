
import sys
import os
import unittest
from unittest.mock import MagicMock

# Add scaper root to sys.path
sys.path.append(r'd:\cbt\koreanews\scrapers')

# Mock server interactions to avoid errors and just capture data
import utils.api_client
utils.api_client.ensure_server_running = MagicMock(return_value=True)
utils.api_client.log_to_server = MagicMock()

captured_data = []

def mock_send_article(data):
    print(f"   [CAPTURED] {data['source']} | {data['title'][:20]}... | {data['published_at']}")
    captured_data.append(data)
    return {'status': 'created'}

utils.api_client.send_article_to_server = mock_send_article

# Import scrapers to test
from jeonnam import jeonnam_scraper
from wando import wando_scraper
from jeonnam_edu import jeonnam_edu_scraper

def test_scraper(name, module):
    print(f"\n--- Testing {name} ---")
    try:
        # Run collection for 1 day, max 2 articles
        module.collect_articles(days=1, max_articles=2, start_date=None, end_date=None)
    except Exception as e:
        print(f"Error running {name}: {e}")

if __name__ == "__main__":
    print("Running Live Verification for Time Extraction...")
    
    test_scraper("Jeonnam", jeonnam_scraper)
    test_scraper("Jeonnam Edu", jeonnam_edu_scraper)
    test_scraper("Wando", wando_scraper)
    
    print("\n\n=== Verification Summary ===")
    for item in captured_data:
        print(f"[{item['source']}] {item['published_at']} - {item['title']}")
        if "09:00:00" not in item['published_at']:
             print("   -> 🟢 SUCCESS: Time extracted!")
        else:
             print("   -> 🟡 NOTE: Default time")
        
        # 이미지 검증
        thumb = item.get('thumbnail_url')
        print(f"   -> 🖼️  Image: {thumb}")
        if thumb and "res.cloudinary.com" in thumb:
             print("   -> 🟢 SUCCESS: Cloudinary uploaded!")
        elif thumb:
             print("   -> 🟡 WARN: Image exists but typical Cloudinary domain not found (check config)")
        else:
             print("   -> 🔴 FAIL: Image missing (should have been skipped if logic works)")

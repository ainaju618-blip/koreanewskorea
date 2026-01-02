"""
Posts Backup Script
- Export all posts from Supabase to local CSV
"""

import os
import csv
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

def backup_posts():
    """Backup all posts to CSV file"""

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[ERROR] SUPABASE_URL or SUPABASE_KEY not found in environment")
        return

    # Create Supabase client
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Fetch all articles
    print("[INFO] Fetching articles from Supabase...")

    all_articles = []
    page_size = 1000
    offset = 0

    while True:
        response = supabase.table('posts').select('*').range(offset, offset + page_size - 1).execute()

        if not response.data:
            break

        all_articles.extend(response.data)
        print(f"   Fetched {len(all_articles)} articles...")

        if len(response.data) < page_size:
            break

        offset += page_size

    if not all_articles:
        print("[WARN] No articles found")
        return

    print(f"[OK] Total {len(all_articles)} articles fetched")

    # Create backup directory
    backup_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backups')
    os.makedirs(backup_dir, exist_ok=True)

    # Generate filename with timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"posts_backup_{timestamp}.csv"
    filepath = os.path.join(backup_dir, filename)

    # Write to CSV
    if all_articles:
        fieldnames = all_articles[0].keys()

        with open(filepath, 'w', newline='', encoding='utf-8-sig') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(all_articles)

    print(f"[OK] Backup saved: {filepath}")
    print(f"     Total rows: {len(all_articles)}")

    return filepath


if __name__ == "__main__":
    backup_posts()

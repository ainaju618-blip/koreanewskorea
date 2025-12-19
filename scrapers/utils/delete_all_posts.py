"""
Delete All Posts Script
- WARNING: This will delete ALL posts from Supabase
"""

import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

def delete_all_posts():
    """Delete all posts from database"""

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[ERROR] SUPABASE_URL or SUPABASE_KEY not found in environment")
        return

    # Create Supabase client
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Count before delete
    count_response = supabase.table('posts').select('id', count='exact').execute()
    total_count = count_response.count if count_response.count else 0
    print(f"[INFO] Total posts before delete: {total_count}")

    if total_count == 0:
        print("[INFO] No posts to delete")
        return

    # Delete all posts (use created_at condition to match all)
    print("[INFO] Deleting all posts...")
    response = supabase.table('posts').delete().gte('created_at', '1900-01-01').execute()

    # Count after delete
    count_after = supabase.table('posts').select('id', count='exact').execute()
    remaining = count_after.count if count_after.count else 0

    print(f"[OK] Deleted {total_count - remaining} posts")
    print(f"[OK] Remaining posts: {remaining}")


if __name__ == "__main__":
    delete_all_posts()

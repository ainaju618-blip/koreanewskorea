"""
나주 기사 thumbnail_url 확인
"""
import os
from dotenv import load_dotenv
from supabase import create_client

try:
    load_dotenv(encoding='utf-8')
except:
    load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# 나주 기사 조회
result = supabase.table("posts").select("title, thumbnail_url, status").eq("region", "naju").limit(5).execute()

print(f"Total: {len(result.data)} articles")
for row in result.data:
    thumb = row.get('thumbnail_url', 'N/A')
    thumb_display = thumb[:60] + "..." if thumb and len(thumb) > 60 else thumb
    print(f"  [{row['status']}] {row['title'][:30]}...")
    print(f"       IMG: {thumb_display}")

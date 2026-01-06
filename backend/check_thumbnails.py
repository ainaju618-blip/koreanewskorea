import os
import sys
from dotenv import load_dotenv

# UTF-8 출력 강제
sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()

from supabase import create_client

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

result = supabase.table('posts').select('id, thumbnail_url').eq('region', 'naju').limit(10).execute()

print(f"Total: {len(result.data)}")
for p in result.data:
    url = p.get('thumbnail_url', 'None')
    if url:
        print(f"  - {url[:100]}")
    else:
        print("  - None")

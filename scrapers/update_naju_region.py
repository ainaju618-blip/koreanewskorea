"""
나주 기사 DB 업데이트 - region 필드 추가
"""

import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
try:
    load_dotenv(encoding='utf-8')
except:
    load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# 나주 관련 기사 찾아서 region 업데이트
result = supabase.table("posts").update({"region": "naju", "status": "published"}).like("source", "%나주%").execute()

print(f"Updated: {len(result.data)} rows")
for row in result.data[:5]:
    print(f"  - {row['title'][:40]}...")

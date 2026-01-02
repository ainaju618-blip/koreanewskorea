"""
나주 기사 삭제 스크립트
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

# 나주 관련 기사 삭제
result = supabase.table("posts").delete().eq("region", "naju").execute()
print(f"Deleted by region: {len(result.data)} rows")

result2 = supabase.table("posts").delete().like("source", "%나주%").execute()
print(f"Deleted by source: {len(result2.data)} rows")

print("Done!")

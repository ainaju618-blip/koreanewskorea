"""여수 기사 삭제 스크립트"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv('d:/cbt/koreanews/web/.env')

from supabase import create_client

url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

if not url or not key:
    print("Environment variables not loaded!")
    sys.exit(1)

client = create_client(url, key)
result = client.table('news').delete().eq('region', 'yeosu').execute()
print(f"Deleted {len(result.data)} yeosu articles")

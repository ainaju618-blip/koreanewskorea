# -*- coding: utf-8 -*-
import os
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from dotenv import load_dotenv
load_dotenv()
from supabase import create_client

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# 1. 전남교육청 학교 데이터
print('=== jeonnam_edu_school ===')
result = supabase.table('posts').select('id, title, department').eq('region', 'jeonnam_edu_school').limit(15).execute()
print(f'Total: {len(result.data)}')
for p in result.data[:10]:
    dept = p.get('department') or 'N/A'
    title = (p.get('title') or '')[:30]
    print(f'  [{dept}] {title}')

# 2. 나주 관련 학교 검색
print('\n=== Naju Schools (department ILIKE %나주%) ===')
naju_result = supabase.table('posts').select('id, title, department').eq('region', 'jeonnam_edu_school').ilike('department', '%나주%').limit(10).execute()
print(f'Naju schools: {len(naju_result.data)}')
for p in naju_result.data[:5]:
    dept = p.get('department') or 'N/A'
    title = (p.get('title') or '')[:30]
    print(f'  [{dept}] {title}')

# 3. 전남교육청 기관 데이터
print('\n=== jeonnam_edu_org ===')
org_result = supabase.table('posts').select('id, title, department').eq('region', 'jeonnam_edu_org').limit(10).execute()
print(f'Total: {len(org_result.data)}')
for p in org_result.data[:5]:
    dept = p.get('department') or 'N/A'
    title = (p.get('title') or '')[:30]
    print(f'  [{dept}] {title}')

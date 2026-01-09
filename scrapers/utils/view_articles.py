"""최근 저장된 기사 조회"""
import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# 인코딩 설정
sys.stdout.reconfigure(encoding='utf-8')

load_dotenv('d:/cbt/koreanewskorea/.env.local')
url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(url, key)

# 본문이 있는 기사 찾기
print("\n" + "="*60)
print("본문이 있는 최근 기사")
print("="*60)

result = supabase.table('posts').select('title, content, region').order('created_at', desc=True).limit(20).execute()

has_content = 0
no_content = 0

for a in result.data:
    content = a.get('content', '') or ''
    if len(content) > 10:
        has_content += 1
        if has_content <= 3:
            print(f'\n[{a["region"]}] {a["title"][:50]}...')
            print(f'본문 ({len(content)}자): {content[:300]}...')
    else:
        no_content += 1

print(f'\n\n=== 통계 (최근 20개 기사) ===')
print(f'본문 있음: {has_content}개')
print(f'본문 없음: {no_content}개')

# 지역별 본문 유무 확인
print("\n" + "="*60)
print("지역별 본문 상태 (각 지역 최신 1개)")
print("="*60)

regions = ['seoul', 'busan', 'incheon', 'daegu', 'daejeon', 'gwangju', 'ulsan', 'sejong',
           'gyeonggi', 'gangwon', 'chungbuk', 'chungnam', 'jeonbuk', 'jeonnam', 'gyeongbuk', 'gyeongnam', 'jeju']

for region in regions:
    result = supabase.table('posts').select('title, content').eq('region', region).order('created_at', desc=True).limit(1).execute()
    if result.data:
        a = result.data[0]
        content = a.get('content', '') or ''
        status = f'✅ {len(content)}자' if len(content) > 10 else '❌ 없음'
        print(f'{region:12} {status:12} {a["title"][:35]}...')

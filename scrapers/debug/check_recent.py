"""최근 수집 기사 확인"""
import requests

r = requests.get('http://localhost:3000/api/posts', params={
    'region': 'gwangju',
    'limit': '10',
    'sort': 'created_at'
}, timeout=10)

data = r.json()
posts = data.get('posts', data)

print("=== 광주시 최근 기사 (최신순) ===")
for i, p in enumerate(posts[:5], 1):
    status = p.get('status', 'N/A')
    title = p.get('title', '')[:50]
    post_id = p.get('id', '')
    created = p.get('created_at', '')[:19]
    ai_processed = "AI" if p.get('ai_processed') else "--"
    print(f"{i}. [{status:^10}] [{ai_processed}] {title}")
    print(f"   ID: {post_id}")
    print(f"   Created: {created}")
    print()

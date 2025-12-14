# -*- coding: utf-8 -*-
import requests

r = requests.get('http://localhost:3000/api/posts', params={'limit':'200'}, timeout=10)
d = r.json()
posts = d.get('posts', d)

# 광주시교육청 기사 확인
gj_posts = [p for p in posts if p.get('source','') == '광주시교육청']
print(f"광주시교육청 기사: {len(gj_posts)}개")

for p in gj_posts[:5]:
    content = p.get('content','') or ''
    title = p.get('title','') or ''
    print(f"\n제목: {title[:60]}")
    print(f"내용 길이: {len(content)}자")
    if len(content) < 50:
        print(f"!! 내용 부족: [{content[:100]}]")
    else:
        print(f"미리보기: {content[:150]}...")

# -*- coding: utf-8 -*-
import requests

r = requests.get('http://localhost:3000/api/posts', params={'limit':'100'}, timeout=10)
d = r.json()
posts = d.get('posts', d)

# 전남교육청 기사만 필터
edu_posts = [p for p in posts if p.get('source','') == '전남교육청']
print(f"전남교육청 기사: {len(edu_posts)}개")

for p in edu_posts[:5]:
    content = p.get('content','') or ''
    title = p.get('title','') or ''
    print(f"\n제목: {title[:50]}")
    print(f"내용 길이: {len(content)}자")
    if len(content) < 50:
        print(f"!! 내용 부족: [{content}]")
    else:
        print(f"미리보기: {content[:100]}...")

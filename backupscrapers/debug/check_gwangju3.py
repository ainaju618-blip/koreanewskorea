# -*- coding: utf-8 -*-
import requests

r = requests.get('http://localhost:3000/api/posts', params={'limit':'300'}, timeout=10)
d = r.json()
posts = d.get('posts', d)

print("=== 광주광역시 기사 상세 ===")
for p in posts:
    source = p.get('source', '')
    if source == '광주광역시':
        print(f"title: {p.get('title','')[:50]}")
        print(f"status: {p.get('status','')}")
        print(f"category: {p.get('category','')}")
        print(f"region: {p.get('region','')}")
        print(f"content_len: {len(p.get('content','') or '')}")
        print("---")

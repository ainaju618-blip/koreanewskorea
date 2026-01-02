# -*- coding: utf-8 -*-
import requests

r = requests.get('http://localhost:3000/api/posts', params={'limit':'300'}, timeout=10)
d = r.json()
posts = d.get('posts', d)

schools = ['평동중학교', '광주예술중', '돈보스코']

print("=== 학교 기사 상세 ===")
for p in posts:
    source = p.get('source', '')
    for school in schools:
        if school in source:
            cat = p.get('category', '')
            reg = p.get('region', '')
            title = p.get('title', '')[:40]
            print(f"source: {source}")
            print(f"  category: {cat}, region: {reg}")
            print(f"  title: {title}")
            print()

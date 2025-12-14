# -*- coding: utf-8 -*-
import requests

r = requests.get('http://localhost:3000/api/posts', params={'limit':'300'}, timeout=10)
d = r.json()
posts = d.get('posts', d)

print("=== 광주 관련 기사 (교육청 제외) ===")
for p in posts:
    source = p.get('source', '')
    if '광주' in source and '교육' not in source:
        cat = p.get('category', '')
        reg = p.get('region', '')
        title = p.get('title', '')[:30]
        print(f"src: {source:<20} cat: {cat:<8} reg: {reg:<15} | {title}")

print("\n=== 광주광역시 source 확인 ===")
for p in posts:
    source = p.get('source', '')
    if source == '광주광역시' or source == '광주시':
        print(f"Found: {source} - {p.get('title','')[:40]}")

# -*- coding: utf-8 -*-
import requests

r = requests.get('http://localhost:3000/api/posts', params={'limit':'300'}, timeout=10)
d = r.json()
posts = d.get('posts', d)

print("=== 광주 카테고리 기사 상세 ===")
for p in posts:
    cat = p.get('category', '')
    region = p.get('region', '')
    source = p.get('source', '')
    
    if cat == '광주' or region == 'gwangju':
        print(f"source: {source:<25} | region: {region:<15} | cat: {cat}")

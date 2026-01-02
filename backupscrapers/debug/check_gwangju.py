# -*- coding: utf-8 -*-
import requests

r = requests.get('http://localhost:3000/api/posts', params={'limit':'200'}, timeout=10)
d = r.json()
posts = d.get('posts', d)

# 광주 관련 기사 분석
print("=== 광주 관련 기사 분석 ===")
for p in posts:
    cat = p.get('category', '')
    region = p.get('region', '')
    source = p.get('source', '')
    
    # category가 광주이거나 region이 gwangju인 기사
    if cat == '광주' or region == 'gwangju':
        print(f"source: {source:<20} | cat: {cat:<8} | region: {region}")

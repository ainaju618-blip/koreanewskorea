# -*- coding: utf-8 -*-
"""교육청 기사 내용 확인 스크립트"""
import requests

def check_source(source_name):
    print(f"\n=== {source_name} 기사 ===")
    try:
        resp = requests.get(
            'http://localhost:3000/api/posts',
            params={'source': source_name, 'limit': '3'},
            timeout=10
        )
        data = resp.json()
        posts = data.get('posts', data) if isinstance(data, dict) else data
        
        print(f"총 {len(posts)}개 조회됨")
        
        for i, p in enumerate(posts[:3]):
            content = p.get('content', '') or ''
            title = p.get('title', '') or ''
            print(f"\n[{i+1}] 제목: {title[:50]}")
            print(f"    내용 길이: {len(content)}자")
            if content:
                preview = content[:200].replace('\n', ' ')
                print(f"    미리보기: {preview}...")
            else:
                print("    !! 내용이 비어있습니다 !!")
                
    except Exception as e:
        print(f"오류: {e}")

if __name__ == "__main__":
    check_source("광주광역시교육청")
    check_source("전남교육청")

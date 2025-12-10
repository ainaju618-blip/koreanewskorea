"""
기존 JSON 데이터를 API로 로드하는 스크립트
- naju_articles.json 등 기존 수집 데이터를 Next.js API로 전송
- 일회성 마이그레이션 용도
"""

import json
import sys
import os
import time
from typing import List, Dict

# 공통 API 클라이언트 임포트
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scrapers.utils.api_client import send_article_to_server


def load_naju_articles(filepath: str = 'naju_articles.json', limit: int = None) -> Dict:
    """
    기존 나주시 보도자료 JSON을 API로 전송
    
    Args:
        filepath: JSON 파일 경로
        limit: 전송할 최대 기사 수 (None이면 전체)
    """
    print(f'📂 파일 로딩: {filepath}')
    
    with open(filepath, 'r', encoding='utf-8') as f:
        articles = json.load(f)
    
    print(f'📊 총 {len(articles)}개 기사 발견')
    
    if limit:
        articles = articles[:limit]
        print(f'⚡ 제한 적용: {limit}개만 전송')
    
    stats = {'created': 0, 'skipped': 0, 'failed': 0}
    
    print(f'\n🌐 API 전송 시작...\n')
    
    for i, article in enumerate(articles, 1):
        # API 페이로드 매핑
        payload = {
            'title': article.get('title', ''),
            'content': article.get('content', ''),
            'original_link': article.get('source_url') or article.get('url', ''),
            'published_at': article.get('published_at', ''),
            'source': article.get('source', '나주시'),
            'category': '나주',
            'thumbnail_url': article.get('image_url'),
        }
        
        # 필수 필드 검증
        if not payload['title'] or not payload['original_link']:
            print(f'   ⚠️ [{i}/{len(articles)}] 필수 필드 누락, 스킵')
            stats['failed'] += 1
            continue
        
        result = send_article_to_server(payload)
        
        if result['status'] == 'created':
            stats['created'] += 1
        elif result['status'] == 'exists':
            stats['skipped'] += 1
        else:
            stats['failed'] += 1
        
        # 진행률 표시 (100개마다)
        if i % 100 == 0:
            print(f'\n   📈 진행률: {i}/{len(articles)} ({i*100//len(articles)}%)\n')
        
        # API 서버 부하 방지
        time.sleep(0.1)
    
    return stats


def main():
    """메인 실행"""
    # 커맨드라인 인자: python load_json_to_api.py [파일경로] [제한수]
    filepath = sys.argv[1] if len(sys.argv) > 1 else 'naju_articles.json'
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else None
    
    if not os.path.exists(filepath):
        print(f'❌ 파일을 찾을 수 없습니다: {filepath}')
        return
    
    stats = load_naju_articles(filepath, limit)
    
    print(f'\n{"="*50}')
    print(f'📊 API 전송 결과:')
    print(f'   - 신규 저장: {stats["created"]}건')
    print(f'   - 중복 스킵: {stats["skipped"]}건')
    print(f'   - 실패: {stats["failed"]}건')
    print(f'{"="*50}')


if __name__ == '__main__':
    main()

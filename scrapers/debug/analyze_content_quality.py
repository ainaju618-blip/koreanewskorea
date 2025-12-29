# -*- coding: utf-8 -*-
"""DB 기사 본문 품질 분석 - 결과 파일 저장"""
import os
import requests
import re
from collections import defaultdict

# Logs directory - all logs go to logs/ folder
LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'logs')
os.makedirs(LOG_DIR, exist_ok=True)

PROBLEM_PATTERNS = [
    (r'개인정보처리방침', '개인정보처리방침'),
    (r'COPYRIGHT|저작권', '저작권'),
    (r'로그인|회원가입', '로그인문구'),
    (r'다운로드.*\d+.*Hit', '첨부메타'),
    (r'조회수?\s*[:：]?\s*\d+', '조회수'),
    (r'본문 내용을 가져올 수 없습니다', '추출실패'),
]

def analyze_content(content):
    issues = []
    if not content:
        return ['빈본문']
    length = len(content)
    if length < 50:
        issues.append(f'짧음({length})')
    for pattern, desc in PROBLEM_PATTERNS:
        if re.search(pattern, content, re.IGNORECASE):
            issues.append(desc)
    return issues

def main():
    resp = requests.get('http://localhost:3000/api/posts', params={'limit': '500'}, timeout=30)
    data = resp.json()
    posts = data.get('posts', data) if isinstance(data, dict) else data
    
    source_issues = defaultdict(list)
    source_counts = defaultdict(int)
    
    for p in posts:
        source = p.get('source', 'Unknown')
        content = p.get('content', '') or ''
        source_counts[source] += 1
        issues = analyze_content(content)
        if issues:
            source_issues[source].append({
                'title': p.get('title', '')[:30],
                'len': len(content),
                'issues': issues
            })
    
    # 결과 수집
    results = []
    for source in sorted(source_counts.keys()):
        total = source_counts[source]
        problems = len(source_issues.get(source, []))
        rate = problems / total * 100 if total > 0 else 0
        results.append((source, total, problems, rate))
    
    results.sort(key=lambda x: -x[3])
    
    # 파일로 저장
    report_path = os.path.join(LOG_DIR, 'content_quality_report.txt')
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(f"총 {len(posts)}개 기사 분석\n\n")
        f.write(f"{'Source':<25} Total  Prob  Rate\n")
        f.write("-" * 50 + "\n")
        
        for source, total, prob, rate in results:
            if prob > 0:
                f.write(f"{source:<25} {total:>4}  {prob:>4}  {rate:>5.1f}%\n")
        
        f.write("\n\n문제 상세 (문제 비율 >= 20%):\n")
        f.write("=" * 50 + "\n")
        
        for source, total, prob, rate in results:
            if rate >= 20:
                f.write(f"\n[{source}] {prob}/{total} ({rate:.1f}%)\n")
                for item in source_issues[source][:3]:
                    f.write(f"  - {item['title']}... ({item['len']}자) {item['issues']}\n")
    
    print("분석 완료! scrapers/debug/content_quality_report.txt 확인")
    
    # 간단 요약 출력
    total_posts = len(posts)
    total_problems = sum(len(v) for v in source_issues.values())
    print(f"전체: {total_posts}개 중 {total_problems}개 문제 ({total_problems/total_posts*100:.1f}%)")
    
    # 심각한 문제만 출력
    print("\n심각한 문제 (비율 >= 30%):")
    for source, total, prob, rate in results:
        if rate >= 30:
            print(f"  {source}: {prob}/{total} ({rate:.0f}%)")

if __name__ == "__main__":
    main()

# -*- coding: utf-8 -*-
"""
스크래퍼 데이터 품질 검증 스크립트
Claude 작업 지시: 이미지 누락 및 메타태그 오염 조사
결과를 파일로 저장
"""

import os
import sys
import requests
from collections import defaultdict
from dotenv import load_dotenv

# 프로젝트 루트로 이동
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(project_root)
load_dotenv()

# 결과 파일 (프로젝트 루트의 .ai-collab 폴더)
koreanews_root = os.path.dirname(project_root)  # scrapers의 상위 = koreanews
output_file = os.path.join(koreanews_root, '.ai-collab', 'quality_report.md')

# Supabase 연결 정보
url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not url or not key:
    print("[X] Supabase 연결 정보가 없습니다!")
    sys.exit(1)

print(f"[OK] Supabase 연결 성공")

# REST API 헤더
headers = {
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json'
}

# 결과 저장용 리스트
report_lines = []
report_lines.append("# 스크래퍼 데이터 품질 검증 보고서\n")
report_lines.append(f"> 분석일: 2025-12-14\n")
report_lines.append(f"> 분석자: Antigravity (Gemini)\n\n")

# ============================================================
# 1. 이미지 누락 현황 조사
# ============================================================
print("[1/4] 이미지 누락 현황 조사 중...")

api_url = f"{url}/rest/v1/posts?select=source,thumbnail_url"
response = requests.get(api_url, headers=headers)
posts = response.json()

print(f"  - {len(posts)}개 기사 조회됨")

stats = defaultdict(lambda: {'total': 0, 'no_image': 0})

for post in posts:
    if not isinstance(post, dict):
        continue
    source = post.get('source') or '알수없음'
    thumbnail_url = post.get('thumbnail_url')
    
    stats[source]['total'] += 1
    
    has_valid_image = (
        thumbnail_url and 
        isinstance(thumbnail_url, str) and 
        thumbnail_url.strip() != '' and
        thumbnail_url.startswith('http')
    )
    
    if not has_valid_image:
        stats[source]['no_image'] += 1

sorted_stats = sorted(stats.items(), key=lambda x: x[1]['no_image'], reverse=True)

report_lines.append("## 1. 지역별 이미지 누락 통계\n\n")
report_lines.append("| 지역 | 전체 | 이미지없음 | 비율 |\n")
report_lines.append("|------|------|------------|------|\n")

for source, data in sorted_stats:
    pct = (data['no_image'] / data['total'] * 100) if data['total'] > 0 else 0
    report_lines.append(f"| {source} | {data['total']} | {data['no_image']} | {pct:.1f}% |\n")

total_no_image = sum(s['no_image'] for s in stats.values())
total_posts = len(posts) if posts else 1
report_lines.append(f"\n**총계:** {len(posts)}개 기사, {total_no_image}개 이미지 없음 ({total_no_image/total_posts*100:.1f}%)\n\n")

# ============================================================
# 2. 본문 메타태그 오염 조사
# ============================================================
print("[2/4] 본문 메타태그 오염 조사 중...")

pollution_keywords = [
    ('조회수', ['조회수', '조회 :', '조회:']),
    ('날짜', ['작성일', '등록일', '수정일']),
    ('담당부서', ['담당부서', '담당자', '부서명']),
    ('연락처', ['전화번호', '연락처', '팩스']),
]

api_url = f"{url}/rest/v1/posts?select=id,title,source,content&limit=1000"
response = requests.get(api_url, headers=headers)
posts_with_content = response.json()

print(f"  - {len(posts_with_content)}개 기사 본문 분석")

pollution_stats = defaultdict(lambda: defaultdict(int))
polluted_samples = []

for post in posts_with_content:
    if not isinstance(post, dict):
        continue
    content = post.get('content') or ''
    source = post.get('source') or '알수없음'
    
    for pollution_type, keywords in pollution_keywords:
        for keyword in keywords:
            if keyword in content:
                pollution_stats[source][pollution_type] += 1
                if len(polluted_samples) < 10:
                    polluted_samples.append({
                        'id': post.get('id'),
                        'title': (post.get('title') or '')[:40],
                        'source': source,
                        'type': pollution_type,
                        'content_snippet': content[:300]
                    })
                break

report_lines.append("## 2. 본문 메타태그 오염 현황\n\n")
report_lines.append("| 지역 | 조회수 | 날짜 | 담당부서 | 연락처 | 합계 |\n")
report_lines.append("|------|--------|------|----------|--------|------|\n")

sorted_pollution = sorted(pollution_stats.items(), 
                          key=lambda x: sum(x[1].values()), reverse=True)

for source, types in sorted_pollution[:20]:
    total = sum(types.values())
    report_lines.append(f"| {source} | {types.get('조회수', 0)} | {types.get('날짜', 0)} | "
          f"{types.get('담당부서', 0)} | {types.get('연락처', 0)} | {total} |\n")

# ============================================================
# 3. 문제가 심한 지역 TOP 5
# ============================================================
print("[3/4] 문제 지역 TOP 5 산출 중...")

combined_issues = {}
for source, data in stats.items():
    img_issue = data['no_image']
    pollution_issue = sum(pollution_stats.get(source, {}).values())
    combined_issues[source] = {
        'no_image': img_issue,
        'pollution': pollution_issue,
        'total_issues': img_issue + pollution_issue
    }

top5 = sorted(combined_issues.items(), key=lambda x: x[1]['total_issues'], reverse=True)[:5]

report_lines.append("\n## 3. 문제가 심한 지역 TOP 5\n\n")
report_lines.append("| 순위 | 지역 | 이미지누락 | 오염 | 총문제 |\n")
report_lines.append("|------|------|------------|------|--------|\n")
for i, (source, issues) in enumerate(top5, 1):
    report_lines.append(f"| {i} | {source} | {issues['no_image']} | {issues['pollution']} | {issues['total_issues']} |\n")

# ============================================================
# 4. 오염 샘플
# ============================================================
print("[4/4] 오염 샘플 수집 중...")

report_lines.append("\n## 4. 오염 샘플 (처음 5개)\n\n")

for i, sample in enumerate(polluted_samples[:5], 1):
    report_lines.append(f"### 샘플 {i}: {sample['source']} - {sample['type']}\n")
    report_lines.append(f"- **제목:** {sample['title']}\n")
    content = sample['content_snippet']
    for ptype, keywords in pollution_keywords:
        if ptype == sample['type']:
            for kw in keywords:
                if kw in content:
                    idx = content.find(kw)
                    start = max(0, idx - 20)
                    end = min(len(content), idx + 50)
                    report_lines.append(f"- **문제 부분:** `...{content[start:end]}...`\n\n")
                    break
            break

# 파일 저장
with open(output_file, 'w', encoding='utf-8') as f:
    f.writelines(report_lines)

print(f"\n[OK] 보고서 저장 완료: {output_file}")

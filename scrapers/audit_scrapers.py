
import sys
import os
import importlib
import inspect
import json
import time
from datetime import datetime
from typing import List, Dict, Any

# Ensure project root is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
# Add parent directory to path to allow imports from utils
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def run_audit(target_scrapers: List[str] = None, days: int = 1):
    """
    Audit scrapers by running them in dry-run mode (collect_articles).
    """
    results = {
        'timestamp': datetime.now().isoformat(),
        'scrapers': {}
    }

    base_dir = os.path.dirname(os.path.abspath(__file__))
    all_files = [f for f in os.listdir(base_dir) if f.endswith('_scraper.py') and f != 'universal_scraper.py']
    
    # Filter if targets provided
    if target_scrapers:
        files_to_run = [f for f in all_files if any(t in f for t in target_scrapers)]
    else:
        files_to_run = all_files

    print(f"🔍 Starting Audit for {len(files_to_run)} scrapers...")

    for filename in sorted(files_to_run):
        print(f"\nExample: Auditing {filename}...")
        module_name = filename[:-3]
        
        try:
            # Dynamic import
            if module_name in sys.modules:
                module = importlib.reload(sys.modules[module_name])
            else:
                module = importlib.import_module(f"scrapers.{module_name}")
            
            # Check for collect_articles
            if hasattr(module, 'collect_articles'):
                func = module.collect_articles
                # Check signature to see if it accepts 'days'
                sig = inspect.signature(func)
                
                start_time = time.time()
                try:
                    # Run scraper
                    print(f"   🏃 Running collect_articles(days={days})...")
                    if 'days' in sig.parameters:
                        articles = func(days=days)
                    else:
                        articles = func()
                    
                    duration = time.time() - start_time
                    
                    # Analyze results
                    article_count = len(articles)
                    images_count = sum(1 for a in articles if a.get('thumbnail_url'))
                    
                    # Detailed checks
                    issues = []
                    if article_count == 0:
                        issues.append("No articles found")
                    
                    # Check first article for mandatory fields
                    if article_count > 0:
                        sample = articles[0]
                        required_fields = ['title', 'content', 'published_at', 'original_link']
                        missing_fields = [f for f in required_fields if not sample.get(f)]
                        if missing_fields:
                            issues.append(f"Missing fields: {missing_fields}")
                        
                        if not sample.get('thumbnail_url'):
                            issues.append("Thumbnail missing in sample")
                        elif 'http' not in sample['thumbnail_url']:
                             issues.append(f"Invalid thumbnail URL: {sample['thumbnail_url']}")

                    status = 'passed' if not issues and article_count > 0 else 'failed'
                    if article_count > 0 and images_count == 0:
                         status = 'warning' # Articles found but no images (might be intended, but suspicious)
                         issues.append("No images found in any article")

                    results['scrapers'][filename] = {
                        'status': status,
                        'duration': round(duration, 2),
                        'articles_found': article_count,
                        'images_found': images_count,
                        'issues': issues,
                        'sample': articles[:3] if articles else []
                    }
                    print(f"   {'✅' if status == 'passed' else '⚠️' if status == 'warning' else '❌'} Result: {status} ({article_count} articles, {images_count} images)")

                except Exception as e:
                    print(f"   ❌ Execution Error: {e}")
                    results['scrapers'][filename] = {
                        'status': 'error',
                        'error': str(e)
                    }
            else:
                print(f"   ❌ collect_articles not found")
                results['scrapers'][filename] = {
                    'status': 'error',
                    'error': 'collect_articles function missing'
                }

        except Exception as e:
            print(f"   ❌ Import Error: {e}")
            results['scrapers'][filename] = {
                'status': 'error',
                'error': f"Import failed: {str(e)}"
            }


    # Save report
    with open(os.path.join(base_dir, 'audit_report.json'), 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    # Generate Markdown Summary
    md_report = f"# 스크래퍼 전수 감사 보고서\n\n검사 일시: {results['timestamp']}\n\n"
    md_report += "| 스크래퍼 | 상태 | 기사 수 | 이미지 수 | 소요시간 (초) | 특이사항 |\n"
    md_report += "|---------|--------|----------|--------|--------------|--------|\n"
    
    for name, res in results['scrapers'].items():
        status_map = {'passed': '✅ 정상', 'warning': '⚠️ 경고', 'failed': '❌ 실패', 'error': '💥 오류'}
        status_icon = status_map.get(res['status'], '❓ 알수없음')
        issues = "<br>".join(res.get('issues', [])) or res.get('error', '-')
        
        # Translate common issues if possible
        issues = issues.replace("No articles found", "기사 미발견")
        issues = issues.replace("No images found in any article", "이미지 미발견 (전체)")
        issues = issues.replace("Missing fields", "필수 필드 누락")
        issues = issues.replace("Thumbnail missing in sample", "썸네일 누락 (샘플)")
        
        md_report += f"| {name} | {status_icon} | {res.get('articles_found', '-')} | {res.get('images_found', '-')} | {res.get('duration', '-')} | {issues} |\n"

    # Add Details Section
    md_report += "\n## 상세 샘플 (상위 3건)\n"
    for name, res in results['scrapers'].items():
        if res.get('sample'):
            md_report += f"\n### {name}\n"
            for idx, article in enumerate(res['sample']):
                thumb = "✅ 있음" if article.get('thumbnail_url') else "❌ 없음"
                md_report += f"- **[{idx+1}] {article.get('title', '제목 없음')}**\n"
                md_report += f"  - 날짜: {article.get('published_at')}\n"
                md_report += f"  - 이미지: {thumb} ({article.get('thumbnail_url', 'N/A')})\n"
                md_report += f"  - 링크: {article.get('original_link')}\n"

    with open(os.path.join(base_dir, 'audit_report.md'), 'w', encoding='utf-8') as f:
        f.write(md_report)
    
    print(f"\n📄 보고서 저장 완료: {os.path.join(base_dir, 'audit_report.md')}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--targets', nargs='+', help='Specific scrapers to audit (partial name match)')
    parser.add_argument('--days', type=int, default=1, help='Days to scrape')
    args = parser.parse_args()
    
    run_audit(args.targets, args.days)

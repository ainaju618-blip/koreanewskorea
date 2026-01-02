
import os
import re
import glob

SCRAPER_DIR = r'd:\cbt\koreanews\scrapers'

def check_time_extraction():
    scraper_files = glob.glob(os.path.join(SCRAPER_DIR, '*', '*_scraper.py'))
    
    results = []
    
    for file_path in scraper_files:
        filename = os.path.basename(file_path)
        region = filename.replace('_scraper.py', '')
        
        if region in ['base_scraper_template', 'universal_scraper', 'backup_scraper']:
            continue
            
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # extract fetch_detail function
        fetch_detail_match = re.search(r'def fetch_detail\(.*?\):(.*?)(def |$)', content, re.DOTALL)
        if not fetch_detail_match:
            continue
            
        fetch_body = fetch_detail_match.group(1)
        
        # Check for time regex patterns
        # \d{1,2}:\d{1,2}  or  %H:%M
        has_time_regex = re.search(r'\\d\{1,2\}:\\d\{1,2\}', fetch_body) or \
                         re.search(r'%H:%M', fetch_body) or \
                         re.search(r'(\d+):(\d+)', fetch_body)
                         
        # Check for published_at construction in collect_articles
        collect_match = re.search(r'def collect_articles\(.*?\):(.*?)(def |if __name__|$)', content, re.DOTALL)
        collect_body = collect_match.group(1) if collect_match else ""
        
        is_hardcoded = "T09:00:00" in collect_body or "T00:00:00" in collect_body
        
        results.append({
            'region': region,
            'has_time_regex': bool(has_time_regex),
            'is_hardcoded': is_hardcoded,
            'file_path': file_path
        })
        
    # Sort: No regex & Hardcoded -> No regex -> Hardcoded -> OK
    results.sort(key=lambda x: (x['has_time_regex'], not x['is_hardcoded']))
    
    print(f"{'REGION':<15} | {'TIME_REGEX':<10} | {'HARDCODED':<10} | {'STATUS'}")
    print("-" * 50)
    
    targets = []
    for r in results:
        status = "OK"
        if not r['has_time_regex']:
            status = "MISSING LOGIC"
        if r['is_hardcoded']:
            if status == "MISSING LOGIC":
                status = "CRITICAL (No Logic + Hardcoded)"
            else:
                status = "WARNING (Logic exists but Hardcoded?)"
                
        print(f"{r['region']:<15} | {str(r['has_time_regex']):<10} | {str(r['is_hardcoded']):<10} | {status}")
        
        if not r['has_time_regex'] or r['is_hardcoded']:
            targets.append(r['file_path'])
            
    return targets

if __name__ == "__main__":
    check_time_extraction()

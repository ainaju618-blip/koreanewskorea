
import subprocess
import sys

REGIONS = ['gwangju_edu', 'haenam', 'hampyeong', 'jangheung']
SCRAPER_DIR = r'd:\cbt\koreanews\scrapers'

def test_region(region):
    print(f"\nTesting {region}...")
    cmd = [
        'python',
        f'{SCRAPER_DIR}\\{region}\\{region}_scraper.py',
        '--dry-run',
        '--max-articles', '2',
        '--days', '1'
    ]
    
    try:
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='replace')
        output = result.stdout
        
        if "SyntaxError" in output or "IndentationError" in output:
             print(f"[FAIL] {region} Syntax Error!")
             print(output[-500:])
             return False
             
        print(f"[PASS] {region} execution finished.")
        return True
        
    except Exception as e:
        print(f"[FAIL] {region} execution failed: {e}")
        return False

if __name__ == '__main__':
    success_count = 0
    for r in REGIONS:
        if test_region(r):
            success_count += 1
            
    print(f"\nResult: {success_count}/{len(REGIONS)} passed basic execution.")

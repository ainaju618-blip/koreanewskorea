
import subprocess
import sys

REGION = 'jangseong'
SCRAPER_DIR = r'd:\cbt\koreanews\scrapers'

def test_region():
    print(f"\nTesting {REGION}...")
    cmd = [
        'python',
        f'{SCRAPER_DIR}\\{REGION}\\{REGION}_scraper.py',
        '--dry-run',
        '--max-articles', '2',
        '--days', '1'
    ]
    
    try:
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='replace')
        output = result.stdout
        
        if "SyntaxError" in output or "IndentationError" in output:
             print(f"[FAIL] {REGION} Syntax Error!")
             print(output[-500:])
             return False
             
        print(f"[PASS] {REGION} execution finished.")
        return True
        
    except Exception as e:
        print(f"[FAIL] {REGION} execution failed: {e}")
        return False

if __name__ == '__main__':
    if test_region():
        print("Success")
    else:
        print("Fail")

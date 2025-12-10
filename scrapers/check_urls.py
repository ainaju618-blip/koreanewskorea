
import sys
import os
import requests
from tabulate import tabulate

# Add parent directory to path to import configs
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from configs.regional_configs import REGIONAL_CONFIGS

def check_urls():
    results = []
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }

    print(f"Checking {len(REGIONAL_CONFIGS)} regional URLs...")

    for key, config in REGIONAL_CONFIGS.items():
        url = config.get('list_url')
        name = config.get('name')
        
        status = "UNKNOWN"
        code = 0
        length = 0
        error_msg = ""

        try:
            # Set timeout to 10 seconds
            response = requests.get(url, headers=headers, timeout=10, verify=False)
            code = response.status_code
            length = len(response.content)
            
            if code == 200:
                if length < 500: # Suspiciously small
                    status = "WARNING (Small Content)"
                else:
                    status = "OK"
            else:
                status = f"FAIL ({code})"
        except Exception as e:
            status = "ERROR"
            error_msg = str(e)[:50]

        results.append([name, key, status, code, length, url, error_msg])
        print(f"Checked {name}: {status}")

    # Print table
    print("\n" + "="*80)
    print("REGIONAL URL HEALTH CHECK REPORT")
    print("="*80)
    print(tabulate(results, headers=["Region", "Key", "Status", "Code", "Length", "URL", "Error"], tablefmt="grid"))

if __name__ == "__main__":
    # Suppress SSL warnings
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    check_urls()

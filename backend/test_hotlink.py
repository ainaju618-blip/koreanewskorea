
import requests

img_url = "https://www.mokpo.go.kr/ybmodule.file/board/www_report_material/1765245166.jpg/www_report_material/924x1x100/1765245166.jpg"

print(f"Testing URL: {img_url}")

# 1. No Referer (Like a direct browser visit or some hotlinks)
try:
    r = requests.get(img_url, timeout=5)
    print(f"1. No Referer: Status {r.status_code}, Size {len(r.content)}")
except Exception as e:
    print(f"1. No Referer: Error {e}")

# 2. External Referer (Simulating our website)
try:
    headers = {'Referer': 'https://korea-news.app/'}
    r = requests.get(img_url, headers=headers, timeout=5)
    print(f"2. External Referer: Status {r.status_code}, Size {len(r.content)}")
except Exception as e:
    print(f"2. External Referer: Error {e}")

# 3. Correct Referer
try:
    headers = {'Referer': 'http://www.mokpo.go.kr/'}
    r = requests.get(img_url, headers=headers, timeout=5)
    print(f"3. Correct Referer: Status {r.status_code}, Size {len(r.content)}")
except Exception as e:
    print(f"3. Correct Referer: Error {e}")

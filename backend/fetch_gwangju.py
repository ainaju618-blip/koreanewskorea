import requests
# A real detail URL found in previous JSON-LD data
url = "https://www.gwangju.go.kr/boardView.do?pageId=www789&boardId=BD_0000000027&seq=21180"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}
try:
    res = requests.get(url, headers=headers, timeout=10)
    print(f"Status Code: {res.status_code}")
    
    with open("gwangju_detail_dump.html", "w", encoding="utf-8") as f:
        f.write(res.text)
    print("Saved to gwangju_detail_dump.html")
except Exception as e:
    print(f"Error: {e}")

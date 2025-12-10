import requests

resp = requests.get("http://localhost:3000/api/posts?limit=10&status=published")
data = resp.json()

print(f"Total: {len(data) if isinstance(data, list) else 'N/A'}")
if isinstance(data, list):
    for p in data:
        print(f"  region={p.get('region', 'N/A')} source={p.get('source', 'N/A')} title={p['title'][:30]}")
else:
    print(data)

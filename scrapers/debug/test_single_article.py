"""Single article test - Debug scraper pipeline"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

# Check env loaded correctly
print("=== ENV CHECK ===")
api_url = os.getenv('BOT_API_URL', 'NOT SET')
api_key = os.getenv('BOT_API_KEY', 'NOT SET')
print(f"BOT_API_URL: {api_url}")
print(f"BOT_API_KEY: {'SET' if api_key and api_key != 'NOT SET' else 'NOT SET'}")
print()

# Test API connection
print("=== API CONNECTION TEST ===")
import requests

test_article = {
    'title': 'DEBUG TEST - DELETE ME - ' + str(int(__import__('time').time())),
    'original_link': f'https://example.com/debug-test-{int(__import__("time").time())}',
    'content': 'This is a debug test article to verify the scraper pipeline is working correctly. It should be deleted after testing.',
    'source': 'Debug',
    'published_at': __import__('datetime').datetime.now().isoformat(),
}

headers = {
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {api_key}'
}

try:
    print(f"Sending to: {api_url}")
    resp = requests.post(api_url, json=test_article, headers=headers, timeout=10)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.json()}")

    if resp.status_code == 201:
        print("\n[SUCCESS] API pipeline working!")
        # Clean up - delete test article
        from supabase import create_client
        supabase = create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_KEY')
        )
        result = resp.json()
        if result.get('id'):
            supabase.table('posts').delete().eq('id', result['id']).execute()
            print(f"[CLEANUP] Deleted test article: {result['id']}")
    elif resp.status_code == 200:
        print("\n[INFO] Article already exists (duplicate check working)")
    else:
        print(f"\n[ERROR] Unexpected status: {resp.status_code}")

except Exception as e:
    print(f"\n[ERROR] {type(e).__name__}: {e}")

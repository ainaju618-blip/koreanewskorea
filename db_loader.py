import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
# Load environment variables
try:
    load_dotenv(encoding='utf-8')
except UnicodeDecodeError:
    try:
        load_dotenv(encoding='cp949')
    except Exception:
        load_dotenv()

# 환경변수 호환성: Python 스크립트용 또는 Next.js용 변수 모두 지원
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[!] Warning: Supabase credentials not found in .env. Running in MOCK MODE (No DB Write).")
    supabase = None
else:
    # Initialize Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def load_to_db(input_file="news_drafts.json"):
    print("=== Starting DB Loading ===")
    
    if not os.path.exists(input_file):
        print(f"[!] Input file {input_file} not found. Run ai_rewriter.py first.")
        return

    with open(input_file, "r", encoding="utf-8") as f:
        drafts = json.load(f)

    print(f"[*] Found {len(drafts)} drafts to upload.")
    
    success_count = 0
    duplicate_count = 0
    
    for draft in drafts:
        try:
            # 0. Mock Mode Check
            if not supabase:
                print(f"  -> [MOCK DB] Would upload: {draft['title'][:30]}...")
                success_count += 1
                continue

            # 1. Duplicate Check
            existing = supabase.table("posts").select("id").eq("original_link", draft["link"]).execute()
            
            if existing.data and len(existing.data) > 0:
                print(f"  - [Skip] Duplicate found: {draft['title'][:30]}...")
                duplicate_count += 1
                continue

            # 2. Insert if new
            data = {
                "title": draft["title"],
                "content": draft["body"],
                "ai_summary": draft["insight"],
                "original_link": draft["link"],
                "source": draft["source"],
                "published_at": draft["created_at"], # ISO format expected
                "category": draft.get("category", "News"), # Classification result
                "status": "draft",
                "thumbnail_url": None
            }
            
            supabase.table("posts").insert(data).execute()
            print(f"  -> [New] Uploaded: {draft['title'][:30]}...")
            success_count += 1
            
        except Exception as e:
            print(f"[!] Failed to upload {draft['title'][:30]}: {e}")

    print(f"=== DB Loading Complete. New: {success_count}, Duplicates: {duplicate_count} ===")

if __name__ == "__main__":
    load_to_db()

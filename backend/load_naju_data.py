
import os
import json
import asyncio
from dotenv import load_dotenv
from supabase import create_client, Client, ClientOptions
from datetime import datetime

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
    print("[!] Error: Supabase credentials not found in .env.")
    exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

async def load_naju_data(input_file="naju_articles.json"):
    print("=== Starting Naju Data Loading ===")
    
    if not os.path.exists(input_file):
        print(f"[!] Input file {input_file} not found.")
        return

    print(f"[*] Reading {input_file}...")
    with open(input_file, "r", encoding="utf-8") as f:
        articles = json.load(f)

    print(f"[*] Found {len(articles)} articles to process.")
    
    success_count = 0
    duplicate_count = 0
    error_count = 0
    
    # 100개씩 배치 처리 권장 (너무 많으면 오래 걸리거나 타임아웃 될 수 있음)
    # 여기서는 단순 loop로 진행하되, 진행상황을 출력
    
    for i, article in enumerate(articles):
        try:
            # 1. Duplicate Check (original_link 기준)
            # 매번 쿼리를 날리면 느릴 수 있으나, 가장 안전함.
            # 성능 개선을 위해선 DB에서 original_link 목록만 미리 가져오는 방법도 있음
            # 일단 안전하게 건별 체크
            
            original_link = article.get("source_url")
            if not original_link:
                # url 키가 있을 수도 있음
                original_link = article.get("original_link") or article.get("url")
            
            if not original_link:
                 print(f"  [Skip] No URL found for: {article['title'][:20]}")
                 error_count += 1
                 continue

            # Check if exists
            existing = supabase.table("posts").select("id").eq("original_link", original_link).execute()
            
            if existing.data and len(existing.data) > 0:
                print(f"[{i+1}/{len(articles)}] [Skip] Duplicate: {article['title'][:20]}...")
                duplicate_count += 1
                continue

            # 2. Data Mapping
            # JSON keys: idx, title, content, content_length, published_at, date, department, image_url, view_count, source, source_url, category
            # DB Schema: title, content, published_at, original_link, source, thumbnail_url, view_count, category, status, ai_summary
            
            insert_data = {
                "title": article["title"],
                "content": article["content"],
                "published_at": article["published_at"],
                "original_link": original_link,
                "source": "나주시", # Fixed source
                "thumbnail_url": article.get("image_url"),
                "view_count": article.get("view_count", 0),
                "category": "나주시", # 기획 변경: '지역' -> '나주시'로 세분화 매핑
                "status": "published", # 즉시 발행
                "created_at": datetime.now().isoformat()
            }
            
            # 3. Insert
            supabase.table("posts").insert(insert_data).execute()
            print(f"[{i+1}/{len(articles)}] [NEW] Uploaded: {article['title'][:20]}...")
            success_count += 1
            
        except Exception as e:
            print(f"[{i+1}/{len(articles)}] [ERROR] Failed: {article['title'][:20]} - {e}")
            error_count += 1

    print(f"\n=== Loading Complete ===")
    print(f"Total: {len(articles)}")
    print(f"Success: {success_count}")
    print(f"Duplicates: {duplicate_count}")
    print(f"Errors: {error_count}")

if __name__ == "__main__":
    # windows async loop policy fix
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
    asyncio.run(load_naju_data())

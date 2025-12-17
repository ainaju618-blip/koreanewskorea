"""
Supabase Client - Central DB connection
"""
from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_ANON_KEY

_client: Client | None = None

def get_client() -> Client:
    """Get or create Supabase client"""
    global _client
    if _client is None:
        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            raise ValueError("Supabase credentials not configured. Check .env file.")
        _client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    return _client

def check_connection() -> bool:
    """Test database connection"""
    try:
        client = get_client()
        # Simple query to test connection
        client.table("project_registry").select("code").limit(1).execute()
        return True
    except Exception as e:
        print(f"DB connection error: {e}")
        return False

"""
Claude Hub - Configuration
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

# Local paths
BASE_PROJECT_PATH = Path(os.getenv("BASE_PROJECT_PATH", "d:/cbt"))
CLAUDE_HUB_PATH = BASE_PROJECT_PATH / "claude-hub"
KNOWLEDGE_PATH = BASE_PROJECT_PATH / ".claude" / "knowledge"

# Server
PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "127.0.0.1")

# Project Git mapping (fallback if DB unavailable)
PROJECT_GIT_MAPPING = {
    "koreanews": {
        "email": "kyh6412057153@gmail.com",
        "name": "유향",
        "path": "d:/cbt/koreanews"
    },
    "hobakflower": {
        "email": "ko518533@gmail.com",
        "name": "광혁",
        "path": "d:/cbt/hobakflower"
    },
    "electrical-cbt": {
        "email": "multi618@gmail.com",
        "name": "중",
        "path": "d:/cbt/electrical-cbt"
    },
    "thub": {
        "email": "multi618@gmail.com",
        "name": "중",
        "path": "d:/cbt/thub"
    }
}

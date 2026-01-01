from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "주역 AI 운세 서비스"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/iching_db"
    DATABASE_URL_SYNC: str = "postgresql://postgres:password@localhost:5432/iching_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # LLM (Ollama)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5:7b"

    # ChromaDB
    CHROMA_PERSIST_DIR: str = "./chroma_data"

    # API Settings
    MAX_DAILY_FREE_QUERIES: int = 5
    CACHE_TTL: int = 3600

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

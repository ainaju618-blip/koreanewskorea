# Core Configuration Module

Core module handles application-wide configuration, settings management, and initialization for the I Ching AI Fortune-Telling Service backend.

## Overview

The `core` module is the heart of configuration management, providing centralized settings for database connections, caching, LLM integration, and API behavior. All application settings are defined in a single source of truth using Pydantic's `BaseSettings`.

## Directory Structure

```
backend/app/core/
├── __init__.py          # Module initialization
├── config.py            # Configuration class and settings loader
└── README.md            # This file
```

## Configuration System

### Settings Class (`config.py`)

The `Settings` class uses Pydantic's `BaseSettings` for robust environment variable management with type validation and default values.

```python
from core.config import settings

# Access settings anywhere in the application
db_url = settings.DATABASE_URL
redis_url = settings.REDIS_URL
model_name = settings.OLLAMA_MODEL
```

### Environment Variables Reference

#### Application Settings

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `APP_NAME` | str | "주역 AI 운세 서비스" | Application name (Korean: "I Ching AI Fortune-Telling Service") |
| `APP_VERSION` | str | "1.0.0" | Semantic version of the application |
| `DEBUG` | bool | `True` | Debug mode flag (disable in production) |

#### Database Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `DATABASE_URL` | str | `postgresql+asyncpg://postgres:password@localhost:5432/iching_db` | Async PostgreSQL connection URL for SQLAlchemy |
| `DATABASE_URL_SYNC` | str | `postgresql://postgres:password@localhost:5432/iching_db` | Sync PostgreSQL connection URL for synchronous operations |

**Format**: `postgresql+asyncpg://user:password@host:port/database`

**Required Components**:
- `user`: PostgreSQL username (default: `postgres`)
- `password`: PostgreSQL password
- `host`: Database server address (default: `localhost`)
- `port`: PostgreSQL port (default: `5432`)
- `database`: Database name (default: `iching_db`)

#### Redis Cache Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `REDIS_URL` | str | `redis://localhost:6379/0` | Redis connection URL for caching |

**Format**: `redis://[password@]host:port/db_number`

**Components**:
- `host`: Redis server address (default: `localhost`)
- `port`: Redis port (default: `6379`)
- `db_number`: Redis database index (0-15, default: `0`)

#### LLM Integration (Ollama)

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `OLLAMA_BASE_URL` | str | `http://localhost:11434` | Ollama API base URL |
| `OLLAMA_MODEL` | str | `qwen2.5:7b` | LLM model identifier |

**Supported Models**:
- `qwen2.5:7b` (default) - Qwen 2.5 7B parameters
- `qwen2.5:14b` - Qwen 2.5 14B parameters
- `qwen2.5:32b` - Qwen 2.5 32B parameters
- `llama2:7b` - Llama 2 7B
- `mistral:7b` - Mistral 7B

#### ChromaDB Vector Database

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `CHROMA_PERSIST_DIR` | str | `./chroma_data` | Directory for persistent ChromaDB storage |

**Notes**:
- Relative paths are resolved from the project root
- Use absolute paths for production deployments
- Directory will be created automatically if it doesn't exist

#### API Rate Limiting & Caching

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `MAX_DAILY_FREE_QUERIES` | int | `5` | Maximum free queries per user per day |
| `CACHE_TTL` | int | `3600` | Cache time-to-live in seconds (1 hour) |

**Rate Limiting**:
- Free tier users are limited to `MAX_DAILY_FREE_QUERIES` queries per 24 hours
- Premium users have unlimited queries
- Value is used in rate limiting middleware

**Caching**:
- `CACHE_TTL` applies to most API responses
- I Ching interpretations are cached to reduce LLM calls
- Keyword search results are cached separately

## Usage Examples

### Basic Configuration Access

```python
from app.core.config import settings

# Access settings in any module
print(f"App: {settings.APP_NAME} v{settings.APP_VERSION}")
print(f"Database: {settings.DATABASE_URL}")
print(f"Debug Mode: {settings.DEBUG}")
```

### Database Connection

```python
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings

# Create async database engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
)
```

### Redis Client

```python
import aioredis
from app.core.config import settings

# Create Redis client
redis = await aioredis.from_url(
    settings.REDIS_URL,
    encoding="utf8",
    decode_responses=True,
)

# Use for caching
cache_key = f"user:{user_id}:queries"
daily_count = await redis.get(cache_key)
```

### LLM Integration

```python
import httpx
from app.core.config import settings

# Create Ollama client
async with httpx.AsyncClient(base_url=settings.OLLAMA_BASE_URL) as client:
    response = await client.post(
        "/api/generate",
        json={
            "model": settings.OLLAMA_MODEL,
            "prompt": "Explain the first hexagram of I Ching",
            "stream": False,
        }
    )
    result = response.json()
```

### ChromaDB Vector Store

```python
from chromadb.config import Settings as ChromaSettings
from app.core.config import settings

# Initialize ChromaDB with persistence
chroma_settings = ChromaSettings(
    chroma_db_impl="duckdb+parquet",
    persist_directory=settings.CHROMA_PERSIST_DIR,
    anonymized_telemetry=False,
)
```

## Environment File Setup

Create a `.env` file in the project root:

```bash
# Application
APP_NAME="주역 AI 운세 서비스"
APP_VERSION="1.0.0"
DEBUG=True

# Database
DATABASE_URL="postgresql+asyncpg://postgres:your_password@localhost:5432/iching_db"
DATABASE_URL_SYNC="postgresql://postgres:your_password@localhost:5432/iching_db"

# Redis
REDIS_URL="redis://localhost:6379/0"

# Ollama (LLM)
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="qwen2.5:7b"

# Vector Database
CHROMA_PERSIST_DIR="./chroma_data"

# API Settings
MAX_DAILY_FREE_QUERIES=5
CACHE_TTL=3600
```

### Development Environment

```bash
# development.env
DEBUG=True
DATABASE_URL="postgresql+asyncpg://postgres:dev_password@localhost:5432/iching_dev"
DATABASE_URL_SYNC="postgresql://postgres:dev_password@localhost:5432/iching_dev"
OLLAMA_MODEL="qwen2.5:7b"
```

### Production Environment

```bash
# production.env
DEBUG=False
DATABASE_URL="postgresql+asyncpg://postgres:${DB_PASSWORD}@prod-db.example.com:5432/iching_prod"
DATABASE_URL_SYNC="postgresql://postgres:${DB_PASSWORD}@prod-db.example.com:5432/iching_prod"
REDIS_URL="redis://:${REDIS_PASSWORD}@prod-redis.example.com:6379/0"
OLLAMA_BASE_URL="http://ollama-service:11434"
OLLAMA_MODEL="qwen2.5:32b"
CHROMA_PERSIST_DIR="/var/lib/chroma_data"
MAX_DAILY_FREE_QUERIES=3
CACHE_TTL=7200
```

## Settings Caching

The `get_settings()` function uses `@lru_cache()` to cache the Settings object:

```python
from functools import lru_cache

@lru_cache()
def get_settings() -> Settings:
    return Settings()

# Subsequent calls return cached object
settings = get_settings()  # Reads from cache
```

**Benefits**:
- Settings are read from `.env` only once at startup
- Reduced I/O overhead
- Consistent settings throughout application lifecycle

**Note**: Settings are not reloaded after application startup. Restart the application to apply configuration changes.

## Type Validation

Pydantic automatically validates configuration values:

```python
# ❌ Invalid - will raise validation error
DEBUG="not_a_boolean"  # Must be True/False

# ❌ Invalid - will raise validation error
MAX_DAILY_FREE_QUERIES="five"  # Must be integer

# ✅ Valid
DEBUG=False
MAX_DAILY_FREE_QUERIES=10
```

## Connection Examples

### Complete FastAPI Setup

```python
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
)

# Create database engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
)

# Create session factory
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Dependency for FastAPI routes
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
        await session.close()
```

### Redis Connection Pool

```python
import aioredis
from app.core.config import settings

class RedisPool:
    _pool = None

    @classmethod
    async def init(cls):
        cls._pool = await aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf8",
            decode_responses=True,
            max_connections=20,
        )

    @classmethod
    async def get(cls):
        if cls._pool is None:
            await cls.init()
        return cls._pool
```

## Troubleshooting

### Common Issues

**Issue**: `ValueError: environment variable not set`
- **Cause**: Required environment variable is missing
- **Solution**: Add variable to `.env` file or set in system environment

**Issue**: `psycopg2.OperationalError: connection refused`
- **Cause**: Database server not running or wrong connection URL
- **Solution**: Check DATABASE_URL and verify PostgreSQL is running

**Issue**: `ConnectionRefusedError: [Errno 111] Connection refused` (Redis)
- **Cause**: Redis server not running
- **Solution**: Start Redis with `redis-server` or verify REDIS_URL

**Issue**: `ConnectionError` (Ollama)
- **Cause**: Ollama server not running or wrong URL
- **Solution**: Verify OLLAMA_BASE_URL and start Ollama service

**Issue**: `Model "qwen2.5:7b" not found`
- **Cause**: Model not pulled in Ollama
- **Solution**: Run `ollama pull qwen2.5:7b` to download model

## Best Practices

### Security

✅ **Do**:
- Store sensitive values (passwords, API keys) in `.env` file
- Add `.env` to `.gitignore` to prevent accidental commits
- Use strong database passwords in production
- Disable `DEBUG=False` in production
- Use environment-specific configuration files

❌ **Don't**:
- Hardcode sensitive values in code
- Commit `.env` files to version control
- Use default passwords in production
- Set `DEBUG=True` in production
- Share environment variables via Slack or email

### Configuration Management

✅ **Do**:
- Keep `.env.example` with template values (passwords removed)
- Document all configuration options
- Use meaningful default values
- Validate configuration on startup
- Use different `.env` files for different environments

❌ **Don't**:
- Use same configuration for dev, test, and production
- Leave undefined required settings
- Use overly complex configuration structures
- Change settings at runtime
- Mix configuration and secrets

### Performance

✅ **Do**:
- Use connection pooling for database
- Cache settings with `@lru_cache()`
- Set appropriate `CACHE_TTL` values
- Use async connections where possible
- Monitor resource usage

❌ **Don't**:
- Create new connections per request
- Reload settings frequently
- Set `CACHE_TTL` to 0 for production
- Use synchronous operations in async contexts
- Ignore connection timeouts

## Related Documentation

- **Database Setup**: See `backend/README.md` for PostgreSQL setup
- **Redis Setup**: Redis caching configuration
- **API Routes**: See `backend/app/api/` for endpoint documentation
- **Models**: See `backend/app/models/` for database schema

## Integration Points

### Used By

- `backend/app/main.py` - FastAPI application initialization
- `backend/app/db/database.py` - Database engine creation
- `backend/app/api/` - All API route handlers
- `backend/app/services/` - Business logic modules
- `backend/app/utils/` - Utility functions and helpers

### Dependencies

- **pydantic-settings** (v2.x) - Environment variable management
- **python-dotenv** - Loading `.env` files
- **sqlalchemy** - Database configuration
- **aioredis** - Redis connection
- **chromadb** - Vector database

## Migration Guide

### From `.env` to Environment Variables

To use environment variables directly without `.env` file:

```bash
# Set in shell
export APP_NAME="주역 AI 운세 서비스"
export DATABASE_URL="postgresql+asyncpg://..."
export DEBUG="False"

# Or set in Docker/deployment configuration
# Settings will be loaded from environment automatically
```

### Version Updates

Settings are backward compatible. When adding new variables:

1. Add to `Settings` class with default value
2. Update `.env.example`
3. Document in this README
4. No migration needed for existing deployments

## Support

For issues or questions about configuration:

1. Check this README and troubleshooting section
2. Review `.env.example` for correct format
3. Check backend logs for detailed errors
4. Verify external service connectivity (DB, Redis, Ollama)

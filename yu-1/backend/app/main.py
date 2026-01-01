from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.database import init_db
from app.api import divination
from app.api import settings as settings_api
from app.api import questions


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"[*] {settings.APP_NAME} v{settings.APP_VERSION} Starting...")
    try:
        await init_db()
        print("[OK] Database connected")
    except Exception as e:
        print(f"[WARN] Database connection failed: {e}")
        print("[*] Running without database (in-memory mode)")
    yield
    # Shutdown
    print("[*] Server shutdown")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="주역 기반 AI 운세 서비스 API",
    lifespan=lifespan
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "https://*.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(divination.router)
app.include_router(settings_api.router)
app.include_router(questions.router)


@app.get("/")
async def root():
    return {
        "message": f"{settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )

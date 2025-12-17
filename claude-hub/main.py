"""
Claude Hub - Main Application
Central Project & Knowledge Management System

Usage:
    python main.py
    or
    uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from app.config import PORT, HOST
from app.api import projects, knowledge, raw_files, summaries
from app.db.supabase_client import check_connection

# Create FastAPI app
app = FastAPI(
    title="Claude Hub",
    description="Central Project & Knowledge Management System",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
static_path = Path(__file__).parent / "frontend" / "static"
static_path.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_path)), name="static")

# Templates
templates_path = Path(__file__).parent / "frontend"
templates = Jinja2Templates(directory=str(templates_path))

# Include routers
app.include_router(projects.router)
app.include_router(knowledge.router)
app.include_router(raw_files.router)
app.include_router(summaries.router)

# Debug: Print all routes
print("\n=== Registered Routes ===")
for r in app.routes:
    print("ROUTE:", getattr(r, "path", None), getattr(r, "methods", None))
print("=========================\n")


@app.get("/")
async def home(request: Request):
    """Home page - Dashboard"""
    return templates.TemplateResponse("index.html", {
        "request": request,
        "title": "Claude Hub"
    })


@app.get("/projects")
async def projects_page(request: Request):
    """Projects management page"""
    return templates.TemplateResponse("projects.html", {
        "request": request,
        "title": "Projects - Claude Hub"
    })


@app.get("/knowledge")
async def knowledge_page(request: Request):
    """Knowledge hub page"""
    return templates.TemplateResponse("knowledge.html", {
        "request": request,
        "title": "Knowledge Hub - Claude Hub"
    })


@app.get("/raw")
async def raw_page(request: Request):
    """Raw source files page (legacy - redirects to library)"""
    return templates.TemplateResponse("raw.html", {
        "request": request,
        "title": "Raw Sources - Claude Hub"
    })


@app.get("/library")
async def library_page(request: Request):
    """Knowledge Library - Integrated tree view of raw files and summaries"""
    return templates.TemplateResponse("library.html", {
        "request": request,
        "title": "Knowledge Library - Claude Hub"
    })


@app.get("/summaries")
async def summaries_page(request: Request):
    """AI Summaries page (legacy)"""
    return templates.TemplateResponse("summaries.html", {
        "request": request,
        "title": "AI Summaries - Claude Hub"
    })


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    db_ok = check_connection()
    return {
        "status": "healthy" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected"
    }


if __name__ == "__main__":
    import uvicorn
    print(f"""
    ========================================
    Claude Hub - Starting...
    ========================================
    URL: http://{HOST}:{PORT}
    ========================================
    """)
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)

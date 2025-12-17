"""
Knowledge API - Knowledge hub endpoints
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from app.services import knowledge_service

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])


class KnowledgeCreate(BaseModel):
    scope: str  # global, stack, project
    topic: str
    title: str
    summary: str
    content: Optional[str] = None
    raw_source: Optional[str] = None
    project_code: Optional[str] = None
    stack: Optional[str] = None
    tags: Optional[list[str]] = None
    source_type: Optional[str] = None
    source_url: Optional[str] = None
    source_title: Optional[str] = None


class KnowledgeUpdate(BaseModel):
    topic: Optional[str] = None
    title: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[list[str]] = None


@router.get("")
async def list_knowledge(
    scope: Optional[str] = Query(None, description="Filter by scope: global, stack, project"),
    project: Optional[str] = Query(None, description="Filter by project code"),
    topic: Optional[str] = Query(None, description="Filter by topic"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """Get knowledge entries with filters"""
    entries = knowledge_service.get_all_knowledge(
        scope=scope,
        project_code=project,
        topic=topic,
        limit=limit,
        offset=offset
    )
    return {"entries": entries, "count": len(entries)}


@router.get("/search")
async def search_knowledge(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(20, ge=1, le=100)
):
    """Search knowledge entries"""
    entries = knowledge_service.search_knowledge(q, limit=limit)
    return {"entries": entries, "count": len(entries), "query": q}


@router.get("/stats")
async def get_stats():
    """Get knowledge hub statistics"""
    stats = knowledge_service.get_knowledge_stats()
    return stats


@router.get("/topics")
async def get_topics():
    """Get list of all topics"""
    topics = knowledge_service.get_topics()
    return {"topics": topics}


@router.get("/recent")
async def get_recent(limit: int = Query(10, ge=1, le=50)):
    """Get most recent knowledge entries"""
    entries = knowledge_service.get_recent_knowledge(limit=limit)
    return {"entries": entries}


@router.get("/{id}")
async def get_knowledge(id: str):
    """Get a specific knowledge entry"""
    entry = knowledge_service.get_knowledge(id)
    if not entry:
        raise HTTPException(status_code=404, detail="Knowledge entry not found")
    return entry


@router.post("")
async def create_knowledge(data: KnowledgeCreate):
    """Create a new knowledge entry"""
    result = knowledge_service.create_knowledge(data.model_dump())
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return result["data"]


@router.put("/{id}")
async def update_knowledge(id: str, data: KnowledgeUpdate):
    """Update a knowledge entry"""
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    result = knowledge_service.update_knowledge(id, update_data)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return result["data"]


@router.delete("/{id}")
async def delete_knowledge(id: str):
    """Delete a knowledge entry"""
    result = knowledge_service.delete_knowledge(id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"message": "Knowledge entry deleted"}

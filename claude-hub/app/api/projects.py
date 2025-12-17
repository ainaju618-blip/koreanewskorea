"""
Projects API - Project management endpoints
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services import project_service, git_service

router = APIRouter(prefix="/api/projects", tags=["projects"])


class ProjectCreate(BaseModel):
    code: str
    name: str
    path: Optional[str] = None
    description: Optional[str] = None
    git_email: str
    git_name: str
    git_repo: Optional[str] = None
    vercel_project: Optional[str] = None
    vercel_team: Optional[str] = None
    tech_stack: Optional[list[str]] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    path: Optional[str] = None
    git_email: Optional[str] = None
    git_name: Optional[str] = None
    git_repo: Optional[str] = None
    vercel_project: Optional[str] = None
    vercel_team: Optional[str] = None
    tech_stack: Optional[list[str]] = None
    status: Optional[str] = None


@router.get("")
async def list_projects():
    """Get all registered projects"""
    projects = project_service.get_all_projects()
    return {"projects": projects, "count": len(projects)}


@router.get("/scan")
async def scan_filesystem_projects():
    """Scan filesystem for projects"""
    projects = git_service.scan_projects()
    return {"projects": projects, "count": len(projects)}


@router.get("/sync")
async def sync_projects():
    """Sync filesystem projects with DB"""
    result = project_service.sync_projects_from_filesystem()
    return result


@router.get("/{code}")
async def get_project(code: str, with_git: bool = False):
    """Get a specific project"""
    if with_git:
        project = project_service.get_project_with_git_status(code)
    else:
        project = project_service.get_project(code)

    if not project:
        raise HTTPException(status_code=404, detail=f"Project not found: {code}")
    return project


@router.post("")
async def create_project(data: ProjectCreate):
    """Create a new project"""
    result = project_service.create_project(data.model_dump())
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return result["data"]


@router.put("/{code}")
async def update_project(code: str, data: ProjectUpdate):
    """Update a project"""
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    result = project_service.update_project(code, update_data)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return result["data"]


@router.delete("/{code}")
async def delete_project(code: str):
    """Archive a project"""
    result = project_service.delete_project(code)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"message": f"Project {code} archived"}


# Git-related endpoints
@router.get("/{code}/git/status")
async def get_git_status(code: str):
    """Get git status for a project"""
    project = project_service.get_project(code)
    if not project or not project.get("path"):
        raise HTTPException(status_code=404, detail="Project or path not found")

    status = git_service.get_git_status(project["path"])
    return status


@router.get("/{code}/git/verify")
async def verify_git_user(code: str):
    """Verify git user configuration"""
    result = git_service.verify_git_user_for_project(code)
    return result


@router.post("/{code}/git/fix")
async def fix_git_user(code: str):
    """Fix git user configuration"""
    result = git_service.fix_git_user_for_project(code)
    return result

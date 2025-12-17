"""
Project Service - Project registry management
"""
from typing import Optional
from app.db.supabase_client import get_client
from app.services.git_service import scan_projects, get_current_git_user, get_git_status


def get_all_projects() -> list[dict]:
    """Get all registered projects from DB"""
    try:
        client = get_client()
        response = client.table("project_registry") \
            .select("*") \
            .order("name") \
            .execute()
        return response.data
    except Exception as e:
        print(f"Error fetching projects: {e}")
        return []


def get_project(code: str) -> Optional[dict]:
    """Get a specific project by code"""
    try:
        client = get_client()
        response = client.table("project_registry") \
            .select("*") \
            .eq("code", code) \
            .single() \
            .execute()
        return response.data
    except Exception as e:
        print(f"Error fetching project {code}: {e}")
        return None


def create_project(data: dict) -> dict:
    """Create a new project"""
    try:
        client = get_client()
        response = client.table("project_registry") \
            .insert(data) \
            .execute()
        return {"success": True, "data": response.data[0]}
    except Exception as e:
        return {"success": False, "error": str(e)}


def update_project(code: str, data: dict) -> dict:
    """Update a project"""
    try:
        client = get_client()
        response = client.table("project_registry") \
            .update(data) \
            .eq("code", code) \
            .execute()
        return {"success": True, "data": response.data[0] if response.data else None}
    except Exception as e:
        return {"success": False, "error": str(e)}


def delete_project(code: str) -> dict:
    """Delete a project (or archive it)"""
    try:
        client = get_client()
        # Soft delete - set status to archived
        response = client.table("project_registry") \
            .update({"status": "archived"}) \
            .eq("code", code) \
            .execute()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}


def get_project_with_git_status(code: str) -> Optional[dict]:
    """Get project with live git status"""
    project = get_project(code)
    if not project:
        return None

    # Add live git info
    if project.get("path"):
        git_user = get_current_git_user(project["path"])
        git_status = get_git_status(project["path"])

        project["live_git"] = {
            "current_email": git_user.get("email"),
            "current_name": git_user.get("name"),
            "branch": git_status.get("branch"),
            "has_changes": git_status.get("has_changes", False),
            "changes_count": len(git_status.get("changes", []))
        }

        # Check if git config matches DB
        project["git_config_valid"] = (
            git_user.get("email") == project.get("git_email") and
            git_user.get("name") == project.get("git_name")
        )

    return project


def sync_projects_from_filesystem() -> dict:
    """
    Scan filesystem and sync with DB

    - Find new projects not in DB
    - Mark missing projects as archived
    """
    try:
        # Get projects from filesystem
        fs_projects = scan_projects()
        fs_codes = {p["code"] for p in fs_projects}

        # Get projects from DB
        db_projects = get_all_projects()
        db_codes = {p["code"] for p in db_projects}

        # Find new projects
        new_codes = fs_codes - db_codes

        # Find missing projects
        missing_codes = db_codes - fs_codes

        results = {
            "new_projects": [],
            "missing_projects": list(missing_codes),
            "synced": True
        }

        # Add new projects to results (don't auto-add, let user confirm)
        for fs_project in fs_projects:
            if fs_project["code"] in new_codes:
                results["new_projects"].append(fs_project)

        return results

    except Exception as e:
        return {"synced": False, "error": str(e)}

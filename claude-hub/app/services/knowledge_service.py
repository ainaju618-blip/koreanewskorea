"""
Knowledge Service - Knowledge hub management
"""
from typing import Optional
from datetime import datetime
from app.db.supabase_client import get_client


def get_all_knowledge(
    scope: Optional[str] = None,
    project_code: Optional[str] = None,
    topic: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> list[dict]:
    """
    Get knowledge entries with filters

    Args:
        scope: global, stack, project
        project_code: filter by project (when scope=project)
        topic: filter by topic
        limit: max results
        offset: pagination offset
    """
    try:
        client = get_client()
        query = client.table("knowledge_hub").select("*")

        if scope:
            query = query.eq("scope", scope)
        if project_code:
            query = query.eq("project_code", project_code)
        if topic:
            query = query.eq("topic", topic)

        response = query \
            .order("created_at", desc=True) \
            .range(offset, offset + limit - 1) \
            .execute()

        return response.data
    except Exception as e:
        print(f"Error fetching knowledge: {e}")
        return []


def get_knowledge(id: str) -> Optional[dict]:
    """Get a specific knowledge entry"""
    try:
        client = get_client()
        response = client.table("knowledge_hub") \
            .select("*") \
            .eq("id", id) \
            .single() \
            .execute()
        return response.data
    except Exception as e:
        print(f"Error fetching knowledge {id}: {e}")
        return None


def search_knowledge(query: str, limit: int = 20) -> list[dict]:
    """
    Search knowledge entries

    Uses PostgreSQL full-text search
    """
    try:
        client = get_client()
        # Use textSearch for full-text search
        response = client.table("knowledge_hub") \
            .select("*") \
            .text_search("search_vector", query) \
            .limit(limit) \
            .execute()
        return response.data
    except Exception as e:
        print(f"Error searching knowledge: {e}")
        # Fallback to simple ILIKE search
        try:
            response = client.table("knowledge_hub") \
                .select("*") \
                .or_(f"title.ilike.%{query}%,summary.ilike.%{query}%") \
                .limit(limit) \
                .execute()
            return response.data
        except:
            return []


def create_knowledge(data: dict) -> dict:
    """Create a new knowledge entry"""
    try:
        # Validate required fields
        required = ["scope", "topic", "title", "summary"]
        for field in required:
            if not data.get(field):
                return {"success": False, "error": f"Missing required field: {field}"}

        client = get_client()
        response = client.table("knowledge_hub") \
            .insert(data) \
            .execute()
        return {"success": True, "data": response.data[0]}
    except Exception as e:
        return {"success": False, "error": str(e)}


def update_knowledge(id: str, data: dict) -> dict:
    """Update a knowledge entry"""
    try:
        data["updated_at"] = datetime.now().isoformat()
        client = get_client()
        response = client.table("knowledge_hub") \
            .update(data) \
            .eq("id", id) \
            .execute()
        return {"success": True, "data": response.data[0] if response.data else None}
    except Exception as e:
        return {"success": False, "error": str(e)}


def delete_knowledge(id: str) -> dict:
    """Delete a knowledge entry"""
    try:
        client = get_client()
        client.table("knowledge_hub") \
            .delete() \
            .eq("id", id) \
            .execute()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}


def get_knowledge_stats() -> dict:
    """Get statistics about knowledge hub"""
    try:
        client = get_client()

        # Get counts by scope
        all_knowledge = client.table("knowledge_hub").select("scope, topic, project_code").execute()

        stats = {
            "total": len(all_knowledge.data),
            "by_scope": {"global": 0, "stack": 0, "project": 0},
            "by_topic": {},
            "by_project": {}
        }

        for entry in all_knowledge.data:
            # Count by scope
            scope = entry.get("scope", "global")
            stats["by_scope"][scope] = stats["by_scope"].get(scope, 0) + 1

            # Count by topic
            topic = entry.get("topic", "unknown")
            stats["by_topic"][topic] = stats["by_topic"].get(topic, 0) + 1

            # Count by project
            project = entry.get("project_code")
            if project:
                stats["by_project"][project] = stats["by_project"].get(project, 0) + 1

        return stats
    except Exception as e:
        print(f"Error getting stats: {e}")
        return {"total": 0, "error": str(e)}


def get_topics() -> list[str]:
    """Get list of all unique topics"""
    try:
        client = get_client()
        response = client.table("knowledge_hub") \
            .select("topic") \
            .execute()

        topics = set(entry["topic"] for entry in response.data if entry.get("topic"))
        return sorted(list(topics))
    except Exception as e:
        print(f"Error getting topics: {e}")
        return []


def get_recent_knowledge(limit: int = 10) -> list[dict]:
    """Get most recent knowledge entries"""
    return get_all_knowledge(limit=limit)

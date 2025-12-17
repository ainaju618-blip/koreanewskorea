"""
Raw Files API - Save and manage raw source files
"""
import os
import re
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/raw", tags=["raw-files"])

# Raw files directory
RAW_DIR = Path("d:/cbt/claude-hub/knowledge/raw")
RAW_DIR.mkdir(parents=True, exist_ok=True)


class RawFileCreate(BaseModel):
    title: str
    content: str
    topic: Optional[str] = "general"


class RawFileResponse(BaseModel):
    filename: str
    title: str
    path: str
    size: int
    created_at: str


def sanitize_filename(title: str) -> str:
    """Convert title to safe filename"""
    # Remove special characters, keep Korean and alphanumeric
    safe = re.sub(r'[^\w\s가-힣-]', '', title)
    safe = safe.strip().replace(' ', '_')[:50]
    return safe or "untitled"


@router.post("", response_model=RawFileResponse)
async def save_raw_file(data: RawFileCreate):
    """Save raw text content to file"""
    try:
        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_title = sanitize_filename(data.title)
        filename = f"{timestamp}_{safe_title}.txt"
        filepath = RAW_DIR / filename

        # Create file content with metadata header
        file_content = f"""# {data.title}
# Topic: {data.topic}
# Created: {datetime.now().isoformat()}
# ---

{data.content}
"""

        # Save file
        filepath.write_text(file_content, encoding="utf-8")

        return RawFileResponse(
            filename=filename,
            title=data.title,
            path=str(filepath),
            size=len(data.content),
            created_at=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
async def list_raw_files():
    """List all raw files"""
    files = []
    for filepath in sorted(RAW_DIR.glob("*.txt"), reverse=True):
        # Read first line for title
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                first_line = f.readline().strip()
                title = first_line.replace("# ", "") if first_line.startswith("# ") else filepath.stem
        except:
            title = filepath.stem

        files.append({
            "filename": filepath.name,
            "title": title,
            "path": str(filepath),
            "size": filepath.stat().st_size,
            "created_at": datetime.fromtimestamp(filepath.stat().st_ctime).isoformat()
        })

    return {"files": files, "count": len(files)}


@router.get("/{filename}")
async def get_raw_file(filename: str):
    """Get raw file content"""
    filepath = RAW_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found")

    content = filepath.read_text(encoding="utf-8")

    # Parse metadata from header
    lines = content.split("\n")
    title = lines[0].replace("# ", "") if lines[0].startswith("# ") else filename

    # Find content after separator
    try:
        sep_index = lines.index("# ---")
        body = "\n".join(lines[sep_index + 2:])
    except ValueError:
        body = content

    return {
        "filename": filename,
        "title": title,
        "content": body,
        "full_content": content,
        "path": str(filepath)
    }


@router.delete("/{filename}")
async def delete_raw_file(filename: str):
    """Delete a raw file"""
    filepath = RAW_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found")

    filepath.unlink()
    return {"message": f"Deleted {filename}"}

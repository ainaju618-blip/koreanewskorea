"""
Summaries API - AI-generated summary files
"""
import os
import re
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, HTTPException
from typing import Optional

router = APIRouter(prefix="/api/summaries", tags=["summaries"])

# Processed files directory
PROCESSED_DIR = Path("d:/cbt/claude-hub/knowledge/processed")
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

# Raw files directory (for linking)
RAW_DIR = Path("d:/cbt/claude-hub/knowledge/raw")


def extract_summary_metadata(content: str) -> dict:
    """Extract metadata from summary markdown file"""
    lines = content.split("\n")
    metadata = {
        "title": "",
        "preview": "",
        "core_summary": "",
        "source_file": ""
    }

    for i, line in enumerate(lines):
        if line.startswith("# "):
            metadata["title"] = line[2:].strip()
        elif "source_file:" in line.lower() or "source:" in line.lower():
            # Extract source file reference
            match = re.search(r'`([^`]+)`', line)
            if match:
                metadata["source_file"] = match.group(1)
        elif line.startswith("## ") and "core" in line.lower():
            # Get core summary (next few lines)
            preview_lines = []
            for j in range(i+1, min(i+5, len(lines))):
                if lines[j].strip() and not lines[j].startswith("#"):
                    preview_lines.append(lines[j].strip())
            metadata["preview"] = " ".join(preview_lines)[:200]
            metadata["core_summary"] = "\n".join(preview_lines)

    return metadata


@router.get("")
async def list_summaries():
    """List all summary files"""
    files = []
    for filepath in sorted(PROCESSED_DIR.glob("*.md"), reverse=True):
        try:
            content = filepath.read_text(encoding="utf-8")
            metadata = extract_summary_metadata(content)

            files.append({
                "filename": filepath.name,
                "title": metadata["title"] or filepath.stem,
                "preview": metadata["preview"] or "Click to view summary...",
                "source_file": metadata["source_file"],
                "path": str(filepath),
                "size": filepath.stat().st_size,
                "created_at": datetime.fromtimestamp(filepath.stat().st_ctime).isoformat()
            })
        except Exception as e:
            print(f"Error reading {filepath}: {e}")
            continue

    return {"files": files, "count": len(files)}


@router.get("/{filename}")
async def get_summary(filename: str):
    """Get summary file content"""
    filepath = PROCESSED_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Summary not found")

    content = filepath.read_text(encoding="utf-8")
    metadata = extract_summary_metadata(content)

    return {
        "filename": filename,
        "title": metadata["title"] or filename,
        "content": content,
        "source_file": metadata["source_file"],
        "path": str(filepath)
    }


@router.get("/tree/all")
async def get_knowledge_tree():
    """
    Get hierarchical tree structure: Raw files -> Summaries
    """
    tree = []

    # Get all raw files
    raw_files = {}
    for filepath in sorted(RAW_DIR.glob("*.txt"), reverse=True):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                first_line = f.readline().strip()
                title = first_line.replace("# ", "") if first_line.startswith("# ") else filepath.stem
        except:
            title = filepath.stem

        # Extract date from filename (format: YYYYMMDD_HHMMSS_title.txt)
        date_match = re.match(r'(\d{8})_\d{6}_', filepath.name)
        date_str = date_match.group(1) if date_match else "unknown"

        raw_files[filepath.name] = {
            "filename": filepath.name,
            "title": title,
            "size": filepath.stat().st_size,
            "created_at": datetime.fromtimestamp(filepath.stat().st_ctime).isoformat(),
            "date_group": date_str,
            "summary": None  # Will be filled if summary exists
        }

    # Match summaries to raw files
    for filepath in PROCESSED_DIR.glob("*.md"):
        try:
            content = filepath.read_text(encoding="utf-8")
            metadata = extract_summary_metadata(content)
            source_file = metadata.get("source_file", "")

            # Try to match by source file reference
            if source_file and source_file in raw_files:
                raw_files[source_file]["summary"] = {
                    "filename": filepath.name,
                    "title": metadata["title"],
                    "preview": metadata["preview"],
                    "core_summary": metadata["core_summary"]
                }
            else:
                # Try to match by similar name pattern
                for raw_name in raw_files:
                    # Check if summary filename contains parts of raw filename
                    raw_stem = Path(raw_name).stem.lower()
                    summary_stem = filepath.stem.lower()
                    if any(part in summary_stem for part in raw_stem.split("_") if len(part) > 3):
                        raw_files[raw_name]["summary"] = {
                            "filename": filepath.name,
                            "title": metadata["title"],
                            "preview": metadata["preview"],
                            "core_summary": metadata["core_summary"]
                        }
                        break
        except Exception as e:
            print(f"Error processing summary {filepath}: {e}")
            continue

    # Group by date
    date_groups = {}
    for raw_name, raw_data in raw_files.items():
        date_key = raw_data["date_group"]
        if date_key not in date_groups:
            date_groups[date_key] = []
        date_groups[date_key].append(raw_data)

    # Convert to tree structure
    for date_key in sorted(date_groups.keys(), reverse=True):
        formatted_date = f"{date_key[:4]}-{date_key[4:6]}-{date_key[6:8]}" if len(date_key) == 8 else date_key
        tree.append({
            "date": formatted_date,
            "items": date_groups[date_key]
        })

    return {"tree": tree, "total_raw": len(raw_files), "total_summaries": sum(1 for r in raw_files.values() if r["summary"])}

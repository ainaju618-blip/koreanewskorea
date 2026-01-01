"""
설정 관리 API - 영상/이미지 등 사이트 설정
"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List
import json
import os
import shutil
from pathlib import Path

router = APIRouter(prefix="/api/settings", tags=["settings"])

# 설정 파일 경로 (프로젝트 루트 기준)
# settings.py → api → app → backend → yu-1 (프로젝트 루트)
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
SETTINGS_FILE = PROJECT_ROOT / "backend" / "data" / "site_settings.json"
MEDIA_DIR = PROJECT_ROOT / "data" / "image"
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov"}
ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp"}


class HeroVideoSettings(BaseModel):
    selected_video: str = "Ancient_Chinese_Coins_Cosmic_Animation.mp4"


class SiteSettings(BaseModel):
    hero_video: str = "Ancient_Chinese_Coins_Cosmic_Animation.mp4"
    layout_style: str = "classic-mystical"
    divination_method: str = "coin"


class MediaFile(BaseModel):
    filename: str
    type: str  # video | image
    size: int
    path: str


def load_settings() -> dict:
    """설정 파일 로드"""
    if SETTINGS_FILE.exists():
        with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "hero_video": "Ancient_Chinese_Coins_Cosmic_Animation.mp4",
        "layout_style": "classic-mystical",
        "divination_method": "coin"
    }


def save_settings(settings: dict):
    """설정 파일 저장"""
    SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(settings, f, ensure_ascii=False, indent=2)


@router.get("/")
async def get_settings():
    """전체 설정 조회"""
    return load_settings()


@router.put("/")
async def update_settings(settings: SiteSettings):
    """전체 설정 업데이트"""
    current = load_settings()
    current.update(settings.model_dump())
    save_settings(current)
    return {"status": "success", "settings": current}


@router.get("/hero-video")
async def get_hero_video():
    """히어로 영상 설정 조회"""
    settings = load_settings()
    return {"video": settings.get("hero_video", "Ancient_Chinese_Coins_Cosmic_Animation.mp4")}


@router.put("/hero-video")
async def set_hero_video(video_settings: HeroVideoSettings):
    """히어로 영상 설정 변경"""
    settings = load_settings()
    settings["hero_video"] = video_settings.selected_video
    save_settings(settings)
    return {"status": "success", "video": video_settings.selected_video}


@router.get("/media/list")
async def list_media_files():
    """미디어 파일 목록 조회"""
    if not MEDIA_DIR.exists():
        return {"videos": [], "images": []}

    videos = []
    images = []

    for file in MEDIA_DIR.iterdir():
        if file.is_file():
            ext = file.suffix.lower()
            file_info = {
                "filename": file.name,
                "size": file.stat().st_size,
                "size_mb": round(file.stat().st_size / 1024 / 1024, 2),
                "path": f"/api/settings/media/file/{file.name}"
            }

            if ext in ALLOWED_VIDEO_EXTENSIONS:
                file_info["type"] = "video"
                videos.append(file_info)
            elif ext in ALLOWED_IMAGE_EXTENSIONS:
                file_info["type"] = "image"
                images.append(file_info)

    return {"videos": videos, "images": images}


@router.get("/media/file/{filename}")
async def get_media_file(filename: str):
    """미디어 파일 제공"""
    file_path = MEDIA_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    # 확장자로 미디어 타입 결정
    ext = file_path.suffix.lower()
    media_types = {
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".mov": "video/quicktime",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp"
    }

    media_type = media_types.get(ext, "application/octet-stream")
    return FileResponse(file_path, media_type=media_type)


@router.post("/media/upload")
async def upload_media(file: UploadFile = File(...)):
    """미디어 파일 업로드"""
    # 확장자 검증
    ext = Path(file.filename).suffix.lower()
    allowed = ALLOWED_VIDEO_EXTENSIONS | ALLOWED_IMAGE_EXTENSIONS

    if ext not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(allowed)}"
        )

    # 파일 저장
    MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    file_path = MEDIA_DIR / file.filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "status": "success",
        "filename": file.filename,
        "size": file_path.stat().st_size,
        "path": f"/api/settings/media/file/{file.filename}"
    }


@router.delete("/media/file/{filename}")
async def delete_media_file(filename: str):
    """미디어 파일 삭제"""
    file_path = MEDIA_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    file_path.unlink()
    return {"status": "success", "deleted": filename}

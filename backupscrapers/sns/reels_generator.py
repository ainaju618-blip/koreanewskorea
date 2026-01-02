"""
Reels Generator - Article to Short Video
Converts news articles (ai_summary) to Instagram Reels

Usage:
    python scrapers/sns/reels_generator.py

Requirements:
    pip install gtts moviepy pillow supabase python-dotenv
"""

import os
import sys
import textwrap
from datetime import datetime
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

# Output directory
OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)


def get_recent_article_with_summary():
    """Fetch a recent article with ai_summary from Supabase"""

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[ERROR] SUPABASE_URL or SUPABASE_KEY not found")
        return None

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Get recent article with ai_summary
    response = supabase.table('posts') \
        .select('id, title, ai_summary, tags, region, published_at') \
        .not_.is_('ai_summary', 'null') \
        .neq('ai_summary', '') \
        .eq('status', 'published') \
        .order('published_at', desc=True) \
        .limit(1) \
        .execute()

    if response.data:
        return response.data[0]
    return None


def generate_tts(text: str, output_path: str) -> bool:
    """Generate TTS audio from text using gTTS"""
    try:
        from gtts import gTTS

        tts = gTTS(text=text, lang='ko', slow=False)
        tts.save(output_path)
        print(f"[OK] TTS generated: {output_path}")
        return True
    except Exception as e:
        print(f"[ERROR] TTS failed: {e}")
        return False


def create_video_with_text(
    text: str,
    title: str,
    audio_path: str,
    output_path: str,
    duration: float = None
) -> bool:
    """Create video with text overlay and audio (MoviePy 2.x compatible)"""
    try:
        # MoviePy 2.x imports
        from moviepy import (
            ColorClip, TextClip, CompositeVideoClip, AudioFileClip
        )

        # Load audio to get duration
        audio = AudioFileClip(audio_path)
        if duration is None:
            duration = audio.duration + 1  # Add 1 second buffer

        # Video dimensions (9:16 for Reels)
        width, height = 1080, 1920

        # Create background clip
        background = ColorClip(size=(width, height), color=(20, 30, 50))
        background = background.with_duration(duration)

        # Wrap text for display
        wrapped_title = textwrap.fill(title, width=18)
        wrapped_text = textwrap.fill(text, width=22)

        # Windows Korean font path
        korean_font = 'C:/Windows/Fonts/malgun.ttf'

        # Create title text (MoviePy 2.x API)
        title_clip = TextClip(
            text=wrapped_title,
            font_size=60,
            color='white',
            font=korean_font,
            size=(width - 100, None),
            text_align='center'
        )
        title_clip = title_clip.with_position(('center', 250)).with_duration(duration)

        # Create summary text
        text_clip = TextClip(
            text=wrapped_text,
            font_size=45,
            color='#E0E0E0',
            font=korean_font,
            size=(width - 120, None),
            text_align='center'
        )
        text_clip = text_clip.with_position(('center', 'center')).with_duration(duration)

        # Create logo/watermark text
        logo_clip = TextClip(
            text="KOREA NEWS",
            font_size=35,
            color='#888888',
            font='C:/Windows/Fonts/arial.ttf'
        )
        logo_clip = logo_clip.with_position(('center', height - 150)).with_duration(duration)

        # Compose video
        video = CompositeVideoClip([
            background,
            title_clip,
            text_clip,
            logo_clip
        ])

        # Add audio
        video = video.with_audio(audio)

        # Write video file
        video.write_videofile(
            output_path,
            fps=24,
            codec='libx264',
            audio_codec='aac',
            logger=None
        )

        print(f"[OK] Video created: {output_path}")
        return True

    except Exception as e:
        print(f"[ERROR] Video creation failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def generate_reels(article: dict) -> str:
    """Generate a Reels video from article data"""

    article_id = article['id'][:8]
    title = article['title']
    summary = article['ai_summary']
    tags = article.get('tags', []) or []
    region = article.get('region', 'jeonnam')

    print(f"\n{'='*60}")
    print(f"Generating Reels for: {title[:50]}...")
    print(f"{'='*60}")
    print(f"Summary: {summary[:100]}...")
    print(f"Tags: {tags}")
    print(f"Region: {region}")

    # File paths
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    audio_path = str(OUTPUT_DIR / f"audio_{article_id}_{timestamp}.mp3")
    video_path = str(OUTPUT_DIR / f"reels_{article_id}_{timestamp}.mp4")

    # Step 1: Generate TTS
    print("\n[1/2] Generating TTS audio...")
    if not generate_tts(summary, audio_path):
        return None

    # Step 2: Create video
    print("\n[2/2] Creating video...")
    if not create_video_with_text(summary, title, audio_path, video_path):
        return None

    # Cleanup audio file
    try:
        os.remove(audio_path)
    except:
        pass

    print(f"\n{'='*60}")
    print(f"[SUCCESS] Reels created: {video_path}")
    print(f"{'='*60}")

    return video_path


def main():
    """Main function"""
    print("\n" + "="*60)
    print("  Korea NEWS Reels Generator")
    print("="*60)

    # Check dependencies
    print("\n[CHECK] Checking dependencies...")

    missing = []
    try:
        import gtts
        print("  - gTTS: OK")
    except ImportError:
        missing.append("gtts")
        print("  - gTTS: MISSING")

    try:
        import moviepy
        print("  - MoviePy: OK")
    except ImportError:
        missing.append("moviepy")
        print("  - MoviePy: MISSING")

    try:
        from PIL import Image
        print("  - Pillow: OK")
    except ImportError:
        missing.append("pillow")
        print("  - Pillow: MISSING")

    if missing:
        print(f"\n[ERROR] Missing dependencies: {', '.join(missing)}")
        print(f"Run: pip install {' '.join(missing)}")
        return

    # Fetch article
    print("\n[FETCH] Getting recent article with summary...")
    article = get_recent_article_with_summary()

    if not article:
        print("[ERROR] No article with ai_summary found")
        return

    print(f"  - Title: {article['title'][:50]}...")
    print(f"  - Summary length: {len(article['ai_summary'])} chars")

    # Generate reels
    video_path = generate_reels(article)

    if video_path:
        print(f"\n[DONE] Video saved to: {video_path}")
        print(f"       Open folder: {OUTPUT_DIR}")
    else:
        print("\n[FAILED] Could not generate video")


if __name__ == "__main__":
    main()

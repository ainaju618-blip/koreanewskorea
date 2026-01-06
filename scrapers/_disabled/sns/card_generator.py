"""
Article Card Generator - News to Social Media Card Image
Generates shareable card images for Facebook, Twitter, KakaoTalk

Usage:
    python scrapers/sns/card_generator.py

Requirements:
    pip install pillow supabase python-dotenv requests
"""

import os
import sys
import textwrap
from datetime import datetime
from pathlib import Path
from io import BytesIO

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from supabase import create_client
from PIL import Image, ImageDraw, ImageFont
import requests

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

# Card dimensions (OG Image standard)
CARD_WIDTH = 1200
CARD_HEIGHT = 630


def get_recent_article():
    """Fetch a recent article with ai_summary from Supabase"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[ERROR] SUPABASE_URL or SUPABASE_KEY not found")
        return None

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    response = supabase.table('posts') \
        .select('id, title, ai_summary, tags, region, published_at, thumbnail_url') \
        .not_.is_('ai_summary', 'null') \
        .neq('ai_summary', '') \
        .eq('status', 'published') \
        .order('published_at', desc=True) \
        .limit(1) \
        .execute()

    if response.data:
        return response.data[0]
    return None


def download_image(url: str) -> Image.Image | None:
    """Download image from URL"""
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return Image.open(BytesIO(response.content))
    except Exception as e:
        print(f"[WARN] Could not download image: {e}")
    return None


def create_gradient_background(width: int, height: int) -> Image.Image:
    """Create a gradient background"""
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)

    # Dark blue gradient
    for y in range(height):
        r = int(15 + (y / height) * 25)
        g = int(25 + (y / height) * 35)
        b = int(45 + (y / height) * 55)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    return img


def get_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """Get Korean font with fallback"""
    font_paths = [
        'C:/Windows/Fonts/malgunbd.ttf' if bold else 'C:/Windows/Fonts/malgun.ttf',
        'C:/Windows/Fonts/gulim.ttc',
        'C:/Windows/Fonts/batang.ttc',
    ]

    for path in font_paths:
        try:
            return ImageFont.truetype(path, size)
        except:
            continue

    return ImageFont.load_default()


def create_article_card(article: dict) -> str:
    """Create article card image"""

    title = article['title']
    summary = article['ai_summary']
    region = article.get('region', 'jeonnam')
    published_at = article.get('published_at', '')
    image_url = article.get('thumbnail_url', '')
    article_id = article['id'][:8]

    print(f"\n{'='*60}")
    print(f"Creating card for: {title[:40]}...")
    print(f"{'='*60}")

    # Create base image
    card = create_gradient_background(CARD_WIDTH, CARD_HEIGHT)
    draw = ImageDraw.Draw(card)

    # Layout constants
    padding = 40
    image_width = 400
    text_x = padding

    # Try to add article image
    has_image = False
    if image_url:
        print(f"[INFO] Downloading image...")
        article_image = download_image(image_url)
        if article_image:
            # Resize and position image on right side
            img_height = CARD_HEIGHT - (padding * 2)
            article_image = article_image.resize((image_width, img_height), Image.Resampling.LANCZOS)

            # Add rounded corners effect with overlay
            img_x = CARD_WIDTH - image_width - padding
            card.paste(article_image, (img_x, padding))
            has_image = True
            print(f"[OK] Image added")

    # Calculate text area width
    text_width = CARD_WIDTH - (padding * 3) - (image_width if has_image else 0)

    # Fonts
    title_font = get_font(48, bold=True)
    summary_font = get_font(28)
    meta_font = get_font(22)
    logo_font = get_font(32, bold=True)

    # Region badge
    region_names = {
        'gwangju': '광주', 'jeonnam': '전남', 'mokpo': '목포',
        'yeosu': '여수', 'suncheon': '순천', 'naju': '나주',
        'gwangyang': '광양', 'damyang': '담양', 'goheung': '고흥',
        'haenam': '해남', 'yeongam': '영암', 'muan': '무안',
        'hampyeong': '함평', 'yeonggwang': '영광', 'jangseong': '장성',
        'wando': '완도', 'jindo': '진도', 'sinan': '신안',
        'boseong': '보성', 'hwasun': '화순', 'jangheung': '장흥',
        'gangjin': '강진', 'gokseong': '곡성', 'gurye': '구례'
    }
    region_text = region_names.get(region, region)

    # Draw region badge
    badge_padding = 10
    badge_text = f" {region_text} "
    badge_bbox = draw.textbbox((0, 0), badge_text, font=meta_font)
    badge_width = badge_bbox[2] - badge_bbox[0] + badge_padding * 2
    badge_height = badge_bbox[3] - badge_bbox[1] + badge_padding

    # Badge background
    draw.rounded_rectangle(
        [padding, padding, padding + badge_width, padding + badge_height + 10],
        radius=5,
        fill=(59, 130, 246)  # Blue
    )
    draw.text((padding + badge_padding, padding + 5), badge_text, fill='white', font=meta_font)

    # Title (wrapped)
    title_y = padding + badge_height + 30
    wrapped_title = textwrap.fill(title, width=22 if has_image else 35)
    draw.text((text_x, title_y), wrapped_title, fill='white', font=title_font)

    # Calculate title height
    title_bbox = draw.textbbox((text_x, title_y), wrapped_title, font=title_font)
    title_height = title_bbox[3] - title_bbox[1]

    # Summary (wrapped)
    summary_y = title_y + title_height + 30
    wrapped_summary = textwrap.fill(summary, width=35 if has_image else 55)

    # Limit summary lines
    summary_lines = wrapped_summary.split('\n')[:4]
    if len(summary_lines) == 4:
        summary_lines[-1] = summary_lines[-1][:30] + '...'
    wrapped_summary = '\n'.join(summary_lines)

    draw.text((text_x, summary_y), wrapped_summary, fill='#D1D5DB', font=summary_font)

    # Bottom bar
    bar_y = CARD_HEIGHT - 80
    draw.rectangle([0, bar_y, CARD_WIDTH, CARD_HEIGHT], fill=(17, 24, 39))

    # Logo
    draw.text((padding, bar_y + 25), "KOREA NEWS", fill='#60A5FA', font=logo_font)

    # Date
    if published_at:
        try:
            date_obj = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
            date_text = date_obj.strftime('%Y.%m.%d')
        except:
            date_text = datetime.now().strftime('%Y.%m.%d')
    else:
        date_text = datetime.now().strftime('%Y.%m.%d')

    date_bbox = draw.textbbox((0, 0), date_text, font=meta_font)
    date_width = date_bbox[2] - date_bbox[0]
    draw.text((CARD_WIDTH - padding - date_width, bar_y + 30), date_text, fill='#9CA3AF', font=meta_font)

    # Save
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = str(OUTPUT_DIR / f"card_{article_id}_{timestamp}.png")
    card.save(output_path, 'PNG', quality=95)

    print(f"[OK] Card created: {output_path}")
    return output_path


def main():
    """Main function"""
    print("\n" + "="*60)
    print("  Korea NEWS Article Card Generator")
    print("="*60)

    # Fetch article
    print("\n[FETCH] Getting recent article...")
    article = get_recent_article()

    if not article:
        print("[ERROR] No article found")
        return

    print(f"  - Title: {article['title'][:50]}...")
    print(f"  - Summary: {len(article['ai_summary'])} chars")
    print(f"  - Image: {'Yes' if article.get('thumbnail_url') else 'No'}")

    # Create card
    card_path = create_article_card(article)

    if card_path:
        print(f"\n[DONE] Card saved to: {card_path}")

        # Try to open the image
        try:
            os.startfile(card_path)
        except:
            print(f"       Open manually: {card_path}")


if __name__ == "__main__":
    main()

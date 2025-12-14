"""
PWA 아이콘 생성 스크립트
logo_main.png를 기반으로 다양한 크기의 아이콘 생성
"""
from PIL import Image
import os

# 경로 설정
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
LOGO_PATH = os.path.join(PROJECT_ROOT, 'public', 'images', 'logo', 'logo_main.png')
ICONS_DIR = os.path.join(PROJECT_ROOT, 'public', 'icons')

# 생성할 아이콘 크기
ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

def create_square_icon(source_img, size):
    """정사각형 아이콘 생성 (배경색 추가)"""
    # 정사각형 캔버스 생성 (흰색 배경)
    canvas = Image.new('RGBA', (size, size), (255, 255, 255, 255))

    # 원본 이미지 비율 유지하며 리사이즈
    img = source_img.copy()
    img.thumbnail((int(size * 0.85), int(size * 0.85)), Image.Resampling.LANCZOS)

    # 중앙 배치
    x = (size - img.width) // 2
    y = (size - img.height) // 2

    # 알파 채널이 있으면 합성, 없으면 붙여넣기
    if img.mode == 'RGBA':
        canvas.paste(img, (x, y), img)
    else:
        canvas.paste(img, (x, y))

    return canvas.convert('RGB')

def main():
    # 아이콘 디렉토리 확인/생성
    os.makedirs(ICONS_DIR, exist_ok=True)

    # 원본 로고 로드
    if not os.path.exists(LOGO_PATH):
        print(f"[ERROR] 로고 파일을 찾을 수 없습니다: {LOGO_PATH}")
        return

    source_img = Image.open(LOGO_PATH)
    print(f"[INFO] 원본 로고 크기: {source_img.size}")

    # 각 크기별 아이콘 생성
    for size in ICON_SIZES:
        icon = create_square_icon(source_img, size)
        output_path = os.path.join(ICONS_DIR, f'icon-{size}x{size}.png')
        icon.save(output_path, 'PNG', optimize=True)
        print(f"[OK] 생성됨: icon-{size}x{size}.png")

    # Apple Touch Icon (180x180)
    apple_icon = create_square_icon(source_img, 180)
    apple_icon.save(os.path.join(ICONS_DIR, 'apple-touch-icon.png'), 'PNG', optimize=True)
    print(f"[OK] 생성됨: apple-touch-icon.png")

    # Favicon 32x32
    favicon = create_square_icon(source_img, 32)
    favicon.save(os.path.join(ICONS_DIR, 'favicon-32x32.png'), 'PNG', optimize=True)
    print(f"[OK] 생성됨: favicon-32x32.png")

    # Favicon 16x16
    favicon16 = create_square_icon(source_img, 16)
    favicon16.save(os.path.join(ICONS_DIR, 'favicon-16x16.png'), 'PNG', optimize=True)
    print(f"[OK] 생성됨: favicon-16x16.png")

    print("\n[DONE] 모든 PWA 아이콘이 생성되었습니다!")

if __name__ == '__main__':
    main()

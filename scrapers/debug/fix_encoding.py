import os

TARGET_FILES = [
    r"D:\cbt\koreanews\scrapers\gwangju\gwangju_scraper.py",
    r"D:\cbt\koreanews\scrapers\mokpo\mokpo_scraper.py",
    r"D:\cbt\koreanews\scrapers\naju\naju_scraper.py",
    r"D:\cbt\koreanews\scrapers\suncheon\suncheon_scraper.py"
]

def remove_bom(filepath):
    try:
        # BOM이 있는 파일은 utf-8-sig로 읽으면 자동으로 BOM을 처리해줌
        with open(filepath, 'r', encoding='utf-8-sig') as f:
            content = f.read()
        
        # 다시 utf-8 (BOM 없음)로 저장
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
            
        print(f"[OK] BOM removed: {os.path.basename(filepath)}")
    except Exception as e:
        print(f"[FAIL] {os.path.basename(filepath)}: {e}")

if __name__ == "__main__":
    for f in TARGET_FILES:
        if os.path.exists(f):
            remove_bom(f)
        else:
            print(f"[SKIP] File not found: {f}")


import ast
import traceback
import sys

TARGET_FILES = [
    r'd:\cbt\koreanews\scrapers\hwasun\hwasun_scraper.py',
    r'd:\cbt\koreanews\scrapers\shinan\shinan_scraper.py',
    r'd:\cbt\koreanews\scrapers\jindo\jindo_scraper.py',
    r'd:\cbt\koreanews\scrapers\goheung\goheung_scraper.py',
]

def check_syntax(file_path):
    print(f"Checking {file_path}...")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            source = f.read()
            
        # Parse output to check for SyntaxError/IndentationError
        ast.parse(source)
        print("   [OK] Syntax check passed")
        return True
    except SyntaxError as e:
        print(f"   [ERROR] Syntax Error: {e}")
        return False
    except IndentationError as e:
        print(f"   [ERROR] Indentation Error: {e}")
        return False
    except Exception as e:
        print(f"   [ERROR] Unexpected error: {e}")
        traceback.print_exc()
        return False

if __name__ == '__main__':
    all_pass = True
    for p in TARGET_FILES:
        if not check_syntax(p):
            all_pass = False
            
    if all_pass:
        print("\nAll files passed syntax check.")
        sys.exit(0)
    else:
        print("\nSome files failed syntax check.")
        sys.exit(1)

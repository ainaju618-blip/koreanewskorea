
import ast
import traceback
import sys

TARGET_FILE = r'd:\cbt\koreanews\scrapers\naju\naju_scraper.py'

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
    if check_syntax(TARGET_FILE):
        sys.exit(0)
    else:
        sys.exit(1)

import os
import ast
import sys

SCRAPERS_DIR = r"D:\cbt\koreanews\scrapers"

def check_file_integrity(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            source = f.read()
        
        # 1. Syntax Check
        tree = ast.parse(source)
        
        # 2. Logic Check
        has_error_collector_import = False
        has_error_collector_init = False
        has_image_missing = False
        has_fetch_detail_error_reason = False
        
        for node in ast.walk(tree):
            if isinstance(node, ast.ImportFrom):
                if node.module == 'utils.error_collector' and any(n.name == 'ErrorCollector' for n in node.names):
                    has_error_collector_import = True
            
            if isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name) and node.func.id == 'ErrorCollector':
                    has_error_collector_init = True
            
            if isinstance(node, ast.Attribute):
                if node.attr == 'IMAGE_MISSING':
                    has_image_missing = True

        if "error_reason" in source and "fetch_detail" in source:
             has_fetch_detail_error_reason = True

        return {
            "file": os.path.basename(filepath),
            "status": "OK",
            "msg": "",
            "details": f"{has_error_collector_import},{has_error_collector_init},{has_image_missing},{has_fetch_detail_error_reason}"
        }

    except SyntaxError as e:
        return {
            "file": os.path.basename(filepath),
            "status": "SYNTAX_ERROR",
            "msg": f"Line {e.lineno}: {e.msg}",
            "details": "Fail"
        }
    except Exception as e:
        return {
            "file": os.path.basename(filepath),
            "status": "EXCEPTION",
            "msg": str(e),
            "details": "Fail"
        }

def main():
    print("filename | status | message")
    print("-" * 60)
    for root, dirs, files in os.walk(SCRAPERS_DIR):
        for file in files:
            if file.endswith("_scraper.py") and "debug" not in root:
                filepath = os.path.join(root, file)
                res = check_file_integrity(filepath)
                if res['status'] != 'OK':
                    print(f"{res['file']} | {res['status']} | {res['msg']}")
                elif "False" in res['details']: # Logic fail
                    print(f"{res['file']} | LOGIC_FAIL | {res['details']}")
                else:
                    # PASS
                    pass

if __name__ == "__main__":
    main()

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
            # Check import
            if isinstance(node, ast.ImportFrom):
                if node.module == 'utils.error_collector' and any(n.name == 'ErrorCollector' for n in node.names):
                    has_error_collector_import = True
            
            # Check instantiation: ErrorCollector(...)
            if isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name) and node.func.id == 'ErrorCollector':
                    has_error_collector_init = True
            
            # Check IMAGE_MISSING usage
            if isinstance(node, ast.Attribute):
                if node.attr == 'IMAGE_MISSING':
                    has_image_missing = True

        # Check fetch_detail logic (simple string check for speed/simplicity)
        if "error_reason" in source and "fetch_detail" in source:
             has_fetch_detail_error_reason = True

        return {
            "file": os.path.basename(filepath),
            "syntax": "OK",
            "error_collector_import": has_error_collector_import,
            "error_collector_init": has_error_collector_init,
            "image_missing_logic": has_image_missing,
            "fetch_detail_updated": has_fetch_detail_error_reason
        }

    except SyntaxError as e:
        return {
            "file": os.path.basename(filepath),
            "syntax": f"ERROR: {e}",
            "error_collector_import": False,
            "error_collector_init": False,
            "image_missing_logic": False,
            "fetch_detail_updated": False
        }
    except Exception as e:
        return {
            "file": os.path.basename(filepath),
            "syntax": f"EXCEPTION: {e}",
            "error_collector_import": False,
            "error_collector_init": False,
            "image_missing_logic": False,
            "fetch_detail_updated": False
        }

def main():
    results = []
    for root, dirs, files in os.walk(SCRAPERS_DIR):
        for file in files:
            if file.endswith("_scraper.py") and "debug" not in root:
                filepath = os.path.join(root, file)
                results.append(check_file_integrity(filepath))
    
    # Print Report
    print(f"{'File':<25} | {'Syntax':<10} | {'EC Imp':<8} | {'EC Init':<8} | {'Img Miss':<8} | {'Fetch Upd':<8}")
    print("-" * 80)
    
    failed_count = 0
    for r in results:
        status = r['syntax']
        if len(status) > 10: status = "ERROR"
        
        is_ok = (r['syntax'] == "OK" and 
                 r['error_collector_import'] and 
                 r['error_collector_init'] and 
                 r['image_missing_logic'] and 
                 r['fetch_detail_updated'])
        
        mark = " " if is_ok else "X"
        if not is_ok: failed_count += 1
        
        print(f"{mark} {r['file']:<23} | {status:<10} | {str(r['error_collector_import']):<8} | {str(r['error_collector_init']):<8} | {str(r['image_missing_logic']):<8} | {str(r['fetch_detail_updated']):<8}")

    print("-" * 80)
    if failed_count == 0:
        print("ALL PASSED")
    else:
        print(f"{failed_count} FILES FAILED INTEGRITY CHECK")

if __name__ == "__main__":
    main()

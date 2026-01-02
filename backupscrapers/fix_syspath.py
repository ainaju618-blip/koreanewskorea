# -*- coding: utf-8 -*-
"""스크래퍼 파일들의 sys.path 설정을 수정하는 스크립트"""

import os
import re
import glob

SCRAPERS_DIR = os.path.dirname(os.path.abspath(__file__))

# 현재 경로 패턴 (폴더 안에 있을 때 잘못된 경로)
OLD_PATTERN = r"sys\.path\.insert\(0, os\.path\.dirname\(os\.path\.abspath\(__file__\)\)\)"
# 수정된 경로 패턴 (상위 폴더인 scrapers를 추가)
NEW_PATH = "sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))"

# 모든 스크래퍼 폴더 내의 *_scraper.py 파일 찾기
scraper_folders = [d for d in os.listdir(SCRAPERS_DIR) if os.path.isdir(os.path.join(SCRAPERS_DIR, d)) and not d.startswith(('__', 'backup', 'debug', 'utils', 'docs', 'configs', 'core', 'templates', 'images', 'verified'))]

fixed_count = 0
for folder in scraper_folders:
    folder_path = os.path.join(SCRAPERS_DIR, folder)
    for file in os.listdir(folder_path):
        if file.endswith('_scraper.py'):
            file_path = os.path.join(folder_path, file)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if re.search(OLD_PATTERN, content):
                    new_content = re.sub(OLD_PATTERN, NEW_PATH, content)
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"✅ Fixed: {folder}/{file}")
                    fixed_count += 1
                else:
                    print(f"⏭️  Skip: {folder}/{file} (already fixed or different pattern)")
            except Exception as e:
                print(f"❌ Error: {folder}/{file} - {str(e)}")

print(f"\n🎉 Total fixed: {fixed_count} files")

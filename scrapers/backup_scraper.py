"""
스크래퍼 백업 유틸리티
- *_scraper.py 파일들을 백업 폴더로 복사
- 백업 폴더: scrapers/backup/{YYYY-MM-DD_HHMM}/
"""

import sys
import os
import shutil
from datetime import datetime

def backup_scrapers():
    """모든 스크래퍼 파일을 백업"""
    
    scrapers_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 백업 폴더 생성
    today = datetime.now().strftime('%Y-%m-%d')
    time_suffix = datetime.now().strftime('%H%M')
    
    backup_dir = os.path.join(scrapers_dir, 'backup', f'{today}_{time_suffix}')
    os.makedirs(backup_dir, exist_ok=True)
    
    # *_scraper.py 파일 찾기 및 복사
    copied = 0
    for filename in os.listdir(scrapers_dir):
        if filename.endswith('_scraper.py'):
            source_path = os.path.join(scrapers_dir, filename)
            backup_path = os.path.join(backup_dir, filename)
            
            shutil.copy2(source_path, backup_path)
            copied += 1
            print(f"   [OK] {filename}")
    
    print(f"\n[OK] 백업 완료!")
    print(f"   복사됨: {copied}개 파일")
    print(f"   위치: {backup_dir}")
    
    return backup_dir


def list_backups():
    """기존 백업 목록 표시"""
    scrapers_dir = os.path.dirname(os.path.abspath(__file__))
    backup_root = os.path.join(scrapers_dir, 'backup')
    
    if not os.path.exists(backup_root):
        print("백업 폴더가 없습니다.")
        return
    
    print("[BACKUP] 백업 목록:")
    for date_folder in sorted(os.listdir(backup_root), reverse=True):
        date_path = os.path.join(backup_root, date_folder)
        if os.path.isdir(date_path):
            count = len([f for f in os.listdir(date_path) if f.endswith('.py')])
            print(f"   [DIR] {date_folder} ({count}개 파일)")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--list":
        list_backups()
    else:
        print("[BACKUP] 스크래퍼 백업 시작...")
        backup_scrapers()

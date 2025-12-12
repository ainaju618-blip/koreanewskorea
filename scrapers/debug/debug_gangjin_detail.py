# -*- coding: utf-8 -*-
"""강진군 상세 페이지 본문 품질 확인"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    sys.stdout.reconfigure(encoding='utf-8')
except:
    pass

from playwright.sync_api import sync_playwright
from gangjin.gangjin_scraper import fetch_detail, clean_content

# 테스트 URL (이미지 있는 기사)
TEST_URL = "https://www.gangjin.go.kr/www/government/news/press?idx=647621&mode=view"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    content, thumbnail, date, dept = fetch_detail(page, TEST_URL)

    print("=" * 60)
    print("강진군 상세 페이지 품질 테스트")
    print("=" * 60)
    print(f"\n[날짜] {date}")
    print(f"[담당부서] {dept}")
    print(f"[이미지] {thumbnail}")
    print(f"\n[본문 길이] {len(content) if content else 0}자")

    print("\n" + "=" * 60)
    print("본문 내용 (처음 500자)")
    print("=" * 60)
    if content:
        print(content[:500])
    else:
        print("(본문 없음)")

    # 메타정보 확인
    print("\n" + "=" * 60)
    print("메타정보 포함 여부 확인")
    print("=" * 60)
    if content:
        checks = [
            ("작성자", "작성자" in content),
            ("작성일", "작성일" in content),
            ("조회수", "조회수" in content),
            ("담당부서:", "담당부서" in content and ":" in content),
            ("전화번호", "전화번호" in content),
            ("등록일", "등록일" in content),
            ("첨부파일", "첨부파일" in content),
        ]
        all_clean = True
        for name, found in checks:
            status = "X (포함됨 - 제거 필요)" if found else "O (깨끗)"
            print(f"  {name}: {status}")
            if found:
                all_clean = False

        print("\n" + (">>> 본문 깨끗함!" if all_clean else ">>> 메타정보 제거 필요!"))

    browser.close()

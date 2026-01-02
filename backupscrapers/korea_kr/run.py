# -*- coding: utf-8 -*-
"""
korea.kr Scraper Runner
- Simple script to run the scraper with common options
"""

import sys
import os

# Path setup
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from korea_kr_scraper import collect_articles


def run_quick():
    """Quick run: last 1 day, max 5 articles"""
    print("[MODE] Quick Run (1 day, 5 articles)")
    collect_articles(days=1, max_articles=5, headless=False)


def run_normal():
    """Normal run: last 3 days, max 10 articles"""
    print("[MODE] Normal Run (3 days, 10 articles)")
    collect_articles(days=3, max_articles=10, headless=True)


def run_full():
    """Full run: last 7 days, max 50 articles"""
    print("[MODE] Full Run (7 days, 50 articles)")
    collect_articles(days=7, max_articles=50, headless=True)


def run_visible():
    """Visible run: show browser for debugging"""
    print("[MODE] Visible Run (3 days, 10 articles, browser visible)")
    collect_articles(days=3, max_articles=10, headless=False)


if __name__ == '__main__':
    # Default: quick run for testing
    if len(sys.argv) > 1:
        mode = sys.argv[1].lower()
        if mode == 'quick':
            run_quick()
        elif mode == 'normal':
            run_normal()
        elif mode == 'full':
            run_full()
        elif mode == 'visible':
            run_visible()
        else:
            print(f"Unknown mode: {mode}")
            print("Available modes: quick, normal, full, visible")
    else:
        # Default: quick run
        run_quick()

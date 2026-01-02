"""
Change Detection Module for Smart Scraping
- Detects new articles by comparing IDs
- Updates scraper state in database
- Records publish patterns for adaptive scheduling

Version: 1.0
Created: 2025-12-27
"""

import os
import re
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import httpx

# Supabase client
SUPABASE_URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')


@dataclass
class ArticleInfo:
    """Minimal article info for change detection."""
    id: str
    title: str
    url: str
    date: Optional[str] = None


@dataclass
class ChangeResult:
    """Result of change detection."""
    region_code: str
    has_new_articles: bool
    new_articles: List[ArticleInfo]
    last_known_id: Optional[str]
    checked_at: datetime


class ChangeDetector:
    """
    Detects new articles by comparing with last known state.

    Usage:
        detector = ChangeDetector()

        # Get last known state
        last_id = detector.get_last_article_id('gwangju')

        # After scraping list page, check for new articles
        new_articles = detector.find_new_articles('gwangju', current_articles, last_id)

        # Update state after successful scraping
        if new_articles:
            detector.update_state('gwangju', new_articles[0])
    """

    def __init__(self):
        self.headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json',
        }
        self.base_url = f"{SUPABASE_URL}/rest/v1"

    def get_last_article_id(self, region_code: str) -> Optional[str]:
        """Get the last scraped article ID for a region."""
        try:
            url = f"{self.base_url}/scraper_state"
            params = {
                'select': 'last_article_id,last_article_url',
                'region_code': f'eq.{region_code}',
            }
            response = httpx.get(url, headers=self.headers, params=params, timeout=10)

            if response.status_code == 200:
                data = response.json()
                if data:
                    return data[0].get('last_article_id')
            return None
        except Exception as e:
            print(f"[WARN] Failed to get last article ID for {region_code}: {e}")
            return None

    def find_new_articles(
        self,
        region_code: str,
        current_articles: List[ArticleInfo],
        last_known_id: Optional[str] = None
    ) -> List[ArticleInfo]:
        """
        Find articles that are newer than the last known ID.

        Args:
            region_code: Region code (e.g., 'gwangju')
            current_articles: List of articles from current scrape (newest first)
            last_known_id: Last known article ID (fetched from DB if None)

        Returns:
            List of new articles (newest first)
        """
        if last_known_id is None:
            last_known_id = self.get_last_article_id(region_code)

        if not last_known_id:
            # First run - return only the first article to avoid flooding
            return current_articles[:1] if current_articles else []

        new_articles = []
        for article in current_articles:
            if article.id == last_known_id:
                break
            new_articles.append(article)

        return new_articles

    def update_state(
        self,
        region_code: str,
        latest_article: ArticleInfo,
        increment_count: int = 1
    ) -> bool:
        """
        Update scraper state after successful scraping.

        Args:
            region_code: Region code
            latest_article: The newest article scraped
            increment_count: Number of new articles collected

        Returns:
            True if update successful
        """
        try:
            url = f"{self.base_url}/scraper_state"
            now = datetime.now().isoformat()

            # First, get existing state to accumulate total_articles
            existing_total = 0
            try:
                get_response = httpx.get(
                    url,
                    headers=self.headers,
                    params={
                        'select': 'total_articles',
                        'region_code': f'eq.{region_code}',
                    },
                    timeout=5
                )
                if get_response.status_code == 200:
                    existing_data = get_response.json()
                    if existing_data:
                        existing_total = existing_data[0].get('total_articles', 0) or 0
            except:
                pass  # If lookup fails, start from 0

            # Upsert state with accumulated total
            data = {
                'region_code': region_code,
                'last_article_id': latest_article.id,
                'last_article_url': latest_article.url,
                'last_check_at': now,
                'last_article_at': now,
                'updated_at': now,
                'total_articles': existing_total + increment_count,
            }

            response = httpx.post(
                url,
                headers={
                    **self.headers,
                    'Prefer': 'resolution=merge-duplicates,return=minimal'
                },
                json=data,
                timeout=10
            )

            return response.status_code in (200, 201, 204)

        except Exception as e:
            print(f"[WARN] Failed to update state for {region_code}: {e}")
            return False

    def record_publish_pattern(
        self,
        region_code: str,
        publish_time: Optional[datetime] = None
    ) -> bool:
        """
        Record article publish time for pattern learning.

        Args:
            region_code: Region code
            publish_time: Article publish time (uses current time if None)

        Returns:
            True if recorded successfully
        """
        try:
            if publish_time is None:
                publish_time = datetime.now()

            # Call the database function
            url = f"{self.base_url}/rpc/update_publish_pattern"
            data = {
                'p_region_code': region_code,
                'p_publish_time': publish_time.isoformat(),
            }

            response = httpx.post(
                url,
                headers=self.headers,
                json=data,
                timeout=10
            )

            return response.status_code in (200, 204)

        except Exception as e:
            print(f"[WARN] Failed to record publish pattern for {region_code}: {e}")
            return False

    def update_last_check(self, region_code: str) -> bool:
        """Update last check time without new article."""
        try:
            url = f"{self.base_url}/scraper_state"
            now = datetime.now().isoformat()

            response = httpx.patch(
                url,
                headers={**self.headers, 'Prefer': 'return=minimal'},
                params={'region_code': f'eq.{region_code}'},
                json={'last_check_at': now, 'updated_at': now},
                timeout=10
            )

            return response.status_code in (200, 204)

        except Exception as e:
            print(f"[WARN] Failed to update last check for {region_code}: {e}")
            return False


def extract_article_id(url: str) -> str:
    """
    Extract article ID from various URL patterns.

    Handles patterns like:
    - ?idx=123
    - ?seq=123
    - ?boardSeq=123
    - /view/123
    - /article/123
    """
    patterns = [
        r'[?&]idx=(\d+)',
        r'[?&]seq=(\d+)',
        r'[?&]boardSeq=(\d+)',
        r'[?&]nttId=(\d+)',
        r'[?&]article_id=(\d+)',
        r'/view/(\d+)',
        r'/article/(\d+)',
        r'/(\d+)/?$',
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)

    # Fallback: use URL hash
    import hashlib
    return hashlib.md5(url.encode()).hexdigest()[:12]


# ============================================================
# Convenience functions
# ============================================================
_detector = None

def get_detector() -> ChangeDetector:
    """Get singleton detector instance."""
    global _detector
    if _detector is None:
        _detector = ChangeDetector()
    return _detector


def check_for_new_articles(
    region_code: str,
    current_articles: List[Dict]
) -> Tuple[bool, List[Dict]]:
    """
    Quick check for new articles.

    Args:
        region_code: Region code
        current_articles: List of dicts with 'id', 'title', 'url' keys

    Returns:
        (has_new, new_articles_list)
    """
    detector = get_detector()

    # Convert to ArticleInfo
    articles = [
        ArticleInfo(
            id=a.get('id') or extract_article_id(a.get('url', '')),
            title=a.get('title', ''),
            url=a.get('url', ''),
            date=a.get('date')
        )
        for a in current_articles
    ]

    new_articles = detector.find_new_articles(region_code, articles)

    # Convert back to dicts
    new_dicts = [
        {'id': a.id, 'title': a.title, 'url': a.url, 'date': a.date}
        for a in new_articles
    ]

    return len(new_dicts) > 0, new_dicts

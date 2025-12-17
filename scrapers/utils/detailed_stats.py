"""
Detailed Statistics Output Module for Scrapers

Outputs structured JSON stats that bot-service.ts can parse
for detailed logging in the admin UI.

Usage in scraper:
    from utils.detailed_stats import DetailedStats

    stats = DetailedStats(region_code='gwangju')
    stats.add_article('2024-12-15', status='created', title='Article Title')
    stats.add_article('2024-12-15', status='skipped', title='Duplicate Article')
    stats.add_date_note('2024-12-14', 'No articles found (weekend)')
    stats.output()  # Prints JSON for bot-service.ts to parse
"""

import json
from datetime import datetime
from typing import Dict, List, Optional
from collections import defaultdict


class DetailedStats:
    """
    Collects and outputs detailed scraping statistics.
    """

    def __init__(self, region_code: str, region_name: str = None):
        self.region_code = region_code
        self.region_name = region_name or region_code
        self.start_time = datetime.now()
        self.end_time: Optional[datetime] = None

        # Per-date stats
        self.date_stats: Dict[str, Dict] = defaultdict(lambda: {
            'created': 0,
            'skipped': 0,
            'failed': 0,
            'articles': []
        })

        # Date notes (e.g., "No articles found")
        self.date_notes: Dict[str, str] = {}

        # Overall stats
        self.total_processed = 0
        self.total_created = 0
        self.total_skipped = 0
        self.total_failed = 0

        # Error messages
        self.errors: List[str] = []

    def add_article(
        self,
        date: str,
        status: str,
        title: str = '',
        reason: str = ''
    ):
        """
        Add an article result.

        Args:
            date: Article date (YYYY-MM-DD)
            status: 'created', 'skipped', or 'failed'
            title: Article title (truncated for display)
            reason: Reason for skip/fail
        """
        self.total_processed += 1

        if status == 'created':
            self.total_created += 1
            self.date_stats[date]['created'] += 1
        elif status == 'skipped':
            self.total_skipped += 1
            self.date_stats[date]['skipped'] += 1
        elif status == 'failed':
            self.total_failed += 1
            self.date_stats[date]['failed'] += 1

        # Store article info (truncate title)
        article_info = {
            'status': status,
            'title': title[:30] + '...' if len(title) > 30 else title,
        }
        if reason:
            article_info['reason'] = reason

        self.date_stats[date]['articles'].append(article_info)

    def add_date_note(self, date: str, note: str):
        """
        Add a note for a specific date (e.g., "No articles found").

        Args:
            date: Date (YYYY-MM-DD)
            note: Note message
        """
        self.date_notes[date] = note

    def add_error(self, message: str):
        """
        Add an error message.
        """
        self.errors.append(message)

    def finalize(self):
        """
        Mark stats collection as complete.
        """
        self.end_time = datetime.now()

    def get_summary(self) -> str:
        """
        Get human-readable summary message.
        """
        if self.total_created > 0:
            return f"{self.total_created}건 수집 완료"
        elif self.total_skipped > 0:
            return f"중복 {self.total_skipped}건 (신규 없음)"
        else:
            return "수집된 기사 없음"

    def to_dict(self) -> Dict:
        """
        Convert stats to dictionary for JSON output.
        """
        self.finalize()

        # Build per-date breakdown
        date_breakdown = []
        for date in sorted(self.date_stats.keys(), reverse=True):
            stats = self.date_stats[date]
            date_info = {
                'date': date,
                'created': stats['created'],
                'skipped': stats['skipped'],
                'failed': stats['failed'],
            }

            # Add note if exists
            if date in self.date_notes:
                date_info['note'] = self.date_notes[date]

            # Add sample articles (limit to 5 per date)
            if stats['articles']:
                date_info['articles'] = stats['articles'][:5]

            date_breakdown.append(date_info)

        # Add dates with only notes (no articles)
        for date, note in self.date_notes.items():
            if date not in self.date_stats:
                date_breakdown.append({
                    'date': date,
                    'created': 0,
                    'skipped': 0,
                    'failed': 0,
                    'note': note
                })

        # Sort by date descending
        date_breakdown.sort(key=lambda x: x['date'], reverse=True)

        return {
            'region': self.region_code,
            'region_name': self.region_name,
            'summary': {
                'total_processed': self.total_processed,
                'total_created': self.total_created,
                'total_skipped': self.total_skipped,
                'total_failed': self.total_failed,
                'message': self.get_summary()
            },
            'date_breakdown': date_breakdown,
            'errors': self.errors if self.errors else None,
            'duration_seconds': (self.end_time - self.start_time).total_seconds() if self.end_time else None
        }

    def output(self):
        """
        Print JSON stats for bot-service.ts to parse.

        The output format:
        ===DETAILED_STATS_START===
        { ... JSON ... }
        ===DETAILED_STATS_END===
        """
        stats_json = json.dumps(self.to_dict(), ensure_ascii=False, indent=2)

        # Print with markers that bot-service.ts can parse
        print("\n===DETAILED_STATS_START===")
        print(stats_json)
        print("===DETAILED_STATS_END===\n")

        # Also print human-readable summary (legacy format)
        print(f"[RESULT] {self.region_name}: 신규 {self.total_created}, 중복 {self.total_skipped}, 실패 {self.total_failed}")


# Singleton for easy access in scrapers
_current_stats: Optional[DetailedStats] = None


def init_stats(region_code: str, region_name: str = None) -> DetailedStats:
    """
    Initialize stats collector for a scraper run.
    """
    global _current_stats
    _current_stats = DetailedStats(region_code, region_name)
    return _current_stats


def get_stats() -> Optional[DetailedStats]:
    """
    Get current stats collector.
    """
    return _current_stats

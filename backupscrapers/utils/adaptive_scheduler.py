"""
Adaptive Scheduler for Smart Scraping
- Time-based scheduling with multiple intervals
- Learns from publish patterns

Version: 2.0
Created: 2025-12-27
Updated: 2025-12-27 - Added time-based scheduling
"""

import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set, Tuple
from dataclasses import dataclass, field
import httpx

# Supabase client
SUPABASE_URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')

# ============================================================
# Time-Based Schedule Configuration
# ============================================================
# Format: (start_hour, end_hour, interval_minutes)
# interval_minutes = 0 means STOP (no monitoring)
TIME_SCHEDULES: List[Tuple[int, int, int]] = [
    (9, 18, 30),    # 09:00 ~ 18:00: 30 min interval (business hours)
    (18, 23, 120),  # 18:00 ~ 23:00: 2 hour interval (evening)
    (23, 7, 0),     # 23:00 ~ 07:00: STOP (night - no monitoring)
    (7, 9, 60),     # 07:00 ~ 09:00: 1 hour interval (early morning)
]

# Weekend behavior
WEEKEND_INTERVAL_MINUTES = 120     # 2 hours on weekends

# Learning phase config
PEAK_THRESHOLD_PERCENTILE = 0.7    # Top 30% hours are peak


@dataclass
class RegionSchedule:
    """Schedule information for a single region."""
    region_code: str
    peak_hours: Set[int] = field(default_factory=set)
    last_poll: Optional[datetime] = None
    next_poll: Optional[datetime] = None
    is_learning: bool = True  # True during initial learning phase


@dataclass
class PollDecision:
    """Result of should_poll check."""
    should_poll: bool
    reason: str
    next_check_in_minutes: int
    is_peak: bool


def _get_current_schedule(hour: int) -> Tuple[int, str]:
    """
    Get the current interval based on hour.

    Returns:
        (interval_minutes, reason_description)
        interval_minutes = 0 means STOP (no monitoring)
    """
    for start_h, end_h, interval in TIME_SCHEDULES:
        # Handle overnight ranges (e.g., 23 to 7)
        if start_h > end_h:
            # Overnight: e.g., 23-7 means 23,24(0),1,2,3,4,5,6
            if hour >= start_h or hour < end_h:
                if interval == 0:
                    return (0, "Night hours - no monitoring")
                return (interval, f"Night schedule ({start_h}:00~{end_h}:00)")
        else:
            # Normal range: e.g., 9-18
            if start_h <= hour < end_h:
                if interval == 0:
                    return (0, "Scheduled stop")
                if start_h == 9 and end_h == 18:
                    return (interval, "Business hours (30min interval)")
                elif start_h == 18:
                    return (interval, "Evening (2hr interval)")
                elif start_h == 7:
                    return (interval, "Early morning (1hr interval)")
                return (interval, f"Scheduled ({start_h}:00~{end_h}:00)")

    # Default fallback (should not reach here if TIME_SCHEDULES covers 24h)
    return (60, "Default schedule")


class AdaptiveScheduler:
    """
    Manages polling schedules based on learned patterns.

    Usage:
        scheduler = AdaptiveScheduler()

        # Check if should poll now
        decision = scheduler.should_poll('gwangju')
        if decision.should_poll:
            # Do scraping
            pass

        # After scraping, record the poll
        scheduler.record_poll('gwangju')
    """

    def __init__(self):
        self.headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json',
        }
        self.base_url = f"{SUPABASE_URL}/rest/v1"
        self.schedules: Dict[str, RegionSchedule] = {}
        self._patterns_loaded = False

    def load_patterns(self) -> None:
        """Load all publish patterns from database."""
        try:
            url = f"{self.base_url}/publish_patterns"
            params = {
                'select': 'region_code,hour,article_count',
                'order': 'region_code,hour',
            }
            response = httpx.get(url, headers=self.headers, params=params, timeout=10)

            if response.status_code == 200:
                data = response.json()
                self._process_patterns(data)
                self._patterns_loaded = True
                print(f"[INFO] Loaded patterns for {len(self.schedules)} regions")
            else:
                print(f"[WARN] Failed to load patterns: {response.status_code}")

        except Exception as e:
            print(f"[WARN] Failed to load patterns: {e}")

    def _process_patterns(self, pattern_data: List[Dict]) -> None:
        """Process raw pattern data into schedules."""
        # Group by region
        region_patterns: Dict[str, List[Dict]] = {}
        for p in pattern_data:
            region = p['region_code']
            if region not in region_patterns:
                region_patterns[region] = []
            region_patterns[region].append(p)

        # Calculate peak hours for each region
        for region_code, patterns in region_patterns.items():
            if not patterns:
                continue

            # Calculate threshold (top 30%)
            counts = [p['article_count'] for p in patterns]
            if not counts:
                continue

            sorted_counts = sorted(counts, reverse=True)
            threshold_idx = max(1, int(len(sorted_counts) * (1 - PEAK_THRESHOLD_PERCENTILE)))
            threshold = sorted_counts[min(threshold_idx, len(sorted_counts) - 1)]

            # Find peak hours
            peak_hours = set()
            for p in patterns:
                if p['article_count'] >= threshold:
                    peak_hours.add(p['hour'])

            self.schedules[region_code] = RegionSchedule(
                region_code=region_code,
                peak_hours=peak_hours,
                is_learning=len(patterns) < 50  # Still learning if < 50 data points
            )

    def _ensure_patterns_loaded(self) -> None:
        """Load patterns if not already loaded."""
        if not self._patterns_loaded:
            self.load_patterns()

    def should_poll(self, region_code: str) -> PollDecision:
        """
        Determine if a region should be polled now.

        Args:
            region_code: Region to check

        Returns:
            PollDecision with polling recommendation
        """
        self._ensure_patterns_loaded()

        now = datetime.now()
        current_hour = now.hour
        current_dow = now.weekday()  # 0=Monday, 6=Sunday

        # Get current schedule based on time
        interval, schedule_reason = _get_current_schedule(current_hour)

        # Check if monitoring is stopped (interval = 0)
        if interval == 0:
            # Calculate when monitoring resumes (07:00 next day or today)
            if current_hour >= 23:
                # After 23:00, next start is 07:00 tomorrow
                next_start = now.replace(hour=7, minute=0, second=0, microsecond=0) + timedelta(days=1)
            else:
                # Before 07:00, next start is 07:00 today
                next_start = now.replace(hour=7, minute=0, second=0, microsecond=0)
            minutes_until = int((next_start - now).total_seconds() / 60)

            return PollDecision(
                should_poll=False,
                reason=schedule_reason,
                next_check_in_minutes=minutes_until,
                is_peak=False
            )

        # Check weekend - use longer intervals
        is_weekend = current_dow >= 5  # Saturday or Sunday
        if is_weekend:
            interval = max(interval, WEEKEND_INTERVAL_MINUTES)

        # Get or create schedule for region
        schedule = self.schedules.get(region_code)
        if not schedule:
            schedule = RegionSchedule(region_code=region_code, is_learning=True)
            self.schedules[region_code] = schedule

        # Determine if peak hour (for display purposes)
        is_peak = current_hour in schedule.peak_hours

        # During learning phase, use more frequent polling
        if schedule.is_learning:
            interval = min(interval, 30)  # Max 30 min during learning

        # Check if enough time has passed since last poll
        if schedule.last_poll:
            elapsed = (now - schedule.last_poll).total_seconds() / 60
            if elapsed < interval:
                remaining = int(interval - elapsed)
                return PollDecision(
                    should_poll=False,
                    reason=f"Too soon (wait {remaining} min)",
                    next_check_in_minutes=remaining,
                    is_peak=is_peak
                )

        return PollDecision(
            should_poll=True,
            reason=schedule_reason,
            next_check_in_minutes=interval,
            is_peak=is_peak
        )

    def record_poll(self, region_code: str) -> None:
        """Record that a poll was performed."""
        now = datetime.now()

        if region_code not in self.schedules:
            self.schedules[region_code] = RegionSchedule(region_code=region_code)

        self.schedules[region_code].last_poll = now

    def get_next_poll_time(self, region_code: str) -> Optional[datetime]:
        """Get the next recommended poll time for a region."""
        decision = self.should_poll(region_code)
        if decision.should_poll:
            return datetime.now()
        return datetime.now() + timedelta(minutes=decision.next_check_in_minutes)

    def get_all_due_regions(self, regions: List[str]) -> List[str]:
        """
        Get list of regions that should be polled now.

        Args:
            regions: List of all region codes to check

        Returns:
            List of region codes that are due for polling
        """
        due = []
        for region in regions:
            decision = self.should_poll(region)
            if decision.should_poll:
                due.append(region)
        return due

    def get_schedule_summary(self) -> Dict[str, Dict]:
        """Get summary of all region schedules for debugging."""
        self._ensure_patterns_loaded()

        summary = {}
        for region_code, schedule in self.schedules.items():
            summary[region_code] = {
                'peak_hours': sorted(list(schedule.peak_hours)),
                'is_learning': schedule.is_learning,
                'last_poll': schedule.last_poll.isoformat() if schedule.last_poll else None,
            }
        return summary


# ============================================================
# Singleton instance
# ============================================================
_scheduler = None


def get_scheduler() -> AdaptiveScheduler:
    """Get singleton scheduler instance."""
    global _scheduler
    if _scheduler is None:
        _scheduler = AdaptiveScheduler()
    return _scheduler


def get_regions_to_poll(regions: List[str]) -> List[str]:
    """Quick function to get regions due for polling."""
    return get_scheduler().get_all_due_regions(regions)


# ============================================================
# CLI for debugging
# ============================================================
if __name__ == '__main__':
    import json

    scheduler = AdaptiveScheduler()
    scheduler.load_patterns()

    print("\n=== Schedule Summary ===")
    print(json.dumps(scheduler.get_schedule_summary(), indent=2, ensure_ascii=False))

    # Test regions
    test_regions = ['gwangju', 'jeonnam', 'mokpo', 'yeosu']
    print("\n=== Poll Decisions ===")
    for region in test_regions:
        decision = scheduler.should_poll(region)
        print(f"{region}: poll={decision.should_poll}, reason={decision.reason}, "
              f"next_in={decision.next_check_in_minutes}min, peak={decision.is_peak}")

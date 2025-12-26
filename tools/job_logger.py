"""
Job Logger Module for Real-time Monitoring
- Creates job sessions
- Logs detailed progress to Supabase
- Enables real-time monitoring via Supabase Realtime

Usage:
    from job_logger import JobLogger

    logger = JobLogger(supabase_client)
    session_id = logger.start_session('scheduled')

    logger.log_scraping_start('gwangju')
    logger.log_article_collected('gwangju', 'Article title...')
    logger.log_article_skipped('gwangju', 'Article title...', 'duplicate')
    ...

    logger.end_session()
"""

import os
import sys
from datetime import datetime
from typing import Optional, Dict, Any, List
import json

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)


class JobLogger:
    """Real-time job logging to Supabase for monitoring"""

    # Batch insert buffer size (reduces DB calls by ~95%)
    BATCH_SIZE = 20

    def __init__(self, supabase_client):
        self.supabase = supabase_client
        self.session_id: Optional[str] = None
        self.start_time: Optional[datetime] = None

        # Batch logging buffer
        self._log_buffer: List[Dict] = []

        # Stats tracking
        self.stats = {
            'scraping': {
                'total_regions': 0,
                'success': 0,
                'failed': 0,
                'skipped': 0,
                'articles_collected': 0,
                'articles_duplicate': 0,
            },
            'ai': {
                'total': 0,
                'processed': 0,
                'grade_a': 0,
                'grade_b': 0,
                'grade_c': 0,
                'grade_d': 0,
                'published': 0,
            },
            'errors': 0
        }

    # =========================================================================
    # Session Management
    # =========================================================================

    def start_session(self, trigger_type: str = 'scheduled') -> str:
        """Start a new job session"""
        self.start_time = datetime.now()

        try:
            result = self.supabase.table('job_sessions').insert({
                'trigger_type': trigger_type,
                'status': 'running',
                'started_at': self.start_time.isoformat()
            }).execute()

            self.session_id = result.data[0]['id']

            # Log session start
            self._log('system', None, 'info', 'session_start',
                     f'Job session started (trigger: {trigger_type})')

            return self.session_id

        except Exception as e:
            print(f"[JobLogger] Failed to start session: {e}")
            return None

    def end_session(self, status: str = 'completed'):
        """End the current job session with final stats"""
        if not self.session_id:
            return

        # Flush any remaining buffered logs before ending session
        self._flush_logs()

        end_time = datetime.now()
        duration = int((end_time - self.start_time).total_seconds()) if self.start_time else 0

        try:
            self.supabase.table('job_sessions').update({
                'status': status,
                'ended_at': end_time.isoformat(),
                'total_duration_seconds': duration,

                # Scraping stats
                'scraping_total_regions': self.stats['scraping']['total_regions'],
                'scraping_success': self.stats['scraping']['success'],
                'scraping_failed': self.stats['scraping']['failed'],
                'scraping_skipped': self.stats['scraping']['skipped'],
                'scraping_articles_collected': self.stats['scraping']['articles_collected'],
                'scraping_articles_duplicate': self.stats['scraping']['articles_duplicate'],

                # AI stats
                'ai_total_articles': self.stats['ai']['total'],
                'ai_processed': self.stats['ai']['processed'],
                'ai_grade_a': self.stats['ai']['grade_a'],
                'ai_grade_b': self.stats['ai']['grade_b'],
                'ai_grade_c': self.stats['ai']['grade_c'],
                'ai_grade_d': self.stats['ai']['grade_d'],
                'ai_published': self.stats['ai']['published'],

                'error_count': self.stats['errors']
            }).eq('id', self.session_id).execute()

            # Log session end
            self._log('system', None, 'info', 'session_end',
                     f'Job session ended ({status}) - Duration: {duration}s')

        except Exception as e:
            print(f"[JobLogger] Failed to end session: {e}")

    # =========================================================================
    # Core Logging Method (with batch buffering)
    # =========================================================================

    def _flush_logs(self):
        """Flush buffered logs to database (batch insert)"""
        if not self._log_buffer:
            return

        try:
            self.supabase.table('job_logs').insert(self._log_buffer).execute()
            self._log_buffer = []
        except Exception as e:
            print(f"[JobLogger] Failed to flush logs: {e}")
            # Keep buffer for retry or lose it to prevent memory buildup
            self._log_buffer = []

    def _log(self, phase: str, region: Optional[str], level: str,
             log_type: str, message: str, **kwargs):
        """Internal method to buffer log entry (batch insert for efficiency)"""
        if not self.session_id:
            print(f"[JobLogger] No session - {phase}/{log_type}: {message}")
            return

        try:
            log_entry = {
                'session_id': self.session_id,
                'phase': phase,
                'region': region,
                'log_level': level,
                'log_type': log_type,
                'message': message,
                'created_at': datetime.now().isoformat()
            }

            # Add optional fields
            for key in ['article_count', 'skip_reason', 'article_id',
                       'article_title', 'ai_attempt', 'ai_grade', 'ai_score',
                       'layer_results', 'duration_ms', 'metadata']:
                if key in kwargs and kwargs[key] is not None:
                    log_entry[key] = kwargs[key]

            # Add to buffer instead of immediate insert
            self._log_buffer.append(log_entry)

            # Flush when buffer reaches batch size
            if len(self._log_buffer) >= self.BATCH_SIZE:
                self._flush_logs()

        except Exception as e:
            print(f"[JobLogger] Failed to log: {e}")

    # =========================================================================
    # Phase 1: Scraping Logs
    # =========================================================================

    def log_scraping_start(self, region: str):
        """Log scraping start for a region"""
        self.stats['scraping']['total_regions'] += 1
        self._log('scraping', region, 'info', 'scraping_start',
                 f'{region} scraping started')

    def log_scraping_page(self, region: str, current: int, total: int):
        """Log page loading progress"""
        self._log('scraping', region, 'debug', 'page_loading',
                 f'Loading page {current}/{total}')

    def log_article_collected(self, region: str, title: str, article_id: str = None):
        """Log successful article collection"""
        self.stats['scraping']['articles_collected'] += 1
        self._log('scraping', region, 'info', 'article_collected',
                 f'Collected: "{title[:50]}..."',
                 article_id=article_id, article_title=title)

    def log_article_skipped(self, region: str, title: str, reason: str,
                           extra_info: str = None):
        """Log skipped article with reason"""
        if reason == 'duplicate':
            self.stats['scraping']['articles_duplicate'] += 1
        else:
            self.stats['scraping']['skipped'] += 1

        message = f'Skipped: "{title[:40]}..." - {reason}'
        if extra_info:
            message += f' ({extra_info})'

        self._log('scraping', region, 'info', f'skip_{reason}',
                 message, skip_reason=reason, article_title=title)

    def log_scraping_complete(self, region: str, collected: int,
                             duplicates: int, skipped: int, failed: int,
                             duration_seconds: int = None):
        """Log scraping completion for a region"""
        self.stats['scraping']['success'] += 1

        message = (f'{region} complete: {collected} collected, '
                  f'{duplicates} duplicates, {skipped} skipped, {failed} failed')

        self._log('scraping', region, 'info', 'scraping_complete',
                 message, article_count=collected,
                 duration_ms=duration_seconds * 1000 if duration_seconds else None,
                 metadata={
                     'collected': collected,
                     'duplicates': duplicates,
                     'skipped': skipped,
                     'failed': failed
                 })

    def log_scraping_error(self, region: str, error_type: str, message: str):
        """Log scraping error"""
        self.stats['scraping']['failed'] += 1
        self.stats['errors'] += 1

        self._log('scraping', region, 'error', f'error_{error_type}',
                 f'Error: {message}')

    # =========================================================================
    # Phase 2: AI Processing Logs
    # =========================================================================

    def log_ai_phase_start(self, total_articles: int):
        """Log AI processing phase start"""
        self.stats['ai']['total'] = total_articles
        self._log('ai_processing', None, 'info', 'ai_phase_start',
                 f'AI processing started: {total_articles} articles pending')

    def log_ai_article_start(self, region: str, article_id: str, title: str,
                            index: int, total: int):
        """Log start of AI processing for an article"""
        self._log('ai_processing', region, 'info', 'ai_article_start',
                 f'[{index}/{total}] Processing: "{title[:50]}..."',
                 article_id=article_id, article_title=title)

    def log_ai_layer1_2(self, region: str, article_id: str,
                        original_facts: Dict, converted_facts: Dict,
                        missing: List, added: List, passed: bool):
        """Log Layer 1 & 2 results (fact extraction and comparison)"""

        status = 'pass' if passed else 'fail'
        message = (f'Layer 1&2: Numbers {len(original_facts.get("numbers", []))}, '
                  f'Dates {len(original_facts.get("dates", []))}, '
                  f'Names {len(original_facts.get("names", []))} | '
                  f'Missing: {len(missing)}, Added: {len(added)}')

        layer_results = {
            'layer1_2': {
                'original_facts': original_facts,
                'converted_facts': converted_facts,
                'missing': missing,
                'added': added,
                'passed': passed
            }
        }

        self._log('ai_processing', region, 'info', f'layer1_2_{status}',
                 message, article_id=article_id, layer_results=layer_results)

    def log_ai_layer3_start(self, region: str, article_id: str):
        """Log Layer 3 start (hallucination detection)"""
        self._log('ai_processing', region, 'debug', 'layer3_start',
                 'Layer 3: Hallucination detection starting (Ollama)...',
                 article_id=article_id)

    def log_ai_layer3(self, region: str, article_id: str,
                     hallucinations: List, llm_response: str, passed: bool):
        """Log Layer 3 results"""
        status = 'pass' if passed else 'fail'

        if passed:
            message = 'Layer 3: No hallucination detected'
        else:
            message = f'Layer 3: Hallucination detected - {len(hallucinations)} issues'

        layer_results = {
            'layer3': {
                'hallucinations': hallucinations,
                'llm_response': llm_response[:500] if llm_response else '',
                'passed': passed
            }
        }

        self._log('ai_processing', region, 'info', f'layer3_{status}',
                 message, article_id=article_id, layer_results=layer_results)

    def log_ai_layer4_start(self, region: str, article_id: str):
        """Log Layer 4 start (cross-validation)"""
        self._log('ai_processing', region, 'debug', 'layer4_start',
                 'Layer 4: Cross-validation starting (Ollama)...',
                 article_id=article_id)

    def log_ai_layer4(self, region: str, article_id: str,
                     accuracy: int, completeness: int, no_additions: int,
                     total_score: int, issues: List, passed: bool):
        """Log Layer 4 results"""
        status = 'pass' if passed else 'fail'
        message = f'Layer 4: Score {total_score}/100 (Acc:{accuracy}/40, Comp:{completeness}/30, NoAdd:{no_additions}/30)'

        layer_results = {
            'layer4': {
                'accuracy': accuracy,
                'completeness': completeness,
                'no_additions': no_additions,
                'total': total_score,
                'issues': issues,
                'passed': passed
            }
        }

        self._log('ai_processing', region, 'info', f'layer4_{status}',
                 message, article_id=article_id, ai_score=total_score,
                 layer_results=layer_results)

    def log_ai_layer5(self, region: str, article_id: str,
                     original_length: int, converted_length: int,
                     ratio: float, passed: bool):
        """Log Layer 5 results (length verification)"""
        status = 'pass' if passed else 'fail'
        percentage = int(ratio * 100)
        message = f'Layer 5: Length {percentage}% ({converted_length}/{original_length} chars)'

        layer_results = {
            'layer5': {
                'original_length': original_length,
                'converted_length': converted_length,
                'ratio': ratio,
                'passed': passed
            }
        }

        self._log('ai_processing', region, 'info', f'layer5_{status}',
                 message, article_id=article_id, layer_results=layer_results)

    def log_ai_retry(self, region: str, article_id: str,
                    attempt: int, max_attempts: int, reason: str):
        """Log retry attempt"""
        message = f'Retry {attempt}/{max_attempts}: {reason}'
        self._log('ai_processing', region, 'warning', 'ai_retry',
                 message, article_id=article_id, ai_attempt=attempt)

    def log_ai_result(self, region: str, article_id: str, title: str,
                     grade: str, published: bool, attempts: int,
                     duration_ms: int, reason: str = None):
        """Log final AI processing result"""
        self.stats['ai']['processed'] += 1

        grade_key = f'grade_{grade.lower()}'
        if grade_key in self.stats['ai']:
            self.stats['ai'][grade_key] += 1

        if published:
            self.stats['ai']['published'] += 1
            status_text = 'Published'
            log_type = 'ai_published'
        else:
            status_text = 'Draft (manual review)'
            log_type = 'ai_draft'

        message = f'Grade {grade} -> {status_text}'
        if reason:
            message += f' ({reason})'
        message += f' [Attempts: {attempts}, Time: {duration_ms}ms]'

        self._log('ai_processing', region, 'info', log_type,
                 message, article_id=article_id, article_title=title,
                 ai_grade=grade, ai_attempt=attempts, duration_ms=duration_ms)

    def log_ai_error(self, region: str, article_id: str,
                    error_type: str, message: str):
        """Log AI processing error"""
        self.stats['errors'] += 1
        self._log('ai_processing', region, 'error', f'ai_error_{error_type}',
                 f'Error: {message}', article_id=article_id)

    def log_ai_phase_complete(self, duration_seconds: int):
        """Log AI processing phase completion"""
        stats = self.stats['ai']
        message = (f'AI processing complete: {stats["processed"]}/{stats["total"]} processed, '
                  f'Grade A: {stats["grade_a"]}, B: {stats["grade_b"]}, '
                  f'C: {stats["grade_c"]}, D: {stats["grade_d"]}, '
                  f'Published: {stats["published"]}')

        self._log('ai_processing', None, 'info', 'ai_phase_complete',
                 message, duration_ms=duration_seconds * 1000,
                 metadata=stats)

    # =========================================================================
    # Utility Methods
    # =========================================================================

    def get_session_id(self) -> Optional[str]:
        """Get current session ID"""
        return self.session_id

    def get_stats(self) -> Dict:
        """Get current stats"""
        return self.stats


# Singleton instance for easy import
_logger_instance: Optional[JobLogger] = None

def get_logger(supabase_client=None) -> JobLogger:
    """Get or create logger instance"""
    global _logger_instance

    if _logger_instance is None and supabase_client is not None:
        _logger_instance = JobLogger(supabase_client)

    return _logger_instance

def reset_logger():
    """Reset logger instance"""
    global _logger_instance
    _logger_instance = None

"""
Korea NEWS - Batch Article Processor
Processes articles from Supabase DB using local Ollama

Features:
- Batch processing (handles 2000+ articles)
- Supabase DB integration
- 3-stage AI processing with hallucination check
- Progress tracking and logging
"""

import os
import sys
import time
import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from supabase import create_client, Client
from article_processor import ArticleProcessor, ProcessingResult

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('batch_processor.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


@dataclass
class BatchConfig:
    """Configuration for batch processing"""
    batch_size: int = 50  # Articles per batch
    delay_between_articles: float = 0.5  # Seconds between articles
    delay_between_batches: float = 5.0  # Seconds between batches
    max_retries: int = 3  # Retries for failed articles
    status_filter: str = "draft"  # Only process draft articles
    model: str = "qwen3:14b"  # Ollama model to use (upgraded 2025)


class BatchProcessor:
    """Batch processor for articles using Supabase and Ollama"""

    def __init__(self, config: BatchConfig = None):
        self.config = config or BatchConfig()

        # Initialize Supabase client
        supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            raise ValueError("Missing Supabase credentials in environment variables")

        self.supabase: Client = create_client(supabase_url, supabase_key)

        # Initialize AI processor
        self.ai_processor = ArticleProcessor(model=self.config.model)

        # Statistics
        self.stats = {
            "total": 0,
            "processed": 0,
            "success": 0,
            "failed": 0,
            "hallucination_detected": 0,
            "start_time": None,
            "end_time": None
        }

    def get_pending_articles(self, limit: int = None) -> List[Dict]:
        """Fetch articles that need AI processing"""
        query = self.supabase.table("posts") \
            .select("id, title, content, source, region, original_link") \
            .eq("status", self.config.status_filter) \
            .eq("ai_processed", False) \
            .order("created_at", desc=False)

        if limit:
            query = query.limit(limit)

        response = query.execute()
        return response.data if response.data else []

    def update_article(self, article_id: str, updates: Dict) -> bool:
        """Update article in database"""
        try:
            self.supabase.table("posts") \
                .update(updates) \
                .eq("id", article_id) \
                .execute()
            return True
        except Exception as e:
            logger.error(f"Failed to update article {article_id}: {e}")
            return False

    def determine_grade(self, result: ProcessingResult) -> str:
        """Determine AI validation grade based on processing result"""
        if result.has_hallucination:
            return "C"  # Needs review

        # Check if verification passed
        verification = result.stage3_verification.lower()
        if "통과" in verification and "수정필요" not in verification:
            return "A"  # Perfect
        elif "수정필요" in verification:
            return "B"  # Minor issues
        else:
            return "B"  # Default to B

    def extract_warnings(self, result: ProcessingResult) -> List[str]:
        """Extract warnings from verification result"""
        warnings = []

        if result.has_hallucination:
            warnings.append("Hallucination detected - using Stage 1 result")

        verification = result.stage3_verification

        # Check for specific issues
        if "날짜 일치: X" in verification:
            warnings.append("Date mismatch detected")
        if "숫자 일치: X" in verification:
            warnings.append("Number mismatch detected")
        if "이름 일치: X" in verification:
            warnings.append("Name mismatch detected")
        if "추가된 내용: 있음" in verification:
            warnings.append("Additional content detected")

        return warnings

    def process_single_article(self, article: Dict) -> bool:
        """Process a single article through 3-stage AI pipeline"""
        article_id = article["id"]
        title = article.get("title", "Untitled")
        content = article.get("content", "")

        if not content:
            logger.warning(f"Article {article_id} has no content, skipping")
            return False

        try:
            logger.info(f"Processing: {title[:50]}...")

            # Run 3-stage processing
            result = self.ai_processor.process_article(content)

            # Determine grade and warnings
            grade = self.determine_grade(result)
            warnings = self.extract_warnings(result)

            # Prepare update data
            updates = {
                "content": result.final_article,  # Use processed content
                "ai_summary": result.stage1_converted[:500] if result.stage1_converted else None,
                "ai_processed": True,
                "ai_processed_at": datetime.now(timezone.utc).isoformat(),
                "ai_validation_grade": grade,
                "ai_validation_warnings": warnings if warnings else None
            }

            # Update database
            if self.update_article(article_id, updates):
                self.stats["success"] += 1
                if result.has_hallucination:
                    self.stats["hallucination_detected"] += 1
                logger.info(f"Success: {title[:50]} (Grade: {grade})")
                return True
            else:
                self.stats["failed"] += 1
                return False

        except Exception as e:
            logger.error(f"Error processing article {article_id}: {e}")
            self.stats["failed"] += 1
            return False

    def run(self, limit: int = None):
        """Run batch processing"""
        self.stats["start_time"] = datetime.now()

        logger.info("=" * 60)
        logger.info("Korea NEWS - Batch Article Processor")
        logger.info(f"Model: {self.config.model}")
        logger.info(f"Batch size: {self.config.batch_size}")
        logger.info("=" * 60)

        # Fetch pending articles
        articles = self.get_pending_articles(limit)
        self.stats["total"] = len(articles)

        if not articles:
            logger.info("No pending articles to process")
            return

        logger.info(f"Found {len(articles)} articles to process")

        # Process in batches
        for i in range(0, len(articles), self.config.batch_size):
            batch = articles[i:i + self.config.batch_size]
            batch_num = i // self.config.batch_size + 1
            total_batches = (len(articles) + self.config.batch_size - 1) // self.config.batch_size

            logger.info(f"\n--- Batch {batch_num}/{total_batches} ---")

            for article in batch:
                self.stats["processed"] += 1
                self.process_single_article(article)

                # Progress update
                progress = (self.stats["processed"] / self.stats["total"]) * 100
                logger.info(f"Progress: {self.stats['processed']}/{self.stats['total']} ({progress:.1f}%)")

                # Delay between articles
                time.sleep(self.config.delay_between_articles)

            # Delay between batches
            if i + self.config.batch_size < len(articles):
                logger.info(f"Batch complete. Waiting {self.config.delay_between_batches}s...")
                time.sleep(self.config.delay_between_batches)

        self.stats["end_time"] = datetime.now()
        self._print_summary()

    def _print_summary(self):
        """Print processing summary"""
        duration = self.stats["end_time"] - self.stats["start_time"]

        logger.info("\n" + "=" * 60)
        logger.info("PROCESSING COMPLETE")
        logger.info("=" * 60)
        logger.info(f"Total articles: {self.stats['total']}")
        logger.info(f"Processed: {self.stats['processed']}")
        logger.info(f"Success: {self.stats['success']}")
        logger.info(f"Failed: {self.stats['failed']}")
        logger.info(f"Hallucinations detected: {self.stats['hallucination_detected']}")
        logger.info(f"Duration: {duration}")
        logger.info(f"Average time per article: {duration.total_seconds() / max(self.stats['processed'], 1):.2f}s")
        logger.info("=" * 60)


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description="Batch process articles with AI")
    parser.add_argument("--limit", type=int, help="Limit number of articles to process")
    parser.add_argument("--batch-size", type=int, default=50, help="Articles per batch")
    parser.add_argument("--model", type=str, default="qwen3:14b", help="Ollama model to use")
    parser.add_argument("--status", type=str, default="draft", help="Article status to process")

    args = parser.parse_args()

    config = BatchConfig(
        batch_size=args.batch_size,
        model=args.model,
        status_filter=args.status
    )

    processor = BatchProcessor(config)
    processor.run(limit=args.limit)


if __name__ == "__main__":
    main()

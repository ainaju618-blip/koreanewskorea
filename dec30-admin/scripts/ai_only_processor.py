"""
12월30일버젼 - AI Only Processor
Separated from scraping logic, uses existing ArticleProcessor

Usage:
    python ai_only_processor.py --limit 10
    python ai_only_processor.py --article-ids id1,id2,id3
"""

import os
import sys
import json
import argparse
from datetime import datetime
from typing import List, Optional

import requests
from supabase import create_client, Client

# Add parent scripts folder to path for ArticleProcessor
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'scripts'))

from article_processor import ArticleProcessor, ProcessingResult


class AIOnlyProcessor:
    """AI-only article processor using Supabase and Ollama"""

    def __init__(self, model: str = "qwen3:14b"):
        # Supabase setup
        supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            raise ValueError("Missing Supabase environment variables")

        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.processor = ArticleProcessor(model=model)
        self.log_entries: List[str] = []

    def log(self, message: str, level: str = "info"):
        """Add log entry"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        entry = f"[{timestamp}] [{level.upper()}] {message}"
        self.log_entries.append(entry)
        print(entry)

    def check_ollama_status(self) -> bool:
        """Check if Ollama is running"""
        try:
            response = requests.get("http://localhost:11434/api/tags", timeout=5)
            return response.status_code == 200
        except:
            return False

    def get_unprocessed_articles(self, limit: int = 10) -> List[dict]:
        """Get articles that haven't been AI processed"""
        try:
            result = self.supabase.table('posts') \
                .select('id, title, content, region, source_url') \
                .eq('ai_processed', False) \
                .order('created_at', desc=True) \
                .limit(limit) \
                .execute()
            return result.data or []
        except Exception as e:
            self.log(f"Error fetching articles: {e}", "error")
            return []

    def get_articles_by_ids(self, article_ids: List[str]) -> List[dict]:
        """Get specific articles by IDs"""
        try:
            result = self.supabase.table('posts') \
                .select('id, title, content, region, source_url') \
                .in_('id', article_ids) \
                .execute()
            return result.data or []
        except Exception as e:
            self.log(f"Error fetching articles: {e}", "error")
            return []

    def process_article(self, article: dict) -> Optional[ProcessingResult]:
        """Process a single article through AI"""
        try:
            content = article.get('content', '')
            if not content:
                self.log(f"Article {article['id']} has no content", "warning")
                return None

            result = self.processor.process_article(content)
            return result
        except Exception as e:
            self.log(f"Error processing article {article['id']}: {e}", "error")
            return None

    def update_article(self, article_id: str, result: ProcessingResult) -> bool:
        """Update article with AI processed content"""
        try:
            update_data = {
                'content': result.final_article,
                'ai_processed': True,
                'ai_processed_at': datetime.now().isoformat(),
                'ai_has_hallucination': result.has_hallucination,
            }

            self.supabase.table('posts') \
                .update(update_data) \
                .eq('id', article_id) \
                .execute()

            return True
        except Exception as e:
            self.log(f"Error updating article {article_id}: {e}", "error")
            return False

    def run(self, limit: int = 10, article_ids: Optional[List[str]] = None) -> dict:
        """Run AI processing"""
        self.log("Starting AI processing...")

        # Check Ollama
        if not self.check_ollama_status():
            self.log("Ollama is not running! Please start Ollama first.", "error")
            return {
                "success": False,
                "error": "Ollama not running",
                "processed": 0,
                "logs": self.log_entries
            }

        self.log("Ollama connection OK")

        # Get articles
        if article_ids:
            articles = self.get_articles_by_ids(article_ids)
            self.log(f"Fetched {len(articles)} specified articles")
        else:
            articles = self.get_unprocessed_articles(limit)
            self.log(f"Found {len(articles)} unprocessed articles")

        if not articles:
            self.log("No articles to process")
            return {
                "success": True,
                "processed": 0,
                "logs": self.log_entries
            }

        # Process each article
        processed = 0
        errors = 0

        for i, article in enumerate(articles, 1):
            title = article.get('title', 'Unknown')[:30]
            self.log(f"Processing {i}/{len(articles)}: {title}...")

            result = self.process_article(article)

            if result:
                if self.update_article(article['id'], result):
                    processed += 1
                    status = "with hallucination" if result.has_hallucination else "OK"
                    self.log(f"  Completed: {status}", "success")
                else:
                    errors += 1
                    self.log(f"  Failed to save", "error")
            else:
                errors += 1
                self.log(f"  Failed to process", "error")

        self.log(f"Processing complete: {processed} success, {errors} errors")

        return {
            "success": True,
            "processed": processed,
            "errors": errors,
            "total": len(articles),
            "logs": self.log_entries
        }


def main():
    parser = argparse.ArgumentParser(description="AI Article Processor")
    parser.add_argument("--limit", type=int, default=10, help="Number of articles to process")
    parser.add_argument("--article-ids", type=str, help="Comma-separated article IDs")
    parser.add_argument("--model", type=str, default="qwen3:14b", help="Ollama model to use")
    args = parser.parse_args()

    article_ids = None
    if args.article_ids:
        article_ids = [id.strip() for id in args.article_ids.split(",")]

    processor = AIOnlyProcessor(model=args.model)
    result = processor.run(limit=args.limit, article_ids=article_ids)

    print("\n" + "=" * 50)
    print("RESULT:")
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()

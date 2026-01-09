"""
AI Rewriter Utility for Python Scrapers

This module provides functions to call the Korea NEWS AI rewriting API
from Python scrapers for automatic article reprocessing.

It replaces the legacy OpenAI direct integration with a centralized
Next.js API call approach, supporting Gemini, Claude, and Grok.

Usage:
    from utils.ai_rewriter import rewrite_article, check_ai_enabled

    # Check if AI is enabled for a source
    if await check_ai_enabled(source_code):
        rewritten = await rewrite_article(original_body)
        article['body'] = rewritten

Last updated: 2025-12-22
"""

import httpx
import asyncio
from typing import Optional
import logging
import os

logger = logging.getLogger(__name__)

# Base URL for the AI rewrite API
# Default to localhost if not specified in environment
API_BASE_URL = os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:3001")


async def rewrite_article(
    body: str,
    style: str = "news",
    timeout: float = 60.0,
    provider: Optional[str] = None
) -> str:
    """
    Send article body to AI rewriting API and return rewritten content.
    
    Args:
        body: Original article body text
        style: Rewriting style ('news', 'summary', or 'general')
        timeout: Request timeout in seconds
        provider: Optional specific provider ('gemini', 'claude', 'grok')
                  If None, uses system default.
    
    Returns:
        Rewritten article body, or original body if API fails
    """
    if not body or len(body.strip()) < 50:
        logger.debug("[AI Rewriter] Body too short, skipping rewrite")
        return body
    
    try:
        # Prepare payload
        payload = {
            "text": body,
            "style": style
        }
        if provider:
            payload["provider"] = provider

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{API_BASE_URL}/api/ai/rewrite",
                json=payload,
                timeout=timeout
            )
            
            if response.status_code == 200:
                data = response.json()
                rewritten = data.get("rewritten", body)
                used_provider = data.get("provider")
                
                if used_provider:
                    logger.info(f"[AI Rewriter] Successfully rewritten using {used_provider}")
                else:
                    logger.info("[AI Rewriter] Returned original (no API key/provider configured)")
                
                return rewritten
            else:
                try:
                    error_msg = response.json().get('error', response.text)
                except:
                    error_msg = response.text
                logger.warning(f"[AI Rewriter] API error ({response.status_code}): {error_msg}")
                return body
                
    except httpx.TimeoutException:
        logger.warning(f"[AI Rewriter] Request timed out after {timeout}s")
        return body
    except httpx.RequestError as e:
        logger.warning(f"[AI Rewriter] Request failed: {e}")
        return body
    except Exception as e:
        logger.error(f"[AI Rewriter] Unexpected error: {e}")
        return body


async def check_ai_enabled(source_code: str) -> bool:
    """
    Check if AI rewriting is enabled for a specific source.
    
    Args:
        source_code: The source identifier (e.g., 'gwangju', 'suncheon')
    
    Returns:
        True if AI rewriting is enabled for this source
    """
    # NOTE: Ideally this should verify against the unified settings API
    # For now, it defaults to False (safe default) or checks a local config if needed.
    # To enable globally for testing, you might return True temporarily.
    
    # Example logic:
    # 1. Call /api/admin/sources/check-ai?code={source_code}
    # 2. Or check a local cached config
    
    return False


def rewrite_article_sync(
    body: str,
    style: str = "news",
    provider: Optional[str] = None
) -> str:
    """
    Synchronous wrapper for rewrite_article.
    Use this in non-async contexts.
    """
    return asyncio.run(rewrite_article(body, style, provider=provider))

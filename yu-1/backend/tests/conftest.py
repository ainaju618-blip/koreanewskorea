"""
Pytest configuration and fixtures for async testing.
"""
import pytest
import asyncio
import sys
from typing import Generator

# Windows asyncio 호환성
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def divination_service():
    """Provide a fresh DivinationService instance for each test."""
    from app.services.divination import DivinationService
    return DivinationService()


@pytest.fixture
async def async_client():
    """Async HTTP client for API testing."""
    from httpx import AsyncClient, ASGITransport
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.fixture
def category_matcher():
    """Category matcher instance."""
    from app.services.category_matcher import category_matcher
    category_matcher._ensure_loaded()
    return category_matcher


@pytest.fixture
def hexagram_repository():
    """Hexagram repository instance."""
    from app.repositories.hexagram_repository import hexagram_repository
    return hexagram_repository


@pytest.fixture
def yao_repository():
    """Yao repository instance."""
    from app.repositories.yao_repository import yao_repository
    return yao_repository

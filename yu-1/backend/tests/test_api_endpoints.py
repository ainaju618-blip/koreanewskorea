"""
API 엔드포인트 테스트

테스트 범위:
- GET /api/divination 엔드포인트
- POST /api/divination/cast 엔드포인트
- GET /api/divination/categories 엔드포인트
- 입력 검증
- 오류 처리
"""
import pytest
from httpx import AsyncClient, ASGITransport
from fastapi import status

from app.main import app


@pytest.fixture
async def client():
    """테스트용 HTTP 클라이언트"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


class TestGetDivinationEndpoint:
    """GET /api/divination 엔드포인트 테스트"""

    @pytest.mark.asyncio
    async def test_get_divination_success(self, client):
        """정상 요청 테스트"""
        response = await client.get(
            "/api/divination",
            params={"category": "재물", "yao": "상육", "hexagram": 1}
        )

        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert "hexagram_number" in data
        assert "hexagram_name" in data
        assert "yao_position" in data
        assert "yao_name" in data
        assert "interpretation" in data
        assert "fortune_score" in data
        assert "matched_category" in data

    @pytest.mark.asyncio
    async def test_get_divination_all_categories(self, client):
        """모든 카테고리 테스트"""
        categories = ["재물", "직업", "학업", "연애", "대인", "건강", "취미", "운명", "기타"]

        for category in categories:
            response = await client.get(
                "/api/divination",
                params={"category": category, "yao": "초구", "hexagram": 1}
            )
            assert response.status_code == status.HTTP_200_OK
            assert response.json()["matched_category"] == category

    @pytest.mark.asyncio
    async def test_get_divination_all_yang_yaos(self, client):
        """모든 양효 이름 테스트"""
        yang_yaos = ["초구", "구이", "구삼", "구사", "구오", "상구"]
        expected_positions = [1, 2, 3, 4, 5, 6]

        for yao, expected_pos in zip(yang_yaos, expected_positions):
            response = await client.get(
                "/api/divination",
                params={"category": "재물", "yao": yao, "hexagram": 1}
            )
            assert response.status_code == status.HTTP_200_OK
            assert response.json()["yao_position"] == expected_pos

    @pytest.mark.asyncio
    async def test_get_divination_all_yin_yaos(self, client):
        """모든 음효 이름 테스트"""
        yin_yaos = ["초육", "육이", "육삼", "육사", "육오", "상육"]
        expected_positions = [1, 2, 3, 4, 5, 6]

        for yao, expected_pos in zip(yin_yaos, expected_positions):
            response = await client.get(
                "/api/divination",
                params={"category": "재물", "yao": yao, "hexagram": 2}
            )
            assert response.status_code == status.HTTP_200_OK
            assert response.json()["yao_position"] == expected_pos

    @pytest.mark.asyncio
    async def test_get_divination_invalid_category(self, client):
        """잘못된 카테고리 테스트"""
        response = await client.get(
            "/api/divination",
            params={"category": "잘못된카테고리", "yao": "초구", "hexagram": 1}
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Invalid category" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_get_divination_invalid_yao(self, client):
        """잘못된 효 이름 테스트"""
        response = await client.get(
            "/api/divination",
            params={"category": "재물", "yao": "잘못된효", "hexagram": 1}
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Invalid yao name" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_get_divination_invalid_hexagram(self, client):
        """잘못된 괘 번호 테스트"""
        # 0 (범위 밖)
        response = await client.get(
            "/api/divination",
            params={"category": "재물", "yao": "초구", "hexagram": 0}
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # 65 (범위 밖)
        response = await client.get(
            "/api/divination",
            params={"category": "재물", "yao": "초구", "hexagram": 65}
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.asyncio
    async def test_get_divination_default_hexagram(self, client):
        """hexagram 기본값 테스트"""
        response = await client.get(
            "/api/divination",
            params={"category": "재물", "yao": "초구"}
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["hexagram_number"] == 1

    @pytest.mark.asyncio
    async def test_get_divination_missing_params(self, client):
        """필수 파라미터 누락 테스트"""
        # category 누락
        response = await client.get(
            "/api/divination",
            params={"yao": "초구"}
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # yao 누락
        response = await client.get(
            "/api/divination",
            params={"category": "재물"}
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.asyncio
    async def test_get_divination_response_structure(self, client):
        """응답 구조 검증"""
        response = await client.get(
            "/api/divination",
            params={"category": "재물", "yao": "상육", "hexagram": 1}
        )

        data = response.json()

        # 필수 필드
        required_fields = [
            "hexagram_number",
            "hexagram_name",
            "yao_position",
            "yao_name",
            "text_hanja",
            "text_kr",
            "interpretation",
            "fortune_score",
            "fortune_category",
            "keywords",
            "matched_category",
        ]

        for field in required_fields:
            assert field in data, f"Missing field: {field}"

    @pytest.mark.asyncio
    async def test_get_divination_category_interpretation(self, client):
        """카테고리별 해석 포함 테스트"""
        response = await client.get(
            "/api/divination",
            params={"category": "재물", "yao": "구오", "hexagram": 1}
        )

        data = response.json()
        assert "category_interpretation" in data

        # 재물 관점 해석이 포함되어야 함
        if data["category_interpretation"]:
            assert "재물" in data["category_interpretation"] or "투자" in data["category_interpretation"]


class TestCategoriesEndpoint:
    """카테고리 엔드포인트 테스트"""

    @pytest.mark.asyncio
    async def test_get_categories(self, client):
        """대분류 카테고리 목록 조회"""
        response = await client.get("/api/divination/categories")

        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert len(data) == 9

        for category in data:
            assert "id" in category
            assert "name" in category
            assert "emoji" in category

    @pytest.mark.asyncio
    async def test_get_sub_categories(self, client):
        """소분류 카테고리 목록 조회"""
        response = await client.get("/api/divination/categories/1/sub")

        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert len(data) > 0

        for sub in data:
            assert sub["main_id"] == 1

    @pytest.mark.asyncio
    async def test_get_sub_categories_invalid(self, client):
        """잘못된 대분류 ID"""
        response = await client.get("/api/divination/categories/0/sub")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        response = await client.get("/api/divination/categories/10/sub")
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestHealthEndpoint:
    """헬스체크 엔드포인트 테스트"""

    @pytest.mark.asyncio
    async def test_health_check(self, client):
        """헬스체크"""
        response = await client.get("/api/divination/health")

        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert "status" in data
        assert "timestamp" in data


class TestRootEndpoint:
    """루트 엔드포인트 테스트"""

    @pytest.mark.asyncio
    async def test_root(self, client):
        """루트 엔드포인트"""
        response = await client.get("/")

        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert "message" in data
        assert "version" in data

    @pytest.mark.asyncio
    async def test_root_health(self, client):
        """루트 헬스체크"""
        response = await client.get("/health")

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["status"] == "healthy"


class TestErrorHandling:
    """에러 처리 테스트"""

    @pytest.mark.asyncio
    async def test_not_found(self, client):
        """존재하지 않는 엔드포인트"""
        response = await client.get("/api/nonexistent")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_method_not_allowed(self, client):
        """허용되지 않는 HTTP 메서드"""
        # GET 전용 엔드포인트에 POST
        response = await client.post("/api/divination/categories")
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED


class TestResponseFormat:
    """응답 형식 테스트"""

    @pytest.mark.asyncio
    async def test_json_content_type(self, client):
        """JSON 컨텐츠 타입"""
        response = await client.get(
            "/api/divination",
            params={"category": "재물", "yao": "초구"}
        )

        assert "application/json" in response.headers["content-type"]

    @pytest.mark.asyncio
    async def test_fortune_score_range(self, client):
        """점수 범위 검증"""
        response = await client.get(
            "/api/divination",
            params={"category": "재물", "yao": "초구"}
        )

        data = response.json()
        assert 0 <= data["fortune_score"] <= 100

    @pytest.mark.asyncio
    async def test_keywords_is_list(self, client):
        """키워드가 리스트인지 확인"""
        response = await client.get(
            "/api/divination",
            params={"category": "재물", "yao": "초구"}
        )

        data = response.json()
        assert isinstance(data["keywords"], list)

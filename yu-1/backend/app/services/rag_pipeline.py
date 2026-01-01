"""
RAG 파이프라인 - 카테고리 벡터 인덱싱

ChromaDB를 활용한 카테고리 시맨틱 검색
- 100개 카테고리 임베딩
- 질문 → 카테고리 유사도 매칭
- category_matcher.py 보조
"""
import logging
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.core.config import settings
from app.data.category_seed import get_all_categories, MAJOR_CATEGORIES

logger = logging.getLogger(__name__)


@dataclass
class CategorySearchResult:
    """카테고리 검색 결과"""
    category_id: int
    major_id: int
    major_name: str
    sub_name: str
    similarity: float
    keywords: List[str]


class CategoryRAGPipeline:
    """
    카테고리 RAG 파이프라인

    기능:
    1. 카테고리 벡터 인덱싱
    2. 질문 → 카테고리 시맨틱 검색
    3. 키워드 매칭 보조
    """

    def __init__(self):
        self.persist_dir = getattr(settings, 'CHROMA_PERSIST_DIR', './chroma_db')
        self.client = None
        self.collection = None
        self._initialized = False

    def init_index(self) -> bool:
        """
        ChromaDB 인덱스 초기화

        Returns:
            초기화 성공 여부
        """
        try:
            # ChromaDB 클라이언트 생성 (최신 API)
            self.client = chromadb.Client(ChromaSettings(
                anonymized_telemetry=False,
                persist_directory=self.persist_dir,
                is_persistent=True
            ))

            # 카테고리 컬렉션 생성/로드
            self.collection = self.client.get_or_create_collection(
                name="categories",
                metadata={"description": "카테고리 시맨틱 검색용 임베딩"}
            )

            self._initialized = True
            logger.info(f"[RAG] 카테고리 인덱스 초기화 완료: {self.persist_dir}")
            return True

        except Exception as e:
            logger.error(f"[RAG] 초기화 실패: {e}")
            self._initialized = False
            return False

    def index_categories(self) -> int:
        """
        카테고리 데이터 벡터 인덱싱

        Returns:
            인덱싱된 카테고리 수
        """
        if not self._initialized:
            self.init_index()

        if not self.collection:
            return 0

        categories = get_all_categories()
        count = 0

        documents = []
        ids = []
        metadatas = []

        for cat in categories:
            try:
                # 검색용 텍스트 생성
                cat_text = self._create_searchable_text(cat)

                # 메타데이터
                metadata = {
                    "category_id": cat["id"],
                    "major_id": cat["major_id"],
                    "major_name": cat["major_name"],
                    "sub_name": cat["sub_name"],
                    "age_target": cat.get("age_target", "전연령")
                }

                documents.append(cat_text)
                ids.append(f"cat_{cat['id']}")
                metadatas.append(metadata)
                count += 1

            except Exception as e:
                logger.error(f"[RAG] 카테고리 처리 오류 ({cat.get('id', 'unknown')}): {e}")

        # 배치 업서트
        if documents:
            self.collection.upsert(
                documents=documents,
                ids=ids,
                metadatas=metadatas
            )
            logger.info(f"[RAG] {count}개 카테고리 인덱싱 완료")

        return count

    def _create_searchable_text(self, cat: Dict) -> str:
        """검색용 텍스트 생성"""
        parts = [
            cat.get("major_name", ""),
            cat.get("sub_name", ""),
            cat.get("description", ""),
            " ".join(cat.get("keywords", []))
        ]
        return " ".join(filter(None, parts))

    def search(
        self,
        query: str,
        top_k: int = 5,
        major_id: Optional[int] = None
    ) -> List[CategorySearchResult]:
        """
        질문으로 카테고리 시맨틱 검색

        Args:
            query: 사용자 질문
            top_k: 반환할 결과 수
            major_id: 대분류 필터 (선택)

        Returns:
            CategorySearchResult 리스트
        """
        if not self._initialized:
            self.init_index()
            # 인덱스가 비어있으면 인덱싱
            if self.collection and self.collection.count() == 0:
                self.index_categories()

        if not self.collection:
            return []

        try:
            # 필터 조건
            where = {"major_id": major_id} if major_id else None

            results = self.collection.query(
                query_texts=[query],
                n_results=top_k,
                where=where
            )

            search_results = []
            if results and results.get("ids"):
                for i, doc_id in enumerate(results["ids"][0]):
                    meta = results["metadatas"][0][i] if results.get("metadatas") else {}
                    distance = results["distances"][0][i] if results.get("distances") else 1.0

                    # 거리 → 유사도 변환 (0~1)
                    similarity = max(0.0, 1.0 - distance)

                    search_results.append(CategorySearchResult(
                        category_id=meta.get("category_id", 0),
                        major_id=meta.get("major_id", 9),
                        major_name=meta.get("major_name", "기타"),
                        sub_name=meta.get("sub_name", ""),
                        similarity=similarity,
                        keywords=[]  # 메타데이터에서 복원 필요시 추가
                    ))

            return search_results

        except Exception as e:
            logger.error(f"[RAG] 검색 오류: {e}")
            return []

    def find_best_category(
        self,
        question: str,
        main_category: Optional[int] = None
    ) -> Tuple[int, int, float]:
        """
        질문에 가장 적합한 카테고리 찾기

        Args:
            question: 사용자 질문
            main_category: 대분류 ID (선택)

        Returns:
            (major_id, category_id, confidence)
        """
        results = self.search(question, top_k=1, major_id=main_category)

        if results:
            best = results[0]
            return (best.major_id, best.category_id, best.similarity)

        # 기본값: 기타
        return (9, 100, 0.0)

    def get_stats(self) -> Dict:
        """컬렉션 통계"""
        if not self._initialized or not self.collection:
            return {"initialized": False, "count": 0}

        try:
            count = self.collection.count()
            return {
                "initialized": True,
                "count": count,
                "persist_dir": self.persist_dir
            }
        except Exception as e:
            return {"initialized": False, "error": str(e)}


# 싱글톤 인스턴스
category_rag = CategoryRAGPipeline()


def init_category_rag() -> bool:
    """카테고리 RAG 초기화 (앱 시작 시 호출)"""
    if category_rag.init_index():
        count = category_rag.index_categories()
        logger.info(f"[RAG] 카테고리 RAG 초기화 완료: {count}개")
        return True
    return False

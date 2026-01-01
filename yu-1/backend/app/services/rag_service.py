"""
RAG 서비스 (ChromaDB 기반)

컨설팅 확정:
- 질문 → 384효 매칭에 활용
- 키워드 기반 매칭 보조
- 유사 질문 검색
"""
import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import hashlib

from app.core.config import settings
from app.data.hexagram_seed import SAMPLE_HEXAGRAM_DATA


@dataclass
class SearchResult:
    """검색 결과"""
    hexagram_id: str
    similarity: float
    text: str
    metadata: Dict


class RAGService:
    """
    RAG 서비스 (Retrieval Augmented Generation)

    기능:
    1. 384효 데이터 인덱싱
    2. 질문 유사도 검색
    3. 키워드 기반 매칭 보조
    """

    def __init__(self):
        self.persist_dir = settings.CHROMA_PERSIST_DIR
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
            # ChromaDB 클라이언트 생성
            self.client = chromadb.Client(ChromaSettings(
                chroma_db_impl="duckdb+parquet",
                persist_directory=self.persist_dir,
                anonymized_telemetry=False
            ))

            # 컬렉션 생성/로드
            self.collection = self.client.get_or_create_collection(
                name="hexagram_yao",
                metadata={"description": "384효 데이터 임베딩"}
            )

            self._initialized = True
            print(f"[RAG] ChromaDB 초기화 완료: {self.persist_dir}")
            return True

        except Exception as e:
            print(f"[RAG] 초기화 실패: {e}")
            self._initialized = False
            return False

    def index_hexagrams(self, hexagrams: List[Dict]) -> int:
        """
        384효 데이터 인덱싱

        Args:
            hexagrams: 효 데이터 리스트

        Returns:
            인덱싱된 문서 수
        """
        if not self._initialized:
            self.init_index()

        if not self.collection:
            return 0

        count = 0
        for hex_data in hexagrams:
            try:
                # 문서 ID 생성
                doc_id = hex_data.get("id", f"{hex_data['gua_number']}-{hex_data['yao_number']}")

                # 검색용 텍스트 생성
                text = self._create_searchable_text(hex_data)

                # 메타데이터
                metadata = {
                    "hexagram_id": doc_id,
                    "gua_number": hex_data.get("gua_number", 0),
                    "yao_number": hex_data.get("yao_number", 0),
                    "gua_name": hex_data.get("gua_name_ko", ""),
                    "direction": hex_data.get("direction", "정체"),
                    "score": hex_data.get("score", 50)
                }

                # 컬렉션에 추가
                self.collection.upsert(
                    ids=[doc_id],
                    documents=[text],
                    metadatas=[metadata]
                )
                count += 1

            except Exception as e:
                print(f"[RAG] 인덱싱 오류 ({hex_data.get('id', 'unknown')}): {e}")

        print(f"[RAG] {count}개 문서 인덱싱 완료")
        return count

    def _create_searchable_text(self, hex_data: Dict) -> str:
        """검색용 텍스트 생성"""
        parts = [
            hex_data.get("core_message", ""),
            hex_data.get("original_meaning", ""),
            hex_data.get("caution", ""),
            " ".join(hex_data.get("keywords", []))
        ]
        return " ".join(filter(None, parts))

    def search(
        self,
        query: str,
        top_k: int = 5,
        filters: Optional[Dict] = None
    ) -> List[SearchResult]:
        """
        유사 질문 검색

        Args:
            query: 검색 쿼리
            top_k: 반환할 결과 수
            filters: 필터 조건 (예: {"direction": "상승"})

        Returns:
            SearchResult 리스트
        """
        if not self._initialized:
            self.init_index()

        if not self.collection:
            return []

        try:
            # where 절 생성
            where = filters if filters else None

            results = self.collection.query(
                query_texts=[query],
                n_results=top_k,
                where=where
            )

            search_results = []
            if results and results.get("ids"):
                for i, doc_id in enumerate(results["ids"][0]):
                    search_results.append(SearchResult(
                        hexagram_id=doc_id,
                        similarity=1.0 - results["distances"][0][i] if results.get("distances") else 0.5,
                        text=results["documents"][0][i] if results.get("documents") else "",
                        metadata=results["metadatas"][0][i] if results.get("metadatas") else {}
                    ))

            return search_results

        except Exception as e:
            print(f"[RAG] 검색 오류: {e}")
            return []

    def search_by_keywords(
        self,
        keywords: List[str],
        top_k: int = 3
    ) -> List[SearchResult]:
        """
        키워드 기반 검색

        Args:
            keywords: 검색 키워드 리스트
            top_k: 반환할 결과 수

        Returns:
            SearchResult 리스트
        """
        query = " ".join(keywords)
        return self.search(query, top_k)

    def find_similar_hexagram(
        self,
        question: str,
        category_id: Optional[int] = None,
        period: str = "daily"
    ) -> Optional[Tuple[str, float]]:
        """
        질문에 가장 유사한 효 찾기

        Args:
            question: 사용자 질문
            category_id: 카테고리 ID (선택)
            period: 기간

        Returns:
            (hexagram_id, similarity) 또는 None
        """
        results = self.search(question, top_k=1)

        if results:
            best = results[0]
            return (best.hexagram_id, best.similarity)

        return None

    def index_sample_data(self) -> int:
        """샘플 데이터 인덱싱 (테스트용)"""
        return self.index_hexagrams(SAMPLE_HEXAGRAM_DATA)

    def get_collection_stats(self) -> Dict:
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
rag_service = RAGService()


# 유틸리티 함수
def init_rag_index():
    """RAG 인덱스 초기화 (앱 시작 시 호출)"""
    if rag_service.init_index():
        # 샘플 데이터 인덱싱
        rag_service.index_sample_data()
        return True
    return False

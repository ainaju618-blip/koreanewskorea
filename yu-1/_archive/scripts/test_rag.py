"""
Dev3: ChromaDB RAG 테스트 스크립트

기능:
1. CategoryRAGPipeline 초기화 테스트
2. 카테고리 인덱싱 테스트
3. 시맨틱 검색 테스트
4. 카테고리 매칭 테스트

사용법:
    python scripts/test_rag.py
"""
import sys
import os

# 프로젝트 루트 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.rag_pipeline import CategoryRAGPipeline, init_category_rag


def test_pipeline_init():
    """1. 파이프라인 초기화 테스트"""
    print("\n" + "="*60)
    print("1. CategoryRAGPipeline 초기화 테스트")
    print("="*60)

    pipeline = CategoryRAGPipeline()

    # 초기화 전 상태
    stats = pipeline.get_stats()
    print(f"  초기화 전: {stats}")

    # 초기화
    result = pipeline.init_index()
    print(f"  init_index() 결과: {result}")

    if result:
        stats = pipeline.get_stats()
        print(f"  초기화 후: {stats}")
        print("  ✅ 초기화 성공")
        return pipeline
    else:
        print("  ❌ 초기화 실패")
        return None


def test_category_indexing(pipeline: CategoryRAGPipeline):
    """2. 카테고리 인덱싱 테스트"""
    print("\n" + "="*60)
    print("2. 카테고리 인덱싱 테스트")
    print("="*60)

    # 인덱싱
    count = pipeline.index_categories()
    print(f"  인덱싱된 카테고리 수: {count}")

    # 통계
    stats = pipeline.get_stats()
    print(f"  컬렉션 통계: {stats}")

    if count > 0:
        print(f"  ✅ {count}개 카테고리 인덱싱 성공")
        return True
    else:
        print("  ❌ 인덱싱 실패")
        return False


def test_semantic_search(pipeline: CategoryRAGPipeline):
    """3. 시맨틱 검색 테스트"""
    print("\n" + "="*60)
    print("3. 시맨틱 검색 테스트")
    print("="*60)

    test_queries = [
        # 재물 관련
        ("비트코인 투자해도 될까요?", None),
        ("주식 매매 타이밍이 궁금해요", 1),  # major_id=1 (재물)

        # 직업 관련
        ("이직할까 고민이에요", None),
        ("창업 성공할 수 있을까요?", 2),  # major_id=2 (직업)

        # 연애 관련
        ("짝사랑 고백해도 될까요?", None),
        ("결혼 운이 궁금해요", 4),  # major_id=4 (연애)

        # 건강 관련
        ("다이어트 성공할 수 있을까요?", None),

        # 학업 관련
        ("시험 합격할 수 있을까요?", 3),  # major_id=3 (학업)
    ]

    success_count = 0

    for query, major_filter in test_queries:
        results = pipeline.search(query, top_k=3, major_id=major_filter)

        filter_str = f"(major_id={major_filter})" if major_filter else ""
        print(f"\n  질문: \"{query}\" {filter_str}")

        if results:
            for i, r in enumerate(results, 1):
                print(f"    {i}. [{r.major_name}] {r.sub_name} (유사도: {r.similarity:.3f})")
            success_count += 1
        else:
            print("    결과 없음")

    print(f"\n  ✅ {success_count}/{len(test_queries)} 검색 성공")
    return success_count == len(test_queries)


def test_best_category_matching(pipeline: CategoryRAGPipeline):
    """4. 최적 카테고리 매칭 테스트"""
    print("\n" + "="*60)
    print("4. 최적 카테고리 매칭 테스트")
    print("="*60)

    test_cases = [
        ("오늘 삼성전자 주식 사도 될까요?", 1, "재물 > 주식"),
        ("내일 면접 잘 볼 수 있을까요?", 2, "직업 > 취업/면접"),
        ("이번 달 토익 시험 합격할까요?", 3, "학업 > 어학/자격증"),
        ("소개팅 잘 될까요?", 4, "연애 > 솔로탈출"),
        ("친구와 화해할 수 있을까요?", 5, "대인관계 > 친구"),
        ("허리 통증이 낫을까요?", 6, "건강 > 통증"),
    ]

    for question, expected_major, expected_desc in test_cases:
        major_id, cat_id, confidence = pipeline.find_best_category(question)

        match = "✅" if major_id == expected_major else "❌"
        print(f"  {match} \"{question}\"")
        print(f"     예상: {expected_desc}, 결과: major={major_id}, cat={cat_id}, 신뢰도={confidence:.3f}")


def main():
    """메인 테스트 실행"""
    print("\n" + "#"*60)
    print("# ChromaDB RAG Pipeline 테스트")
    print("#"*60)

    # 1. 초기화 테스트
    pipeline = test_pipeline_init()
    if not pipeline:
        print("\n❌ 파이프라인 초기화 실패. 테스트 중단.")
        return

    # 2. 인덱싱 테스트
    if not test_category_indexing(pipeline):
        print("\n⚠️ 인덱싱 실패. 검색 테스트 건너뜀.")
    else:
        # 3. 시맨틱 검색 테스트
        test_semantic_search(pipeline)

        # 4. 카테고리 매칭 테스트
        test_best_category_matching(pipeline)

    print("\n" + "#"*60)
    print("# 테스트 완료")
    print("#"*60)

    # 최종 통계
    final_stats = pipeline.get_stats()
    print(f"\n최종 상태: {final_stats}")


if __name__ == "__main__":
    main()

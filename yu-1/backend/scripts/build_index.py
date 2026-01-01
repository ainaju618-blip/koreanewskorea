"""
키워드 인덱스 및 카테고리 매핑 생성 스크립트
questions_unified.json -> keywords_index.json + category_questions_map.json
"""

import json
from pathlib import Path
from collections import defaultdict
from datetime import datetime

PROJECT_ROOT = Path(__file__).parent.parent.parent
DATA_DIR = PROJECT_ROOT / "backend" / "app" / "data"

def build_keyword_index():
    """키워드 역인덱스 생성"""

    # 질문 데이터 로드
    with open(DATA_DIR / "questions_unified.json", 'r', encoding='utf-8') as f:
        data = json.load(f)

    questions = data["questions"]

    # 키워드 -> 질문 ID 역인덱스
    keyword_to_questions = defaultdict(list)
    keyword_stats = defaultdict(lambda: {"count": 0, "categories": set()})

    # 카테고리 -> 질문 매핑
    category_questions = defaultdict(list)

    for q in questions:
        q_id = q["id"]
        major_id = q["major_category_id"]
        major_name = q["major_category_name"]
        sub_cat = q["sub_category"]
        keywords = q.get("keywords", [])

        # 카테고리별 질문 매핑
        category_questions[major_id].append({
            "id": q_id,
            "text": q["text"],
            "sub_category": sub_cat
        })

        # 키워드 역인덱스
        for kw in keywords:
            keyword_to_questions[kw].append(q_id)
            keyword_stats[kw]["count"] += 1
            keyword_stats[kw]["categories"].add(major_id)

    # 결과 정리
    keyword_index = {
        "version": "1.0.0",
        "generated_at": datetime.now().isoformat(),
        "total_keywords": len(keyword_to_questions),
        "index": dict(keyword_to_questions),
        "stats": {
            kw: {
                "count": stats["count"],
                "categories": list(stats["categories"])
            }
            for kw, stats in keyword_stats.items()
        }
    }

    category_map = {
        "version": "1.0.0",
        "generated_at": datetime.now().isoformat(),
        "categories": {
            str(cat_id): {
                "count": len(questions_list),
                "questions": questions_list
            }
            for cat_id, questions_list in category_questions.items()
        }
    }

    # 저장
    with open(DATA_DIR / "keywords_index.json", 'w', encoding='utf-8') as f:
        json.dump(keyword_index, f, ensure_ascii=False, indent=2)

    with open(DATA_DIR / "category_questions_map.json", 'w', encoding='utf-8') as f:
        json.dump(category_map, f, ensure_ascii=False, indent=2)

    print("=" * 60)
    print("[DONE] Index Build Complete")
    print(f"  - Total keywords: {len(keyword_to_questions)}")
    print(f"  - Categories: {len(category_questions)}")
    print("=" * 60)

    # 상위 키워드 출력
    print("\n[TOP 20 Keywords]")
    top_keywords = sorted(keyword_stats.items(), key=lambda x: -x[1]["count"])[:20]
    for kw, stats in top_keywords:
        print(f"  {kw}: {stats['count']}")

if __name__ == "__main__":
    build_keyword_index()

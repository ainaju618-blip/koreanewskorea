"""
질문 파일 파싱 및 JSON 통합 스크립트
19개 TXT 파일 → questions_unified.json
"""

import os
import re
import json
from datetime import datetime
from pathlib import Path

# 프로젝트 루트
PROJECT_ROOT = Path(__file__).parent.parent.parent
QUESTIONS_DIR = PROJECT_ROOT
OUTPUT_DIR = PROJECT_ROOT / "backend" / "app" / "data"

# 파일별 카테고리 매핑
FILE_CATEGORY_MAP = {
    "career_questions_500.txt": {"major_id": 2, "major_name": "직업", "sub_category": "취업/면접"},
    "questions_career_501_1000.txt": {"major_id": 2, "major_name": "직업", "sub_category": "이직/승진"},
    "questions_money_500.txt": {"major_id": 1, "major_name": "재물", "sub_category": "재물운"},
    "questions_business_500.txt": {"major_id": 1, "major_name": "재물", "sub_category": "창업/사업"},
    "investment_questions_501_1000.txt": {"major_id": 1, "major_name": "재물", "sub_category": "투자"},
    "questions_housing_500.txt": {"major_id": 1, "major_name": "재물", "sub_category": "부동산/이사"},
    "questions_study_500.txt": {"major_id": 3, "major_name": "학업", "sub_category": "학업/시험"},
    "questions_love_marriage_500.txt": {"major_id": 4, "major_name": "연애", "sub_category": "연애"},
    "questions_love_marriage_501_1000.txt": {"major_id": 4, "major_name": "연애", "sub_category": "결혼"},
    "questions_relationships_500.txt": {"major_id": 5, "major_name": "대인", "sub_category": "인간관계"},
    "questions_social_500.txt": {"major_id": 5, "major_name": "대인", "sub_category": "사회생활"},
    "health_family_questions_500.txt": {"major_id": 6, "major_name": "건강", "sub_category": "건강/가족"},
    "questions_parenting_500.txt": {"major_id": 6, "major_name": "건강", "sub_category": "육아/부모"},
    "questions_hobby_500.txt": {"major_id": 7, "major_name": "취미", "sub_category": "취미/여가"},
    "questions_travel_500.txt": {"major_id": 7, "major_name": "취미", "sub_category": "여행"},
    "questions_destiny_500.txt": {"major_id": 8, "major_name": "운명", "sub_category": "운명/전생"},
    "questions_daily_500.txt": {"major_id": 8, "major_name": "운명", "sub_category": "일상선택"},
    "questions_legal_500.txt": {"major_id": 9, "major_name": "기타", "sub_category": "법률/분쟁"},
    "questions_500.txt": {"major_id": 8, "major_name": "운명", "sub_category": "오늘운세"},
}

# 불용어
STOPWORDS = {
    "이번", "지금", "오늘", "내일", "이", "그", "저", "할까요", "될까요",
    "있을까요", "좋을까요", "나을까요", "괜찮을까요", "맞을까요",
    "수", "것", "때", "위해", "통해", "대해", "있는", "없는", "하는"
}

def extract_keywords(text: str) -> list:
    """질문에서 키워드 추출"""
    # 한글만 추출
    words = re.findall(r'[가-힣]{2,}', text)
    # 불용어 제거 및 중복 제거
    keywords = []
    for word in words:
        if word not in STOPWORDS and word not in keywords:
            keywords.append(word)
    return keywords[:10]  # 최대 10개

def parse_question_file(filepath: str, category_info: dict, start_id: int) -> list:
    """단일 질문 파일 파싱"""
    questions = []
    filename = os.path.basename(filepath)

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except UnicodeDecodeError:
        with open(filepath, 'r', encoding='cp949') as f:
            lines = f.readlines()

    # 질문 패턴
    question_pattern = re.compile(r'^Q?(\d+)[\.\)]\s*(.+[?？])\s*$')

    line_num = 0
    for line in lines:
        line = line.strip()
        line_num += 1

        if not line:
            continue

        # 제목/섹션 라인 건너뛰기
        if line.startswith('===') or line.startswith('---'):
            continue
        if line.startswith('【') or line.startswith('[') or line.startswith('#'):
            continue
        if line.startswith('주역') or line.startswith('========'):
            continue

        # 질문 매칭
        match = question_pattern.match(line)
        if match:
            q_num = match.group(1)
            q_text = match.group(2).strip()

            # 질문 ID 생성
            q_id = f"Q{start_id + len(questions):05d}"

            questions.append({
                "id": q_id,
                "text": q_text,
                "major_category_id": category_info["major_id"],
                "major_category_name": category_info["major_name"],
                "sub_category": category_info["sub_category"],
                "keywords": extract_keywords(q_text),
                "source_file": filename,
                "line_number": line_num,
                "original_number": int(q_num)
            })

    return questions

def main():
    """메인 실행"""
    print("=" * 60)
    print("Question Data Integration Started")
    print("=" * 60)

    all_questions = []
    file_stats = []
    current_id = 1

    for filename, category_info in FILE_CATEGORY_MAP.items():
        filepath = QUESTIONS_DIR / filename

        if not filepath.exists():
            print(f"[WARN] File not found: {filename}")
            continue

        questions = parse_question_file(str(filepath), category_info, current_id)
        current_id += len(questions)

        all_questions.extend(questions)
        file_stats.append({
            "file": filename,
            "count": len(questions),
            "category": f"{category_info['major_name']} > {category_info['sub_category']}"
        })

        print(f"[OK] {filename}: {len(questions)} questions")

    # 카테고리별 통계
    category_stats = {}
    for q in all_questions:
        cat_name = q["major_category_name"]
        if cat_name not in category_stats:
            category_stats[cat_name] = 0
        category_stats[cat_name] += 1

    # 결과 JSON 생성
    result = {
        "version": "1.0.0",
        "generated_at": datetime.now().isoformat(),
        "total_count": len(all_questions),
        "statistics": {
            "by_category": category_stats,
            "by_file": file_stats
        },
        "questions": all_questions
    }

    # 저장
    output_path = OUTPUT_DIR / "questions_unified.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print("=" * 60)
    print(f"[DONE] Total {len(all_questions)} questions integrated")
    print(f"[PATH] {output_path}")
    print("\n[STATS] By Category:")
    for cat, count in sorted(category_stats.items(), key=lambda x: -x[1]):
        print(f"   {cat}: {count}")
    print("=" * 60)

    return result

if __name__ == "__main__":
    main()

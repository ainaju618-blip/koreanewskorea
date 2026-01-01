"""
사용자 질문 수집 데이터 시드

설문조사 및 실제 서비스에서 수집된 질문들을 저장
- 카테고리 매칭 학습 데이터로 활용
- 키워드 확장에 활용
- 해석 품질 개선에 활용
"""
from typing import List, Dict, Optional
from datetime import datetime


# 수집된 질문 데이터
# source: survey (설문), service (실서비스), test (테스트)
COLLECTED_QUESTIONS: List[Dict] = [
    # ========== 💰 재물 (major_id=1) ==========
    # 주식
    {"question": "삼성전자 주식 지금 사도 될까요?", "major_id": 1, "sub_id": 1, "source": "survey", "age_group": "30대"},
    {"question": "테슬라 매수 타이밍이 언제일까요?", "major_id": 1, "sub_id": 1, "source": "survey", "age_group": "20대"},
    {"question": "코스피 지금 들어가도 될까요?", "major_id": 1, "sub_id": 1, "source": "test", "age_group": None},
    {"question": "반도체 주식 전망이 어떨까요?", "major_id": 1, "sub_id": 1, "source": "survey", "age_group": "40대"},
    {"question": "주식 손절해야 할까요?", "major_id": 1, "sub_id": 1, "source": "survey", "age_group": "30대"},

    # 코인
    {"question": "비트코인 지금 사도 될까요?", "major_id": 1, "sub_id": 2, "source": "test", "age_group": None},
    {"question": "이더리움 전망이 어떨까요?", "major_id": 1, "sub_id": 2, "source": "test", "age_group": None},
    {"question": "업비트에서 코인 사려는데 괜찮을까요?", "major_id": 1, "sub_id": 2, "source": "survey", "age_group": "20대"},
    {"question": "알트코인 투자해도 될까요?", "major_id": 1, "sub_id": 2, "source": "survey", "age_group": "20대"},
    {"question": "리플 오를까요?", "major_id": 1, "sub_id": 2, "source": "survey", "age_group": "30대"},

    # 부동산
    {"question": "지금 아파트 사도 될까요?", "major_id": 1, "sub_id": 3, "source": "survey", "age_group": "30대"},
    {"question": "전세 vs 매매 뭐가 나을까요?", "major_id": 1, "sub_id": 3, "source": "survey", "age_group": "30대"},
    {"question": "부동산 가격 오를까요?", "major_id": 1, "sub_id": 3, "source": "survey", "age_group": "40대"},

    # 복권/로또
    {"question": "로또 당첨될 수 있을까요?", "major_id": 1, "sub_id": 4, "source": "test", "age_group": None},
    {"question": "이번 주 로또 운이 있을까요?", "major_id": 1, "sub_id": 4, "source": "survey", "age_group": "50대"},
    {"question": "복권 사면 될까요?", "major_id": 1, "sub_id": 4, "source": "survey", "age_group": "40대"},

    # 사업/창업
    {"question": "창업하면 성공할 수 있을까요?", "major_id": 1, "sub_id": 5, "source": "test", "age_group": None},
    {"question": "카페 창업 괜찮을까요?", "major_id": 1, "sub_id": 5, "source": "survey", "age_group": "30대"},
    {"question": "프랜차이즈 해도 될까요?", "major_id": 1, "sub_id": 103, "source": "survey", "age_group": "40대"},

    # ========== 💼 직업 (major_id=2) ==========
    # 취업/면접
    {"question": "이번 면접 합격할 수 있을까요?", "major_id": 2, "sub_id": 11, "source": "survey", "age_group": "20대"},
    {"question": "다음 주 면접 잘 볼 수 있을까요?", "major_id": 2, "sub_id": 11, "source": "test", "age_group": None},
    {"question": "취업 언제 될까요?", "major_id": 2, "sub_id": 11, "source": "survey", "age_group": "20대"},
    {"question": "서류 합격할까요?", "major_id": 2, "sub_id": 11, "source": "survey", "age_group": "20대"},

    # 이직
    {"question": "이직하면 잘 될까요?", "major_id": 2, "sub_id": 12, "source": "test", "age_group": None},
    {"question": "지금 회사 때려치고 옮겨도 될까요?", "major_id": 2, "sub_id": 12, "source": "survey", "age_group": "30대"},
    {"question": "이직 제안 받았는데 가도 될까요?", "major_id": 2, "sub_id": 12, "source": "survey", "age_group": "30대"},

    # 연봉/승진
    {"question": "연봉 협상 잘 될까요?", "major_id": 2, "sub_id": 13, "source": "test", "age_group": None},
    {"question": "올해 승진할 수 있을까요?", "major_id": 2, "sub_id": 13, "source": "survey", "age_group": "30대"},
    {"question": "인센티브 많이 받을까요?", "major_id": 2, "sub_id": 13, "source": "survey", "age_group": "30대"},

    # 직장내 관계
    {"question": "팀장님이 나를 싫어하는 걸까요?", "major_id": 2, "sub_id": 122, "source": "survey", "age_group": "30대"},
    {"question": "상사와의 관계가 나아질까요?", "major_id": 2, "sub_id": 201, "source": "survey", "age_group": "30대"},

    # ========== 📚 학업 (major_id=3) ==========
    # 수능/입시
    {"question": "수능 잘 볼 수 있을까요?", "major_id": 3, "sub_id": 21, "source": "test", "age_group": None},
    {"question": "원하는 대학 갈 수 있을까요?", "major_id": 3, "sub_id": 21, "source": "survey", "age_group": "10대"},
    {"question": "정시 vs 수시 뭐가 유리할까요?", "major_id": 3, "sub_id": 21, "source": "survey", "age_group": "10대"},

    # 자격증
    {"question": "자격증 시험 합격할까요?", "major_id": 3, "sub_id": 22, "source": "test", "age_group": None},
    {"question": "정보처리기사 붙을 수 있을까요?", "major_id": 3, "sub_id": 125, "source": "survey", "age_group": "20대"},
    {"question": "토익 목표 점수 달성할까요?", "major_id": 3, "sub_id": 23, "source": "survey", "age_group": "20대"},

    # 공무원
    {"question": "공무원 시험 붙을 수 있을까요?", "major_id": 3, "sub_id": 24, "source": "test", "age_group": None},
    {"question": "9급 공무원 올해 합격할까요?", "major_id": 3, "sub_id": 24, "source": "survey", "age_group": "20대"},

    # ========== 💕 연애 (major_id=4) ==========
    # 짝사랑/고백
    {"question": "고백하면 받아줄까요?", "major_id": 4, "sub_id": 31, "source": "test", "age_group": None},
    {"question": "짝사랑하는 사람이 나를 좋아할까요?", "major_id": 4, "sub_id": 31, "source": "survey", "age_group": "20대"},
    {"question": "고백 타이밍이 언제가 좋을까요?", "major_id": 4, "sub_id": 174, "source": "survey", "age_group": "20대"},

    # 썸/연애시작
    {"question": "썸남이 나한테 관심 있는 걸까요?", "major_id": 4, "sub_id": 32, "source": "test", "age_group": None},
    {"question": "이 사람이랑 사귀면 잘 될까요?", "major_id": 4, "sub_id": 171, "source": "survey", "age_group": "20대"},
    {"question": "카톡 읽씹하는데 관심 없는 걸까요?", "major_id": 4, "sub_id": 172, "source": "survey", "age_group": "20대"},

    # 연인관계
    {"question": "남자친구가 바람피우는 걸까요?", "major_id": 4, "sub_id": 199, "source": "survey", "age_group": "20대"},
    {"question": "이 연애 계속해도 될까요?", "major_id": 4, "sub_id": 183, "source": "survey", "age_group": "20대"},
    {"question": "연인과 싸웠는데 화해할 수 있을까요?", "major_id": 4, "sub_id": 177, "source": "survey", "age_group": "30대"},

    # 이별/재회
    {"question": "헤어진 전남친과 재회할 수 있을까요?", "major_id": 4, "sub_id": 186, "source": "test", "age_group": None},
    {"question": "이별 후 다시 연락해도 될까요?", "major_id": 4, "sub_id": 186, "source": "survey", "age_group": "20대"},
    {"question": "이별 극복할 수 있을까요?", "major_id": 4, "sub_id": 185, "source": "survey", "age_group": "20대"},

    # 결혼
    {"question": "이 사람과 결혼해도 될까요?", "major_id": 4, "sub_id": 35, "source": "survey", "age_group": "30대"},
    {"question": "올해 결혼할 수 있을까요?", "major_id": 4, "sub_id": 35, "source": "survey", "age_group": "30대"},
    {"question": "상견례 잘 될까요?", "major_id": 4, "sub_id": 141, "source": "survey", "age_group": "30대"},

    # 소개팅
    {"question": "소개팅 잘 될까요?", "major_id": 4, "sub_id": 34, "source": "test", "age_group": None},
    {"question": "이번 소개팅 상대가 인연일까요?", "major_id": 4, "sub_id": 34, "source": "survey", "age_group": "30대"},

    # ========== 👥 대인관계 (major_id=5) ==========
    # 가족
    {"question": "부모님과 화해할 수 있을까요?", "major_id": 5, "sub_id": 41, "source": "survey", "age_group": "30대"},
    {"question": "형제와의 관계가 나아질까요?", "major_id": 5, "sub_id": 41, "source": "survey", "age_group": "40대"},
    {"question": "상속 문제 잘 해결될까요?", "major_id": 5, "sub_id": 156, "source": "survey", "age_group": "50대"},

    # 친구
    {"question": "친구와 화해할 수 있을까요?", "major_id": 5, "sub_id": 42, "source": "test", "age_group": None},
    {"question": "오랜 친구가 연락 안 하는데 왜 그럴까요?", "major_id": 5, "sub_id": 208, "source": "survey", "age_group": "30대"},

    # 직장동료
    {"question": "직장 동료가 나를 무시하는 것 같아요", "major_id": 5, "sub_id": 43, "source": "survey", "age_group": "30대"},
    {"question": "팀원들과 관계가 나아질까요?", "major_id": 5, "sub_id": 43, "source": "survey", "age_group": "30대"},

    # ========== 🏥 건강 (major_id=6) ==========
    # 질병/수술
    {"question": "수술 결과가 좋을까요?", "major_id": 6, "sub_id": 51, "source": "test", "age_group": None},
    {"question": "병이 빨리 나을까요?", "major_id": 6, "sub_id": 51, "source": "survey", "age_group": "50대"},
    {"question": "건강검진 결과가 괜찮을까요?", "major_id": 6, "sub_id": 168, "source": "survey", "age_group": "40대"},

    # 다이어트
    {"question": "다이어트 성공할 수 있을까요?", "major_id": 6, "sub_id": 52, "source": "test", "age_group": None},
    {"question": "살 빠질까요?", "major_id": 6, "sub_id": 52, "source": "survey", "age_group": "30대"},

    # 임신/출산
    {"question": "임신할 수 있을까요?", "major_id": 6, "sub_id": 54, "source": "test", "age_group": None},
    {"question": "순산할 수 있을까요?", "major_id": 6, "sub_id": 54, "source": "survey", "age_group": "30대"},

    # 정신건강
    {"question": "우울증이 나아질까요?", "major_id": 6, "sub_id": 53, "source": "survey", "age_group": "20대"},
    {"question": "스트레스에서 벗어날 수 있을까요?", "major_id": 6, "sub_id": 53, "source": "survey", "age_group": "30대"},

    # ========== 🏠 주거/이사 (major_id=7) ==========
    {"question": "이사 가면 운이 좋아질까요?", "major_id": 7, "sub_id": 61, "source": "survey", "age_group": "30대"},
    {"question": "새 집으로 이사해도 될까요?", "major_id": 7, "sub_id": 61, "source": "survey", "age_group": "40대"},
    {"question": "이번 집이 좋은 집일까요?", "major_id": 7, "sub_id": 61, "source": "survey", "age_group": "30대"},

    # ========== 🔮 운세/택일 (major_id=8) ==========
    {"question": "결혼식 날짜 언제가 좋을까요?", "major_id": 8, "sub_id": 82, "source": "survey", "age_group": "30대"},
    {"question": "이사 날짜 좋은 날 알려주세요", "major_id": 8, "sub_id": 82, "source": "survey", "age_group": "40대"},
    {"question": "오늘 운세가 어떨까요?", "major_id": 9, "sub_id": 97, "source": "survey", "age_group": "20대"},

    # ========== 🔄 기타 (major_id=9) ==========
    {"question": "요즘 운이 안 좋은데 왜 그럴까요?", "major_id": 9, "sub_id": 97, "source": "survey", "age_group": "30대"},
    {"question": "A랑 B 중에 뭘 선택해야 할까요?", "major_id": 9, "sub_id": 98, "source": "survey", "age_group": "20대"},
    {"question": "올해 전체 운세가 궁금해요", "major_id": 9, "sub_id": 97, "source": "survey", "age_group": "30대"},
]


def get_questions_by_major(major_id: int) -> List[Dict]:
    """대분류별 질문 조회"""
    return [q for q in COLLECTED_QUESTIONS if q["major_id"] == major_id]


def get_questions_by_source(source: str) -> List[Dict]:
    """출처별 질문 조회 (survey, service, test)"""
    return [q for q in COLLECTED_QUESTIONS if q["source"] == source]


def get_questions_by_age(age_group: str) -> List[Dict]:
    """연령대별 질문 조회"""
    return [q for q in COLLECTED_QUESTIONS if q.get("age_group") == age_group]


def add_question(
    question: str,
    major_id: int,
    sub_id: Optional[int] = None,
    source: str = "service",
    age_group: Optional[str] = None
) -> Dict:
    """새 질문 추가"""
    new_q = {
        "question": question,
        "major_id": major_id,
        "sub_id": sub_id,
        "source": source,
        "age_group": age_group,
        "created_at": datetime.now().isoformat()
    }
    COLLECTED_QUESTIONS.append(new_q)
    return new_q


def print_summary():
    """질문 데이터 요약"""
    print("\n" + "="*60)
    print("📊 수집된 질문 데이터 요약")
    print("="*60)

    print(f"\n✅ 총 질문 수: {len(COLLECTED_QUESTIONS)}개")

    # 대분류별
    print("\n📁 대분류별 현황:")
    major_names = {
        1: "💰 재물", 2: "💼 직업", 3: "📚 학업",
        4: "💕 연애", 5: "👥 대인관계", 6: "🏥 건강",
        7: "🏠 주거", 8: "🔮 운세/택일", 9: "🔄 기타"
    }
    for major_id in range(1, 10):
        count = len(get_questions_by_major(major_id))
        print(f"   {major_names.get(major_id, major_id)}: {count}개")

    # 출처별
    print("\n📋 출처별 현황:")
    for source in ["survey", "service", "test"]:
        count = len(get_questions_by_source(source))
        print(f"   {source}: {count}개")

    # 연령별
    print("\n👥 연령대별 현황:")
    age_counts = {}
    for q in COLLECTED_QUESTIONS:
        age = q.get("age_group") or "미상"
        age_counts[age] = age_counts.get(age, 0) + 1
    for age, count in sorted(age_counts.items()):
        print(f"   {age}: {count}개")

    print("\n" + "="*60)


if __name__ == "__main__":
    print_summary()

    # 샘플 출력
    print("\n📝 샘플 질문 (재물 분야):")
    for q in get_questions_by_major(1)[:5]:
        print(f"   - {q['question']}")

# -*- coding: utf-8 -*-
"""
정통 384효 점술법으로 3가지 선택지 점 치기

질문:
1. 시초점을 코리아NEWS 운세 시스템에 적용하는것이 좋습니까?
2. 동전점을 코리아NEWS 운세 시스템에 적용하는것이 좋습니까?
3. 384효사점(균등분포)을 코리아NEWS 운세 시스템에 적용하는것이 좋습니까?
"""
import sys
import os
import io

# UTF-8 출력 설정
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.divination import (
    DivinationService,
    HEXAGRAM_REVERSE,
    TRIGRAM_NAMES,
    SEONCHEON_NAMES
)

# 64괘 이름 데이터
HEXAGRAM_NAMES = {
    1: ("건", "乾", "건위천", "하늘의 강건함"),
    2: ("곤", "坤", "곤위지", "땅의 순응"),
    3: ("준", "屯", "수뢰준", "시작의 어려움"),
    4: ("몽", "蒙", "산수몽", "어리석음/교육"),
    5: ("수", "需", "수천수", "기다림"),
    6: ("송", "訟", "천수송", "다툼"),
    7: ("사", "師", "지수사", "군대/리더십"),
    8: ("비", "比", "수지비", "친밀함"),
    9: ("소축", "小畜", "풍천소축", "작은 축적"),
    10: ("리", "履", "천택리", "밟음/예절"),
    11: ("태", "泰", "지천태", "태평/형통"),
    12: ("비", "否", "천지비", "막힘"),
    13: ("동인", "同人", "천화동인", "함께함"),
    14: ("대유", "大有", "화천대유", "크게 소유"),
    15: ("겸", "謙", "지산겸", "겸손"),
    16: ("예", "豫", "뇌지예", "기쁨/준비"),
    17: ("수", "隨", "택뢰수", "따름"),
    18: ("고", "蠱", "산풍고", "부패/개혁"),
    19: ("임", "臨", "지택임", "다가감"),
    20: ("관", "觀", "풍지관", "관찰"),
    21: ("서합", "噬嗑", "화뢰서합", "씹어 합침"),
    22: ("비", "賁", "산화비", "꾸밈"),
    23: ("박", "剝", "산지박", "벗겨짐"),
    24: ("복", "復", "지뢰복", "돌아옴"),
    25: ("무망", "無妄", "천뢰무망", "무망/순수"),
    26: ("대축", "大畜", "산천대축", "크게 축적"),
    27: ("이", "頤", "산뢰이", "기름/양육"),
    28: ("대과", "大過", "택풍대과", "크게 지나침"),
    29: ("감", "坎", "감위수", "험난함"),
    30: ("리", "離", "리위화", "밝음/붙음"),
    31: ("함", "咸", "택산함", "감응"),
    32: ("항", "恒", "뇌풍항", "항상함"),
    33: ("둔", "遯", "천산둔", "물러남"),
    34: ("대장", "大壯", "뇌천대장", "크게 강함"),
    35: ("진", "晉", "화지진", "나아감"),
    36: ("명이", "明夷", "지화명이", "밝음이 상함"),
    37: ("가인", "家人", "풍화가인", "가정"),
    38: ("규", "睽", "화택규", "어긋남"),
    39: ("건", "蹇", "수산건", "절름발이/어려움"),
    40: ("해", "解", "뇌수해", "풀림"),
    41: ("손", "損", "산택손", "덜어냄"),
    42: ("익", "益", "풍뢰익", "더함"),
    43: ("쾌", "夬", "택천쾌", "결단"),
    44: ("구", "姤", "천풍구", "만남"),
    45: ("췌", "萃", "택지췌", "모임"),
    46: ("승", "升", "지풍승", "올라감"),
    47: ("곤", "困", "택수곤", "곤궁함"),
    48: ("정", "井", "수풍정", "우물"),
    49: ("혁", "革", "택화혁", "변혁"),
    50: ("정", "鼎", "화풍정", "솥"),
    51: ("진", "震", "진위뢰", "우레/움직임"),
    52: ("간", "艮", "간위산", "그침"),
    53: ("점", "漸", "풍산점", "점진"),
    54: ("귀매", "歸妹", "뇌택귀매", "여자가 시집감"),
    55: ("풍", "豐", "뇌화풍", "풍성함"),
    56: ("려", "旅", "화산려", "나그네"),
    57: ("손", "巽", "손위풍", "바람/들어감"),
    58: ("태", "兌", "태위택", "기쁨"),
    59: ("환", "渙", "풍수환", "흩어짐"),
    60: ("절", "節", "수택절", "절제"),
    61: ("중부", "中孚", "풍택중부", "중심의 믿음"),
    62: ("소과", "小過", "뇌산소과", "작게 지나침"),
    63: ("기제", "既濟", "수화기제", "이미 건넘"),
    64: ("미제", "未濟", "화수미제", "아직 건너지 못함"),
}

# 효 위치 이름
YAO_NAMES = {
    1: "초효(初爻)",
    2: "이효(二爻)",
    3: "삼효(三爻)",
    4: "사효(四爻)",
    5: "오효(五爻)",
    6: "상효(上爻)"
}

# 길흉 판단 (기본 해석)
FORTUNE_INTERPRETATIONS = {
    # 대길(5)
    1: (5, "대길", "하늘의 기운, 강건함. 용기있게 나아가라."),
    11: (5, "대길", "태평의 괘. 하늘과 땅이 조화롭다."),
    14: (5, "대길", "크게 소유함. 하늘이 돕는다."),
    42: (5, "대길", "더함의 괘. 위에서 아래로 은혜가 내린다."),

    # 길(4)
    2: (4, "길", "땅의 기운, 순응. 순리를 따르라."),
    15: (4, "길", "겸손의 괘. 낮추면 높아진다."),
    19: (4, "길", "다가감의 괘. 때가 왔다."),
    24: (4, "길", "돌아옴의 괘. 새 출발이 길하다."),
    26: (4, "길", "크게 축적함. 실력을 기르라."),
    31: (4, "길", "감응의 괘. 마음이 통한다."),
    32: (4, "길", "항상함의 괘. 변치 않으면 길하다."),
    35: (4, "길", "나아감의 괘. 때가 무르익었다."),
    40: (4, "길", "풀림의 괘. 어려움이 해소된다."),
    43: (4, "길", "결단의 괘. 과감히 결정하라."),
    46: (4, "길", "올라감의 괘. 점진적 상승이다."),
    49: (4, "길", "변혁의 괘. 때가 되면 바꿔야 한다."),
    53: (4, "길", "점진의 괘. 서두르지 말라."),
    58: (4, "길", "기쁨의 괘. 즐거운 일이 있다."),
    61: (4, "길", "믿음의 괘. 진심이 통한다."),

    # 평(3)
    63: (3, "평", "이미 건넜으나 끝까지 조심하라."),
    64: (3, "평", "아직 건너지 못함. 준비가 더 필요하다."),

    # 흉(2)
    12: (2, "흉", "막힘의 괘. 때가 아니니 기다리라."),
    23: (2, "흉", "벗겨짐의 괘. 손실을 조심하라."),
    29: (2, "흉", "험난함의 괘. 신중히 처신하라."),
    36: (2, "흉", "밝음이 상함. 숨어서 지혜를 기르라."),
    39: (2, "흉", "어려움의 괘. 물러날 때를 알라."),
    47: (2, "흉", "곤궁함의 괘. 어려운 시기이나 때가 오면 풀린다."),
}


def draw_hexagram_visual(lines):
    """괘상 시각화"""
    result = []
    for i in range(5, -1, -1):
        line = lines[i]
        pos = i + 1
        if line.type == "yang":
            bar = "======="
        else:
            bar = "=== ==="
        result.append(f"    {pos}효: {bar}")
    return "\n".join(result)


def get_fortune(hex_num):
    """길흉 판단"""
    if hex_num in FORTUNE_INTERPRETATIONS:
        return FORTUNE_INTERPRETATIONS[hex_num]
    return (3, "평", "상황을 살피고 신중히 판단하라.")


def interpret_traditional_result(result, question_num, question):
    """정통 384효 점 결과 해석"""
    hex_num = result.hexagram_number
    hex_info = HEXAGRAM_NAMES.get(hex_num, ("?", "?", "?", "?"))
    yao_pos = result.reading_method.yao_position

    # 상하괘 정보
    if hex_num in HEXAGRAM_REVERSE:
        upper, lower = HEXAGRAM_REVERSE[hex_num]
        upper_name = TRIGRAM_NAMES[upper]
        lower_name = TRIGRAM_NAMES[lower]
    else:
        upper_name = ("?", "?", "?")
        lower_name = ("?", "?", "?")

    print(f"\n{'='*60}")
    print(f"  질문 {question_num}: {question}")
    print(f"{'='*60}")

    print(f"\n[축원문]")
    print(f"  천하언재시리오 지하언재시리니")
    print(f"  고지즉응하시고 감위수통하소서.")
    print(f"  건명(乾命) 주인님, 하늘에 뜻을 구합니다.")
    print(f"  \"{question}\"")

    print(f"\n[점괘 과정]")
    print(f"  1. 태극(1) 설정")
    print(f"  2. 49개 서죽 분할 → 하괘 결정")
    print(f"  3. 49개 서죽 분할 → 상괘 결정")
    print(f"  4. 49개 서죽 분할 → 효위 결정")

    print(f"\n[득괘]")
    print(f"  제{hex_num}괘 {hex_info[2]}({hex_info[1]})")
    print(f"  상괘: {upper_name[0]}({upper_name[1]}) {upper_name[2]}")
    print(f"  하괘: {lower_name[0]}({lower_name[1]}) {lower_name[2]}")

    print(f"\n[괘상]")
    print(draw_hexagram_visual(result.lines))

    print(f"\n[효위]")
    print(f"  {YAO_NAMES[yao_pos]} ← 이 효사로 해석")

    # 길흉 판단
    score, fortune, meaning = get_fortune(hex_num)

    print(f"\n[점술적 해석]")
    print(f"  괘의 의미: {hex_info[3]}")
    print(f"  길흉: {fortune} ({score}점)")
    print(f"  해석: {meaning}")

    # 효위에 따른 추가 해석
    if yao_pos <= 2:
        stage = "초기 단계"
        advice = "시작이 중요하니 기초를 튼튼히 하라."
    elif yao_pos <= 4:
        stage = "중간 단계"
        advice = "핵심 시기이니 중심을 잡고 나아가라."
    else:
        stage = "완성 단계"
        advice = "마무리가 중요하니 끝까지 신중하라."

    print(f"  단계: {stage} ({yao_pos}효)")
    print(f"  조언: {advice}")

    return hex_num, yao_pos, score, fortune


def main():
    service = DivinationService()

    questions = [
        "시초점을 코리아NEWS 운세 시스템에 적용하는것이 좋습니까?",
        "동전점을 코리아NEWS 운세 시스템에 적용하는것이 좋습니까?",
        "384효사점(균등분포)을 코리아NEWS 운세 시스템에 적용하는것이 좋습니까?"
    ]

    print("\n" + "=" * 60)
    print("    정통 384효 점술법 (傳統 三百八十四爻 占術法)")
    print("    - 조주역학회 정통 기법 -")
    print("=" * 60)

    results = []

    for i, q in enumerate(questions, 1):
        # 정통 384효 점술 실행
        result = service.traditional_384_divination()
        hex_num, yao_pos, score, fortune = interpret_traditional_result(result, i, q)
        results.append({
            "question": q,
            "hexagram": hex_num,
            "yao": yao_pos,
            "score": score,
            "fortune": fortune,
            "hex_name": HEXAGRAM_NAMES.get(hex_num, ("?", "?", "?", "?"))
        })

    # 최종 비교
    print("\n" + "=" * 60)
    print("    [최종 비교표]")
    print("=" * 60)

    print(f"\n{'선택지':<30} | {'괘':<20} | {'효':<8} | {'길흉':<8}")
    print("-" * 70)

    options = ["시초점", "동전점", "384효사점(균등)"]
    for i, r in enumerate(results):
        hex_info = r["hex_name"]
        print(f"{options[i]:<30} | 제{r['hexagram']}괘 {hex_info[2]:<12} | {r['yao']}효 | {r['fortune']}({r['score']})")

    # 하늘의 답
    print("\n" + "=" * 60)
    print("    [하늘의 답 (天意)]")
    print("=" * 60)

    best_idx = max(range(len(results)), key=lambda i: results[i]["score"])
    best = results[best_idx]

    print(f"\n  하늘이 가장 길하게 본 선택:")
    print(f"  → {options[best_idx]} ({best['fortune']}, {best['score']}점)")
    print(f"     제{best['hexagram']}괘 {best['hex_name'][2]} {best['yao']}효")

    print(f"\n  [각 선택에 대한 천의]")
    for i, r in enumerate(results):
        if r["score"] >= 4:
            verdict = "길(吉) - 하늘이 허락하시니라"
        elif r["score"] >= 3:
            verdict = "평(平) - 가하되 신중하라"
        else:
            verdict = "흉(凶) - 때가 아니니라"
        print(f"    {options[i]}: {verdict}")


if __name__ == "__main__":
    main()

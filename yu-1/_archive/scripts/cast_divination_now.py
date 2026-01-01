# -*- coding: utf-8 -*-
"""
실제 점술 실행 스크립트
주인님의 세 가지 질문에 대한 점을 칩니다.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.divination import DivinationService, ReadingType, TRIGRAM_NAMES, HEXAGRAM_REVERSE

# 64괘 이름 데이터
HEXAGRAM_NAMES = {
    1: ("건", "乾", "건위천", "하늘"),
    2: ("곤", "坤", "곤위지", "땅"),
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
    63: ("기제", "旣濟", "수화기제", "이미 건넘"),
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

# 효 이름 (양/음)
def get_yao_name(position, is_yang):
    prefixes = {1: "초", 2: "", 3: "", 4: "", 5: "", 6: "상"}
    numbers = {1: "", 2: "이", 3: "삼", 4: "사", 5: "오", 6: ""}

    if is_yang:
        suffix = "구(九)" if position != 1 and position != 6 else ("구(九)" if position == 6 else "구(初九)")
    else:
        suffix = "육(六)" if position != 1 and position != 6 else ("육(六)" if position == 6 else "육(初六)")

    if position == 1:
        return f"초{'구' if is_yang else '육'}(初{'九' if is_yang else '六'})"
    elif position == 6:
        return f"상{'구' if is_yang else '육'}(上{'九' if is_yang else '六'})"
    else:
        num_kr = ["", "", "이", "삼", "사", "오"][position]
        num_hanja = ["", "", "二", "三", "四", "五"][position]
        return f"{'구' if is_yang else '육'}{num_kr}({'九' if is_yang else '六'}{num_hanja})"


def draw_hexagram(lines):
    """괘상 그리기"""
    result = []
    for i in range(5, -1, -1):  # 상효부터 초효까지
        line = lines[i]
        pos = i + 1
        if line.type == "yang":
            if line.changing:
                result.append(f"  {pos}효: ======= O (노양9, 변)")
            else:
                result.append(f"  {pos}효: ======= - (소양7)")
        else:
            if line.changing:
                result.append(f"  {pos}효: === === X (노음6, 변)")
            else:
                result.append(f"  {pos}효: === === - (소음8)")
    return "\n".join(result)


def interpret_result(result, question_num):
    """결과 해석"""
    hex_num = result.hexagram_number
    hex_info = HEXAGRAM_NAMES.get(hex_num, ("?", "?", "?", "?"))

    reading = result.reading_method
    changing_count = len(result.changing_lines)

    # 상하괘 정보
    if hex_num in HEXAGRAM_REVERSE:
        upper, lower = HEXAGRAM_REVERSE[hex_num]
        upper_info = TRIGRAM_NAMES[upper]
        lower_info = TRIGRAM_NAMES[lower]
    else:
        upper_info = ("?", "?", "?")
        lower_info = ("?", "?", "?")

    print(f"\n{'='*60}")
    print(f"  질문 {question_num} 점괘 결과")
    print(f"{'='*60}")

    print(f"\n[괘상]")
    print(f"  {upper_info[0]}({upper_info[1]}) - 상괘")
    print(draw_hexagram(result.lines))
    print(f"  {lower_info[0]}({lower_info[1]}) - 하괘")

    print(f"\n[득괘]")
    print(f"  제{hex_num}괘 {hex_info[2]}({hex_info[1]})")
    print(f"  의미: {hex_info[3]}")

    # 변효 정보
    print(f"\n[변효]")
    if changing_count == 0:
        print(f"  변효 없음 - 괘사(卦辭)로 해석")
    else:
        changing_str = ", ".join([f"제{p}효" for p in result.changing_lines])
        print(f"  {changing_count}개 변효: {changing_str}")

        # 변괘 정보
        if result.transformed_hexagram:
            trans_info = HEXAGRAM_NAMES.get(result.transformed_hexagram, ("?", "?", "?", "?"))
            print(f"  변괘: 제{result.transformed_hexagram}괘 {trans_info[2]}({trans_info[1]})")

    print(f"\n[해석 방법]")
    print(f"  {reading.description}")

    # 간단한 길흉 판단
    print(f"\n[점술적 해석]")

    # 괘별 기본 해석
    interpretations = {
        1: ("대길", "하늘의 기운, 강건함. 때가 무르익었으니 과감히 나아가라."),
        2: ("길", "땅의 기운, 순응. 때를 기다리며 순리를 따르라."),
        11: ("대길", "태평의 괘. 하늘과 땅이 조화롭다. 매우 길하다."),
        12: ("흉", "막힘의 괘. 때가 아니니 기다리라."),
        14: ("대길", "크게 소유함. 하늘이 돕는다."),
        15: ("길", "겸손의 괘. 낮추면 높아진다."),
        29: ("흉", "험난함의 괘. 신중히 처신하라."),
        30: ("길", "밝음의 괘. 올바름을 지키면 길하다."),
        31: ("길", "감응의 괘. 마음이 통한다."),
        32: ("길", "항상함의 괘. 변치 않으면 길하다."),
        47: ("흉", "곤궁함의 괘. 어려운 시기이나 때가 오면 풀린다."),
        49: ("길", "변혁의 괘. 때가 되면 바꿔야 한다."),
        63: ("평", "이미 건넜으나 끝까지 조심하라."),
        64: ("평", "아직 건너지 못함. 준비가 더 필요하다."),
    }

    default_interp = ("평", "상황을 살피고 신중히 판단하라.")
    fortune, meaning = interpretations.get(hex_num, default_interp)

    # 변효에 따른 추가 해석
    if changing_count == 0:
        extra = "변효가 없으니 현 상태를 유지하라."
    elif changing_count == 1:
        pos = result.changing_lines[0]
        if pos <= 2:
            extra = f"초반의 변화. 시작 단계의 움직임이 있다."
        elif pos <= 4:
            extra = f"중반의 변화. 핵심적인 전환점이다."
        else:
            extra = f"후반의 변화. 결말을 향해 간다."
    elif changing_count == 2:
        extra = "두 곳에서 변화. 상황이 복잡하니 위의 것을 따르라."
    elif changing_count == 3:
        extra = "세 곳에서 변화. 큰 전환기이니 본괘와 지괘를 함께 보라."
    elif changing_count >= 4:
        extra = "많은 변화. 상황이 급변하니 지괘의 뜻을 따르라."

    print(f"  길흉: {fortune}")
    print(f"  해석: {meaning}")
    print(f"  부연: {extra}")

    return fortune


def main():
    service = DivinationService()

    questions = [
        "시초점을 코리아NEWS 운세 시스템에 적용하는것이 좋습니까?",
        "동전점을 코리아NEWS 운세 시스템에 적용하는것이 좋습니까?",
        "384개효사점(균등분포)을 코리아NEWS 운세 시스템에 적용하는것이 좋습니까?"
    ]

    print("\n" + "=" * 60)
    print("       하늘에 여쭙니다 - 코리아NEWS 운세 시스템")
    print("=" * 60)

    results = {}

    # 각 질문에 대해 시초점과 동전점 둘 다 실행
    for i, q in enumerate(questions, 1):
        print(f"\n{'#'*60}")
        print(f"  질문 {i}: {q}")
        print(f"{'#'*60}")

        # 시초점
        print(f"\n>>> 시초점(蓍草占)으로 점을 칩니다...")
        shicho_result = service.shicho_divination()
        shicho_fortune = interpret_result(shicho_result, f"{i}-A (시초점)")

        # 동전점
        print(f"\n>>> 동전점(擲錢占)으로 점을 칩니다...")
        coin_result = service.simple_divination()
        coin_fortune = interpret_result(coin_result, f"{i}-B (동전점)")

        results[i] = {
            "question": q,
            "shicho": (shicho_result, shicho_fortune),
            "coin": (coin_result, coin_fortune)
        }

    # 최종 비교
    print("\n" + "=" * 60)
    print("       [최종 비교표]")
    print("=" * 60)

    fortune_score = {"대길": 5, "길": 4, "평": 3, "흉": 2, "대흉": 1}

    print(f"\n{'옵션':<20} | {'시초점':<12} | {'동전점':<12} | {'평균':<8}")
    print("-" * 60)

    option_scores = {}
    for i in range(1, 4):
        option_name = ["시초점", "동전점", "384효사점"][i-1]
        shicho_f = results[i]["shicho"][1]
        coin_f = results[i]["coin"][1]

        shicho_s = fortune_score.get(shicho_f, 3)
        coin_s = fortune_score.get(coin_f, 3)
        avg = (shicho_s + coin_s) / 2

        option_scores[option_name] = avg
        print(f"{option_name:<20} | {shicho_f}({shicho_s}점){'':<4} | {coin_f}({coin_s}점){'':<4} | {avg:.1f}점")

    # 최종 판정
    print("\n" + "=" * 60)
    print("       [하늘의 답]")
    print("=" * 60)

    best_option = max(option_scores, key=option_scores.get)
    best_score = option_scores[best_option]

    print(f"\n  하늘이 가장 길하게 본 선택: {best_option} ({best_score:.1f}점)")

    print("\n  [각 선택에 대한 천의(天意)]")
    for opt, score in sorted(option_scores.items(), key=lambda x: -x[1]):
        if score >= 4:
            verdict = "길(吉) - 하늘이 허락하시니라"
        elif score >= 3:
            verdict = "평(平) - 가하되 신중하라"
        else:
            verdict = "흉(凶) - 때가 아니니라"
        print(f"    {opt}: {verdict}")


if __name__ == "__main__":
    main()

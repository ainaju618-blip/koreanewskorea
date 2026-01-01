# -*- coding: utf-8 -*-
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.divination import DivinationService, HEXAGRAM_REVERSE

# 64괘 이름 (한글만)
GUA_NAMES = {
    1: "건위천(건)", 2: "곤위지(곤)", 3: "수뢰준(준)", 4: "산수몽(몽)",
    5: "수천수(수)", 6: "천수송(송)", 7: "지수사(사)", 8: "수지비(비)",
    9: "풍천소축", 10: "천택리(리)", 11: "지천태(태)-대길", 12: "천지비(비)-막힘",
    13: "천화동인", 14: "화천대유-대길", 15: "지산겸-길", 16: "뇌지예(예)",
    17: "택뢰수(수)", 18: "산풍고(고)", 19: "지택임-길", 20: "풍지관(관)",
    21: "화뢰서합", 22: "산화비(비)", 23: "산지박-흉", 24: "지뢰복-길",
    25: "천뢰무망", 26: "산천대축-길", 27: "산뢰이(이)", 28: "택풍대과",
    29: "감위수-험난", 30: "리위화(리)", 31: "택산함-길", 32: "뇌풍항-길",
    33: "천산둔(둔)", 34: "뇌천대장", 35: "화지진-나아감", 36: "지화명이-흉",
    37: "풍화가인", 38: "화택규(규)", 39: "수산건-어려움", 40: "뇌수해-풀림",
    41: "산택손(손)", 42: "풍뢰익-대길", 43: "택천쾌-결단", 44: "천풍구(구)",
    45: "택지췌(췌)", 46: "지풍승-올라감", 47: "택수곤-곤궁", 48: "수풍정(정)",
    49: "택화혁-변혁", 50: "화풍정(정)", 51: "진위뢰(진)", 52: "간위산(간)",
    53: "풍산점-점진", 54: "뇌택귀매", 55: "뇌화풍(풍)", 56: "화산려(려)",
    57: "손위풍(손)", 58: "태위택-기쁨", 59: "풍수환(환)", 60: "수택절(절)",
    61: "풍택중부-믿음", 62: "뇌산소과", 63: "수화기제-완성", 64: "화수미제-미완"
}

# 길흉 매핑
FORTUNE_MAP = {
    1: 5, 2: 4, 11: 5, 12: 2, 14: 5, 15: 4, 19: 4, 23: 2, 24: 4,
    26: 4, 29: 2, 31: 4, 32: 4, 35: 4, 36: 2, 39: 2, 40: 4, 42: 5,
    43: 4, 46: 4, 47: 2, 49: 4, 53: 4, 58: 4, 61: 4, 63: 3, 64: 3
}

def get_fortune(hex_num, changing_count):
    base = FORTUNE_MAP.get(hex_num, 3)
    if changing_count == 0:
        return base
    elif changing_count <= 2:
        return base
    elif changing_count == 3:
        return max(2, base - 1)  # 변화 많으면 불안정
    else:
        return max(2, base - 1)

def fortune_name(score):
    if score >= 5: return "DAE-GIL(5)"
    elif score >= 4: return "GIL(4)"
    elif score >= 3: return "PYEONG(3)"
    else: return "HYUNG(2)"

def draw_gua(lines):
    result = []
    for i in range(5, -1, -1):
        line = lines[i]
        pos = i + 1
        if line.type == "yang":
            mark = "O" if line.changing else "-"
            result.append(f"  {pos}: ======= {mark}")
        else:
            mark = "X" if line.changing else "-"
            result.append(f"  {pos}: === === {mark}")
    return "\n".join(result)

def cast_and_interpret(service, method, question_num, method_name):
    if method == "shicho":
        result = service.shicho_divination()
    else:
        result = service.simple_divination()

    hex_num = result.hexagram_number
    gua_name = GUA_NAMES.get(hex_num, f"Gua-{hex_num}")
    changing = result.changing_lines
    changing_count = len(changing)

    fortune = get_fortune(hex_num, changing_count)

    print(f"\n[Q{question_num} - {method_name}]")
    print(f"  Gua #{hex_num}: {gua_name}")
    print(draw_gua(result.lines))

    if changing_count > 0:
        print(f"  Changing: {changing_count}lines {changing}")
        if result.transformed_hexagram:
            trans_name = GUA_NAMES.get(result.transformed_hexagram, f"Gua-{result.transformed_hexagram}")
            print(f"  -> Transformed: #{result.transformed_hexagram} {trans_name}")
    else:
        print(f"  Changing: None (stable)")

    print(f"  Fortune: {fortune_name(fortune)}")
    return fortune

def main():
    service = DivinationService()

    questions = [
        "Shicho(SiChoJum) for KoreaNews?",
        "Coin(DongJunJum) for KoreaNews?",
        "384Yao(Uniform) for KoreaNews?"
    ]

    print("=" * 50)
    print("  DIVINATION: Which algorithm for KoreaNews?")
    print("=" * 50)

    scores = {1: [], 2: [], 3: []}

    for i, q in enumerate(questions, 1):
        print(f"\n{'#' * 50}")
        print(f"  Q{i}: {q}")
        print("#" * 50)

        # Shicho
        s1 = cast_and_interpret(service, "shicho", i, "SHICHO")
        scores[i].append(s1)

        # Coin
        s2 = cast_and_interpret(service, "coin", i, "COIN")
        scores[i].append(s2)

    # Summary
    print("\n" + "=" * 50)
    print("  SUMMARY")
    print("=" * 50)

    print(f"\n{'Option':<25} | {'Shicho':<10} | {'Coin':<10} | {'Avg':<8}")
    print("-" * 55)

    options = ["1.Shicho", "2.Coin", "3.384Yao"]
    avgs = {}

    for i in range(1, 4):
        s1, s2 = scores[i]
        avg = (s1 + s2) / 2
        avgs[options[i-1]] = avg
        print(f"{options[i-1]:<25} | {fortune_name(s1):<10} | {fortune_name(s2):<10} | {avg:.1f}")

    print("\n" + "=" * 50)
    print("  HEAVEN'S ANSWER")
    print("=" * 50)

    best = max(avgs, key=avgs.get)
    print(f"\n  Best choice: {best} (score: {avgs[best]:.1f})")

    for opt, score in sorted(avgs.items(), key=lambda x: -x[1]):
        if score >= 4:
            verdict = "GIL - Heaven approves"
        elif score >= 3:
            verdict = "PYEONG - Acceptable"
        else:
            verdict = "HYUNG - Not recommended"
        print(f"    {opt}: {verdict}")

if __name__ == "__main__":
    main()

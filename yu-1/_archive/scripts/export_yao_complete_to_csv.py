"""
yao_complete.py의 384효 데이터를 컨설팅 포맷 CSV로 변환
"""

import csv
import json
import sys
from pathlib import Path

# 프로젝트 루트 추가
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# 384효 데이터 임포트
from app.data.yao_complete import YAO_DATA

# 64괘 기본 정보
GUA_INFO = {
    1: ("건괘", "乾"), 2: ("곤괘", "坤"), 3: ("준괘", "屯"), 4: ("몽괘", "蒙"),
    5: ("수괘", "需"), 6: ("송괘", "訟"), 7: ("사괘", "師"), 8: ("비괘", "比"),
    9: ("소축괘", "小畜"), 10: ("리괘", "履"), 11: ("태괘", "泰"), 12: ("비괘", "否"),
    13: ("동인괘", "同人"), 14: ("대유괘", "大有"), 15: ("겸괘", "謙"), 16: ("예괘", "豫"),
    17: ("수괘", "隨"), 18: ("고괘", "蠱"), 19: ("임괘", "臨"), 20: ("관괘", "觀"),
    21: ("서합괘", "噬嗑"), 22: ("비괘", "賁"), 23: ("박괘", "剝"), 24: ("복괘", "復"),
    25: ("무망괘", "无妄"), 26: ("대축괘", "大畜"), 27: ("이괘", "頤"), 28: ("대과괘", "大過"),
    29: ("감괘", "坎"), 30: ("리괘", "離"), 31: ("함괘", "咸"), 32: ("항괘", "恆"),
    33: ("둔괘", "遯"), 34: ("대장괘", "大壯"), 35: ("진괘", "晉"), 36: ("명이괘", "明夷"),
    37: ("가인괘", "家人"), 38: ("규괘", "睽"), 39: ("건괘", "蹇"), 40: ("해괘", "解"),
    41: ("손괘", "損"), 42: ("익괘", "益"), 43: ("쾌괘", "夬"), 44: ("구괘", "姤"),
    45: ("췌괘", "萃"), 46: ("승괘", "升"), 47: ("곤괘", "困"), 48: ("정괘", "井"),
    49: ("혁괘", "革"), 50: ("정괘", "鼎"), 51: ("진괘", "震"), 52: ("간괘", "艮"),
    53: ("점괘", "漸"), 54: ("귀매괘", "歸妹"), 55: ("풍괘", "豐"), 56: ("려괘", "旅"),
    57: ("손괘", "巽"), 58: ("태괘", "兌"), 59: ("환괘", "渙"), 60: ("절괘", "節"),
    61: ("중부괘", "中孚"), 62: ("소과괘", "小過"), 63: ("기제괘", "既濟"), 64: ("미제괘", "未濟"),
}

# 효 위치 이름 (정식 표기)
YAO_POSITIONS = {
    1: ("초효(初九)", "초효(初六)"),
    2: ("이효(九二)", "이효(六二)"),
    3: ("삼효(九三)", "삼효(六三)"),
    4: ("사효(九四)", "사효(六四)"),
    5: ("오효(九五)", "오효(六五)"),
    6: ("상효(上九)", "상효(上六)"),
}

# 이미지 심볼 생성
IMAGE_SYMBOLS = {
    (1, 1): "땅속에 숨은 황금용", (1, 2): "들판 위 황금용", (1, 3): "하늘 내려다보는 용",
    (1, 4): "심연 위 도약하는 용", (1, 5): "하늘 높이 나는 황금용", (1, 6): "하늘 높이 날다 추락하는 용",
    (2, 1): "서리 밟고 얼음 오는 땅", (2, 2): "넓고 곧은 대지", (2, 3): "땅속에 빛나는 보석",
    (2, 4): "묶인 주머니", (2, 5): "누런 옷을 입은 군자", (2, 6): "들판에서 싸우는 두 용",
    (14, 1): "황금 창고 앞에 선 사람", (14, 2): "물건 가득 실은 큰 수레",
    (14, 3): "천자에게 선물 바치는 제후", (14, 4): "빛을 감춘 태양",
    (14, 5): "사람들에게 둘러싸인 지도자", (14, 6): "태양이 하늘 위에 빛남",
}

GUA_IMAGE_PATTERNS = {
    1: "용", 2: "땅", 3: "구름과 천둥", 4: "산 아래 샘", 5: "구름 낀 하늘",
    6: "하늘 아래 물", 7: "땅속의 물", 8: "물 위의 땅", 9: "바람 위의 하늘",
    10: "호랑이 꼬리", 11: "땅과 하늘의 조화", 12: "막힌 하늘과 땅",
    13: "하늘 아래 불", 14: "하늘 위의 태양", 15: "땅 아래 산", 16: "땅 위의 천둥",
    17: "우뢰 위의 연못", 18: "산 아래 바람", 19: "연못 위의 땅", 20: "땅 위의 바람",
    21: "천둥과 번개", 22: "산 아래 불", 23: "산 위의 땅", 24: "땅 아래 천둥",
    25: "하늘 아래 천둥", 26: "산 아래 하늘", 27: "산 아래 천둥", 28: "연못 아래 나무",
    29: "물 위의 물", 30: "불 위의 불", 31: "산 위의 연못", 32: "천둥 아래 바람",
    33: "하늘 아래 산", 34: "천둥 위의 하늘", 35: "땅 위의 불", 36: "땅 아래 불",
    37: "바람 위의 불", 38: "불 위의 연못", 39: "산 위의 물", 40: "천둥 위의 물",
    41: "산 아래 연못", 42: "바람 위의 천둥", 43: "하늘 위의 연못", 44: "하늘 아래 바람",
    45: "땅 위의 연못", 46: "땅 아래 바람", 47: "물 위의 연못", 48: "바람 위의 물",
    49: "불 위의 연못", 50: "바람 위의 불", 51: "천둥 위의 천둥", 52: "산 위의 산",
    53: "산 위의 바람", 54: "천둥 위의 연못", 55: "천둥 위의 불", 56: "산 위의 불",
    57: "바람 위의 바람", 58: "연못 위의 연못", 59: "바람 위의 물", 60: "물 위의 연못",
    61: "바람 위의 연못", 62: "산 위의 천둥", 63: "물 위의 불", 64: "불 위의 물",
}

YAO_SITUATIONS = {
    1: "시작하는", 2: "드러나는", 3: "노력하는",
    4: "선택하는", 5: "정점의", 6: "마무리하는"
}


def get_image_symbol(gua_num: int, yao_num: int) -> str:
    """이미지 심볼 생성"""
    if (gua_num, yao_num) in IMAGE_SYMBOLS:
        return IMAGE_SYMBOLS[(gua_num, yao_num)]
    pattern = GUA_IMAGE_PATTERNS.get(gua_num, "변화의 기운")
    situation = YAO_SITUATIONS.get(yao_num, "")
    return f"{situation} {pattern}"


def get_direction(score: int) -> str:
    """점수에 따른 방향 결정"""
    if score >= 70:
        return "상승"
    elif score >= 40:
        return "정체"
    else:
        return "하강"


def get_timing(yao_num: int) -> str:
    """효 위치에 따른 타이밍"""
    timings = {1: "초반", 2: "초중반", 3: "중반", 4: "중후반", 5: "후반", 6: "마무리"}
    return timings.get(yao_num, "중반")


def get_priority(score: int) -> str:
    """점수에 따른 우선순위"""
    if score >= 80:
        return "고"
    elif score >= 50:
        return "중"
    else:
        return "저"


def get_yao_position(yao_num: int, yao_name: str) -> str:
    """효 위치 정식 표기"""
    # yao_name에서 음양 판단 (구=양, 육=음)
    is_yang = "구" in yao_name
    return YAO_POSITIONS[yao_num][0 if is_yang else 1]


def export_to_csv():
    """CSV 변환"""
    output_path = backend_dir / "data" / "384yao_complete.csv"

    rows = []
    missing = []

    for gua_num in range(1, 65):
        gua_name_ko, gua_name_hanja = GUA_INFO.get(gua_num, (f"괘{gua_num}", "卦"))

        for yao_num in range(1, 7):
            key = (gua_num, yao_num)

            if key not in YAO_DATA:
                missing.append(key)
                continue

            yao = YAO_DATA[key]

            row = {
                "id": f"{gua_num}-{yao_num}",
                "gua_number": gua_num,
                "gua_name_ko": gua_name_ko,
                "gua_name_hanja": gua_name_hanja,
                "yao_number": yao_num,
                "yao_position": get_yao_position(yao_num, yao.get("name", "")),
                "original_text": yao.get("text_hanja", ""),
                "original_meaning": f"{yao.get('name', '')} - {yao.get('text_kr', '')}",
                "direction": get_direction(yao.get("fortune_score", 50)),
                "score": yao.get("fortune_score", 50),
                "core_message": yao.get("interpretation", ""),
                "caution": f"{yao.get('fortune_category', '평')}운 - 신중히 판단하세요",
                "timing": get_timing(yao_num),
                "keywords": json.dumps(yao.get("keywords", []), ensure_ascii=False),
                "image_symbol": get_image_symbol(gua_num, yao_num),
                "age_target": "전연령",
                "priority": get_priority(yao.get("fortune_score", 50)),
            }

            rows.append(row)

    # CSV 저장
    fieldnames = [
        "id", "gua_number", "gua_name_ko", "gua_name_hanja",
        "yao_number", "yao_position", "original_text", "original_meaning",
        "direction", "score", "core_message", "caution", "timing",
        "keywords", "image_symbol", "age_target", "priority"
    ]

    with open(output_path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(rows)

    print(f"[OK] Exported {len(rows)} yao to {output_path}")

    if missing:
        print(f"[WARN] Missing {len(missing)} entries: {missing[:10]}...")

    # 통계
    print(f"\n[Statistics]")
    print(f"   Total: {len(rows)} / 384")
    print(f"   Coverage: {len(rows)/384*100:.1f}%")

    # 점수 분포
    score_dist = {"대길(90+)": 0, "길(70-89)": 0, "평(40-69)": 0, "흉(0-39)": 0}
    for row in rows:
        score = row["score"]
        if score >= 90:
            score_dist["대길(90+)"] += 1
        elif score >= 70:
            score_dist["길(70-89)"] += 1
        elif score >= 40:
            score_dist["평(40-69)"] += 1
        else:
            score_dist["흉(0-39)"] += 1

    print(f"\n   Fortune Distribution:")
    for cat, count in score_dist.items():
        print(f"      {cat}: {count} ({count/len(rows)*100:.1f}%)")


if __name__ == "__main__":
    print("[*] Exporting yao_complete.py to CSV...")
    print("=" * 50)
    export_to_csv()
    print("\n[Complete!]")

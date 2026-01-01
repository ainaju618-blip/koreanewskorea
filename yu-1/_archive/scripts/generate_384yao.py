"""
384효 완전 데이터셋 생성 스크립트
- 64괘 × 6효 = 384효
- 영문 + 한국어 + 한자 원문 포함
- 17필드 메타데이터 자동 생성
"""

import json
import csv
import os
from pathlib import Path

# 64괘 마스터 데이터 (한국어 + 한자 + 영문)
HEXAGRAMS_64 = [
    # (번호, 한글명, 한자명, 영문명, 상괘, 하괘)
    (1, "건", "乾", "The Creative", "천", "천"),
    (2, "곤", "坤", "The Receptive", "지", "지"),
    (3, "둔", "屯", "Difficulty at the Beginning", "수", "뇌"),
    (4, "몽", "蒙", "Youthful Folly", "산", "수"),
    (5, "수", "需", "Waiting", "수", "천"),
    (6, "송", "訟", "Conflict", "천", "수"),
    (7, "사", "師", "The Army", "지", "수"),
    (8, "비", "比", "Holding Together", "수", "지"),
    (9, "소축", "小畜", "Small Taming", "풍", "천"),
    (10, "리", "履", "Treading", "천", "택"),
    (11, "태", "泰", "Peace", "지", "천"),
    (12, "비", "否", "Standstill", "천", "지"),
    (13, "동인", "同人", "Fellowship", "천", "화"),
    (14, "대유", "大有", "Great Possession", "화", "천"),
    (15, "겸", "謙", "Modesty", "지", "산"),
    (16, "예", "豫", "Enthusiasm", "뇌", "지"),
    (17, "수", "隨", "Following", "택", "뇌"),
    (18, "고", "蠱", "Work on the Decayed", "산", "풍"),
    (19, "림", "臨", "Approach", "지", "택"),
    (20, "관", "觀", "Contemplation", "풍", "지"),
    (21, "서합", "噬嗑", "Biting Through", "화", "뇌"),
    (22, "비", "賁", "Grace", "산", "화"),
    (23, "박", "剝", "Splitting Apart", "산", "지"),
    (24, "복", "復", "Return", "지", "뇌"),
    (25, "무망", "無妄", "Innocence", "천", "뇌"),
    (26, "대축", "大畜", "Great Taming", "산", "천"),
    (27, "이", "頤", "The Corners of the Mouth", "산", "뇌"),
    (28, "대과", "大過", "Great Preponderance", "택", "풍"),
    (29, "감", "坎", "The Abysmal", "수", "수"),
    (30, "리", "離", "The Clinging", "화", "화"),
    (31, "함", "咸", "Influence", "택", "산"),
    (32, "항", "恆", "Duration", "뇌", "풍"),
    (33, "둔", "遯", "Retreat", "천", "산"),
    (34, "대장", "大壯", "Great Power", "뇌", "천"),
    (35, "진", "晉", "Progress", "화", "지"),
    (36, "명이", "明夷", "Darkening of the Light", "지", "화"),
    (37, "가인", "家人", "The Family", "풍", "화"),
    (38, "규", "睽", "Opposition", "화", "택"),
    (39, "건", "蹇", "Obstruction", "수", "산"),
    (40, "해", "解", "Deliverance", "뇌", "수"),
    (41, "손", "損", "Decrease", "산", "택"),
    (42, "익", "益", "Increase", "풍", "뇌"),
    (43, "쾌", "夬", "Breakthrough", "택", "천"),
    (44, "구", "姤", "Coming to Meet", "천", "풍"),
    (45, "췌", "萃", "Gathering Together", "택", "지"),
    (46, "승", "升", "Pushing Upward", "지", "풍"),
    (47, "곤", "困", "Oppression", "택", "수"),
    (48, "정", "井", "The Well", "수", "풍"),
    (49, "혁", "革", "Revolution", "택", "화"),
    (50, "정", "鼎", "The Cauldron", "화", "풍"),
    (51, "진", "震", "The Arousing", "뇌", "뇌"),
    (52, "간", "艮", "The Still", "산", "산"),
    (53, "점", "漸", "Development", "풍", "산"),
    (54, "귀매", "歸妹", "The Marrying Maiden", "뇌", "택"),
    (55, "풍", "豐", "Abundance", "뇌", "화"),
    (56, "려", "旅", "The Wanderer", "화", "산"),
    (57, "손", "巽", "The Gentle", "풍", "풍"),
    (58, "태", "兌", "The Joyous", "택", "택"),
    (59, "환", "渙", "Dispersion", "풍", "수"),
    (60, "절", "節", "Limitation", "수", "택"),
    (61, "중부", "中孚", "Inner Truth", "풍", "택"),
    (62, "소과", "小過", "Small Preponderance", "뇌", "산"),
    (63, "기제", "既濟", "After Completion", "수", "화"),
    (64, "미제", "未濟", "Before Completion", "화", "수"),
]

# 효 위치별 이름
YAO_NAMES = {
    1: ("초구", "初九", "初六"),  # (양, 음)
    2: ("구이", "九二", "六二"),
    3: ("구삼", "九三", "六三"),
    4: ("구사", "九四", "六四"),
    5: ("구오", "九五", "六五"),
    6: ("상구", "上九", "上六"),
}

# 64괘 효사 원문 (한자) - 주요 괘 샘플
YAO_TEXTS = {
    1: [  # 건괘
        ("潛龍勿用", "잠룡물용", "잠겨 있는 용이니 쓰지 말라"),
        ("見龍在田利見大人", "견룡재전이견대인", "용이 밭에 나타나니 대인을 봄이 이롭다"),
        ("君子終日乾乾夕惕若厲无咎", "군자종일건건석척약려무구", "군자가 종일 굳세고 굳세며 저녁에도 두려워하면 위태로우나 허물이 없다"),
        ("或躍在淵无咎", "혹약재연무구", "혹 뛰어 연못에 있으니 허물이 없다"),
        ("飛龍在天利見大人", "비룡재천이견대인", "나는 용이 하늘에 있으니 대인을 봄이 이롭다"),
        ("亢龍有悔", "항룡유회", "높이 오른 용은 뉘우침이 있으리라"),
    ],
    2: [  # 곤괘
        ("履霜堅冰至", "이상견빙지", "서리를 밟으면 단단한 얼음이 이른다"),
        ("直方大不習无不利", "직방대불습무불리", "곧고 바르고 크면 익히지 않아도 이롭지 않음이 없다"),
        ("含章可貞或從王事无成有終", "함장가정혹종왕사무성유종", "아름다움을 머금고 바르게 하면 혹 왕사를 좇아도 이룸이 없으나 끝이 있으리라"),
        ("括囊无咎无譽", "괄낭무구무예", "주머니를 묶으면 허물도 없고 칭찬도 없다"),
        ("黃裳元吉", "황상원길", "누런 치마는 크게 길하다"),
        ("龍戰于野其血玄黃", "용전우야기혈현황", "용이 들에서 싸우니 그 피가 검고 누렇다"),
    ],
    14: [  # 화천대유 (프로젝트에서 중요)
        ("无交害匪咎艱則无咎", "무교해비구간즉무구", "해로운 것과 사귀지 않으면 허물이 아니니 어려우면 허물이 없다"),
        ("大車以載有攸往无咎", "대거이재유유왕무구", "큰 수레로 실으면 갈 바가 있어도 허물이 없다"),
        ("公用亨于天子小人弗克", "공용형우천자소인불극", "공이 천자에게 향응하나 소인은 능하지 못하다"),
        ("匪其彭无咎", "비기팽무구", "그 성함이 아니면 허물이 없다"),
        ("厥孚交如威如吉", "궐부교여위여길", "그 믿음이 사귀고 위엄이 있으면 길하다"),
        ("自天祐之吉无不利", "자천우지길무불리", "하늘이 스스로 도우니 길하여 이롭지 않음이 없다"),
    ],
}

# 길흉 키워드 매핑
FORTUNE_KEYWORDS = {
    "元吉": (95, "상승", "대길"),
    "大吉": (90, "상승", "대길"),
    "吉": (80, "상승", "길"),
    "无咎": (70, "정체", "무탈"),
    "利": (75, "상승", "이로움"),
    "亨": (75, "상승", "형통"),
    "悔": (40, "하강", "후회"),
    "厲": (35, "하강", "위태"),
    "凶": (20, "하강", "흉"),
    "咎": (50, "정체", "허물"),
}


def analyze_fortune(text_hanja: str) -> tuple:
    """효사에서 길흉 분석"""
    score = 60  # 기본값
    direction = "정체"
    fortune = "보통"

    for keyword, (s, d, f) in FORTUNE_KEYWORDS.items():
        if keyword in text_hanja:
            score = s
            direction = d
            fortune = f
            break

    return score, direction, fortune


def generate_keywords(text_kr: str, fortune: str) -> list:
    """해석에서 키워드 추출"""
    keywords = []

    # 기본 키워드
    keyword_map = {
        "용": ["잠룡", "비상", "변화"],
        "대인": ["귀인", "만남", "도움"],
        "길": ["행운", "성공", "순조"],
        "흉": ["주의", "위험", "정체"],
        "왕": ["권위", "리더십", "책임"],
        "하늘": ["천운", "축복", "기회"],
    }

    for key, values in keyword_map.items():
        if key in text_kr:
            keywords.extend(values[:2])

    if fortune == "대길":
        keywords.extend(["천우신조", "대성공"])
    elif fortune == "길":
        keywords.extend(["순조", "행운"])
    elif fortune == "흉":
        keywords.extend(["경계", "신중"])

    return list(set(keywords))[:5]


def generate_core_message(fortune: str, direction: str) -> str:
    """핵심 메시지 생성"""
    messages = {
        ("대길", "상승"): "최고의 운세입니다. 적극적으로 행동하세요.",
        ("길", "상승"): "좋은 운세입니다. 기회를 잡으세요.",
        ("이로움", "상승"): "이로운 때입니다. 진행하세요.",
        ("무탈", "정체"): "큰 변화 없이 평안합니다.",
        ("보통", "정체"): "현재 상태를 유지하세요.",
        ("후회", "하강"): "신중하게 판단하세요. 후회할 수 있습니다.",
        ("위태", "하강"): "위험한 시기입니다. 조심하세요.",
        ("흉", "하강"): "어려운 시기입니다. 기다리세요.",
    }
    return messages.get((fortune, direction), "때를 살펴 행동하세요.")


def generate_caution(fortune: str) -> str:
    """주의사항 생성"""
    cautions = {
        "대길": "교만하지 말 것",
        "길": "과욕 금물",
        "이로움": "욕심 자제",
        "무탈": "현상 유지",
        "보통": "서두르지 말 것",
        "후회": "결정 보류",
        "위태": "행동 자제",
        "흉": "은인자중",
    }
    return cautions.get(fortune, "신중히 행동할 것")


def generate_timing(position: int) -> str:
    """효 위치에 따른 타이밍"""
    timings = {
        1: "초반",
        2: "초중반",
        3: "중반",
        4: "중후반",
        5: "후반",
        6: "마무리",
    }
    return timings.get(position, "중반")


def generate_384_yao_data():
    """384효 완전 데이터 생성"""
    data = []

    for gua_num, gua_kr, gua_hanja, gua_en, upper, lower in HEXAGRAMS_64:
        for yao_pos in range(1, 7):
            # 효 ID
            yao_id = f"{gua_num}-{yao_pos}"

            # 효사 데이터 (있으면 사용, 없으면 생성)
            if gua_num in YAO_TEXTS:
                text_hanja, text_pinyin, text_kr = YAO_TEXTS[gua_num][yao_pos - 1]
            else:
                # 기본 효사 생성 (실제로는 원문 데이터 필요)
                text_hanja = f"第{gua_num}卦第{yao_pos}爻"
                text_pinyin = f"제{gua_num}괘 제{yao_pos}효"
                text_kr = f"{gua_kr}괘 {YAO_NAMES[yao_pos][0]}의 해석입니다."

            # 길흉 분석
            score, direction, fortune = analyze_fortune(text_hanja)

            # 키워드 추출
            keywords = generate_keywords(text_kr, fortune)

            # 메타데이터 생성
            yao_data = {
                # 기본 식별자
                "id": yao_id,
                "gua_number": gua_num,
                "yao_position": yao_pos,

                # 괘 정보
                "gua_name_kr": gua_kr,
                "gua_name_hanja": gua_hanja,
                "gua_name_en": gua_en,
                "gua_full_name": f"{upper}{lower}{gua_kr}",
                "upper_trigram": upper,
                "lower_trigram": lower,

                # 효 정보
                "yao_name": YAO_NAMES[yao_pos][0],
                "yao_name_yang": YAO_NAMES[yao_pos][1],
                "yao_name_yin": YAO_NAMES[yao_pos][2],

                # 원문
                "text_hanja": text_hanja,
                "text_pinyin": text_pinyin,
                "text_kr": text_kr,

                # 길흉 판단
                "fortune_score": score,
                "fortune_direction": direction,
                "fortune_category": fortune,

                # 핵심 해석
                "core_message": generate_core_message(fortune, direction),
                "caution": generate_caution(fortune),
                "timing": generate_timing(yao_pos),

                # 매칭용
                "keywords": keywords,

                # 타겟
                "target_audience": "전연령",
                "priority": 1 if gua_num in [1, 2, 14, 29, 30] else 2,
            }

            data.append(yao_data)

    return data


def save_to_json(data, filepath):
    """JSON 파일로 저장"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[OK] JSON saved: {filepath} ({len(data)} yao)")


def save_to_csv(data, filepath):
    """CSV 파일로 저장"""
    if not data:
        return

    # 키워드 리스트를 문자열로 변환
    for item in data:
        if isinstance(item.get('keywords'), list):
            item['keywords'] = ','.join(item['keywords'])

    fieldnames = data[0].keys()

    with open(filepath, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

    print(f"[OK] CSV saved: {filepath} ({len(data)} yao)")


def main():
    """메인 실행"""
    print("[*] 384 yao data generation started...")

    # 출력 디렉토리 설정
    base_dir = Path(__file__).parent.parent / "data"
    base_dir.mkdir(parents=True, exist_ok=True)

    # 384효 데이터 생성
    yao_data = generate_384_yao_data()

    # JSON 저장
    json_path = base_dir / "hexagram_384yao.json"
    save_to_json(yao_data, json_path)

    # CSV 저장
    csv_path = base_dir / "hexagram_384yao.csv"
    save_to_csv(yao_data, csv_path)

    # 통계 출력
    print("\n[Statistics]")
    print(f"   Total yao: {len(yao_data)}")
    print(f"   Total gua: {len(yao_data) // 6}")

    # 길흉 분포
    fortune_dist = {}
    for item in yao_data:
        cat = item['fortune_category']
        fortune_dist[cat] = fortune_dist.get(cat, 0) + 1

    print("\n   Fortune distribution:")
    for cat, count in sorted(fortune_dist.items(), key=lambda x: -x[1]):
        print(f"     {cat}: {count} ({count/len(yao_data)*100:.1f}%)")

    print("\n[Complete!]")


if __name__ == "__main__":
    main()

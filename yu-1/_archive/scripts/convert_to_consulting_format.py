"""
384효 CSV를 컨설팅 포맷(17필드)으로 변환
"""

import csv
import json
from pathlib import Path

# 이미지 심볼 생성 (효 위치 + 괘 특성 기반)
IMAGE_SYMBOLS = {
    # 건괘(1) - 용 이미지
    (1, 1): "땅속에 숨은 황금용",
    (1, 2): "들판 위 황금용",
    (1, 3): "하늘 내려다보는 용",
    (1, 4): "심연 위 도약하는 용",
    (1, 5): "하늘 높이 나는 황금용",
    (1, 6): "하늘 높이 날다 추락하는 용",
    # 곤괘(2) - 땅 이미지
    (2, 1): "서리 밟고 얼음 오는 땅",
    (2, 2): "넓고 곧은 대지",
    (2, 3): "땅속에 빛나는 보석",
    (2, 4): "묶인 주머니",
    (2, 5): "누런 옷을 입은 군자",
    (2, 6): "들판에서 싸우는 두 용",
    # 대유괘(14) - 태양/풍요 이미지
    (14, 1): "황금 창고 앞에 선 사람",
    (14, 2): "물건 가득 실은 큰 수레",
    (14, 3): "천자에게 선물 바치는 제후",
    (14, 4): "빛을 감춘 태양",
    (14, 5): "사람들에게 둘러싸인 지도자",
    (14, 6): "태양이 하늘 위에 빛남",
}

# 괘별 기본 이미지 패턴
GUA_IMAGE_PATTERNS = {
    1: "용", 2: "땅", 3: "구름과 천둥", 4: "산 아래 샘",
    5: "구름 낀 하늘", 6: "하늘 아래 물", 7: "땅속의 물", 8: "물 위의 땅",
    9: "바람 위의 하늘", 10: "호랑이 꼬리", 11: "땅과 하늘의 조화", 12: "막힌 하늘과 땅",
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

# 효 위치별 상황
YAO_SITUATIONS = {
    1: "시작하는", 2: "드러나는", 3: "노력하는",
    4: "선택하는", 5: "정점의", 6: "마무리하는"
}


def generate_image_symbol(gua_num: int, yao_pos: int) -> str:
    """이미지 심볼 생성"""
    # 기존 정의된 이미지가 있으면 사용
    if (gua_num, yao_pos) in IMAGE_SYMBOLS:
        return IMAGE_SYMBOLS[(gua_num, yao_pos)]

    # 괘 패턴 + 효 상황으로 생성
    pattern = GUA_IMAGE_PATTERNS.get(gua_num, "변화의 기운")
    situation = YAO_SITUATIONS.get(yao_pos, "")
    return f"{situation} {pattern}"


def convert_priority(priority_num):
    """우선순위 변환 (1→고, 2→중, 3→저)"""
    mapping = {1: "고", 2: "중", 3: "저"}
    return mapping.get(priority_num, "중")


def format_keywords(keywords_str: str) -> str:
    """키워드를 JSON 배열 형식으로 변환"""
    if not keywords_str:
        return '["기다림","신중","때"]'

    keywords = [k.strip() for k in keywords_str.split(',') if k.strip()]
    if not keywords:
        return '["기다림","신중","때"]'

    return json.dumps(keywords, ensure_ascii=False)


def get_yao_position_name(yao_num: int, is_yang: bool = True) -> str:
    """효 위치 이름 생성"""
    positions = {
        1: ("초효(初九)", "초효(初六)"),
        2: ("이효(九二)", "이효(六二)"),
        3: ("삼효(九三)", "삼효(六三)"),
        4: ("사효(九四)", "사효(六四)"),
        5: ("오효(九五)", "오효(六五)"),
        6: ("상효(上九)", "상효(上六)"),
    }
    return positions[yao_num][0 if is_yang else 1]


def convert_to_consulting_format():
    """384효 CSV를 컨설팅 포맷으로 변환"""

    base_dir = Path(__file__).parent.parent / "data"
    input_file = base_dir / "hexagram_384yao.csv"
    output_file = base_dir / "384yao_complete.csv"

    # 기존 데이터 로드
    rows = []
    with open(input_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)

    print(f"[*] Loaded {len(rows)} rows from {input_file}")

    # 변환된 데이터
    converted = []

    for row in rows:
        gua_num = int(row['gua_number'])
        yao_num = int(row['yao_position'])

        # 컨설팅 포맷으로 변환
        new_row = {
            'id': row['id'],
            'gua_number': gua_num,
            'gua_name_ko': row['gua_name_kr'] + '괘',
            'gua_name_hanja': row['gua_name_hanja'],
            'yao_number': yao_num,
            'yao_position': get_yao_position_name(yao_num),
            'original_text': row['text_hanja'],
            'original_meaning': f"{row['text_pinyin']} - {row['text_kr']}",
            'direction': row['fortune_direction'],
            'score': int(row['fortune_score']),
            'core_message': row['core_message'],
            'caution': row['caution'],
            'timing': row['timing'],
            'keywords': format_keywords(row['keywords']),
            'image_symbol': generate_image_symbol(gua_num, yao_num),
            'age_target': row['target_audience'],
            'priority': convert_priority(int(row['priority'])),
        }

        converted.append(new_row)

    # CSV 저장
    fieldnames = [
        'id', 'gua_number', 'gua_name_ko', 'gua_name_hanja',
        'yao_number', 'yao_position', 'original_text', 'original_meaning',
        'direction', 'score', 'core_message', 'caution', 'timing',
        'keywords', 'image_symbol', 'age_target', 'priority'
    ]

    with open(output_file, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(converted)

    print(f"[OK] Converted to consulting format: {output_file}")
    print(f"[*] Total: {len(converted)} yao entries")

    # 샘플 출력
    print("\n[Sample - First 3 entries]")
    for row in converted[:3]:
        print(f"  {row['id']}: {row['gua_name_ko']} {row['yao_position']}")
        print(f"    원문: {row['original_text']}")
        print(f"    점수: {row['score']} / 방향: {row['direction']}")
        print(f"    이미지: {row['image_symbol']}")
        print()


if __name__ == "__main__":
    convert_to_consulting_format()

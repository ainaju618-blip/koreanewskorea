"""
384효 시드 데이터 (컨설팅 확정 CSV 포맷)
17개 필드 구조

사용법:
1. 이 파일의 HEXAGRAM_DATA로 빈 껍데기 384개 생성
2. CSV 파일(384yao_complete.csv)로 실제 데이터 임포트
3. 점진적으로 데이터 채움
"""

# 64괘 기본 정보 (괘번호 → 괘명)
GUA_INFO = {
    1: ("건괘", "乾"),
    2: ("곤괘", "坤"),
    3: ("준괘", "屯"),
    4: ("몽괘", "蒙"),
    5: ("수괘", "需"),
    6: ("송괘", "訟"),
    7: ("사괘", "師"),
    8: ("비괘", "比"),
    9: ("소축괘", "小畜"),
    10: ("리괘", "履"),
    11: ("태괘", "泰"),
    12: ("비괘", "否"),
    13: ("동인괘", "同人"),
    14: ("대유괘", "大有"),
    15: ("겸괘", "謙"),
    16: ("예괘", "豫"),
    17: ("수괘", "隨"),
    18: ("고괘", "蠱"),
    19: ("임괘", "臨"),
    20: ("관괘", "觀"),
    21: ("서합괘", "噬嗑"),
    22: ("비괘", "賁"),
    23: ("박괘", "剝"),
    24: ("복괘", "復"),
    25: ("무망괘", "无妄"),
    26: ("대축괘", "大畜"),
    27: ("이괘", "頤"),
    28: ("대과괘", "大過"),
    29: ("감괘", "坎"),
    30: ("리괘", "離"),
    31: ("함괘", "咸"),
    32: ("항괘", "恆"),
    33: ("둔괘", "遯"),
    34: ("대장괘", "大壯"),
    35: ("진괘", "晉"),
    36: ("명이괘", "明夷"),
    37: ("가인괘", "家人"),
    38: ("규괘", "睽"),
    39: ("건괘", "蹇"),
    40: ("해괘", "解"),
    41: ("손괘", "損"),
    42: ("익괘", "益"),
    43: ("쾌괘", "夬"),
    44: ("구괘", "姤"),
    45: ("췌괘", "萃"),
    46: ("승괘", "升"),
    47: ("곤괘", "困"),
    48: ("정괘", "井"),
    49: ("혁괘", "革"),
    50: ("정괘", "鼎"),
    51: ("진괘", "震"),
    52: ("간괘", "艮"),
    53: ("점괘", "漸"),
    54: ("귀매괘", "歸妹"),
    55: ("풍괘", "豐"),
    56: ("려괘", "旅"),
    57: ("손괘", "巽"),
    58: ("태괘", "兌"),
    59: ("환괘", "渙"),
    60: ("절괘", "節"),
    61: ("중부괘", "中孚"),
    62: ("소과괘", "小過"),
    63: ("기제괘", "既濟"),
    64: ("미제괘", "未濟"),
}

# 효 위치 이름
YAO_POSITIONS = {
    1: "초효",
    2: "이효",
    3: "삼효",
    4: "사효",
    5: "오효",
    6: "상효",
}


def generate_empty_384_data():
    """
    384개 빈 껍데기 데이터 생성
    실제 데이터는 CSV로 채움
    """
    data = []
    for gua_num in range(1, 65):
        gua_name_ko, gua_name_hanja = GUA_INFO.get(gua_num, (f"괘{gua_num}", "卦"))

        for yao_num in range(1, 7):
            yao_pos = YAO_POSITIONS[yao_num]

            data.append({
                "id": f"{gua_num}-{yao_num}",
                "gua_number": gua_num,
                "gua_name_ko": gua_name_ko,
                "gua_name_hanja": gua_name_hanja,
                "yao_number": yao_num,
                "yao_position": yao_pos,
                "original_text": "[원문 미입력]",
                "original_meaning": "[직역 미입력]",
                "direction": "정체",
                "score": 50,
                "core_message": "[핵심 메시지 미입력]",
                "caution": "[주의사항 미입력]",
                "timing": "중반",
                "keywords": [],
                "image_symbol": None,
                "age_target": "전연령",
                "priority": "중",
            })

    return data


# 샘플 데이터 (20개 - 실제 내용 포함)
SAMPLE_HEXAGRAM_DATA = [
    # 건괘 (1) - 6효
    {
        "id": "1-1",
        "gua_number": 1,
        "gua_name_ko": "건괘",
        "gua_name_hanja": "乾",
        "yao_number": 1,
        "yao_position": "초효(初九)",
        "original_text": "潛龍勿用",
        "original_meaning": "잠룡물용 - 숨은 용은 쓰지 말라",
        "direction": "정체",
        "score": 40,
        "core_message": "때를 기다리라, 인내의 시기",
        "caution": "서두르지 말라",
        "timing": "초반",
        "keywords": ["잠재", "인내", "대기", "숨김"],
        "image_symbol": "땅속에 숨은 황금용",
        "age_target": "전연령",
        "priority": "중",
    },
    {
        "id": "1-2",
        "gua_number": 1,
        "gua_name_ko": "건괘",
        "gua_name_hanja": "乾",
        "yao_number": 2,
        "yao_position": "이효(九二)",
        "original_text": "見龍在田,利見大人",
        "original_meaning": "견룡재전 이견대인 - 용이 밭에 나타나니 대인을 만남이 이롭다",
        "direction": "상승",
        "score": 75,
        "core_message": "귀인 등장, 기회 포착의 시기",
        "caution": "과신 금지",
        "timing": "중반",
        "keywords": ["귀인", "등장", "기회", "활동"],
        "image_symbol": "들판 위 황금용",
        "age_target": "전연령",
        "priority": "고",
    },
    {
        "id": "1-3",
        "gua_number": 1,
        "gua_name_ko": "건괘",
        "gua_name_hanja": "乾",
        "yao_number": 3,
        "yao_position": "삼효(九三)",
        "original_text": "君子終日乾乾,夕惕若厲,无咎",
        "original_meaning": "군자종일건건 석척약려 무구 - 군자가 종일 힘쓰고 저녁에도 경계하면 허물없다",
        "direction": "상승",
        "score": 65,
        "core_message": "부지런히 노력하되 경계를 늦추지 말라",
        "caution": "태만하면 화가 된다",
        "timing": "중반",
        "keywords": ["부지런", "경계", "노력", "위험"],
        "image_symbol": "하늘 내려다보는 용",
        "age_target": "MZ",
        "priority": "중",
    },
    {
        "id": "1-4",
        "gua_number": 1,
        "gua_name_ko": "건괘",
        "gua_name_hanja": "乾",
        "yao_number": 4,
        "yao_position": "사효(九四)",
        "original_text": "或躍在淵,无咎",
        "original_meaning": "혹약재연 무구 - 혹 뛰어 연못에 있으니 허물없다",
        "direction": "정체",
        "score": 55,
        "core_message": "도약의 기로, 신중한 선택 필요",
        "caution": "무모한 도전 금물",
        "timing": "중후반",
        "keywords": ["도약", "선택", "고민", "기로"],
        "image_symbol": "심연 위 도약하는 용",
        "age_target": "MZ",
        "priority": "중",
    },
    {
        "id": "1-5",
        "gua_number": 1,
        "gua_name_ko": "건괘",
        "gua_name_hanja": "乾",
        "yao_number": 5,
        "yao_position": "오효(九五)",
        "original_text": "飛龍在天,利見大人",
        "original_meaning": "비룡재천 이견대인 - 나는 용이 하늘에 있으니 대인을 만남이 이롭다",
        "direction": "상승",
        "score": 95,
        "core_message": "대길! 최고의 때, 뜻을 펼쳐라",
        "caution": "교만 금물",
        "timing": "후반",
        "keywords": ["대길", "최고", "성공", "비상"],
        "image_symbol": "하늘 높이 나는 황금용",
        "age_target": "전연령",
        "priority": "고",
    },
    {
        "id": "1-6",
        "gua_number": 1,
        "gua_name_ko": "건괘",
        "gua_name_hanja": "乾",
        "yao_number": 6,
        "yao_position": "상효(上九)",
        "original_text": "亢龍有悔",
        "original_meaning": "항룡유회 - 너무 높이 오른 용은 후회가 있다",
        "direction": "하강",
        "score": 35,
        "core_message": "정점에서 물러날 때를 알라",
        "caution": "과욕은 후회를 부른다",
        "timing": "후반",
        "keywords": ["과욕", "후회", "하강", "절정"],
        "image_symbol": "하늘 높이 날다 추락하는 용",
        "age_target": "전연령",
        "priority": "중",
    },

    # 곤괘 (2) - 2개 샘플
    {
        "id": "2-1",
        "gua_number": 2,
        "gua_name_ko": "곤괘",
        "gua_name_hanja": "坤",
        "yao_number": 1,
        "yao_position": "초효(初六)",
        "original_text": "履霜,堅冰至",
        "original_meaning": "이상 견빙지 - 서리를 밟으면 단단한 얼음이 이른다",
        "direction": "정체",
        "score": 45,
        "core_message": "작은 징조를 무시하지 말라",
        "caution": "초기 경고를 간과하면 큰 화",
        "timing": "초반",
        "keywords": ["경고", "징조", "예방", "차단"],
        "image_symbol": "서리 밟고 얼음 오는 땅",
        "age_target": "MZ",
        "priority": "중",
    },
    {
        "id": "2-2",
        "gua_number": 2,
        "gua_name_ko": "곤괘",
        "gua_name_hanja": "坤",
        "yao_number": 2,
        "yao_position": "이효(六二)",
        "original_text": "直方大,不習无不利",
        "original_meaning": "직방대 불습무불리 - 곧고 바르고 크니 익히지 않아도 이롭지 않음이 없다",
        "direction": "상승",
        "score": 80,
        "core_message": "순리대로 행하면 자연히 이롭다",
        "caution": "억지로 하지 말라",
        "timing": "중반",
        "keywords": ["순리", "자연", "덕행", "바름"],
        "image_symbol": "넓고 곧은 대지",
        "age_target": "전연령",
        "priority": "고",
    },

    # 화천대유 (14) - 상효 (가장 많이 쓰이는 예시)
    {
        "id": "14-6",
        "gua_number": 14,
        "gua_name_ko": "대유괘",
        "gua_name_hanja": "大有",
        "yao_number": 6,
        "yao_position": "상효(上九)",
        "original_text": "自天祐之,吉无不利",
        "original_meaning": "자천우지 길무불리 - 하늘이 스스로 돕나니 길하고 이롭지 않음이 없다",
        "direction": "상승",
        "score": 98,
        "core_message": "하늘이 돕는다, 최고의 대길",
        "caution": "겸손을 잃지 말라",
        "timing": "후반",
        "keywords": ["천우신조", "대길", "순조", "겸손"],
        "image_symbol": "태양이 하늘 위에 빛남",
        "age_target": "전연령",
        "priority": "고",
    },
]


def get_hexagram_by_id(hexagram_id: str):
    """ID로 효 데이터 조회"""
    for item in SAMPLE_HEXAGRAM_DATA:
        if item["id"] == hexagram_id:
            return item
    return None


def get_all_sample_data():
    """샘플 데이터 전체 반환"""
    return SAMPLE_HEXAGRAM_DATA


def get_empty_384_data():
    """384개 빈 껍데기 반환"""
    return generate_empty_384_data()

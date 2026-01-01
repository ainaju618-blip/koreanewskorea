"""
64괘 완전 데이터셋 (I Ching / 주역)
모든 64괘에 대한 기본 정보 포함

Trigram (소성괘) 매핑:
- 0: 곤(坤) ☷ - 땅
- 1: 진(震) ☳ - 우레
- 2: 감(坎) ☵ - 물
- 3: 태(兌) ☱ - 못
- 4: 간(艮) ☶ - 산
- 5: 리(離) ☲ - 불
- 6: 손(巽) ☴ - 바람
- 7: 건(乾) ☰ - 하늘
"""

from typing import Dict, Optional

# 소성괘 (Trigram) 정보
TRIGRAM_INFO = {
    0: {"name_ko": "곤", "name_hanja": "坤", "symbol": "☷", "nature": "땅", "attribute": "순종"},
    1: {"name_ko": "진", "name_hanja": "震", "symbol": "☳", "nature": "우레", "attribute": "동"},
    2: {"name_ko": "감", "name_hanja": "坎", "symbol": "☵", "nature": "물", "attribute": "험"},
    3: {"name_ko": "태", "name_hanja": "兌", "symbol": "☱", "nature": "못", "attribute": "열"},
    4: {"name_ko": "간", "name_hanja": "艮", "symbol": "☶", "nature": "산", "attribute": "지"},
    5: {"name_ko": "리", "name_hanja": "離", "symbol": "☲", "nature": "불", "attribute": "명"},
    6: {"name_ko": "손", "name_hanja": "巽", "symbol": "☴", "nature": "바람", "attribute": "입"},
    7: {"name_ko": "건", "name_hanja": "乾", "symbol": "☰", "nature": "하늘", "attribute": "건"},
}

# 64괘 완전 데이터
HEXAGRAM_DATA: Dict[int, dict] = {
    1: {
        "number": 1,
        "name_ko": "건",
        "name_hanja": "乾",
        "name_full": "건위천",
        "upper_trigram": 7,  # 건(乾)
        "lower_trigram": 7,  # 건(乾)
        "gua_ci": "원형이정(元亨利貞). 크게 형통하니 바르게 함이 이롭다. 하늘의 도가 굳건하니 군자는 스스로 강건하여 쉬지 않는다.",
    },
    2: {
        "number": 2,
        "name_ko": "곤",
        "name_hanja": "坤",
        "name_full": "곤위지",
        "upper_trigram": 0,  # 곤(坤)
        "lower_trigram": 0,  # 곤(坤)
        "gua_ci": "원형이정(元亨利貞). 암말의 바름이 이롭다. 땅의 도가 유순하니 군자는 두터운 덕으로 만물을 싣는다.",
    },
    3: {
        "number": 3,
        "name_ko": "둔",
        "name_hanja": "屯",
        "name_full": "수뢰둔",
        "upper_trigram": 2,  # 감(坎)
        "lower_trigram": 1,  # 진(震)
        "gua_ci": "원형이정(元亨利貞). 어려움 속에 형통함이 있다. 초창기의 어려움이니 함부로 나아가지 말고 때를 기다려라.",
    },
    4: {
        "number": 4,
        "name_ko": "몽",
        "name_hanja": "蒙",
        "name_full": "산수몽",
        "upper_trigram": 4,  # 간(艮)
        "lower_trigram": 2,  # 감(坎)
        "gua_ci": "형통하다. 내가 어린이를 구하는 것이 아니라 어린이가 나를 구한다. 처음 점치면 알려주나 거듭하면 모독이니 알려주지 않는다.",
    },
    5: {
        "number": 5,
        "name_ko": "수",
        "name_hanja": "需",
        "name_full": "수천수",
        "upper_trigram": 2,  # 감(坎)
        "lower_trigram": 7,  # 건(乾)
        "gua_ci": "성실하면 크게 형통하고 바르게 함이 이롭다. 기다림이 필요하니 조급하지 말라. 큰 물을 건너는 것이 이롭다.",
    },
    6: {
        "number": 6,
        "name_ko": "송",
        "name_hanja": "訟",
        "name_full": "천수송",
        "upper_trigram": 7,  # 건(乾)
        "lower_trigram": 2,  # 감(坎)
        "gua_ci": "성실하지만 막힘이 있다. 두려워하며 중도를 지키면 길하고, 끝까지 가면 흉하다. 대인을 만남이 이롭고 큰 물을 건넘은 이롭지 않다.",
    },
    7: {
        "number": 7,
        "name_ko": "사",
        "name_hanja": "師",
        "name_full": "지수사",
        "upper_trigram": 0,  # 곤(坤)
        "lower_trigram": 2,  # 감(坎)
        "gua_ci": "바르게 함이 이롭고 장인(丈人)이면 길하여 허물이 없다. 군대를 다스리는 도이니 기율이 바르면 승리한다.",
    },
    8: {
        "number": 8,
        "name_ko": "비",
        "name_hanja": "比",
        "name_full": "수지비",
        "upper_trigram": 2,  # 감(坎)
        "lower_trigram": 0,  # 곤(坤)
        "gua_ci": "길하다. 다시 점쳐서 영원하고 바름이 있으면 허물이 없다. 편안치 못한 자가 와서 모이니 뒤처지는 자는 흉하다.",
    },
    9: {
        "number": 9,
        "name_ko": "소축",
        "name_hanja": "小畜",
        "name_full": "풍천소축",
        "upper_trigram": 6,  # 손(巽)
        "lower_trigram": 7,  # 건(乾)
        "gua_ci": "형통하다. 빽빽한 구름이 서쪽에서 오나 비가 내리지 않으니 작은 것이 쌓여 큰 것이 된다.",
    },
    10: {
        "number": 10,
        "name_ko": "리",
        "name_hanja": "履",
        "name_full": "천택리",
        "upper_trigram": 7,  # 건(乾)
        "lower_trigram": 3,  # 태(兌)
        "gua_ci": "호랑이 꼬리를 밟아도 물리지 않으니 형통하다. 예의를 밟아 행하면 위태로움이 없다.",
    },
    11: {
        "number": 11,
        "name_ko": "태",
        "name_hanja": "泰",
        "name_full": "지천태",
        "upper_trigram": 0,  # 곤(坤)
        "lower_trigram": 7,  # 건(乾)
        "gua_ci": "작은 것이 가고 큰 것이 오니 길하고 형통하다. 천지가 교감하여 만물이 통하니 태평성대의 때이다.",
    },
    12: {
        "number": 12,
        "name_ko": "비",
        "name_hanja": "否",
        "name_full": "천지비",
        "upper_trigram": 7,  # 건(乾)
        "lower_trigram": 0,  # 곤(坤)
        "gua_ci": "비색(否塞)하여 소인의 바름이 아니니 대인에게 이롭지 않다. 큰 것이 가고 작은 것이 오니 막힘의 때이다.",
    },
    13: {
        "number": 13,
        "name_ko": "동인",
        "name_hanja": "同人",
        "name_full": "천화동인",
        "upper_trigram": 7,  # 건(乾)
        "lower_trigram": 5,  # 리(離)
        "gua_ci": "들에서 사람과 동하니 형통하다. 큰 물을 건너는 것이 이롭고 군자의 바름이 이롭다.",
    },
    14: {
        "number": 14,
        "name_ko": "대유",
        "name_hanja": "大有",
        "name_full": "화천대유",
        "upper_trigram": 5,  # 리(離)
        "lower_trigram": 7,  # 건(乾)
        "gua_ci": "원대하게 형통하다. 불이 하늘 위에 있으니 밝음이 크고 만물을 크게 소유한다.",
    },
    15: {
        "number": 15,
        "name_ko": "겸",
        "name_hanja": "謙",
        "name_full": "지산겸",
        "upper_trigram": 0,  # 곤(坤)
        "lower_trigram": 4,  # 간(艮)
        "gua_ci": "형통하니 군자가 마침이 있다. 겸손함이 덕의 병기이니 낮추면 높아진다.",
    },
    16: {
        "number": 16,
        "name_ko": "예",
        "name_hanja": "豫",
        "name_full": "뇌지예",
        "upper_trigram": 1,  # 진(震)
        "lower_trigram": 0,  # 곤(坤)
        "gua_ci": "제후를 세우고 군대를 행함이 이롭다. 기쁨과 즐거움이 있으니 미리 준비하고 대비하라.",
    },
    17: {
        "number": 17,
        "name_ko": "수",
        "name_hanja": "隨",
        "name_full": "택뢰수",
        "upper_trigram": 3,  # 태(兌)
        "lower_trigram": 1,  # 진(震)
        "gua_ci": "크게 형통하고 바르게 함이 이로우니 허물이 없다. 때에 따라 변화하며 따르니 유연함이 필요하다.",
    },
    18: {
        "number": 18,
        "name_ko": "고",
        "name_hanja": "蠱",
        "name_full": "산풍고",
        "upper_trigram": 4,  # 간(艮)
        "lower_trigram": 6,  # 손(巽)
        "gua_ci": "원대하게 형통하니 큰 물을 건너는 것이 이롭다. 갑일 전 삼일과 갑일 후 삼일을 살펴라. 부패를 바로잡아야 한다.",
    },
    19: {
        "number": 19,
        "name_ko": "임",
        "name_hanja": "臨",
        "name_full": "지택임",
        "upper_trigram": 0,  # 곤(坤)
        "lower_trigram": 3,  # 태(兌)
        "gua_ci": "크게 형통하고 바르게 함이 이롭다. 팔월에 이르면 흉하니 다가감과 임함의 때를 알라.",
    },
    20: {
        "number": 20,
        "name_ko": "관",
        "name_hanja": "觀",
        "name_full": "풍지관",
        "upper_trigram": 6,  # 손(巽)
        "lower_trigram": 0,  # 곤(坤)
        "gua_ci": "손을 씻고 제사는 드리지 않았으나 성실함이 있어 우러러본다. 관찰하고 성찰하는 때이다.",
    },
    21: {
        "number": 21,
        "name_ko": "서합",
        "name_hanja": "噬嗑",
        "name_full": "화뢰서합",
        "upper_trigram": 5,  # 리(離)
        "lower_trigram": 1,  # 진(震)
        "gua_ci": "형통하니 옥송을 씀이 이롭다. 씹어서 합하니 장애물을 제거하고 형벌을 밝히는 때이다.",
    },
    22: {
        "number": 22,
        "name_ko": "비",
        "name_hanja": "賁",
        "name_full": "산화비",
        "upper_trigram": 4,  # 간(艮)
        "lower_trigram": 5,  # 리(離)
        "gua_ci": "형통하니 작게 가는 것이 이롭다. 꾸밈이 있으니 화려함보다 본질을 중시하라.",
    },
    23: {
        "number": 23,
        "name_ko": "박",
        "name_hanja": "剝",
        "name_full": "산지박",
        "upper_trigram": 4,  # 간(艮)
        "lower_trigram": 0,  # 곤(坤)
        "gua_ci": "갈 곳이 이롭지 않다. 음이 양을 깎아 없애니 물러나 지킬 때이다.",
    },
    24: {
        "number": 24,
        "name_ko": "복",
        "name_hanja": "復",
        "name_full": "지뢰복",
        "upper_trigram": 0,  # 곤(坤)
        "lower_trigram": 1,  # 진(震)
        "gua_ci": "형통하니 출입에 병이 없고 벗이 와도 허물이 없다. 양이 돌아오니 새로운 시작의 때이다. 칠일에 돌아온다.",
    },
    25: {
        "number": 25,
        "name_ko": "무망",
        "name_hanja": "无妄",
        "name_full": "천뢰무망",
        "upper_trigram": 7,  # 건(乾)
        "lower_trigram": 1,  # 진(震)
        "gua_ci": "원대하게 형통하고 바르게 함이 이롭다. 그 바름이 아니면 재앙이 있으니 갈 곳이 이롭지 않다. 거짓 없이 진실해야 한다.",
    },
    26: {
        "number": 26,
        "name_ko": "대축",
        "name_hanja": "大畜",
        "name_full": "산천대축",
        "upper_trigram": 4,  # 간(艮)
        "lower_trigram": 7,  # 건(乾)
        "gua_ci": "바르게 함이 이롭고 집에서 먹지 않으면 길하다. 큰 물을 건너는 것이 이롭다. 크게 쌓으니 덕과 실력을 기르라.",
    },
    27: {
        "number": 27,
        "name_ko": "이",
        "name_hanja": "頤",
        "name_full": "산뢰이",
        "upper_trigram": 4,  # 간(艮)
        "lower_trigram": 1,  # 진(震)
        "gua_ci": "바르게 함이 길하다. 기름을 관찰하고 스스로 입에 넣는 것을 구하라. 양생의 도를 살피라.",
    },
    28: {
        "number": 28,
        "name_ko": "대과",
        "name_hanja": "大過",
        "name_full": "택풍대과",
        "upper_trigram": 3,  # 태(兌)
        "lower_trigram": 6,  # 손(巽)
        "gua_ci": "동량이 휘어지니 갈 곳이 있으면 이롭고 형통하다. 대들보가 휘었으니 과감한 행동이 필요한 비상시이다.",
    },
    29: {
        "number": 29,
        "name_ko": "감",
        "name_hanja": "坎",
        "name_full": "감위수",
        "upper_trigram": 2,  # 감(坎)
        "lower_trigram": 2,  # 감(坎)
        "gua_ci": "습감(習坎)이라 성실함이 있으면 마음이 형통하고 행하면 높임이 있다. 거듭된 험난함이니 성실히 임하면 통과한다.",
    },
    30: {
        "number": 30,
        "name_ko": "리",
        "name_hanja": "離",
        "name_full": "리위화",
        "upper_trigram": 5,  # 리(離)
        "lower_trigram": 5,  # 리(離)
        "gua_ci": "바르게 함이 이로우니 형통하다. 암소를 기르면 길하다. 밝음이 거듭되니 문명과 지혜가 빛난다.",
    },
    31: {
        "number": 31,
        "name_ko": "함",
        "name_hanja": "咸",
        "name_full": "택산함",
        "upper_trigram": 3,  # 태(兌)
        "lower_trigram": 4,  # 간(艮)
        "gua_ci": "형통하고 바르게 함이 이로우니 여자를 취함이 길하다. 감응하니 마음이 통하는 때이다.",
    },
    32: {
        "number": 32,
        "name_ko": "항",
        "name_hanja": "恆",
        "name_full": "뇌풍항",
        "upper_trigram": 1,  # 진(震)
        "lower_trigram": 6,  # 손(巽)
        "gua_ci": "형통하고 허물이 없으니 바르게 함이 이롭다. 갈 곳이 있으면 이롭다. 항상함이니 변치 않고 꾸준히 하라.",
    },
    33: {
        "number": 33,
        "name_ko": "둔",
        "name_hanja": "遯",
        "name_full": "천산둔",
        "upper_trigram": 7,  # 건(乾)
        "lower_trigram": 4,  # 간(艮)
        "gua_ci": "형통하고 작게 바르게 함이 이롭다. 물러남이니 때가 맞지 않으면 피하라.",
    },
    34: {
        "number": 34,
        "name_ko": "대장",
        "name_hanja": "大壯",
        "name_full": "뇌천대장",
        "upper_trigram": 1,  # 진(震)
        "lower_trigram": 7,  # 건(乾)
        "gua_ci": "바르게 함이 이롭다. 크게 강성하니 힘이 넘치나 바름을 잃지 말라.",
    },
    35: {
        "number": 35,
        "name_ko": "진",
        "name_hanja": "晉",
        "name_full": "화지진",
        "upper_trigram": 5,  # 리(離)
        "lower_trigram": 0,  # 곤(坤)
        "gua_ci": "강후에게 말을 하사하고 하루에 세 번 접견한다. 나아감이니 밝음이 땅 위에 올라 진출의 때이다.",
    },
    36: {
        "number": 36,
        "name_ko": "명이",
        "name_hanja": "明夷",
        "name_full": "지화명이",
        "upper_trigram": 0,  # 곤(坤)
        "lower_trigram": 5,  # 리(離)
        "gua_ci": "어려움에 처해 바르게 함이 이롭다. 밝음이 상했으니 지혜를 감추고 때를 기다려라.",
    },
    37: {
        "number": 37,
        "name_ko": "가인",
        "name_hanja": "家人",
        "name_full": "풍화가인",
        "upper_trigram": 6,  # 손(巽)
        "lower_trigram": 5,  # 리(離)
        "gua_ci": "여자가 바르게 함이 이롭다. 집안 사람이니 가정의 도를 바르게 하라.",
    },
    38: {
        "number": 38,
        "name_ko": "규",
        "name_hanja": "睽",
        "name_full": "화택규",
        "upper_trigram": 5,  # 리(離)
        "lower_trigram": 3,  # 태(兌)
        "gua_ci": "작은 일이 길하다. 등지고 어긋남이 있으니 큰일은 삼가고 작은 일에 힘쓰라.",
    },
    39: {
        "number": 39,
        "name_ko": "건",
        "name_hanja": "蹇",
        "name_full": "수산건",
        "upper_trigram": 2,  # 감(坎)
        "lower_trigram": 4,  # 간(艮)
        "gua_ci": "서남이 이롭고 동북은 이롭지 않다. 대인을 봄이 이롭고 바르게 함이 길하다. 험난함이니 물러서서 반성하라.",
    },
    40: {
        "number": 40,
        "name_ko": "해",
        "name_hanja": "解",
        "name_full": "뇌수해",
        "upper_trigram": 1,  # 진(震)
        "lower_trigram": 2,  # 감(坎)
        "gua_ci": "서남이 이롭다. 갈 곳이 없으면 와서 돌아오면 길하고, 갈 곳이 있으면 빨리 가면 길하다. 풀림이니 어려움이 해소되는 때이다.",
    },
    41: {
        "number": 41,
        "name_ko": "손",
        "name_hanja": "損",
        "name_full": "산택손",
        "upper_trigram": 4,  # 간(艮)
        "lower_trigram": 3,  # 태(兌)
        "gua_ci": "성실함이 있으면 으뜸가는 길함이요, 허물이 없으며 바르게 함이 가하고 갈 곳이 있으면 이롭다. 줄임이니 아래를 줄여 위를 보태라.",
    },
    42: {
        "number": 42,
        "name_ko": "익",
        "name_hanja": "益",
        "name_full": "풍뢰익",
        "upper_trigram": 6,  # 손(巽)
        "lower_trigram": 1,  # 진(震)
        "gua_ci": "갈 곳이 있으면 이롭고 큰 물을 건넘이 이롭다. 더함이니 위를 줄여 아래를 보태는 때이다.",
    },
    43: {
        "number": 43,
        "name_ko": "쾌",
        "name_hanja": "夬",
        "name_full": "택천쾌",
        "upper_trigram": 3,  # 태(兌)
        "lower_trigram": 7,  # 건(乾)
        "gua_ci": "왕정에 펼치니 성실히 호령한다. 위태롭다고 알려라. 스스로의 고을에 알려라. 무기를 쓰는 것은 이롭지 않다. 가는 바가 있으면 이롭다. 결단함이니 과감히 소인을 몰아내라.",
    },
    44: {
        "number": 44,
        "name_ko": "구",
        "name_hanja": "姤",
        "name_full": "천풍구",
        "upper_trigram": 7,  # 건(乾)
        "lower_trigram": 6,  # 손(巽)
        "gua_ci": "여자가 강하니 여자를 취함은 쓰지 말라. 만남이니 우연한 만남을 경계하라.",
    },
    45: {
        "number": 45,
        "name_ko": "췌",
        "name_hanja": "萃",
        "name_full": "택지췌",
        "upper_trigram": 3,  # 태(兌)
        "lower_trigram": 0,  # 곤(坤)
        "gua_ci": "형통하니 왕이 묘에 이른다. 대인을 봄이 이롭고 형통하고 바르게 함이 이롭다. 큰 희생을 쓰면 길하고 갈 곳이 있으면 이롭다. 모임이니 사람들이 모여드는 때이다.",
    },
    46: {
        "number": 46,
        "name_ko": "승",
        "name_hanja": "升",
        "name_full": "지풍승",
        "upper_trigram": 0,  # 곤(坤)
        "lower_trigram": 6,  # 손(巽)
        "gua_ci": "원대하게 형통하니 대인을 봄에 쓰라. 걱정하지 말라. 남쪽으로 정벌하면 길하다. 오름이니 차근차근 올라가는 때이다.",
    },
    47: {
        "number": 47,
        "name_ko": "곤",
        "name_hanja": "困",
        "name_full": "택수곤",
        "upper_trigram": 3,  # 태(兌)
        "lower_trigram": 2,  # 감(坎)
        "gua_ci": "형통하니 바름이라야 대인이 길하고 허물이 없다. 말이 있어도 믿지 않는다. 곤궁함이니 어려움 속에서도 신념을 지켜라.",
    },
    48: {
        "number": 48,
        "name_ko": "정",
        "name_hanja": "井",
        "name_full": "수풍정",
        "upper_trigram": 2,  # 감(坎)
        "lower_trigram": 6,  # 손(巽)
        "gua_ci": "마을을 바꾸어도 우물은 바꾸지 못한다. 잃음도 없고 얻음도 없다. 오가며 우물에서 긷는다. 물에 거의 닿았는데 두레박 줄이 미치지 못하거나 두레박이 깨지면 흉하다. 우물이니 변치 않는 근본을 지켜라.",
    },
    49: {
        "number": 49,
        "name_ko": "혁",
        "name_hanja": "革",
        "name_full": "택화혁",
        "upper_trigram": 3,  # 태(兌)
        "lower_trigram": 5,  # 리(離)
        "gua_ci": "이미 날이 되면 믿으니 원대하게 형통하고 바르게 함이 이로우며 후회가 없어진다. 변혁이니 때가 되면 과감히 바꾸라.",
    },
    50: {
        "number": 50,
        "name_ko": "정",
        "name_hanja": "鼎",
        "name_full": "화풍정",
        "upper_trigram": 5,  # 리(離)
        "lower_trigram": 6,  # 손(巽)
        "gua_ci": "으뜸가는 길함이요 형통하다. 솥이니 새것을 받아들이고 현자를 양성하라.",
    },
    51: {
        "number": 51,
        "name_ko": "진",
        "name_hanja": "震",
        "name_full": "진위뢰",
        "upper_trigram": 1,  # 진(震)
        "lower_trigram": 1,  # 진(震)
        "gua_ci": "형통하니 우레가 오면 두려워서 웃고 말한다. 우레가 백 리를 놀라게 해도 비장과 창을 잃지 않는다. 우레이니 두려워하되 조심하면 무탈하다.",
    },
    52: {
        "number": 52,
        "name_ko": "간",
        "name_hanja": "艮",
        "name_full": "간위산",
        "upper_trigram": 4,  # 간(艮)
        "lower_trigram": 4,  # 간(艮)
        "gua_ci": "등에 그치니 그 몸을 얻지 못하고 그 뜰에 행해도 그 사람을 보지 못하니 허물이 없다. 그침이니 때에 맞게 멈출 줄 알라.",
    },
    53: {
        "number": 53,
        "name_ko": "점",
        "name_hanja": "漸",
        "name_full": "풍산점",
        "upper_trigram": 6,  # 손(巽)
        "lower_trigram": 4,  # 간(艮)
        "gua_ci": "여자가 시집감이니 길하고 바르게 함이 이롭다. 점진함이니 서서히 나아감이 이롭다.",
    },
    54: {
        "number": 54,
        "name_ko": "귀매",
        "name_hanja": "歸妹",
        "name_full": "뇌택귀매",
        "upper_trigram": 1,  # 진(震)
        "lower_trigram": 3,  # 태(兌)
        "gua_ci": "가면 흉하고 이로운 바가 없다. 여자가 시집감이니 바르게 처신하지 않으면 흉하다.",
    },
    55: {
        "number": 55,
        "name_ko": "풍",
        "name_hanja": "豐",
        "name_full": "뇌화풍",
        "upper_trigram": 1,  # 진(震)
        "lower_trigram": 5,  # 리(離)
        "gua_ci": "형통하니 왕이 이에 이른다. 근심하지 말라. 마땅히 해가 중천에 있는 것이다. 풍성함이니 극성하되 오래가지 못함을 알라.",
    },
    56: {
        "number": 56,
        "name_ko": "려",
        "name_hanja": "旅",
        "name_full": "화산려",
        "upper_trigram": 5,  # 리(離)
        "lower_trigram": 4,  # 간(艮)
        "gua_ci": "조금 형통하고 나그네가 바르게 하면 길하다. 나그네이니 겸손히 처신하라.",
    },
    57: {
        "number": 57,
        "name_ko": "손",
        "name_hanja": "巽",
        "name_full": "손위풍",
        "upper_trigram": 6,  # 손(巽)
        "lower_trigram": 6,  # 손(巽)
        "gua_ci": "조금 형통하고 갈 곳이 있으면 이롭고 대인을 봄이 이롭다. 공손함이니 부드럽게 순종하며 스며들라.",
    },
    58: {
        "number": 58,
        "name_ko": "태",
        "name_hanja": "兌",
        "name_full": "태위택",
        "upper_trigram": 3,  # 태(兌)
        "lower_trigram": 3,  # 태(兌)
        "gua_ci": "형통하고 바르게 함이 이롭다. 기쁨이니 화합하고 기뻐하라.",
    },
    59: {
        "number": 59,
        "name_ko": "환",
        "name_hanja": "渙",
        "name_full": "풍수환",
        "upper_trigram": 6,  # 손(巽)
        "lower_trigram": 2,  # 감(坎)
        "gua_ci": "형통하니 왕이 묘에 이른다. 큰 물을 건넘이 이롭고 바르게 함이 이롭다. 흩어짐이니 막힌 것을 풀어 흩어지게 하라.",
    },
    60: {
        "number": 60,
        "name_ko": "절",
        "name_hanja": "節",
        "name_full": "수택절",
        "upper_trigram": 2,  # 감(坎)
        "lower_trigram": 3,  # 태(兌)
        "gua_ci": "형통하니 쓰라린 절도는 바르게 할 수 없다. 절제이니 지나치지도 모자라지도 않게 하라.",
    },
    61: {
        "number": 61,
        "name_ko": "중부",
        "name_hanja": "中孚",
        "name_full": "풍택중부",
        "upper_trigram": 6,  # 손(巽)
        "lower_trigram": 3,  # 태(兌)
        "gua_ci": "돼지와 물고기라도 길하니 큰 물을 건넘이 이롭고 바르게 함이 이롭다. 마음속의 믿음이니 진심으로 신뢰하라.",
    },
    62: {
        "number": 62,
        "name_ko": "소과",
        "name_hanja": "小過",
        "name_full": "뇌산소과",
        "upper_trigram": 1,  # 진(震)
        "lower_trigram": 4,  # 간(艮)
        "gua_ci": "형통하니 바르게 함이 이롭다. 작은 일에는 가하나 큰 일에는 가하지 않다. 나는 새가 소리를 남기니 오르는 것은 마땅치 않고 내리는 것이 마땅하면 크게 길하다. 작은 과함이니 작은 일에 치중하고 큰 일은 삼가라.",
    },
    63: {
        "number": 63,
        "name_ko": "기제",
        "name_hanja": "既濟",
        "name_full": "수화기제",
        "upper_trigram": 2,  # 감(坎)
        "lower_trigram": 5,  # 리(離)
        "gua_ci": "형통하니 작은 것이 이롭고 바르게 함이 이롭다. 처음은 길하나 끝은 어지러워지리라. 이미 건넜으니 완성 후에도 경계를 늦추지 말라.",
    },
    64: {
        "number": 64,
        "name_ko": "미제",
        "name_hanja": "未濟",
        "name_full": "화수미제",
        "upper_trigram": 5,  # 리(離)
        "lower_trigram": 2,  # 감(坎)
        "gua_ci": "형통하니 어린 여우가 거의 건넜으나 꼬리를 적시니 이로운 바가 없다. 아직 건너지 못했으니 완성을 향해 나아가되 신중하라.",
    },
}


def get_hexagram(number: int) -> Optional[dict]:
    """
    괘 번호로 괘 데이터 조회

    Args:
        number: 1-64 사이의 괘 번호

    Returns:
        해당 괘의 데이터 딕셔너리, 없으면 None
    """
    if not 1 <= number <= 64:
        return None
    return HEXAGRAM_DATA.get(number)


def get_hexagram_by_trigrams(upper: int, lower: int) -> Optional[dict]:
    """
    상괘와 하괘로 괘 데이터 조회

    Args:
        upper: 상괘 번호 (0-7)
        lower: 하괘 번호 (0-7)

    Returns:
        해당 괘의 데이터 딕셔너리, 없으면 None
    """
    for hexagram in HEXAGRAM_DATA.values():
        if hexagram["upper_trigram"] == upper and hexagram["lower_trigram"] == lower:
            return hexagram
    return None


def get_trigram_info(trigram_num: int) -> Optional[dict]:
    """
    소성괘 정보 조회

    Args:
        trigram_num: 소성괘 번호 (0-7)

    Returns:
        소성괘 정보 딕셔너리, 없으면 None
    """
    return TRIGRAM_INFO.get(trigram_num)


def get_all_hexagrams() -> list:
    """
    모든 64괘 데이터를 리스트로 반환

    Returns:
        64괘 데이터 리스트 (번호순 정렬)
    """
    return [HEXAGRAM_DATA[i] for i in range(1, 65)]


def validate_hexagram_data() -> dict:
    """
    64괘 데이터 유효성 검증

    Returns:
        검증 결과 딕셔너리
    """
    results = {
        "total": 64,
        "valid": 0,
        "errors": [],
    }

    required_fields = ["number", "name_ko", "name_hanja", "name_full",
                       "upper_trigram", "lower_trigram", "gua_ci"]

    for i in range(1, 65):
        hexagram = HEXAGRAM_DATA.get(i)
        if not hexagram:
            results["errors"].append(f"괘 {i}: 데이터 없음")
            continue

        missing = [f for f in required_fields if f not in hexagram]
        if missing:
            results["errors"].append(f"괘 {i}: 필수 필드 누락 - {missing}")
            continue

        if hexagram["number"] != i:
            results["errors"].append(f"괘 {i}: 번호 불일치")
            continue

        if not 0 <= hexagram["upper_trigram"] <= 7:
            results["errors"].append(f"괘 {i}: 상괘 범위 오류")
            continue

        if not 0 <= hexagram["lower_trigram"] <= 7:
            results["errors"].append(f"괘 {i}: 하괘 범위 오류")
            continue

        results["valid"] += 1

    return results


# 편의를 위한 상수
HEXAGRAM_NAMES_KO = {i: h["name_ko"] for i, h in HEXAGRAM_DATA.items()}
HEXAGRAM_NAMES_HANJA = {i: h["name_hanja"] for i, h in HEXAGRAM_DATA.items()}
HEXAGRAM_NAMES_FULL = {i: h["name_full"] for i, h in HEXAGRAM_DATA.items()}

"""
100개 Interpretation 시드 데이터 (Day1 목표)

hexagram_id: "괘번호-효번호" 형식 (1-1 ~ 64-6)
category_id: 1-170
period: daily/weekly/monthly/yearly
base_text: LLM 없이 사용 가능한 기본 해석
tone_hint: 단호/위로/현실적/희망적/중립
"""

from typing import List, Dict

# ============================================================================
# 100개 Interpretations 데이터
# ============================================================================

INTERPRETATIONS_DATA: List[Dict] = [
    # ========== 재물 카테고리 (1-10) ==========
    # 1. 건괘 초효 + 주식 (daily)
    {
        "hexagram_id": "1-1",
        "category_id": 1,
        "period": "daily",
        "base_text": "잠룡물용(潛龍勿用). 아직 때가 아닙니다. 오늘은 주식 매매를 자제하고 관망하세요. 성급한 진입은 손실로 이어질 수 있습니다.",
        "tone_hint": "단호"
    },
    # 2. 건괘 오효 + 주식 (daily)
    {
        "hexagram_id": "1-5",
        "category_id": 1,
        "period": "daily",
        "base_text": "비룡재천(飛龍在天). 강한 상승 기운이 있습니다. 보유 종목에 좋은 소식이 있을 수 있으니 차분히 흐름을 지켜보세요.",
        "tone_hint": "희망적"
    },
    # 3. 곤괘 초효 + 부동산 (weekly)
    {
        "hexagram_id": "2-1",
        "category_id": 2,
        "period": "weekly",
        "base_text": "이상박빙(履霜堅氷). 서리를 밟으면 단단한 얼음이 옵니다. 부동산 시장의 조정 신호에 주의하세요. 이번 주는 계약보다 정보 수집이 중요합니다.",
        "tone_hint": "현실적"
    },
    # 4. 태괘 + 투자 (monthly)
    {
        "hexagram_id": "11-3",
        "category_id": 3,
        "period": "monthly",
        "base_text": "무평불피(無平不陂). 평탄하면 기울어집니다. 이번 달 투자 수익이 있더라도 일부 차익 실현을 고려하세요. 균형 있는 포트폴리오 관리가 필요합니다.",
        "tone_hint": "현실적"
    },
    # 5. 비괘 + 저축 (daily)
    {
        "hexagram_id": "12-2",
        "category_id": 4,
        "period": "daily",
        "base_text": "포승대인(包承大人). 때를 기다리며 내실을 다지세요. 저축을 늘리고 불필요한 지출을 줄이는 것이 현명합니다.",
        "tone_hint": "중립"
    },
    # 6. 대유괘 + 사업자금 (weekly)
    {
        "hexagram_id": "14-5",
        "category_id": 5,
        "period": "weekly",
        "base_text": "궐부교여(厥孚交如). 믿음이 서로 통합니다. 사업 자금 조달에 좋은 기회가 있습니다. 신뢰할 수 있는 파트너와의 협력을 고려하세요.",
        "tone_hint": "희망적"
    },
    # 7. 겸괘 + 암호화폐 (daily)
    {
        "hexagram_id": "15-1",
        "category_id": 6,
        "period": "daily",
        "base_text": "겸겸군자(謙謙君子). 겸손한 자세로 시장을 바라보세요. 암호화폐 시장의 변동성에 휩쓸리지 말고 기본에 충실하세요.",
        "tone_hint": "중립"
    },
    # 8. 임괘 + 금/은 (monthly)
    {
        "hexagram_id": "19-4",
        "category_id": 101,
        "period": "monthly",
        "base_text": "지림무구(至臨無咎). 진심으로 임하면 허물이 없습니다. 귀금속 투자에 적기입니다. 안전자산으로서의 가치가 빛날 때입니다.",
        "tone_hint": "희망적"
    },
    # 9. 관괘 + 상속/증여 (yearly)
    {
        "hexagram_id": "20-5",
        "category_id": 10,
        "period": "yearly",
        "base_text": "관아생(觀我生). 자신의 삶을 돌아보세요. 상속이나 증여 계획은 신중하게, 가족과의 충분한 소통 후 결정하세요.",
        "tone_hint": "중립"
    },
    # 10. 익괘 + 재물운 전반 (weekly)
    {
        "hexagram_id": "42-2",
        "category_id": 11,
        "period": "weekly",
        "base_text": "익지십붕지귀(益之十朋之龜). 열 친구의 거북점처럼 이로움이 있습니다. 이번 주 재물운이 좋습니다. 기회를 놓치지 마세요.",
        "tone_hint": "희망적"
    },

    # ========== 직업 카테고리 (11-20) ==========
    # 11. 건괘 이효 + 취업 (monthly)
    {
        "hexagram_id": "1-2",
        "category_id": 12,
        "period": "monthly",
        "base_text": "현룡재전(見龍在田). 용이 밭에 나타났습니다. 취업 기회가 가시화됩니다. 적극적으로 이력서를 내고 면접 준비를 하세요.",
        "tone_hint": "희망적"
    },
    # 12. 진괘 + 이직 (weekly)
    {
        "hexagram_id": "35-4",
        "category_id": 13,
        "period": "weekly",
        "base_text": "진여석서(晉如鼫鼠). 다람쥐처럼 조심스럽게. 이직은 신중하게 결정하세요. 현재 자리에서의 성과를 먼저 점검하세요.",
        "tone_hint": "현실적"
    },
    # 13. 대장괘 + 승진 (monthly)
    {
        "hexagram_id": "34-5",
        "category_id": 14,
        "period": "monthly",
        "base_text": "상양우역(喪羊于易). 쉽게 양을 잃습니다. 승진을 원한다면 눈앞의 성과보다 장기적 신뢰를 쌓으세요.",
        "tone_hint": "단호"
    },
    # 14. 사괘 + 창업 (yearly)
    {
        "hexagram_id": "7-5",
        "category_id": 15,
        "period": "yearly",
        "base_text": "전유금(田有禽). 밭에 새가 있습니다. 창업의 기회가 보입니다. 하지만 철저한 준비 없이는 실패할 수 있으니 계획을 세우세요.",
        "tone_hint": "현실적"
    },
    # 15. 비괘 상효 + 프리랜서 (daily)
    {
        "hexagram_id": "8-6",
        "category_id": 16,
        "period": "daily",
        "base_text": "비지무수(比之無首). 머리가 없으면 흉합니다. 프리랜서로서 명확한 방향성을 정하세요. 오늘 결정이 향후 커리어에 영향을 줍니다.",
        "tone_hint": "단호"
    },
    # 16. 항괘 + 직장생활 (weekly)
    {
        "hexagram_id": "32-3",
        "category_id": 17,
        "period": "weekly",
        "base_text": "불항기덕(不恆其德). 덕을 항상하지 못하면 부끄러움이 있습니다. 직장에서 일관된 태도를 유지하세요. 변덕스러우면 신뢰를 잃습니다.",
        "tone_hint": "단호"
    },
    # 17. 둔괘 + 퇴직 (monthly)
    {
        "hexagram_id": "33-2",
        "category_id": 18,
        "period": "monthly",
        "base_text": "집지용황우지혁(執之用黃牛之革). 황소 가죽으로 단단히 묶습니다. 퇴직을 고민 중이라면 조금 더 현재 자리에서 버티는 것이 좋겠습니다.",
        "tone_hint": "위로"
    },
    # 18. 손괘 + 부업/N잡 (daily)
    {
        "hexagram_id": "41-1",
        "category_id": 19,
        "period": "daily",
        "base_text": "사사천왕(巳事遄往). 일을 마치면 빨리 가세요. 부업은 본업에 지장이 없는 선에서 하세요. 오늘은 본업에 집중하는 날입니다.",
        "tone_hint": "현실적"
    },
    # 19. 혁괘 + 경력개발 (monthly)
    {
        "hexagram_id": "49-4",
        "category_id": 20,
        "period": "monthly",
        "base_text": "회망유부개명길(悔亡有孚改命吉). 후회가 사라지고 믿음이 있으면 길합니다. 경력 전환의 적기입니다. 새로운 배움을 시작하세요.",
        "tone_hint": "희망적"
    },
    # 20. 정괘 + 직업운 전반 (yearly)
    {
        "hexagram_id": "50-5",
        "category_id": 21,
        "period": "yearly",
        "base_text": "정황이금현(鼎黃耳金鉉). 황금 귀의 솥. 올해 직업운이 밝습니다. 자신의 전문성을 갈고닦으면 인정받을 기회가 옵니다.",
        "tone_hint": "희망적"
    },

    # ========== 학업 카테고리 (21-30) ==========
    # 21. 몽괘 + 초중고학업 (daily)
    {
        "hexagram_id": "4-1",
        "category_id": 22,
        "period": "daily",
        "base_text": "발몽리용형인(發蒙利用刑人). 어리석음을 깨우침에 엄함이 이롭습니다. 오늘 학습은 기초에 충실하세요. 꾸준함이 중요합니다.",
        "tone_hint": "단호"
    },
    # 22. 몽괘 오효 + 대학입시 (monthly)
    {
        "hexagram_id": "4-5",
        "category_id": 23,
        "period": "monthly",
        "base_text": "동몽길(童蒙吉). 어린 몽매함도 길합니다. 입시 준비에 긍정적입니다. 기본기를 탄탄히 하면 좋은 결과가 있을 것입니다.",
        "tone_hint": "희망적"
    },
    # 23. 관괘 + 자격증시험 (weekly)
    {
        "hexagram_id": "20-4",
        "category_id": 24,
        "period": "weekly",
        "base_text": "관국지광(觀國之光). 나라의 빛을 봅니다. 시험 준비가 잘 되어가고 있습니다. 이번 주 집중하면 합격에 가까워집니다.",
        "tone_hint": "희망적"
    },
    # 24. 점괘 + 대학원/유학 (yearly)
    {
        "hexagram_id": "53-3",
        "category_id": 25,
        "period": "yearly",
        "base_text": "홍점우륙(鴻漸于陸). 기러기가 점점 육지로 나아갑니다. 유학이나 대학원 진학의 기회가 열립니다. 차근차근 준비하세요.",
        "tone_hint": "희망적"
    },
    # 25. 곤괘 + 어학공부 (daily)
    {
        "hexagram_id": "2-3",
        "category_id": 26,
        "period": "daily",
        "base_text": "함장가정(含章可貞). 문장을 품으면 바름을 얻습니다. 어학 공부에 좋은 날입니다. 꾸준히 읽고 쓰며 실력을 쌓으세요.",
        "tone_hint": "중립"
    },
    # 26. 이괘 + 기술습득 (weekly)
    {
        "hexagram_id": "27-2",
        "category_id": 27,
        "period": "weekly",
        "base_text": "전이불경(顚頤不經). 배움의 방향을 바로잡으세요. 기술 습득에서 기본을 무시하면 안 됩니다. 원리를 먼저 이해하세요.",
        "tone_hint": "단호"
    },
    # 27. 고괘 + 학습방법 (monthly)
    {
        "hexagram_id": "18-4",
        "category_id": 28,
        "period": "monthly",
        "base_text": "유부지고(裕父之蠱). 아버지의 잘못을 너그러이 바로잡습니다. 지금까지의 학습 방법을 점검하고 개선할 때입니다.",
        "tone_hint": "현실적"
    },
    # 28. 진괘 + 성적향상 (weekly)
    {
        "hexagram_id": "51-5",
        "category_id": 29,
        "period": "weekly",
        "base_text": "진왕래려(震往來厲). 우레가 왔다 갔다 합니다. 성적 향상을 위해 긴장감을 유지하세요. 적당한 스트레스가 동기부여가 됩니다.",
        "tone_hint": "현실적"
    },
    # 29. 간괘 + 집중력 (daily)
    {
        "hexagram_id": "52-1",
        "category_id": 30,
        "period": "daily",
        "base_text": "간기지무구(艮其趾無咎). 발을 멈추면 허물이 없습니다. 오늘은 한 곳에 집중하세요. 산만함을 경계하면 효율이 높아집니다.",
        "tone_hint": "단호"
    },
    # 30. 익괘 + 학업운 전반 (monthly)
    {
        "hexagram_id": "42-5",
        "category_id": 31,
        "period": "monthly",
        "base_text": "유부혜심(有孚惠心). 믿음이 있어 마음을 베풉니다. 이번 달 학업운이 좋습니다. 남을 돕는 마음으로 공부하면 더 잘됩니다.",
        "tone_hint": "희망적"
    },

    # ========== 연애 카테고리 (31-45) ==========
    # 31. 함괘 + 솔로탈출 (daily)
    {
        "hexagram_id": "31-1",
        "category_id": 32,
        "period": "daily",
        "base_text": "함기무(咸其拇). 엄지발가락이 감응합니다. 오늘 좋은 인연의 기운이 있습니다. 평소 안 가던 곳에서 만남이 있을 수 있어요.",
        "tone_hint": "희망적"
    },
    # 32. 함괘 사효 + 짝사랑 (weekly)
    {
        "hexagram_id": "31-4",
        "category_id": 33,
        "period": "weekly",
        "base_text": "정길회망(貞吉悔亡). 바르면 길하고 후회가 없습니다. 짝사랑에 진심을 담아 표현해보세요. 이번 주가 고백의 적기일 수 있습니다.",
        "tone_hint": "희망적"
    },
    # 33. 항괘 + 연인관계 (monthly)
    {
        "hexagram_id": "32-5",
        "category_id": 34,
        "period": "monthly",
        "base_text": "항기덕정부인길(恆其德貞婦人吉). 덕을 항상함이 여인에게 길합니다. 연인과의 관계에서 변함없는 마음이 중요합니다. 신뢰를 쌓으세요.",
        "tone_hint": "위로"
    },
    # 34. 규괘 + 썸/밀당 (daily)
    {
        "hexagram_id": "38-3",
        "category_id": 35,
        "period": "daily",
        "base_text": "견여예(見輿曳). 수레가 끌리는 것을 봅니다. 밀당에서 끌려다니지 마세요. 오늘은 자존감을 지키는 것이 중요합니다.",
        "tone_hint": "단호"
    },
    # 35. 가인괘 + 동거/결혼 (yearly)
    {
        "hexagram_id": "37-2",
        "category_id": 36,
        "period": "yearly",
        "base_text": "무유수재중궤(無攸遂在中饋). 집안에서 음식을 주관합니다. 올해 동거나 결혼에 좋은 기운이 있습니다. 가정의 안정을 추구하세요.",
        "tone_hint": "희망적"
    },
    # 36. 귀매괘 + 이별/재회 (weekly)
    {
        "hexagram_id": "54-4",
        "category_id": 37,
        "period": "weekly",
        "base_text": "귀매건기(歸妹愆期). 시집가는 기한이 늦어집니다. 재회를 기다리고 있다면 조급해하지 마세요. 때가 되면 인연은 다시 닿습니다.",
        "tone_hint": "위로"
    },
    # 37. 수괘 + 장거리연애 (monthly)
    {
        "hexagram_id": "5-3",
        "category_id": 38,
        "period": "monthly",
        "base_text": "수우니(需于泥). 진흙에서 기다립니다. 장거리 연애가 힘들 수 있지만, 인내하면 관계가 깊어집니다. 소통을 게을리하지 마세요.",
        "tone_hint": "위로"
    },
    # 38. 태괘 상효 + 연애운 전반 (daily)
    {
        "hexagram_id": "58-6",
        "category_id": 39,
        "period": "daily",
        "base_text": "인태(引兌). 기쁨으로 이끕니다. 오늘 연애운이 좋습니다. 밝은 에너지로 상대방에게 다가가세요.",
        "tone_hint": "희망적"
    },
    # 39. 감괘 + 연인관계 갈등 (weekly)
    {
        "hexagram_id": "29-3",
        "category_id": 34,
        "period": "weekly",
        "base_text": "험차감(險且枕). 험하고 베개도 불안합니다. 연인과 갈등이 있다면 잠시 거리를 두세요. 감정이 가라앉은 후 대화하세요.",
        "tone_hint": "현실적"
    },
    # 40. 리괘 + 고백/프로포즈 (daily)
    {
        "hexagram_id": "30-5",
        "category_id": 40,
        "period": "daily",
        "base_text": "출제타약(出涕沱若). 눈물이 흘러넘칩니다. 진심 어린 고백은 상대방의 마음을 움직입니다. 용기를 내어 마음을 전하세요.",
        "tone_hint": "희망적"
    },
    # 41. 쾌괘 + 권태기극복 (monthly)
    {
        "hexagram_id": "43-4",
        "category_id": 141,
        "period": "monthly",
        "base_text": "신무부(臀無膚). 엉덩이에 살이 없어 앉기 불편합니다. 권태기는 새로운 시도로 극복하세요. 함께 여행이나 취미를 시작해보세요.",
        "tone_hint": "현실적"
    },
    # 42. 구괘 + 소개팅/선 (daily)
    {
        "hexagram_id": "44-1",
        "category_id": 142,
        "period": "daily",
        "base_text": "계우금니(繫于金柅). 금으로 된 수레바퀴 고정쇠에 묶습니다. 오늘 소개팅에서는 첫인상이 중요합니다. 단정하게 준비하세요.",
        "tone_hint": "중립"
    },
    # 43. 췌괘 + 연애상담 (weekly)
    {
        "hexagram_id": "45-2",
        "category_id": 143,
        "period": "weekly",
        "base_text": "인길무구(引吉無咎). 이끌어가면 길하고 허물이 없습니다. 친구나 전문가의 연애 조언을 들어보세요. 객관적 시선이 도움됩니다.",
        "tone_hint": "위로"
    },
    # 44. 점괘 상효 + 재혼 (yearly)
    {
        "hexagram_id": "53-6",
        "category_id": 144,
        "period": "yearly",
        "base_text": "홍점우륙(鴻漸于陸). 기러기가 높은 언덕에 이릅니다. 재혼의 기운이 있습니다. 과거를 정리하고 새 출발을 준비하세요.",
        "tone_hint": "희망적"
    },
    # 45. 절괘 + 연애밸런스 (monthly)
    {
        "hexagram_id": "60-2",
        "category_id": 145,
        "period": "monthly",
        "base_text": "불출호정흉(不出戶庭凶). 문을 나서지 않으면 흉합니다. 연애에서 균형이 필요합니다. 혼자만의 시간과 함께하는 시간을 조절하세요.",
        "tone_hint": "현실적"
    },

    # ========== 대인관계 카테고리 (46-55) ==========
    # 46. 동인괘 + 친구관계 (daily)
    {
        "hexagram_id": "13-2",
        "category_id": 41,
        "period": "daily",
        "base_text": "동인우종(同人于宗). 같은 뜻을 가진 이들과 함께합니다. 오늘 친구와의 시간이 즐겁습니다. 진심으로 소통하세요.",
        "tone_hint": "희망적"
    },
    # 47. 비괘 + 직장동료 (weekly)
    {
        "hexagram_id": "8-4",
        "category_id": 42,
        "period": "weekly",
        "base_text": "외비지정길(外比之貞吉). 밖에서 친밀함을 구하면 길합니다. 동료들과의 관계를 넓혀보세요. 협력이 성과로 이어집니다.",
        "tone_hint": "희망적"
    },
    # 48. 송괘 + 갈등해결 (daily)
    {
        "hexagram_id": "6-3",
        "category_id": 43,
        "period": "daily",
        "base_text": "식구덕(食舊德). 옛 덕을 먹습니다. 갈등 상황에서는 과거의 좋았던 관계를 떠올리세요. 화해의 실마리가 보입니다.",
        "tone_hint": "위로"
    },
    # 49. 예괘 + 모임/커뮤니티 (weekly)
    {
        "hexagram_id": "16-4",
        "category_id": 44,
        "period": "weekly",
        "base_text": "유예대유득(由豫大有得). 기쁨으로 인해 크게 얻습니다. 모임이나 커뮤니티 활동에서 좋은 인연을 만날 수 있습니다.",
        "tone_hint": "희망적"
    },
    # 50. 가인괘 상효 + 가족관계 (monthly)
    {
        "hexagram_id": "37-6",
        "category_id": 45,
        "period": "monthly",
        "base_text": "유부위여(有孚威如). 믿음이 있어 위엄이 있습니다. 가족 관계에서 신뢰와 존중이 중요합니다. 진심을 표현하세요.",
        "tone_hint": "중립"
    },
    # 51. 해괘 + 이웃관계 (daily)
    {
        "hexagram_id": "40-2",
        "category_id": 46,
        "period": "daily",
        "base_text": "전획삼호(田獲三狐). 사냥에서 세 마리 여우를 잡습니다. 이웃과의 작은 갈등이 해소됩니다. 먼저 인사하세요.",
        "tone_hint": "희망적"
    },
    # 52. 환괘 + 인맥확장 (monthly)
    {
        "hexagram_id": "59-4",
        "category_id": 156,
        "period": "monthly",
        "base_text": "환기군원길(渙其群元吉). 무리를 흩어 크게 길합니다. 기존 인맥을 넘어 새로운 만남을 추구하세요. 넓은 시야가 도움됩니다.",
        "tone_hint": "희망적"
    },
    # 53. 중부괘 + 신뢰관계 (weekly)
    {
        "hexagram_id": "61-2",
        "category_id": 157,
        "period": "weekly",
        "base_text": "학명재음(鶴鳴在陰). 학이 그늘에서 웁니다. 조용히 신뢰를 쌓으세요. 과시하지 않아도 진심은 통합니다.",
        "tone_hint": "중립"
    },
    # 54. 소과괘 + 오해해소 (daily)
    {
        "hexagram_id": "62-3",
        "category_id": 158,
        "period": "daily",
        "base_text": "불과방지(弗過防之). 지나치게 막으면 안 됩니다. 오해가 있다면 적극적으로 해명하세요. 침묵은 오해를 키웁니다.",
        "tone_hint": "단호"
    },
    # 55. 기제괘 + 관계유지 (monthly)
    {
        "hexagram_id": "63-5",
        "category_id": 159,
        "period": "monthly",
        "base_text": "동린살우(東鄰殺牛). 동쪽 이웃이 소를 잡습니다. 화려한 것보다 꾸준한 관계 유지가 복을 부릅니다.",
        "tone_hint": "현실적"
    },

    # ========== 건강 카테고리 (56-70) ==========
    # 56. 건괘 삼효 + 체력관리 (daily)
    {
        "hexagram_id": "1-3",
        "category_id": 47,
        "period": "daily",
        "base_text": "군자종일건건(君子終日乾乾). 군자는 종일 힘쓰고 또 힘씁니다. 오늘 운동을 시작하기 좋은 날입니다. 꾸준함이 건강을 만듭니다.",
        "tone_hint": "희망적"
    },
    # 57. 곤괘 육사 + 정신건강 (weekly)
    {
        "hexagram_id": "2-4",
        "category_id": 48,
        "period": "weekly",
        "base_text": "괄낭무구무예(括囊無咎無譽). 주머니를 묶으면 허물도 없고 칭찬도 없습니다. 이번 주는 조용히 쉬며 마음을 다스리세요.",
        "tone_hint": "위로"
    },
    # 58. 준괘 + 다이어트 (monthly)
    {
        "hexagram_id": "3-4",
        "category_id": 49,
        "period": "monthly",
        "base_text": "승마반여(乘馬班如). 말을 타고 서성입니다. 다이어트가 정체기에 있을 수 있습니다. 방법을 바꿔보세요.",
        "tone_hint": "현실적"
    },
    # 59. 수괘 오효 + 수면/휴식 (daily)
    {
        "hexagram_id": "5-5",
        "category_id": 50,
        "period": "daily",
        "base_text": "수우주식(需于酒食). 술과 음식에서 기다립니다. 오늘은 충분히 쉬세요. 휴식도 건강의 일부입니다.",
        "tone_hint": "위로"
    },
    # 60. 리괘 + 눈건강 (weekly)
    {
        "hexagram_id": "10-2",
        "category_id": 51,
        "period": "weekly",
        "base_text": "리도탄탄(履道坦坦). 길을 밟아 편안합니다. 눈 건강에 신경 쓰세요. 적절한 휴식과 스트레칭이 필요합니다.",
        "tone_hint": "중립"
    },
    # 61. 복괘 + 회복/재활 (monthly)
    {
        "hexagram_id": "24-1",
        "category_id": 52,
        "period": "monthly",
        "base_text": "불원복무기회(不遠復無祇悔). 멀리 가기 전에 돌아오면 후회가 없습니다. 건강 회복에 좋은 기운이 있습니다. 천천히 돌아오세요.",
        "tone_hint": "희망적"
    },
    # 62. 무망괘 + 건강검진 (yearly)
    {
        "hexagram_id": "25-4",
        "category_id": 53,
        "period": "yearly",
        "base_text": "가정무망(可貞無妄). 바름을 지키면 허망함이 없습니다. 정기적인 건강검진을 받으세요. 예방이 최선입니다.",
        "tone_hint": "단호"
    },
    # 63. 대축괘 + 질병예방 (weekly)
    {
        "hexagram_id": "26-3",
        "category_id": 54,
        "period": "weekly",
        "base_text": "양마축(良馬逐). 좋은 말이 달립니다. 건강한 습관을 유지하면 질병을 예방할 수 있습니다. 이번 주 생활 습관을 점검하세요.",
        "tone_hint": "희망적"
    },
    # 64. 이괘 초효 + 식이요법 (daily)
    {
        "hexagram_id": "27-1",
        "category_id": 170,
        "period": "daily",
        "base_text": "사이영귀(舍爾靈龜). 영험한 거북이를 버립니다. 몸에 좋은 음식을 선택하세요. 오늘 식단이 건강을 좌우합니다.",
        "tone_hint": "현실적"
    },
    # 65. 정괘 + 피부건강 (monthly)
    {
        "hexagram_id": "48-2",
        "category_id": 166,
        "period": "monthly",
        "base_text": "정곡사부(井谷射鮒). 우물 골짜기에서 물고기를 잡습니다. 피부 관리에 신경 쓰세요. 기본적인 보습과 수분 섭취가 중요합니다.",
        "tone_hint": "중립"
    },
    # 66. 진괘 + 스트레스관리 (weekly)
    {
        "hexagram_id": "51-2",
        "category_id": 167,
        "period": "weekly",
        "base_text": "진래려(震來厲). 우레가 와서 위태롭습니다. 스트레스가 많은 한 주가 될 수 있습니다. 미리 해소 방법을 준비하세요.",
        "tone_hint": "현실적"
    },
    # 67. 간괘 + 허리/관절 (daily)
    {
        "hexagram_id": "52-2",
        "category_id": 168,
        "period": "daily",
        "base_text": "간기비(艮其腓). 종아리를 멈춥니다. 오늘은 무리한 운동을 피하세요. 허리와 관절을 아끼는 스트레칭을 권합니다.",
        "tone_hint": "위로"
    },
    # 68. 손괘 + 호흡기 (weekly)
    {
        "hexagram_id": "57-3",
        "category_id": 169,
        "period": "weekly",
        "base_text": "빈손린(頻巽吝). 자주 굽히면 인색해집니다. 호흡기 건강에 주의하세요. 환기와 마스크 착용을 챙기세요.",
        "tone_hint": "현실적"
    },
    # 69. 태괘 + 치아건강 (monthly)
    {
        "hexagram_id": "58-1",
        "category_id": 55,
        "period": "monthly",
        "base_text": "화태(和兌). 조화로운 기쁨입니다. 이번 달 치과 검진을 권합니다. 작은 관리가 큰 문제를 예방합니다.",
        "tone_hint": "중립"
    },
    # 70. 미제괘 + 건강운 전반 (yearly)
    {
        "hexagram_id": "64-5",
        "category_id": 56,
        "period": "yearly",
        "base_text": "정길무회(貞吉無悔). 바르면 길하고 후회가 없습니다. 올해 건강 관리를 꾸준히 하면 좋은 결과가 있습니다.",
        "tone_hint": "희망적"
    },

    # ========== 취미 카테고리 (71-80) ==========
    # 71. 대과괘 + 여행 (monthly)
    {
        "hexagram_id": "28-2",
        "category_id": 57,
        "period": "monthly",
        "base_text": "고양생제(枯楊生稊). 마른 버드나무에 새싹이 납니다. 여행을 통해 새로운 활력을 얻을 수 있습니다. 떠나보세요.",
        "tone_hint": "희망적"
    },
    # 72. 예괘 + 운동/스포츠 (weekly)
    {
        "hexagram_id": "16-2",
        "category_id": 58,
        "period": "weekly",
        "base_text": "개우석(介于石). 돌에 의지합니다. 운동에서 기본기가 중요합니다. 이번 주는 기초 훈련에 집중하세요.",
        "tone_hint": "단호"
    },
    # 73. 풍괘 + 음악/예술 (daily)
    {
        "hexagram_id": "55-3",
        "category_id": 59,
        "period": "daily",
        "base_text": "풍기패(豐其沛). 풍성함이 넘칩니다. 오늘 예술적 영감이 풍부합니다. 창작 활동에 몰두해보세요.",
        "tone_hint": "희망적"
    },
    # 74. 손괘 + 게임/레저 (daily)
    {
        "hexagram_id": "57-1",
        "category_id": 60,
        "period": "daily",
        "base_text": "진퇴이무인지정(進退利武人之貞). 나아가고 물러남에 무인의 바름이 이롭습니다. 게임에서도 절제가 필요합니다.",
        "tone_hint": "현실적"
    },
    # 75. 간괘 + 독서/학습취미 (weekly)
    {
        "hexagram_id": "52-5",
        "category_id": 61,
        "period": "weekly",
        "base_text": "간기보언유서(艮其輔言有序). 뺨을 멈추니 말에 차례가 있습니다. 독서를 통해 사고가 정리됩니다. 책을 가까이 하세요.",
        "tone_hint": "희망적"
    },
    # 76. 려괘 + 사진/영상 (daily)
    {
        "hexagram_id": "56-3",
        "category_id": 62,
        "period": "daily",
        "base_text": "려분기차(旅焚其次). 여행에서 묵을 곳을 태웁니다. 사진이나 영상으로 순간을 담으세요. 추억이 됩니다.",
        "tone_hint": "중립"
    },
    # 77. 비괘 + 요리/베이킹 (weekly)
    {
        "hexagram_id": "22-2",
        "category_id": 63,
        "period": "weekly",
        "base_text": "비기수(賁其須). 수염을 꾸밉니다. 요리에서 세밀함이 맛을 좌우합니다. 레시피를 꼼꼼히 따라해보세요.",
        "tone_hint": "중립"
    },
    # 78. 관괘 + 정원가꾸기 (monthly)
    {
        "hexagram_id": "20-1",
        "category_id": 64,
        "period": "monthly",
        "base_text": "동관(童觀). 어린아이처럼 바라봅니다. 정원 가꾸기를 통해 마음의 평화를 얻으세요. 자연과 함께하는 시간입니다.",
        "tone_hint": "위로"
    },
    # 79. 환괘 + 반려동물 (daily)
    {
        "hexagram_id": "59-1",
        "category_id": 65,
        "period": "daily",
        "base_text": "용탁마장길(用拯馬壯吉). 말을 구해 건장하니 길합니다. 반려동물과 함께하는 시간이 행복을 줍니다.",
        "tone_hint": "희망적"
    },
    # 80. 절괘 + 명상/요가 (weekly)
    {
        "hexagram_id": "60-5",
        "category_id": 66,
        "period": "weekly",
        "base_text": "감절길(甘節吉). 달게 절제하면 길합니다. 명상이나 요가로 마음을 다스리세요. 이번 주 내면의 평화를 찾을 수 있습니다.",
        "tone_hint": "위로"
    },

    # ========== 운명 카테고리 (81-90) ==========
    # 81. 건괘 상효 + 인생방향 (yearly)
    {
        "hexagram_id": "1-6",
        "category_id": 67,
        "period": "yearly",
        "base_text": "항룡유회(亢龍有悔). 높이 오른 용은 후회가 있습니다. 정점에 있다면 내려올 준비를 하세요. 인생의 방향을 재점검할 때입니다.",
        "tone_hint": "현실적"
    },
    # 82. 곤괘 상효 + 운세전반 (yearly)
    {
        "hexagram_id": "2-6",
        "category_id": 68,
        "period": "yearly",
        "base_text": "용전우야(龍戰于野). 용이 들에서 싸웁니다. 올해 큰 변화가 예상됩니다. 대비하면 위기를 기회로 만들 수 있습니다.",
        "tone_hint": "단호"
    },
    # 83. 복괘 + 전환점 (monthly)
    {
        "hexagram_id": "24-4",
        "category_id": 69,
        "period": "monthly",
        "base_text": "중행독복(中行獨復). 중도에서 홀로 돌아옵니다. 인생의 전환점이 다가오고 있습니다. 자신만의 길을 가세요.",
        "tone_hint": "희망적"
    },
    # 84. 무망괘 + 행운/불운 (weekly)
    {
        "hexagram_id": "25-1",
        "category_id": 70,
        "period": "weekly",
        "base_text": "무망왕길(无妄往吉). 허망함이 없이 가면 길합니다. 이번 주 순수한 마음으로 행동하면 행운이 따릅니다.",
        "tone_hint": "희망적"
    },
    # 85. 비괘 오효 + 선택/결정 (daily)
    {
        "hexagram_id": "12-5",
        "category_id": 71,
        "period": "daily",
        "base_text": "휴비대인길(休否大人吉). 막힘을 쉬면 대인에게 길합니다. 오늘 중요한 결정은 잠시 미루세요. 시간이 답을 줍니다.",
        "tone_hint": "위로"
    },
    # 86. 감괘 + 시련극복 (monthly)
    {
        "hexagram_id": "29-5",
        "category_id": 72,
        "period": "monthly",
        "base_text": "감불영(坎不盈). 웅덩이가 차지 않습니다. 시련이 있더라도 곧 지나갑니다. 인내하면 돌파구가 보입니다.",
        "tone_hint": "위로"
    },
    # 87. 리괘 이효 + 운명탐구 (yearly)
    {
        "hexagram_id": "30-2",
        "category_id": 73,
        "period": "yearly",
        "base_text": "황리원길(黃離元吉). 황색의 불이니 크게 길합니다. 올해 자신의 운명을 깊이 탐구해보세요. 깨달음이 있습니다.",
        "tone_hint": "희망적"
    },
    # 88. 건괘(艮) + 자아성찰 (weekly)
    {
        "hexagram_id": "39-4",
        "category_id": 74,
        "period": "weekly",
        "base_text": "왕건래련(往蹇來連). 가면 어렵고 오면 연결됩니다. 이번 주는 바깥보다 내면을 살피세요. 성찰의 시간입니다.",
        "tone_hint": "중립"
    },
    # 89. 해괘 상효 + 새출발 (monthly)
    {
        "hexagram_id": "40-6",
        "category_id": 75,
        "period": "monthly",
        "base_text": "공용사준우고용(公用射隼于高墉). 매를 쏘아 맞춥니다. 과거를 털어내고 새 출발을 할 때입니다. 과감하게 나아가세요.",
        "tone_hint": "희망적"
    },
    # 90. 미제괘 + 삶의의미 (yearly)
    {
        "hexagram_id": "64-1",
        "category_id": 76,
        "period": "yearly",
        "base_text": "유기미(濡其尾). 꼬리가 젖습니다. 아직 완성되지 않았습니다. 삶의 의미를 찾는 여정이 계속됩니다. 멈추지 마세요.",
        "tone_hint": "위로"
    },

    # ========== 기타/복합 카테고리 (91-100) ==========
    # 91. 수괘 + 법률/소송 (monthly)
    {
        "hexagram_id": "17-3",
        "category_id": 77,
        "period": "monthly",
        "base_text": "계장부(係丈夫). 어른에게 매입니다. 법률 문제는 전문가와 상담하세요. 혼자 해결하려 하지 마세요.",
        "tone_hint": "단호"
    },
    # 92. 송괘 + 분쟁해결 (weekly)
    {
        "hexagram_id": "6-5",
        "category_id": 78,
        "period": "weekly",
        "base_text": "송원길(訟元吉). 송사에서 크게 길합니다. 분쟁이 유리하게 해결될 조짐이 있습니다. 끝까지 포기하지 마세요.",
        "tone_hint": "희망적"
    },
    # 93. 대유괘 + 기부/봉사 (monthly)
    {
        "hexagram_id": "14-2",
        "category_id": 79,
        "period": "monthly",
        "base_text": "대거이재(大車以載). 큰 수레로 싣습니다. 나눔의 기쁨이 있습니다. 이번 달 기부나 봉사를 통해 마음이 풍요로워집니다.",
        "tone_hint": "희망적"
    },
    # 94. 진괘 + 이사/이동 (weekly)
    {
        "hexagram_id": "51-4",
        "category_id": 80,
        "period": "weekly",
        "base_text": "진수니(震遂泥). 우레가 진흙에 빠집니다. 이사나 이동 계획은 조금 미루는 것이 좋겠습니다. 여건을 더 살피세요.",
        "tone_hint": "현실적"
    },
    # 95. 정괘 + 종교/영성 (yearly)
    {
        "hexagram_id": "50-3",
        "category_id": 81,
        "period": "yearly",
        "base_text": "정이혁(鼎耳革). 솥의 귀가 바뀝니다. 영적 성장의 해입니다. 종교나 영성 활동을 통해 내면이 성숙해집니다.",
        "tone_hint": "희망적"
    },
    # 96. 혁괘 + 가치관변화 (monthly)
    {
        "hexagram_id": "49-5",
        "category_id": 82,
        "period": "monthly",
        "base_text": "대인호변(大人虎變). 대인이 호랑이처럼 변합니다. 가치관의 큰 변화가 예상됩니다. 두려워하지 말고 받아들이세요.",
        "tone_hint": "단호"
    },
    # 97. 곤괘(困) + 위기관리 (weekly)
    {
        "hexagram_id": "47-3",
        "category_id": 83,
        "period": "weekly",
        "base_text": "곤우석(困于石). 돌에 막혀 곤란합니다. 위기 상황에서는 함부로 움직이지 마세요. 때를 기다리는 것도 지혜입니다.",
        "tone_hint": "위로"
    },
    # 98. 정괘(井) + 기본기다지기 (daily)
    {
        "hexagram_id": "48-5",
        "category_id": 84,
        "period": "daily",
        "base_text": "정렬한천(井洌寒泉). 우물이 맑고 샘이 차갑습니다. 오늘은 기본에 충실하세요. 기초가 튼튼해야 발전이 있습니다.",
        "tone_hint": "중립"
    },
    # 99. 기제괘 + 완성/마무리 (monthly)
    {
        "hexagram_id": "63-2",
        "category_id": 85,
        "period": "monthly",
        "base_text": "부상기불(婦喪其茀). 부인이 수레 휘장을 잃습니다. 완성 단계에서 방심하지 마세요. 마무리까지 신중하게.",
        "tone_hint": "단호"
    },
    # 100. 미제괘 상효 + 새로운시작 (yearly)
    {
        "hexagram_id": "64-6",
        "category_id": 86,
        "period": "yearly",
        "base_text": "유부우음주(有孚于飲酒). 술을 마시며 믿음이 있습니다. 아직 끝나지 않았습니다. 새로운 시작이 기다리고 있습니다.",
        "tone_hint": "희망적"
    },
]


def get_all_interpretations():
    """전체 Interpretations 반환"""
    return INTERPRETATIONS_DATA


def get_interpretations_by_category(category_id: int):
    """특정 카테고리의 Interpretations 반환"""
    return [i for i in INTERPRETATIONS_DATA if i["category_id"] == category_id]


def get_interpretations_by_hexagram(hexagram_id: str):
    """특정 괘+효의 Interpretations 반환"""
    return [i for i in INTERPRETATIONS_DATA if i["hexagram_id"] == hexagram_id]


def get_interpretations_by_period(period: str):
    """특정 기간의 Interpretations 반환"""
    return [i for i in INTERPRETATIONS_DATA if i["period"] == period]


# 통계
INTERPRETATIONS_STATS = {
    "total": 100,
    "by_period": {
        "daily": len([i for i in INTERPRETATIONS_DATA if i["period"] == "daily"]),
        "weekly": len([i for i in INTERPRETATIONS_DATA if i["period"] == "weekly"]),
        "monthly": len([i for i in INTERPRETATIONS_DATA if i["period"] == "monthly"]),
        "yearly": len([i for i in INTERPRETATIONS_DATA if i["period"] == "yearly"]),
    },
    "by_tone": {
        "희망적": len([i for i in INTERPRETATIONS_DATA if i["tone_hint"] == "희망적"]),
        "현실적": len([i for i in INTERPRETATIONS_DATA if i["tone_hint"] == "현실적"]),
        "단호": len([i for i in INTERPRETATIONS_DATA if i["tone_hint"] == "단호"]),
        "위로": len([i for i in INTERPRETATIONS_DATA if i["tone_hint"] == "위로"]),
        "중립": len([i for i in INTERPRETATIONS_DATA if i["tone_hint"] == "중립"]),
    }
}

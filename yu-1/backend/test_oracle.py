# -*- coding: utf-8 -*-
import json
from app.services.oracle_generator import oracle_generator, OracleInput
from app.data.yao_direction import YaoDirection
from app.data.question_direction import QuestionDirection

input_data = OracleInput(
    hexagram_number=2,
    hexagram_name='곤',
    yao_position=5,
    yao_text='黃裳元吉',
    yao_meaning='누런 치마이니 크게 길하다',
    yao_direction=YaoDirection.ASCENDING,
    question='주식을 사도 되나요?',
    question_direction=QuestionDirection.START,
    category_name='재물/주식/증권',
    period='daily',
    base_interpretation='테스트'
)

output = oracle_generator.generate(input_data)
result = {
    'stage_3_context': output.stage_3_context,
    'stage_4_guidance': output.stage_4_guidance,
    'full_text': output.full_text
}

with open('oracle_test_result.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print("Result saved to oracle_test_result.json")

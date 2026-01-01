# -*- coding: utf-8 -*-
import requests
import json

response = requests.post(
    'http://localhost:8000/api/divination/cast-by-question',
    json={'question': '주식을 사도 되나요?', 'period': 'daily'}
)

print(f"Status: {response.status_code}")
data = response.json()

# 파일로 저장
with open('test_result.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("결과가 test_result.json에 저장되었습니다.")

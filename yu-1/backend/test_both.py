# -*- coding: utf-8 -*-
import json
import requests

API_BASE = "http://localhost:8000"

# 테스트 1: 행동 질문
response1 = requests.post(
    f"{API_BASE}/api/divination/cast-by-question",
    json={"question": "주식을 사도 되나요?", "period": "daily"}
)
result1 = response1.json()

# 테스트 2: 운세 질문
response2 = requests.post(
    f"{API_BASE}/api/divination/cast-by-question",
    json={"question": "2026년 한해의 운세가 어떻습니까?", "period": "yearly"}
)
result2 = response2.json()

# 결과 저장
with open('test_both_result.json', 'w', encoding='utf-8') as f:
    json.dump({
        "action_query": {
            "question": "주식을 사도 되나요?",
            "interpretation": result1['divination_result']['interpretation']
        },
        "fortune_query": {
            "question": "2026년 한해의 운세가 어떻습니까?",
            "interpretation": result2['divination_result']['interpretation']
        }
    }, f, ensure_ascii=False, indent=2)

print("Done")

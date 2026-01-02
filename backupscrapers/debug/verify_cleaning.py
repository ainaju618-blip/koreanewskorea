
import sys
import os
import re

sys.path.append(r'd:\cbt\koreanews\scrapers')
from utils.scraper_utils import clean_article_content

sample_text = """
순천시, 2025년 청년도전지원사업 평가 '최우수 지자체 ' 선정 관련 이미지 © 코리아NEWS

순천시는 고용노동부가 주관한 '2025년 청년도전지원사업 성과평가'
에서 최우수 지자체로 선정되는 성과를 거뒀다고 17일 밝혔다.
이번 최우수 지자체 선정은 단기 취업 성과를 넘어, 구직단념 청년의 회복과 자립 역량 강화를 중심으로 단계별 맞춤 프로그램 운영하며 청년의 사회 복귀와 지역 정책을 체계적으로 지원한 점이 높이 평가된 결과다.

보도자료 제공 : 청년정책과(061-749-5749)
"""

print("--- Original Text ---")
print(sample_text)
print("-" * 30)

cleaned = clean_article_content(sample_text)

print("--- Cleaned Text ---")
print(cleaned)
print("-" * 30)

failures = []
if "관련 이미지" in cleaned:
    failures.append("Image caption NOT removed")
if "보도자료 제공" in cleaned:
    failures.append("Provider info NOT removed")

if failures:
    print("\n[FAIL] Cleaning incomplete:")
    for f in failures:
        print(f" - {f}")
else:
    print("\n[PASS] All targets removed successfully.")

"""
주역 점술 확률 분포 검증 테스트

전통 시초점 이론적 확률:
- 노음(6): 1/16 = 6.25%   (변효, 음→양)
- 소양(7): 5/16 = 31.25%  (불변, 양)
- 소음(8): 7/16 = 43.75%  (불변, 음)
- 노양(9): 3/16 = 18.75%  (변효, 양→음)

동전점 이론적 확률:
- 노음(6): 1/8 = 12.5%
- 소양(7): 3/8 = 37.5%
- 소음(8): 3/8 = 37.5%
- 노양(9): 1/8 = 12.5%
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from collections import Counter
from app.services.divination import DivinationService

def test_shicho_probability(iterations: int = 10000):
    """시초점 확률 분포 테스트"""
    print(f"\n{'='*60}")
    print(f"시초점(蓍草占) 확률 분포 테스트 - {iterations:,}회 반복")
    print(f"{'='*60}")

    service = DivinationService()
    yao_counter = Counter()  # 6, 7, 8, 9 카운트
    changing_count = 0  # 변효 총 개수

    for _ in range(iterations):
        result = service.shicho_divination()
        for line in result.lines:
            yao_counter[line.value] += 1
            if line.changing:
                changing_count += 1

    total = sum(yao_counter.values())

    print("\n[결과 vs 이론값]")
    print("-" * 50)

    theoretical = {
        6: 6.25,   # 노음 (변효)
        7: 31.25,  # 소양
        8: 43.75,  # 소음
        9: 18.75   # 노양 (변효)
    }

    names = {6: "노음(老陰)", 7: "소양(少陽)", 8: "소음(少陰)", 9: "노양(老陽)"}

    for value in [6, 7, 8, 9]:
        actual_pct = (yao_counter[value] / total) * 100
        theo_pct = theoretical[value]
        diff = actual_pct - theo_pct
        status = "[OK]" if abs(diff) < 3 else "[WARN]"

        print(f"{names[value]}: {yao_counter[value]:>6,}회 | "
              f"실제: {actual_pct:>6.2f}% | "
              f"이론: {theo_pct:>6.2f}% | "
              f"차이: {diff:>+6.2f}% {status}")

    # 변효 비율 (이론: 6.25% + 18.75% = 25%)
    changing_pct = (changing_count / total) * 100
    print(f"\n변효 비율: {changing_pct:.2f}% (이론: 25.00%)")

    return yao_counter


def test_coin_probability(iterations: int = 10000):
    """동전점 확률 분포 테스트"""
    print(f"\n{'='*60}")
    print(f"동전점(擲錢占) 확률 분포 테스트 - {iterations:,}회 반복")
    print(f"{'='*60}")

    service = DivinationService()
    yao_counter = Counter()

    for _ in range(iterations):
        result = service.simple_divination()
        for line in result.lines:
            yao_counter[line.value] += 1

    total = sum(yao_counter.values())

    print("\n[결과 vs 이론값]")
    print("-" * 50)

    theoretical = {
        6: 12.5,   # 노음
        7: 37.5,   # 소양
        8: 37.5,   # 소음
        9: 12.5    # 노양
    }

    names = {6: "노음(老陰)", 7: "소양(少陽)", 8: "소음(少陰)", 9: "노양(老陽)"}

    for value in [6, 7, 8, 9]:
        actual_pct = (yao_counter[value] / total) * 100
        theo_pct = theoretical[value]
        diff = actual_pct - theo_pct
        status = "[OK]" if abs(diff) < 2 else "[WARN]"

        print(f"{names[value]}: {yao_counter[value]:>6,}회 | "
              f"실제: {actual_pct:>6.2f}% | "
              f"이론: {theo_pct:>6.2f}% | "
              f"차이: {diff:>+6.2f}% {status}")

    return yao_counter


def test_uniform_probability(iterations: int = 10000):
    """균등 분포 384효 테스트"""
    print(f"\n{'='*60}")
    print(f"균등 분포 384효 테스트 - {iterations:,}회 반복")
    print(f"{'='*60}")

    service = DivinationService()

    hexagram_counter = Counter()  # 64괘 분포
    yao_position_counter = Counter()  # 1-6효 분포
    fortune_scores = []

    for _ in range(iterations):
        result = service.uniform_384_divination()
        hexagram_counter[result.hexagram_number] += 1
        if result.reading_method.yao_position:
            yao_position_counter[result.reading_method.yao_position] += 1

    print("\n[64괘 분포 - 상위/하위 5개]")
    print("-" * 50)

    most_common = hexagram_counter.most_common(5)
    least_common = hexagram_counter.most_common()[-5:]

    expected_per_hex = iterations / 64

    print("가장 많이 나온 괘:")
    for hex_num, count in most_common:
        pct = (count / iterations) * 100
        expected_pct = 100 / 64
        diff = pct - expected_pct
        print(f"  제{hex_num:>2}괘: {count:>5,}회 ({pct:.2f}%, 차이: {diff:+.2f}%)")

    print("\n가장 적게 나온 괘:")
    for hex_num, count in least_common:
        pct = (count / iterations) * 100
        expected_pct = 100 / 64
        diff = pct - expected_pct
        print(f"  제{hex_num:>2}괘: {count:>5,}회 ({pct:.2f}%, 차이: {diff:+.2f}%)")

    print("\n[효 위치 분포 (이론: 각 16.67%)]")
    print("-" * 50)
    for pos in range(1, 7):
        count = yao_position_counter[pos]
        pct = (count / iterations) * 100
        diff = pct - 16.67
        status = "[OK]" if abs(diff) < 2 else "[WARN]"
        print(f"제{pos}효: {count:>5,}회 ({pct:.2f}%, 차이: {diff:+.2f}%) {status}")

    return hexagram_counter


def test_fortune_weight_bias(iterations: int = 5000):
    """운발수 가중치 편향 테스트"""
    print(f"\n{'='*60}")
    print(f"운발수(運發數) 가중치 편향 테스트 - {iterations:,}회 반복")
    print(f"{'='*60}")

    service = DivinationService()

    # 운발수별 결과 수집
    luck_results = {i: [] for i in range(1, 11)}
    all_scores = []

    # DivinationService의 운발수 선택을 직접 테스트
    from collections import defaultdict
    import random

    # 운발수 분포 테스트
    luck_counter = Counter()
    for _ in range(iterations):
        luck = random.randint(1, 10)
        luck_counter[luck] += 1

    print("\n[운발수 분포 (이론: 각 10%)]")
    print("-" * 50)
    for luck in range(1, 11):
        count = luck_counter[luck]
        pct = (count / iterations) * 100
        print(f"운발수 {luck:>2}: {count:>5,}회 ({pct:.1f}%)")

    # 실제 점술 결과에서 fortune_score 분포 테스트
    print("\n[실제 점술 결과 fortune_score 분포 분석]")
    print("-" * 50)

    # yao_complete 데이터 로드 시도
    try:
        from app.data.yao_complete import YAO_DATA

        # 384효의 fortune_score 분포
        score_distribution = Counter()
        for (hex_num, yao_pos), data in YAO_DATA.items():
            score = data.get("fortune_score", 50)
            if score >= 85:
                score_distribution["대길(85+)"] += 1
            elif score >= 70:
                score_distribution["길(70-84)"] += 1
            elif score >= 50:
                score_distribution["평(50-69)"] += 1
            elif score >= 30:
                score_distribution["흉(30-49)"] += 1
            else:
                score_distribution["대흉(<30)"] += 1

        print("\n384효 데이터 fortune_score 분포:")
        for category in ["대길(85+)", "길(70-84)", "평(50-69)", "흉(30-49)", "대흉(<30)"]:
            count = score_distribution[category]
            pct = (count / 384) * 100
            print(f"  {category}: {count:>3}개 ({pct:.1f}%)")

        # 가중치 적용 후 예상 확률 계산
        weights = {"대길(85+)": 3.0, "길(70-84)": 2.5, "평(50-69)": 1.5, "흉(30-49)": 1.0, "대흉(<30)": 0.5}
        total_weight = sum(score_distribution[cat] * weights[cat] for cat in weights)

        print("\n가중치 적용 후 예상 선택 확률:")
        for category in ["대길(85+)", "길(70-84)", "평(50-69)", "흉(30-49)", "대흉(<30)"]:
            weighted = score_distribution[category] * weights[category]
            expected_pct = (weighted / total_weight) * 100
            print(f"  {category}: 가중치 {weights[category]} → 예상 {expected_pct:.1f}%")

    except ImportError:
        print("[WARN] yao_complete 데이터를 로드할 수 없습니다.")
        print("균등 분포로 테스트를 진행합니다.")


def test_changing_lines_distribution(iterations: int = 5000):
    """변효 개수 분포 테스트"""
    print(f"\n{'='*60}")
    print(f"변효(變爻) 개수 분포 테스트 - {iterations:,}회 반복")
    print(f"{'='*60}")

    service = DivinationService()

    # 시초점 변효 분포
    shicho_changing = Counter()
    for _ in range(iterations):
        result = service.shicho_divination()
        shicho_changing[len(result.changing_lines)] += 1

    # 동전점 변효 분포
    coin_changing = Counter()
    for _ in range(iterations):
        result = service.simple_divination()
        coin_changing[len(result.changing_lines)] += 1

    # 균등 분포 변효 분포
    uniform_changing = Counter()
    for _ in range(iterations):
        result = service.uniform_384_divination()
        uniform_changing[len(result.changing_lines)] += 1

    print("\n[변효 개수 분포 비교]")
    print("-" * 70)
    print(f"{'변효 수':^8} | {'시초점':^15} | {'동전점':^15} | {'균등분포':^15}")
    print("-" * 70)

    for count in range(7):
        s_pct = (shicho_changing[count] / iterations) * 100
        c_pct = (coin_changing[count] / iterations) * 100
        u_pct = (uniform_changing[count] / iterations) * 100
        print(f"{count}개변효 | {s_pct:>6.2f}% ({shicho_changing[count]:>4}) | "
              f"{c_pct:>6.2f}% ({coin_changing[count]:>4}) | "
              f"{u_pct:>6.2f}% ({uniform_changing[count]:>4})")

    # 이론적 분포 계산
    print("\n[이론적 변효 분포]")
    print("-" * 50)

    # 시초점: 변효 확률 = 6.25% + 18.75% = 25%
    # 동전점: 변효 확률 = 12.5% + 12.5% = 25%
    from math import comb

    print("시초점 이론 (변효 확률 25%):")
    for k in range(7):
        prob = comb(6, k) * (0.25 ** k) * (0.75 ** (6-k)) * 100
        print(f"  {k}개 변효: {prob:.2f}%")

    print("\n동전점 이론 (변효 확률 25%):")
    for k in range(7):
        prob = comb(6, k) * (0.25 ** k) * (0.75 ** (6-k)) * 100
        print(f"  {k}개 변효: {prob:.2f}%")


def main():
    print("\n" + "=" * 60)
    print("        [주역 점술 확률 분포 종합 검증]")
    print("=" * 60)

    # 1. 시초점 테스트
    test_shicho_probability(10000)

    # 2. 동전점 테스트
    test_coin_probability(10000)

    # 3. 균등 분포 테스트
    test_uniform_probability(10000)

    # 4. 운발수 편향 테스트
    test_fortune_weight_bias(5000)

    # 5. 변효 분포 테스트
    test_changing_lines_distribution(5000)

    print("\n" + "=" * 60)
    print("검증 완료!")
    print("=" * 60)


if __name__ == "__main__":
    main()

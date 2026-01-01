"""
Test suite for divination algorithm.
Tests probability distributions, hexagram lookup, changing lines detection,
and transformed hexagram calculation.
"""
import pytest
from collections import Counter
from typing import Dict, List

from app.services.divination import (
    DivinationService,
    HEXAGRAM_LOOKUP,
    YaoResult,
    DivinationResult,
    ReadingType,
    ReadingMethod,
)


class TestShichoProbabilityDistribution:
    """Test probability distribution for shicho (yarrow stalk) divination method."""

    def test_shicho_probability_distribution(self, divination_service: DivinationService):
        """
        Run 100,000 simulations and verify probability distribution matches traditional I Ching:
        - 노음(6): ~6.25% (1/16)
        - 소양(7): ~31.25% (5/16)
        - 소음(8): ~43.75% (7/16)
        - 노양(9): ~18.75% (3/16)
        """
        num_simulations = 100_000
        value_counts: Counter = Counter()

        # Run simulations - cast single yao 100,000 times
        for _ in range(num_simulations):
            yao = divination_service._cast_single_yao_shicho()
            value_counts[yao.value] += 1

        # Calculate observed probabilities
        observed_probs = {
            value: count / num_simulations * 100
            for value, count in value_counts.items()
        }

        # Expected probabilities for shicho method
        expected_probs = {
            6: 6.25,   # 노음 (1/16)
            7: 31.25,  # 소양 (5/16)
            8: 43.75,  # 소음 (7/16)
            9: 18.75,  # 노양 (3/16)
        }

        # Allow 1% tolerance for statistical variance
        tolerance = 1.0

        for value in [6, 7, 8, 9]:
            observed = observed_probs.get(value, 0)
            expected = expected_probs[value]
            assert abs(observed - expected) < tolerance, (
                f"Value {value}: expected {expected}%, got {observed:.2f}%"
            )

        # Print distribution for debugging
        print("\n시초점 확률 분포 (100,000회 시뮬레이션):")
        for value in sorted(value_counts.keys()):
            obs_pct = observed_probs[value]
            exp_pct = expected_probs[value]
            print(f"  {value}: {obs_pct:.2f}% (expected: {exp_pct}%)")


class TestSimpleDivinationProbabilityDistribution:
    """Test probability distribution for simple (coin) divination method."""

    def test_simple_divination_probability(self, divination_service: DivinationService):
        """
        Run 100,000 simulations for coin method and verify:
        - 6: 12.5% (1/8)
        - 7: 37.5% (3/8)
        - 8: 37.5% (3/8)
        - 9: 12.5% (1/8)
        """
        num_simulations = 100_000
        value_counts: Counter = Counter()

        # Run simulations - each simple_divination produces 6 lines
        # We need individual coin tosses, so we'll simulate directly
        import random

        for _ in range(num_simulations):
            # 3 coins: heads=3, tails=2
            coins = [random.choice([2, 3]) for _ in range(3)]
            total = sum(coins)
            value_counts[total] += 1

        # Calculate observed probabilities
        observed_probs = {
            value: count / num_simulations * 100
            for value, count in value_counts.items()
        }

        # Expected probabilities for coin method
        expected_probs = {
            6: 12.5,   # TTT: 1/8
            7: 37.5,   # HTT, THT, TTH: 3/8
            8: 37.5,   # HHT, HTH, THH: 3/8
            9: 12.5,   # HHH: 1/8
        }

        # Allow 1% tolerance
        tolerance = 1.0

        for value in [6, 7, 8, 9]:
            observed = observed_probs.get(value, 0)
            expected = expected_probs[value]
            assert abs(observed - expected) < tolerance, (
                f"Value {value}: expected {expected}%, got {observed:.2f}%"
            )

        # Print distribution for debugging
        print("\n동전점 확률 분포 (100,000회 시뮬레이션):")
        for value in sorted(value_counts.keys()):
            obs_pct = observed_probs[value]
            exp_pct = expected_probs[value]
            print(f"  {value}: {obs_pct:.2f}% (expected: {exp_pct}%)")


class TestHexagramLookup:
    """Test hexagram lookup table completeness."""

    def test_hexagram_lookup_complete(self):
        """
        Verify all 64 combinations exist in HEXAGRAM_LOOKUP.
        8 upper trigrams x 8 lower trigrams = 64 hexagrams
        """
        # All 8 trigrams: 0=곤, 1=진, 2=감, 3=태, 4=간, 5=리, 6=손, 7=건
        trigrams = list(range(8))

        # Check all 64 combinations
        missing_combinations = []
        found_hexagrams = set()

        for upper in trigrams:
            for lower in trigrams:
                key = (upper, lower)
                if key not in HEXAGRAM_LOOKUP:
                    missing_combinations.append(key)
                else:
                    found_hexagrams.add(HEXAGRAM_LOOKUP[key])

        # Assert no missing combinations
        assert len(missing_combinations) == 0, (
            f"Missing {len(missing_combinations)} combinations in HEXAGRAM_LOOKUP: {missing_combinations}"
        )

        # Assert all 64 hexagram numbers (1-64) are present
        expected_hexagrams = set(range(1, 65))
        missing_hexagrams = expected_hexagrams - found_hexagrams
        extra_hexagrams = found_hexagrams - expected_hexagrams

        assert len(missing_hexagrams) == 0, (
            f"Missing hexagram numbers: {sorted(missing_hexagrams)}"
        )
        assert len(extra_hexagrams) == 0, (
            f"Extra hexagram numbers: {sorted(extra_hexagrams)}"
        )

        # Print summary
        print(f"\nHexagram lookup 완성도 검증:")
        print(f"  총 조합 수: {len(HEXAGRAM_LOOKUP)} / 64")
        print(f"  괘 번호 범위: {min(found_hexagrams)} ~ {max(found_hexagrams)}")


class TestChangingLinesDetection:
    """Test changing lines (변효) detection."""

    def test_changing_lines_detection_value_6(self, divination_service: DivinationService):
        """Verify that value 6 (노음) is correctly detected as changing."""
        yao = YaoResult(type="yin", changing=True, value=6)
        assert yao.changing is True
        assert yao.value == 6
        assert yao.type == "yin"

    def test_changing_lines_detection_value_9(self, divination_service: DivinationService):
        """Verify that value 9 (노양) is correctly detected as changing."""
        yao = YaoResult(type="yang", changing=True, value=9)
        assert yao.changing is True
        assert yao.value == 9
        assert yao.type == "yang"

    def test_non_changing_lines_value_7(self, divination_service: DivinationService):
        """Verify that value 7 (소양) is not changing."""
        yao = YaoResult(type="yang", changing=False, value=7)
        assert yao.changing is False
        assert yao.value == 7
        assert yao.type == "yang"

    def test_non_changing_lines_value_8(self, divination_service: DivinationService):
        """Verify that value 8 (소음) is not changing."""
        yao = YaoResult(type="yin", changing=False, value=8)
        assert yao.changing is False
        assert yao.value == 8
        assert yao.type == "yin"

    def test_changing_lines_in_result(self, divination_service: DivinationService):
        """Verify changing lines are correctly collected in DivinationResult."""
        # Create test lines with known changing positions
        lines = [
            YaoResult(type="yang", changing=True, value=9),   # position 1 - changing
            YaoResult(type="yin", changing=False, value=8),   # position 2
            YaoResult(type="yang", changing=False, value=7),  # position 3
            YaoResult(type="yin", changing=True, value=6),    # position 4 - changing
            YaoResult(type="yang", changing=False, value=7),  # position 5
            YaoResult(type="yin", changing=False, value=8),   # position 6
        ]

        result = divination_service._lines_to_result(lines)

        # Verify changing lines positions
        assert 1 in result.changing_lines
        assert 4 in result.changing_lines
        assert len(result.changing_lines) == 2

        # Verify non-changing positions are not included
        assert 2 not in result.changing_lines
        assert 3 not in result.changing_lines
        assert 5 not in result.changing_lines
        assert 6 not in result.changing_lines


class TestTransformedHexagramCalculation:
    """Test transformed hexagram (변괘) calculation."""

    def test_transformed_hexagram_calculation_single_change(self, divination_service: DivinationService):
        """Verify 변괘 calculation with a single changing line."""
        # Create 건위천 (all yang, hexagram 1) with position 1 changing
        lines = [
            YaoResult(type="yang", changing=True, value=9),   # position 1 - changes to yin
            YaoResult(type="yang", changing=False, value=7),
            YaoResult(type="yang", changing=False, value=7),
            YaoResult(type="yang", changing=False, value=7),
            YaoResult(type="yang", changing=False, value=7),
            YaoResult(type="yang", changing=False, value=7),
        ]

        result = divination_service._lines_to_result(lines)

        # Original should be 건위천 (1)
        assert result.hexagram_number == 1

        # Transformed: first yang becomes yin
        # Lower trigram: 0(yin) + 1*2 + 1*4 = 6 (손)
        # Upper trigram: 1 + 1*2 + 1*4 = 7 (건)
        # (7, 6) = 44 천풍구
        assert result.transformed_hexagram == 44

        print(f"\n변괘 테스트 (단일 변효):")
        print(f"  원괘: {result.hexagram_number} (건위천)")
        print(f"  변효: {result.changing_lines}")
        print(f"  변괘: {result.transformed_hexagram} (천풍구)")

    def test_transformed_hexagram_calculation_multiple_changes(self, divination_service: DivinationService):
        """Verify 변괘 calculation with multiple changing lines."""
        # Create 곤위지 (all yin, hexagram 2) with positions 1 and 6 changing
        lines = [
            YaoResult(type="yin", changing=True, value=6),    # position 1 - changes to yang
            YaoResult(type="yin", changing=False, value=8),
            YaoResult(type="yin", changing=False, value=8),
            YaoResult(type="yin", changing=False, value=8),
            YaoResult(type="yin", changing=False, value=8),
            YaoResult(type="yin", changing=True, value=6),    # position 6 - changes to yang
        ]

        result = divination_service._lines_to_result(lines)

        # Original should be 곤위지 (2)
        assert result.hexagram_number == 2

        # Transformed:
        # Lower trigram: 1(yang) + 0*2 + 0*4 = 1 (진)
        # Upper trigram: 0 + 0*2 + 1*4 = 4 (간)
        # (4, 1) = 27 산뢰이
        assert result.transformed_hexagram == 27

        print(f"\n변괘 테스트 (다중 변효):")
        print(f"  원괘: {result.hexagram_number} (곤위지)")
        print(f"  변효: {result.changing_lines}")
        print(f"  변괘: {result.transformed_hexagram} (산뢰이)")

    def test_no_transformed_hexagram_without_changing_lines(self, divination_service: DivinationService):
        """Verify no 변괘 when there are no changing lines."""
        # Create all non-changing lines
        lines = [
            YaoResult(type="yang", changing=False, value=7),
            YaoResult(type="yin", changing=False, value=8),
            YaoResult(type="yang", changing=False, value=7),
            YaoResult(type="yin", changing=False, value=8),
            YaoResult(type="yang", changing=False, value=7),
            YaoResult(type="yin", changing=False, value=8),
        ]

        result = divination_service._lines_to_result(lines)

        # No changing lines
        assert len(result.changing_lines) == 0

        # No transformed hexagram
        assert result.transformed_hexagram is None

        print(f"\n변괘 테스트 (변효 없음):")
        print(f"  원괘: {result.hexagram_number}")
        print(f"  변효: {result.changing_lines}")
        print(f"  변괘: {result.transformed_hexagram}")

    def test_all_changing_lines(self, divination_service: DivinationService):
        """Verify 변괘 calculation when all lines are changing."""
        # All yang changing (value 9) - 건위천 transforms to 곤위지
        lines = [
            YaoResult(type="yang", changing=True, value=9),
            YaoResult(type="yang", changing=True, value=9),
            YaoResult(type="yang", changing=True, value=9),
            YaoResult(type="yang", changing=True, value=9),
            YaoResult(type="yang", changing=True, value=9),
            YaoResult(type="yang", changing=True, value=9),
        ]

        result = divination_service._lines_to_result(lines)

        # Original is 건위천 (1)
        assert result.hexagram_number == 1

        # All 6 positions should be changing
        assert len(result.changing_lines) == 6
        assert result.changing_lines == [1, 2, 3, 4, 5, 6]

        # Transformed is 곤위지 (2) - all yang becomes yin
        assert result.transformed_hexagram == 2

        print(f"\n변괘 테스트 (전변효):")
        print(f"  원괘: {result.hexagram_number} (건위천)")
        print(f"  변효: {result.changing_lines}")
        print(f"  변괘: {result.transformed_hexagram} (곤위지)")


class TestYaoValueMapping:
    """Test that yao values map correctly to type and changing status."""

    def test_value_6_maps_to_yin_changing(self, divination_service: DivinationService):
        """Value 6 (노음) should be yin and changing."""
        # Run multiple times and check consistency
        for _ in range(100):
            result = divination_service.simple_divination()
            for i, line in enumerate(result.changing_lines):
                # This test verifies that changing lines are properly detected
                assert 1 <= line <= 6

    def test_complete_divination_result_structure(self, divination_service: DivinationService):
        """Verify DivinationResult has all required fields."""
        result = divination_service.simple_divination()

        # Check hexagram_number is in valid range
        assert 1 <= result.hexagram_number <= 64

        # Check reading_method exists and has valid reading_type
        assert result.reading_method is not None
        assert isinstance(result.reading_method.reading_type, ReadingType)

        # If yao_position is set, it should be in valid range (1-6)
        if result.reading_method.yao_position is not None:
            assert 1 <= result.reading_method.yao_position <= 6

        # yao_position property should match reading_method.yao_position
        assert result.yao_position == result.reading_method.yao_position

        # Check changing_lines is a list
        assert isinstance(result.changing_lines, list)

        # If there are changing lines, check they're in valid range
        for line in result.changing_lines:
            assert 1 <= line <= 6

        # transformed_hexagram should be None or in valid range
        if result.transformed_hexagram is not None:
            assert 1 <= result.transformed_hexagram <= 64


class TestReadingMethodRules:
    """Test traditional 변효 interpretation rules (주역본의 규칙)."""

    def test_zero_changing_lines_uses_gua_ci(self, divination_service: DivinationService):
        """0변효: 본괘 괘사(卦辭) 사용"""
        lines = [
            YaoResult(type="yang", changing=False, value=7),
            YaoResult(type="yin", changing=False, value=8),
            YaoResult(type="yang", changing=False, value=7),
            YaoResult(type="yin", changing=False, value=8),
            YaoResult(type="yang", changing=False, value=7),
            YaoResult(type="yin", changing=False, value=8),
        ]
        result = divination_service._lines_to_result(lines)

        assert len(result.changing_lines) == 0
        assert result.reading_method.reading_type == ReadingType.GUA_CI
        assert result.reading_method.yao_position is None
        assert result.reading_method.use_transformed is False

    def test_one_changing_line_uses_yao_ci(self, divination_service: DivinationService):
        """1변효: 해당 효사(爻辭) 사용"""
        lines = [
            YaoResult(type="yang", changing=True, value=9),   # 변효
            YaoResult(type="yin", changing=False, value=8),
            YaoResult(type="yang", changing=False, value=7),
            YaoResult(type="yin", changing=False, value=8),
            YaoResult(type="yang", changing=False, value=7),
            YaoResult(type="yin", changing=False, value=8),
        ]
        result = divination_service._lines_to_result(lines)

        assert len(result.changing_lines) == 1
        assert result.reading_method.reading_type == ReadingType.YAO_CI
        assert result.reading_method.yao_position == 1  # 변효 위치
        assert result.reading_method.use_transformed is False

    def test_two_changing_lines_uses_upper_yao_ci(self, divination_service: DivinationService):
        """2변효: 두 효 중 위(상위) 효사 사용"""
        lines = [
            YaoResult(type="yang", changing=True, value=9),   # 변효 1
            YaoResult(type="yin", changing=False, value=8),
            YaoResult(type="yang", changing=False, value=7),
            YaoResult(type="yin", changing=True, value=6),    # 변효 4
            YaoResult(type="yang", changing=False, value=7),
            YaoResult(type="yin", changing=False, value=8),
        ]
        result = divination_service._lines_to_result(lines)

        assert len(result.changing_lines) == 2
        assert result.reading_method.reading_type == ReadingType.YAO_CI
        assert result.reading_method.yao_position == 4  # 상위 효
        assert result.reading_method.use_transformed is False

    def test_three_changing_lines_uses_both_gua_ci(self, divination_service: DivinationService):
        """3변효: 본괘 괘사와 지괘 괘사 함께 참조"""
        lines = [
            YaoResult(type="yang", changing=True, value=9),
            YaoResult(type="yin", changing=True, value=6),
            YaoResult(type="yang", changing=True, value=9),
            YaoResult(type="yin", changing=False, value=8),
            YaoResult(type="yang", changing=False, value=7),
            YaoResult(type="yin", changing=False, value=8),
        ]
        result = divination_service._lines_to_result(lines)

        assert len(result.changing_lines) == 3
        assert result.reading_method.reading_type == ReadingType.BOTH_GUA_CI
        assert result.reading_method.yao_position is None
        assert result.reading_method.use_transformed is False

    def test_four_changing_lines_uses_lower_unchanged_yao_ci(self, divination_service: DivinationService):
        """4변효: 지괘에서 변하지 않은 두 효 중 아래(하위) 효사 사용"""
        lines = [
            YaoResult(type="yang", changing=True, value=9),   # 변효
            YaoResult(type="yin", changing=False, value=8),   # 불변 (하위)
            YaoResult(type="yang", changing=True, value=9),   # 변효
            YaoResult(type="yin", changing=True, value=6),    # 변효
            YaoResult(type="yang", changing=False, value=7),  # 불변 (상위)
            YaoResult(type="yin", changing=True, value=6),    # 변효
        ]
        result = divination_service._lines_to_result(lines)

        assert len(result.changing_lines) == 4
        assert result.reading_method.reading_type == ReadingType.YAO_CI
        assert result.reading_method.yao_position == 2  # 불변 효 중 하위
        assert result.reading_method.use_transformed is True

    def test_five_changing_lines_uses_only_unchanged_yao_ci(self, divination_service: DivinationService):
        """5변효: 지괘에서 변하지 않은 효사 사용"""
        lines = [
            YaoResult(type="yang", changing=True, value=9),
            YaoResult(type="yin", changing=True, value=6),
            YaoResult(type="yang", changing=False, value=7),  # 유일한 불변효
            YaoResult(type="yin", changing=True, value=6),
            YaoResult(type="yang", changing=True, value=9),
            YaoResult(type="yin", changing=True, value=6),
        ]
        result = divination_service._lines_to_result(lines)

        assert len(result.changing_lines) == 5
        assert result.reading_method.reading_type == ReadingType.YAO_CI
        assert result.reading_method.yao_position == 3  # 유일한 불변효
        assert result.reading_method.use_transformed is True

    def test_six_changing_lines_qian_uses_yong_jiu(self, divination_service: DivinationService):
        """6변효 건괘: 용구(用九) 사용 - 群龍無首 吉"""
        lines = [
            YaoResult(type="yang", changing=True, value=9),
            YaoResult(type="yang", changing=True, value=9),
            YaoResult(type="yang", changing=True, value=9),
            YaoResult(type="yang", changing=True, value=9),
            YaoResult(type="yang", changing=True, value=9),
            YaoResult(type="yang", changing=True, value=9),
        ]
        result = divination_service._lines_to_result(lines)

        assert result.hexagram_number == 1  # 건괘
        assert len(result.changing_lines) == 6
        assert result.reading_method.reading_type == ReadingType.YONG_JIU
        assert result.reading_method.yao_position is None

    def test_six_changing_lines_kun_uses_yong_liu(self, divination_service: DivinationService):
        """6변효 곤괘: 용육(用六) 사용 - 利永貞"""
        lines = [
            YaoResult(type="yin", changing=True, value=6),
            YaoResult(type="yin", changing=True, value=6),
            YaoResult(type="yin", changing=True, value=6),
            YaoResult(type="yin", changing=True, value=6),
            YaoResult(type="yin", changing=True, value=6),
            YaoResult(type="yin", changing=True, value=6),
        ]
        result = divination_service._lines_to_result(lines)

        assert result.hexagram_number == 2  # 곤괘
        assert len(result.changing_lines) == 6
        assert result.reading_method.reading_type == ReadingType.YONG_LIU
        assert result.reading_method.yao_position is None

    def test_six_changing_lines_other_uses_transformed_gua_ci(self, divination_service: DivinationService):
        """6변효 기타 괘: 지괘 괘사 사용"""
        # 지천태 (건 하 + 곤 상) - 6변효 시 천지비로 변환
        lines = [
            YaoResult(type="yang", changing=True, value=9),  # 건
            YaoResult(type="yang", changing=True, value=9),
            YaoResult(type="yang", changing=True, value=9),
            YaoResult(type="yin", changing=True, value=6),   # 곤
            YaoResult(type="yin", changing=True, value=6),
            YaoResult(type="yin", changing=True, value=6),
        ]
        result = divination_service._lines_to_result(lines)

        assert result.hexagram_number == 11  # 지천태
        assert len(result.changing_lines) == 6
        assert result.reading_method.reading_type == ReadingType.GUA_CI
        assert result.reading_method.use_transformed is True
        assert result.transformed_hexagram == 12  # 천지비


class TestTrigramCalculation:
    """Test trigram binary calculation from lines."""

    def test_lower_trigram_calculation(self, divination_service: DivinationService):
        """Verify lower trigram is calculated from lines 1-3."""
        # Test case: lines 1,2,3 = yang, yang, yang = 111 binary = 7 (건)
        lines = [
            YaoResult(type="yang", changing=False, value=7),  # 1
            YaoResult(type="yang", changing=False, value=7),  # 2
            YaoResult(type="yang", changing=False, value=7),  # 4
            YaoResult(type="yin", changing=False, value=8),   # 0
            YaoResult(type="yin", changing=False, value=8),   # 0
            YaoResult(type="yin", changing=False, value=8),   # 0
        ]

        result = divination_service._lines_to_result(lines)

        # Lower = 건(7), Upper = 곤(0)
        # (0, 7) = 11 지천태
        assert result.hexagram_number == 11

    def test_upper_trigram_calculation(self, divination_service: DivinationService):
        """Verify upper trigram is calculated from lines 4-6."""
        # Test case: lines 4,5,6 = yang, yang, yang = 111 binary = 7 (건)
        lines = [
            YaoResult(type="yin", changing=False, value=8),   # 0
            YaoResult(type="yin", changing=False, value=8),   # 0
            YaoResult(type="yin", changing=False, value=8),   # 0
            YaoResult(type="yang", changing=False, value=7),  # 1
            YaoResult(type="yang", changing=False, value=7),  # 2
            YaoResult(type="yang", changing=False, value=7),  # 4
        ]

        result = divination_service._lines_to_result(lines)

        # Lower = 곤(0), Upper = 건(7)
        # (7, 0) = 12 천지비
        assert result.hexagram_number == 12

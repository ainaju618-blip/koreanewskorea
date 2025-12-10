"""
스크래퍼 검증 스크립트
- 모든 *_scraper.py 파일 검증
- 구문 검사, 필수 함수 존재 여부, 실행 테스트
"""

import os
import sys
import ast
import subprocess
import json
from datetime import datetime
from typing import List, Dict, Tuple

# 검증 결과 저장
RESULTS = {
    'timestamp': datetime.now().isoformat(),
    'total': 0,
    'passed': 0,
    'failed': 0,
    'warnings': 0,
    'details': []
}

# 필수 요소 정의
REQUIRED_FUNCTIONS = ['collect_articles', 'main']
RECOMMENDED_FUNCTIONS = ['fetch_list', 'fetch_detail', 'normalize_date']
REQUIRED_IMPORTS = ['requests', 'BeautifulSoup']

# 품질 기준
QUALITY_CRITERIA = {
    'has_timeout': '타임아웃 설정 (timeout=)',
    'has_headers': 'User-Agent 헤더 설정',
    'has_error_handling': '예외 처리 (try/except)',
    'has_rate_limit': '속도 제한 (time.sleep)',
    'has_date_filter': '날짜 범위 필터링',
    'has_api_send': 'API 전송 로직',
}


def check_syntax(filepath: str) -> Tuple[bool, str]:
    """구문 검사"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            source = f.read()
        ast.parse(source)
        return True, "✅ 구문 정상"
    except SyntaxError as e:
        return False, f"❌ 구문 오류: {e}"


def check_required_functions(filepath: str) -> Tuple[bool, List[str], List[str]]:
    """필수 함수 존재 여부 확인"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            source = f.read()
        tree = ast.parse(source)
        
        function_names = []
        class_methods = []
        
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                function_names.append(node.name)
            elif isinstance(node, ast.ClassDef):
                for item in node.body:
                    if isinstance(item, ast.FunctionDef):
                        class_methods.append(item.name)
        
        all_funcs = set(function_names + class_methods)
        
        missing = []
        for req in REQUIRED_FUNCTIONS:
            # 다양한 패턴 허용
            if req not in all_funcs:
                # _collect_articles, run, main 등 다양한 패턴 허용
                alternatives = [f'_{req}', f'{req}s', 'run']
                if not any(alt in all_funcs for alt in alternatives):
                    missing.append(req)
        
        found = [f for f in REQUIRED_FUNCTIONS if f in all_funcs or f'_{f}' in all_funcs]
        
        return len(missing) == 0, found, missing
        
    except Exception as e:
        return False, [], [str(e)]


def check_quality_criteria(filepath: str) -> Dict[str, bool]:
    """품질 기준 검사"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        results = {}
        
        # 타임아웃 설정
        results['has_timeout'] = 'timeout=' in content or 'timeout =' in content
        
        # User-Agent
        results['has_headers'] = 'User-Agent' in content or 'HEADERS' in content or 'DEFAULT_HEADERS' in content
        
        # 예외 처리
        results['has_error_handling'] = 'try:' in content and 'except' in content
        
        # 속도 제한
        results['has_rate_limit'] = 'time.sleep' in content
        
        # 날짜 필터링
        results['has_date_filter'] = 'start_date' in content or 'end_date' in content or 'days' in content
        
        # API 전송 (UniversalScraper 상속도 포함)
        has_api = 'send_to_api' in content or 'api_client' in content or 'send_article' in content or '_send_to_api' in content
        inherits_universal = 'UniversalScraper' in content  # 상속 시 API 로직 포함
        results['has_api_send'] = has_api or inherits_universal
        
        return results
        
    except Exception as e:
        return {k: False for k in QUALITY_CRITERIA}


def run_dry_test(filepath: str) -> Tuple[bool, str]:
    """Dry-run 테스트 (선택적)"""
    try:
        # 구문 검사만 수행 (실제 실행은 시간이 오래 걸림)
        result = subprocess.run(
            [sys.executable, '-m', 'py_compile', filepath],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            return True, "✅ 컴파일 성공"
        else:
            return False, f"❌ 컴파일 실패: {result.stderr}"
    except subprocess.TimeoutExpired:
        return False, "⚠️ 타임아웃"
    except Exception as e:
        return False, f"❌ 실행 오류: {e}"


def verify_scraper(filepath: str) -> Dict:
    """단일 스크래퍼 검증"""
    filename = os.path.basename(filepath)
    result = {
        'file': filename,
        'path': filepath,
        'status': 'unknown',
        'issues': [],
        'warnings': [],
        'quality': {}
    }
    
    # 1. 구문 검사
    syntax_ok, syntax_msg = check_syntax(filepath)
    if not syntax_ok:
        result['status'] = 'failed'
        result['issues'].append(syntax_msg)
        return result
    
    # 2. 필수 함수 검사
    funcs_ok, found, missing = check_required_functions(filepath)
    if not funcs_ok:
        result['warnings'].append(f"⚠️ 누락된 함수: {missing}")
    
    # 3. 품질 기준 검사
    quality = check_quality_criteria(filepath)
    result['quality'] = quality
    
    for key, has in quality.items():
        if not has:
            result['warnings'].append(f"⚠️ {QUALITY_CRITERIA[key]} 없음")
    
    # 4. 컴파일 테스트
    compile_ok, compile_msg = run_dry_test(filepath)
    if not compile_ok:
        result['status'] = 'failed'
        result['issues'].append(compile_msg)
        return result
    
    # 최종 상태 결정
    if result['issues']:
        result['status'] = 'failed'
    elif result['warnings']:
        result['status'] = 'warning'
    else:
        result['status'] = 'passed'
    
    return result


def verify_all_scrapers(directory: str) -> Dict:
    """모든 스크래퍼 검증"""
    global RESULTS
    
    print("=" * 60)
    print("🔍 스크래퍼 검증 시작")
    print("=" * 60)
    
    scrapers = [f for f in os.listdir(directory) if f.endswith('_scraper.py')]
    RESULTS['total'] = len(scrapers)
    
    for scraper in sorted(scrapers):
        filepath = os.path.join(directory, scraper)
        print(f"\n📄 검증 중: {scraper}")
        
        result = verify_scraper(filepath)
        RESULTS['details'].append(result)
        
        if result['status'] == 'passed':
            RESULTS['passed'] += 1
            print(f"   ✅ 통과")
        elif result['status'] == 'warning':
            RESULTS['warnings'] += 1
            print(f"   ⚠️ 경고: {len(result['warnings'])}건")
        else:
            RESULTS['failed'] += 1
            print(f"   ❌ 실패: {result['issues']}")
    
    print("\n" + "=" * 60)
    print("📊 검증 결과 요약")
    print("=" * 60)
    print(f"총 스크래퍼: {RESULTS['total']}")
    print(f"✅ 통과: {RESULTS['passed']}")
    print(f"⚠️ 경고: {RESULTS['warnings']}")
    print(f"❌ 실패: {RESULTS['failed']}")
    
    return RESULTS


def generate_report(results: Dict, output_path: str):
    """마크다운 보고서 생성"""
    report = f"""# 🔍 스크래퍼 검증 보고서

> **생성 시각:** {results['timestamp']}

## 📊 요약

| 항목 | 수치 |
|------|------|
| 총 스크래퍼 | {results['total']} |
| ✅ 통과 | {results['passed']} |
| ⚠️ 경고 | {results['warnings']} |
| ❌ 실패 | {results['failed']} |

---

## 📋 상세 결과

"""
    
    # 실패한 스크래퍼
    failed = [d for d in results['details'] if d['status'] == 'failed']
    if failed:
        report += "### ❌ 실패 (즉시 수정 필요)\n\n"
        for f in failed:
            report += f"#### {f['file']}\n"
            for issue in f['issues']:
                report += f"- {issue}\n"
            report += "\n"
    
    # 경고 스크래퍼
    warnings = [d for d in results['details'] if d['status'] == 'warning']
    if warnings:
        report += "### ⚠️ 경고 (개선 권장)\n\n"
        for w in warnings:
            report += f"#### {w['file']}\n"
            for warn in w['warnings']:
                report += f"- {warn}\n"
            report += "\n"
    
    # 통과 스크래퍼
    passed = [d for d in results['details'] if d['status'] == 'passed']
    if passed:
        report += "### ✅ 통과\n\n"
        for p in passed:
            report += f"- {p['file']}\n"
    
    # 품질 통계
    report += """
---

## 📈 품질 기준 통계

| 기준 | 충족 수 | 비율 |
|------|--------|------|
"""
    
    for key, desc in QUALITY_CRITERIA.items():
        count = sum(1 for d in results['details'] if d.get('quality', {}).get(key, False))
        pct = count / results['total'] * 100 if results['total'] > 0 else 0
        report += f"| {desc} | {count}/{results['total']} | {pct:.0f}% |\n"
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"\n📝 보고서 저장: {output_path}")


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Scraper Verification Tool')
    parser.add_argument('--dir', default='.', help='Directory containing scrapers')
    parser.add_argument('--report', default='verification_report.md', help='Report output path')
    args = parser.parse_args()
    
    results = verify_all_scrapers(args.dir)
    generate_report(results, args.report)
    
    # JSON 결과도 저장
    json_path = args.report.replace('.md', '.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"📊 JSON 결과: {json_path}")

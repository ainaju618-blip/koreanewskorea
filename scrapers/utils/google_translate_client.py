# -*- coding: utf-8 -*-
"""
Google Translation API 클라이언트
- 다중 프로젝트 API Key 로테이션
- 사용량 추적 + CLI 대시보드

버전: v1.0
작성일: 2025-12-15
"""

import os
import json
from datetime import datetime
from typing import Optional, Dict, List
from pathlib import Path

# Google Cloud Translation API
try:
    from google.cloud import translate_v2 as translate
    GOOGLE_TRANSLATE_AVAILABLE = True
except ImportError:
    GOOGLE_TRANSLATE_AVAILABLE = False
    print("[WARN] google-cloud-translate 미설치. pip install google-cloud-translate")


# ============================================
# 설정
# ============================================
CONFIG_DIR = Path(__file__).parent.parent / "configs"
USAGE_FILE = CONFIG_DIR / "translation_usage.json"
KEYS_FILE = CONFIG_DIR / "translation_keys.json"

# 월 무료 한도 (글자 수)
MONTHLY_LIMIT = 500000

# 안전 마진 (95%에서 전환)
SAFETY_MARGIN = 0.95


class GoogleTranslateClient:
    """Google Translation API 클라이언트 (다중 프로젝트 지원)"""
    
    def __init__(self, keys_file: str = None):
        """
        Args:
            keys_file: API 키 설정 파일 경로 (없으면 기본 경로 사용)
        """
        self.keys_file = Path(keys_file) if keys_file else KEYS_FILE
        self.usage_file = USAGE_FILE
        self.projects: List[Dict] = []
        self.current_project_idx = 0
        self.client = None
        
        self._load_config()
        self._load_usage()
        self._init_client()
    
    def _load_config(self):
        """API 키 설정 로드"""
        if not self.keys_file.exists():
            # 샘플 설정 파일 생성
            self._create_sample_config()
            raise FileNotFoundError(
                f"API 키 설정 파일이 없습니다.\n"
                f"샘플 파일 생성됨: {self.keys_file}\n"
                f"파일을 수정하여 API 키를 입력하세요."
            )
        
        with open(self.keys_file, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        self.projects = config.get('projects', [])
        if not self.projects:
            raise ValueError("프로젝트 설정이 없습니다.")
    
    def _create_sample_config(self):
        """샘플 설정 파일 생성"""
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        
        sample = {
            "projects": [
                {
                    "name": "korea-news-ai",
                    "api_key": "YOUR_API_KEY_1",
                    "limit": 500000
                },
                {
                    "name": "korea-news-backup",
                    "api_key": "YOUR_API_KEY_2",
                    "limit": 500000
                }
            ]
        }
        
        with open(self.keys_file, 'w', encoding='utf-8') as f:
            json.dump(sample, f, indent=2, ensure_ascii=False)
    
    def _load_usage(self):
        """사용량 로드 (월별 리셋)"""
        if not self.usage_file.exists():
            self._reset_usage()
            return
        
        with open(self.usage_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 월이 바뀌었으면 리셋
        current_month = datetime.now().strftime("%Y-%m")
        if data.get('month') != current_month:
            self._reset_usage()
            return
        
        # 사용량 적용
        for project in self.projects:
            project['used'] = data.get('usage', {}).get(project['name'], 0)
    
    def _reset_usage(self):
        """사용량 리셋"""
        for project in self.projects:
            project['used'] = 0
        self._save_usage()
    
    def _save_usage(self):
        """사용량 저장"""
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        
        data = {
            'month': datetime.now().strftime("%Y-%m"),
            'updated_at': datetime.now().isoformat(),
            'usage': {p['name']: p.get('used', 0) for p in self.projects}
        }
        
        with open(self.usage_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    def _init_client(self):
        """현재 프로젝트로 클라이언트 초기화"""
        if not GOOGLE_TRANSLATE_AVAILABLE:
            return
        
        project = self._get_current_project()
        if project:
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = ''
            # API Key 방식 사용
            self.client = translate.Client()
            # API Key 설정은 환경변수로
            os.environ['GOOGLE_API_KEY'] = project['api_key']
    
    def _get_current_project(self) -> Optional[Dict]:
        """현재 활성 프로젝트 반환"""
        if not self.projects:
            return None
        return self.projects[self.current_project_idx]
    
    def _find_available_project(self) -> Optional[int]:
        """사용 가능한 프로젝트 찾기"""
        for i, project in enumerate(self.projects):
            limit = project.get('limit', MONTHLY_LIMIT)
            used = project.get('used', 0)
            if used < limit * SAFETY_MARGIN:
                return i
        return None
    
    def _switch_project(self) -> bool:
        """다음 사용 가능한 프로젝트로 전환"""
        available_idx = self._find_available_project()
        if available_idx is None:
            return False
        
        if available_idx != self.current_project_idx:
            old_name = self.projects[self.current_project_idx]['name']
            self.current_project_idx = available_idx
            new_name = self.projects[self.current_project_idx]['name']
            print(f"\n[SWITCH] {old_name} -> {new_name} (한도 전환)")
            self._init_client()
        
        return True
    
    def translate(self, text: str, target: str = 'ko') -> Optional[str]:
        """
        텍스트 번역
        
        Args:
            text: 번역할 텍스트
            target: 대상 언어 코드 (기본: 한국어)
        
        Returns:
            번역된 텍스트 또는 None
        """
        if not GOOGLE_TRANSLATE_AVAILABLE:
            print("[ERROR] google-cloud-translate 미설치")
            return None
        
        if not self.client:
            print("[ERROR] Translation 클라이언트 초기화 실패")
            return None
        
        # 사용 가능한 프로젝트 확인
        if not self._switch_project():
            print("[ERROR] 모든 프로젝트 한도 초과!")
            return None
        
        try:
            # 번역 실행
            result = self.client.translate(text, target_language=target)
            translated = result['translatedText']
            
            # 사용량 업데이트
            char_count = len(text)
            self.projects[self.current_project_idx]['used'] = \
                self.projects[self.current_project_idx].get('used', 0) + char_count
            self._save_usage()
            
            return translated
            
        except Exception as e:
            print(f"[ERROR] 번역 실패: {e}")
            return None
    
    def get_usage_stats(self) -> Dict:
        """사용량 통계 반환"""
        stats = {
            'projects': [],
            'total_used': 0,
            'total_limit': 0,
            'current_project': self.current_project_idx,
            'month': datetime.now().strftime("%Y-%m")
        }
        
        for i, project in enumerate(self.projects):
            limit = project.get('limit', MONTHLY_LIMIT)
            used = project.get('used', 0)
            percent = (used / limit * 100) if limit > 0 else 0
            
            stats['projects'].append({
                'name': project['name'],
                'used': used,
                'limit': limit,
                'percent': percent,
                'is_active': i == self.current_project_idx
            })
            stats['total_used'] += used
            stats['total_limit'] += limit
        
        stats['total_percent'] = (stats['total_used'] / stats['total_limit'] * 100) \
            if stats['total_limit'] > 0 else 0
        
        return stats
    
    def print_dashboard(self):
        """CLI 대시보드 출력"""
        stats = self.get_usage_stats()
        
        print("\n" + "=" * 60)
        print(" [API] Google Translation API Usage")
        print("=" * 60)
        
        for i, proj in enumerate(stats['projects']):
            # 프로그레스 바 생성 (12칸)
            filled = int(proj['percent'] / 100 * 12)
            bar = "#" * filled + "-" * (12 - filled)
            
            # 활성 프로젝트 표시
            active = " <-" if proj['is_active'] else ""
            
            # K 단위로 표시
            used_k = proj['used'] / 1000
            limit_k = proj['limit'] / 1000
            
            print(f" [{i+1}] {proj['name'][:20]:<20} [{bar}] {used_k:>6.0f}K/{limit_k:.0f}K ({proj['percent']:>5.1f}%){active}")
        
        print("-" * 60)
        
        # 총합
        total_used_k = stats['total_used'] / 1000
        total_limit_k = stats['total_limit'] / 1000
        print(f" Total: {total_used_k:.0f}K / {total_limit_k:.0f}K ({stats['total_percent']:.1f}%)")
        
        # 리셋일 계산
        now = datetime.now()
        if now.month == 12:
            next_month = datetime(now.year + 1, 1, 1)
        else:
            next_month = datetime(now.year, now.month + 1, 1)
        days_left = (next_month - now).days
        print(f" Reset: {days_left} days left")
        
        print("=" * 60 + "\n")


# ============================================
# 테스트
# ============================================
if __name__ == "__main__":
    try:
        client = GoogleTranslateClient()
        client.print_dashboard()
        
        # 테스트 번역
        test_text = "Hello, this is a test for Google Translation API."
        result = client.translate(test_text, target='ko')
        print(f"Original: {test_text}")
        print(f"Translated: {result}")
        
    except FileNotFoundError as e:
        print(f"\n[SETUP] {e}")
    except Exception as e:
        print(f"[ERROR] {e}")

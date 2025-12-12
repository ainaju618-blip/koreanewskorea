"""
Korea NEWS 통합 자동화 봇 (Main Scheduler)
- 수집 → 가공 → 알림을 순차적으로 실행
- 원클릭 완전 자동화 파이프라인
"""

import os
import sys
import time
import argparse
from datetime import datetime
from typing import Dict

# 프로젝트 경로 설정
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_ROOT)

from dotenv import load_dotenv
load_dotenv(os.path.join(PROJECT_ROOT, '.env'))

# 각 모듈 임포트
try:
    from scrapers.naju.naju_scraper import main as run_naju_scraper
    from scrapers.rss_collector import FullTextRSSCollector
    from processors.ai_rewriter import AIRewriter
    from processors.telegram_bot import TelegramNotifier, send_telegram_report
except ImportError as e:
    print(f"❌ 모듈 임포트 오류: {e}")
    print("   필요한 모듈이 설치되어 있는지 확인하세요.")
    sys.exit(1)


class KoreaNewsPipeline:
    """Korea NEWS 자동화 파이프라인"""
    
    def __init__(self, skip_ai: bool = False, skip_telegram: bool = False):
        """
        Args:
            skip_ai: AI 가공 단계 건너뛰기 (API 키 없을 때)
            skip_telegram: Telegram 알림 건너뛰기
        """
        self.skip_ai = skip_ai
        self.skip_telegram = skip_telegram
        self.stats = {
            'naju_collected': 0,
            'ai_collected': 0,
            'ai_processed': 0,
            'pending_review': 0,
            'errors': []
        }
        self.notifier = TelegramNotifier()

    def run(self):
        """전체 파이프라인 실행"""
        start_time = datetime.now()
        
        print("=" * 60)
        print("🚀 Korea NEWS 자동화 파이프라인 시작")
        print(f"   시작 시간: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        
        # 시작 알림 (선택)
        if not self.skip_telegram:
            self.notifier.send_startup_notification()
        
        # Step 1: 나주시 보도자료 수집
        self._step_naju_scraper()
        
        # Step 2: 해외 AI 뉴스 수집
        self._step_rss_collector()
        
        # Step 3: AI 가공
        if not self.skip_ai:
            self._step_ai_rewriter()
        else:
            print("\n[3/4] ⏩ AI 가공 건너뜀 (--skip-ai 옵션)")
        
        # Step 4: 결과 리포트 발송
        self._step_send_report()
        
        # 완료
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        print("\n" + "=" * 60)
        print("✅ 파이프라인 완료!")
        print(f"   소요 시간: {duration:.1f}초")
        print("=" * 60)
        
        self._print_summary()

    def _step_naju_scraper(self):
        """Step 1: 나주시 보도자료 수집"""
        print("\n[1/4] 🏛️ 나주시 보도자료 수집 중...")
        
        try:
            # 최근 3일치만 수집 (일상 운영)
            from datetime import timedelta
            end_date = datetime.now().strftime('%Y-%m-%d')
            start_date = (datetime.now() - timedelta(days=3)).strftime('%Y-%m-%d')
            
            from scrapers.naju.naju_scraper import collect_articles, send_to_api
            articles = collect_articles(start_date=start_date, end_date=end_date)
            
            if articles:
                stats = send_to_api(articles)
                self.stats['naju_collected'] = stats.get('created', 0)
                print(f"   ✅ 나주: {self.stats['naju_collected']}건 신규 저장")
            else:
                print("   ℹ️ 수집된 기사 없음")
                
        except Exception as e:
            print(f"   ❌ 오류: {e}")
            self.stats['errors'].append(f"나주 스크래퍼: {str(e)[:50]}")

    def _step_rss_collector(self):
        """Step 2: 해외 AI 뉴스 수집"""
        print("\n[2/4] 🌍 해외 AI 뉴스 수집 중...")
        
        try:
            collector = FullTextRSSCollector()
            collector.run(mode='api')
            
            self.stats['ai_collected'] = collector.stats.get('created', 0)
            print(f"   ✅ AI 뉴스: {self.stats['ai_collected']}건 신규 저장")
            
        except Exception as e:
            print(f"   ❌ 오류: {e}")
            self.stats['errors'].append(f"RSS 수집기: {str(e)[:50]}")

    def _step_ai_rewriter(self):
        """Step 3: AI 가공 (번역/재작성)"""
        print("\n[3/4] 🤖 AI 기사 가공 중...")
        
        try:
            rewriter = AIRewriter()
            rewriter.run(limit=20)  # 최대 20개 처리
            
            self.stats['ai_processed'] = rewriter.stats.get('success', 0)
            print(f"   ✅ AI 가공: {self.stats['ai_processed']}건 완료")
            
        except Exception as e:
            print(f"   ❌ 오류: {e}")
            self.stats['errors'].append(f"AI Rewriter: {str(e)[:50]}")

    def _step_send_report(self):
        """Step 4: Telegram 리포트 발송"""
        print("\n[4/4] 📱 결과 리포트 발송 중...")
        
        if self.skip_telegram:
            print("   ⏩ Telegram 알림 건너뜀 (--skip-telegram 옵션)")
            return
        
        # 승인 대기 건수 조회
        try:
            from supabase import create_client
            url = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
            
            if url and key:
                supabase = create_client(url, key)
                result = supabase.table('posts').select('id', count='exact').eq('status', 'review').execute()
                self.stats['pending_review'] = result.count or 0
        except:
            pass
        
        # 리포트 발송
        send_telegram_report(self.stats)

    def _print_summary(self):
        """결과 요약 출력"""
        print("\n📊 파이프라인 실행 결과:")
        print(f"   - 나주 수집: {self.stats['naju_collected']}건")
        print(f"   - AI 뉴스 수집: {self.stats['ai_collected']}건")
        print(f"   - AI 가공: {self.stats['ai_processed']}건")
        print(f"   - 승인 대기: {self.stats['pending_review']}건")
        
        if self.stats['errors']:
            print(f"\n⚠️ 발생한 오류 ({len(self.stats['errors'])}건):")
            for err in self.stats['errors']:
                print(f"   - {err}")


def main():
    """메인 실행"""
    parser = argparse.ArgumentParser(description='Korea NEWS 자동화 파이프라인')
    parser.add_argument('--skip-ai', action='store_true', 
                        help='AI 가공 단계 건너뛰기 (API 키 없을 때)')
    parser.add_argument('--skip-telegram', action='store_true',
                        help='Telegram 알림 건너뛰기')
    parser.add_argument('--schedule', action='store_true',
                        help='스케줄 모드로 실행 (09:00, 13:00, 18:00)')
    
    args = parser.parse_args()
    
    if args.schedule:
        # 스케줄 모드
        try:
            import schedule
        except ImportError:
            print("❌ schedule 패키지가 필요합니다: pip install schedule")
            sys.exit(1)
        
        pipeline = KoreaNewsPipeline(
            skip_ai=args.skip_ai,
            skip_telegram=args.skip_telegram
        )
        
        # 매일 09:00, 13:00, 18:00 실행
        schedule.every().day.at("09:00").do(pipeline.run)
        schedule.every().day.at("13:00").do(pipeline.run)
        schedule.every().day.at("18:00").do(pipeline.run)
        
        print("⏰ 스케줄 모드 활성화 (09:00, 13:00, 18:00)")
        print("   Ctrl+C로 종료")
        
        while True:
            schedule.run_pending()
            time.sleep(60)
    else:
        # 즉시 실행 모드
        pipeline = KoreaNewsPipeline(
            skip_ai=args.skip_ai,
            skip_telegram=args.skip_telegram
        )
        pipeline.run()


if __name__ == "__main__":
    main()

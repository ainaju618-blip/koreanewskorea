"""
Telegram 알림 봇 모듈
- 수집/가공 결과를 발행인에게 즉시 알림
- 주요 이벤트 리포트 발송
"""

import os
import requests
from typing import Dict, Optional
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# === 설정 ===
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")
ADMIN_URL = os.getenv("ADMIN_URL", "http://localhost:3000/admin/news")


class TelegramNotifier:
    """Telegram 알림 발송 클래스"""
    
    def __init__(self):
        self.bot_token = TELEGRAM_BOT_TOKEN
        self.chat_id = TELEGRAM_CHAT_ID
        self.enabled = bool(self.bot_token and self.chat_id)
        
        if not self.enabled:
            print("⚠️ Telegram 설정이 없습니다. 알림이 비활성화됩니다.")
            print("   .env 파일에 TELEGRAM_BOT_TOKEN과 TELEGRAM_CHAT_ID를 추가하세요.")

    def send_message(self, message: str) -> bool:
        """
        텔레그램으로 메시지 발송
        
        Args:
            message: 발송할 메시지 (Markdown 지원)
        
        Returns:
            성공 여부
        """
        if not self.enabled:
            print(f"📱 [MOCK] Telegram 메시지:\n{message}")
            return False
        
        url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
        
        payload = {
            "chat_id": self.chat_id,
            "text": message,
            "parse_mode": "Markdown"
        }
        
        try:
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                print("📱 Telegram 알림 발송 완료")
                return True
            else:
                print(f"❌ Telegram 오류: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Telegram 발송 실패: {e}")
            return False

    def send_collection_report(self, stats: Dict) -> bool:
        """
        수집 결과 리포트 발송
        
        Args:
            stats: 수집 통계 딕셔너리
                - naju_collected: 나주 수집 건수
                - ai_collected: AI 뉴스 수집 건수
                - ai_processed: AI 가공 건수
                - pending_review: 승인 대기 건수
        """
        naju = stats.get('naju_collected', 0)
        ai = stats.get('ai_collected', 0)
        processed = stats.get('ai_processed', 0)
        pending = stats.get('pending_review', 0)
        total = naju + ai
        
        message = f"""*[Korea NEWS 봇 리포트]*

✅ *수집 완료:* {total}건 (나주 {naju}, AI {ai})
✍️ *AI 가공:* {processed}건 완료
🚀 *승인 대기:* {pending}건

📋 [관리자 페이지 바로가기]({ADMIN_URL})
"""
        return self.send_message(message)

    def send_error_alert(self, error_message: str, source: str = "Unknown") -> bool:
        """
        에러 알림 발송
        
        Args:
            error_message: 에러 내용
            source: 에러 발생 모듈
        """
        message = f"""🚨 *[Korea NEWS 에러 알림]*

*발생 위치:* `{source}`
*내용:* {error_message[:200]}

즉시 확인이 필요합니다.
"""
        return self.send_message(message)

    def send_startup_notification(self) -> bool:
        """봇 시작 알림"""
        message = """🤖 *Korea NEWS 자동화 봇 가동*

수집 및 가공 작업을 시작합니다.
완료 시 결과를 다시 알려드리겠습니다.
"""
        return self.send_message(message)


def send_telegram_report(stats: Dict) -> bool:
    """외부에서 호출할 수 있는 래퍼 함수"""
    notifier = TelegramNotifier()
    return notifier.send_collection_report(stats)


if __name__ == "__main__":
    # 테스트 실행
    notifier = TelegramNotifier()
    
    test_stats = {
        'naju_collected': 5,
        'ai_collected': 10,
        'ai_processed': 8,
        'pending_review': 13
    }
    
    print("=== Telegram 알림 테스트 ===")
    notifier.send_collection_report(test_stats)

"""
텔레그램 알림 유틸리티
- 스크래퍼 완료 시 텔레그램으로 알림 전송
"""

import os
import requests
from typing import Optional
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', '')
TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID', '')

def send_telegram(
    message: str, 
    parse_mode: str = 'HTML',
    disable_preview: bool = True
) -> bool:
    """
    텔레그램 메시지 전송
    
    Args:
        message: 전송할 메시지 (HTML 태그 사용 가능)
        parse_mode: 파싱 모드 ('HTML' 또는 'Markdown')
        disable_preview: 링크 미리보기 비활성화
        
    Returns:
        성공 여부 (True/False)
        
    Usage:
        from utils.telegram_notifier import send_telegram
        
        send_telegram("🏛️ <b>나주시</b> 보도자료 5건 수집 완료!")
        send_telegram("⚠️ 전남도청 스크래핑 실패: WAF 차단")
    """
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("[!] 텔레그램 설정 없음. 알림 건너뜀.")
        return False
    
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        data = {
            "chat_id": TELEGRAM_CHAT_ID,
            "text": message,
            "parse_mode": parse_mode,
            "disable_web_page_preview": disable_preview
        }
        
        response = requests.post(url, data=data, timeout=10)
        
        if response.status_code == 200:
            print(f"[📱] 텔레그램 알림 전송 완료")
            return True
        else:
            print(f"[!] 텔레그램 전송 실패: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"[!] 텔레그램 오류: {str(e)[:50]}")
        return False


def notify_scrape_complete(
    source: str, 
    count: int, 
    new_count: int = 0,
    skip_count: int = 0,
    fail_count: int = 0
) -> bool:
    """
    스크래핑 완료 알림 전송
    
    Args:
        source: 소스명 (예: "나주시", "TechCrunch")
        count: 총 수집 건수
        new_count: 신규 저장 건수
        skip_count: 중복 스킵 건수
        fail_count: 실패 건수
    """
    # 이모지 매핑
    emoji_map = {
        '나주시': '🏛️',
        '광주광역시': '🏙️',
        '전라남도': '🌿',
        '목포시': '⚓',
        '여수시': '🌊',
        '순천시': '🌸',
        'TechCrunch': '🌍',
        'Wired': '🌍',
        'MIT Tech Review': '🌍',
        'AI News': '🤖',
    }
    
    emoji = emoji_map.get(source, '📰')
    
    message = f"{emoji} <b>{source}</b> 뉴스 수집 완료\n\n"
    message += f"📊 총 수집: <b>{count}건</b>\n"
    
    if new_count > 0:
        message += f"✅ 신규 저장: {new_count}건\n"
    if skip_count > 0:
        message += f"⏩ 중복 스킵: {skip_count}건\n"
    if fail_count > 0:
        message += f"❌ 실패: {fail_count}건\n"
    
    return send_telegram(message)


def notify_error(source: str, error_message: str) -> bool:
    """
    스크래핑 오류 알림 전송
    """
    message = f"⚠️ <b>{source}</b> 스크래핑 오류\n\n"
    message += f"<code>{error_message[:200]}</code>"
    
    return send_telegram(message)

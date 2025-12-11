# -*- coding: utf-8 -*-
"""
광주교육청 보도자료 스크래퍼 v5.0 (Pyppeteer)
- Python용 Puppeteer 포트 사용
- 원본 JS 코드와 유사한 API
"""

import sys, os, time, re, argparse, asyncio, json
from datetime import datetime
from typing import List, Dict, Tuple, Optional

# Pyppeteer import
from pyppeteer import launch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.api_client import send_article_to_server
from utils.cloudinary_uploader import download_and_upload_image

# ===== 상수 정의 =====
REGION_CODE = 'kedu'
REGION_NAME = '광주시교육청'
CATEGORY_NAME = '광주교육청'
BASE_URL = 'https://enews.gen.go.kr'
LIST_URL = 'https://enews.gen.go.kr/v5/?sid=25'


def parse_args():
    """CLI 옵션 파서"""
    parser = argparse.ArgumentParser(
        description='광주광역시교육청 보도자료 스크래퍼 v5.0 (Pyppeteer)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
사용 예시:
  python gwangju_edu_scraper_v5_pyppeteer.py
  python gwangju_edu_scraper_v5_pyppeteer.py --exact-date 2025-12-11
  python gwangju_edu_scraper_v5_pyppeteer.py --max-articles 3 --dry-run
        """
    )
    parser.add_argument('--start-date', help='시작 날짜 (YYYY-MM-DD)')
    parser.add_argument('--end-date', help='종료 날짜 (YYYY-MM-DD)')
    parser.add_argument('--exact-date', help='특정 날짜만 수집 (YYYY-MM-DD)')
    parser.add_argument('--max-pages', type=int, default=3, help='최대 페이지 수 (기본: 3)')
    parser.add_argument('--max-articles', type=int, default=12, help='최대 기사 수 (기본: 12)')
    parser.add_argument('--dry-run', action='store_true', help='DB 저장 없이 테스트만')
    parser.add_argument('--output', help='결과 JSON 파일 경로')
    return parser.parse_args()


def is_date_in_range(date_str: str, start_date: str = None, 
                     end_date: str = None, exact_date: str = None) -> bool:
    """날짜가 지정된 범위 내에 있는지 확인"""
    if not date_str:
        return True
    
    if exact_date:
        return date_str == exact_date
    
    if start_date and date_str < start_date:
        return False
    if end_date and date_str > end_date:
        return False
    
    return True


def validate_article(article_data: Dict) -> Tuple[bool, str]:
    """기사 데이터 검증"""
    if not article_data.get('title') or len(article_data['title']) < 5:
        return False, "❌ 제목 너무 짧음"
    content = article_data.get('content', '')
    if not content or len(content) < 30:
        return False, f"❌ 본문 부족 ({len(content)}자)"
    return True, "✅ 검증 통과"


async def collect_list_with_metadata(page) -> List[Dict]:
    """목록에서 날짜/조회수도 함께 추출 (Pyppeteer - 실제 사이트 구조에 맞게 수정)"""
    try:
        items = await page.evaluate('''() => {
            const results = [];
            // 실제 사이트 구조: a 태그가 직접 기사 링크 (ul/li 구조 아님)
            const links = document.querySelectorAll("a[href*='wbb=md:view;uid:']");
            
            links.forEach(link => {
                const href = link.getAttribute('href') || '';
                const uidMatch = href.match(/uid:(\\d+)/);
                if (!uidMatch) return;
                
                // 제목 추출 (링크 내부 텍스트에서)
                let title = '';
                const divs = link.querySelectorAll('div');
                if (divs.length > 0) {
                    title = divs[0].textContent?.trim() || '';
                } else {
                    title = link.textContent?.trim() || '';
                }
                
                // 링크 전체 텍스트에서 날짜 추출
                const allText = link.textContent || '';
                const dateMatch = allText.match(/(\\d{4}-\\d{2}-\\d{2})/);
                const date = dateMatch ? dateMatch[1] : '';
                
                // 조회수 추출
                const viewsMatch = allText.match(/조회\\s*(\\d+)/);
                const views = viewsMatch ? viewsMatch[1] : '';
                
                // 중복 제거 (같은 uid 있으면 스킵)
                if (!results.some(r => r.uid === uidMatch[1])) {
                    results.push({
                        uid: uidMatch[1],
                        title: title.substring(0, 100),
                        date: date,
                        views: views,
                        href: href
                    });
                }
            });
            
            return results;
        }''')
        return items if items else []
    except Exception as e:
        print(f"   ⚠️ 목록 추출 에러: {e}")
        return []


async def fetch_detail(page, url: str) -> Tuple[str, str, Optional[str]]:
    """상세 페이지에서 제목, 본문, 이미지 추출 (Pyppeteer)"""
    try:
        await page.goto(url, {'waitUntil': 'networkidle2', 'timeout': 30000})
    except Exception as e:
        print(f"   ⚠️ 페이지 이동 실패: {str(e)[:30]}")
        return "", "", None
    
    await asyncio.sleep(2)
    
    title = ""
    content = ""
    thumbnail_url = None
    
    try:
        # 1. 제목 추출
        try:
            title = await page.evaluate('''() => {
                const viewTop = document.querySelector('div.view_top');
                if (!viewTop) return '';
                
                const text = viewTop.textContent || '';
                const lines = text.split('\\n').map(l => l.trim()).filter(l => l.length > 5);
                
                for (const line of lines) {
                    if (!line.includes('작성일:') && 
                        !line.includes('작성자:') && 
                        !line.includes('기관명') &&
                        !line.includes('자료문의') &&
                        !line.includes('조회수') &&
                        !line.includes('추천수') &&
                        !line.includes('등록일')) {
                        return line;
                    }
                }
                return lines[0] || '';
            }''')
        except:
            title = ""

        # 2. 본문 추출
        try:
            content = await page.evaluate('''() => {
                const boardPress = document.querySelector('div.board_press');
                if (!boardPress) return '';
                
                const clone = boardPress.cloneNode(true);
                
                const excludeSelectors = [
                    'div.view_top', 'div.inquiry', 'div.writer',
                    'div.file_list', 'div.view_bottom', '.btn_wrap',
                ];
                
                excludeSelectors.forEach(sel => {
                    const els = clone.querySelectorAll(sel);
                    els.forEach(el => el.remove());
                });
                
                return clone.textContent?.trim() || '';
            }''')
        except:
            content = ""
        
        # 본문 정제
        if content:
            noise_patterns = [
                r'HOME\s*', r'보도/해명자료\s*', r'만족도\s*조사.*',
                r'저작권.*', r'COPYRIGHT.*', r'목록\s*이전글\s*다음글.*',
            ]
            for pattern in noise_patterns:
                content = re.sub(pattern, '', content, flags=re.IGNORECASE)
            
            if title and content.startswith(title):
                content = content[len(title):].strip()
            
            content = re.sub(r'\n{3,}', '\n\n', content)
            content = re.sub(r' {2,}', ' ', content)
            content = content.strip()[:5000]

        # 3. 이미지 추출
        DOWNLOAD_BASE = 'https://enews.gen.go.kr/v5/decoboard/download.php?uid='
        
        try:
            js_result = await page.evaluate('''() => {
                const links = Array.from(document.querySelectorAll('a'));
                for (const a of links) {
                    const href = a.getAttribute('href') || '';
                    const text = (a.textContent || '').toLowerCase();
                    if (href.includes('file_download') && 
                        (text.includes('.jpg') || text.includes('.jpeg') || text.includes('.png'))) {
                        const match = href.match(/file_download\\(['"]?(\\d+)['"]?\\)/);
                        if (match) {
                            return { uid: match[1], text: a.textContent.trim() };
                        }
                    }
                }
                return null;
            }''')
            
            if js_result and js_result.get('uid'):
                download_url = DOWNLOAD_BASE + js_result['uid']
                print(f"      📷 이미지 발견: {js_result['text'][:30]}...")
                cloud_url = download_and_upload_image(download_url, BASE_URL, folder="gwangju_edu")
                if cloud_url and 'cloudinary' in cloud_url:
                    thumbnail_url = cloud_url
                    print(f"      ✅ 이미지 업로드 완료")
                else:
                    thumbnail_url = download_url
        except Exception as img_err:
            print(f"      ⚠️ 이미지 에러: {str(img_err)[:30]}")
        
    except Exception as e:
        print(f"   ⚠️ 상세 파싱 에러: {str(e)[:50]}")
    
    return title, content, thumbnail_url


async def collect_articles(args):
    """메인 수집 함수 (async)"""
    start_time = time.time()
    
    print(f"🏛️ {REGION_NAME} 보도자료 수집 시작 (v5.0 Pyppeteer)")
    print(f"   설정: 최대 {args.max_pages}페이지, 최대 {args.max_articles}개")
    
    if args.exact_date:
        print(f"   📅 필터: {args.exact_date} 날짜만")
    elif args.start_date or args.end_date:
        print(f"   📅 필터: {args.start_date or '시작'} ~ {args.end_date or '종료'}")
    
    date_filter = {
        'start_date': args.start_date,
        'end_date': args.end_date,
        'exact_date': args.exact_date
    }
    
    all_items = []
    consecutive_empty = 0
    results = []
    
    # Pyppeteer 브라우저 시작
    browser = await launch(
        headless=True,
        args=['--no-sandbox', '--disable-setuid-sandbox']
    )
    page = await browser.newPage()
    await page.setViewport({'width': 1280, 'height': 1024})
    
    try:
        # 1단계: 목록 수집 (페이지네이션)
        for page_num in range(1, args.max_pages + 1):
            page_url = f"{LIST_URL}&wbb=md%3Alist%3B&page={page_num}"
            print(f"\n📄 페이지 {page_num} 스캔 중...")
            
            try:
                await page.goto(page_url, {'waitUntil': 'networkidle2', 'timeout': 30000})
            except Exception as e:
                print(f"   ❌ 페이지 접속 실패: {str(e)[:30]}")
                break
            
            await asyncio.sleep(2)
            
            items = await collect_list_with_metadata(page)
            print(f"   🔗 발견: {len(items)}개")
            
            # 날짜 필터 적용
            filtered = [i for i in items if is_date_in_range(i['date'], **date_filter)]
            
            if not filtered:
                consecutive_empty += 1
                print(f"   ⚠️ 필터 통과 항목 없음 (연속 {consecutive_empty}회)")
                
                if consecutive_empty >= 3 and (args.start_date or args.end_date or args.exact_date):
                    print("   📌 날짜 범위 초과로 판단, 수집 중단")
                    break
            else:
                consecutive_empty = 0
                all_items.extend(filtered)
                print(f"   ✅ {len(filtered)}개 필터 통과 (누적: {len(all_items)}개)")
            
            if len(all_items) >= args.max_articles:
                print(f"   📌 최대 기사 수({args.max_articles}) 도달, 수집 중단")
                break
            
            await asyncio.sleep(0.5)
        
        # 2단계: 상세 페이지 수집
        print(f"\n📰 상세 페이지 수집 시작 (총 {min(len(all_items), args.max_articles)}개)")
        
        success_count = 0
        
        for idx, item in enumerate(all_items[:args.max_articles]):
            url = BASE_URL + '/v5/' + item['href'] if item['href'].startswith('?') else item['href']
            if not url.startswith('http'):
                url = BASE_URL + '/v5/' + url
            
            print(f"\n   🔍 [{idx+1}] {item['title'][:25]}... ({item['date']})")
            
            real_title, content, thumbnail_url = await fetch_detail(page, url)
            
            # 제목 결정
            if real_title and len(real_title) > 10 and '홍보관' not in real_title:
                final_title = real_title
            else:
                final_title = item['title']
            
            published_at = f"{item['date'] or datetime.now().strftime('%Y-%m-%d')}T09:00:00+09:00"
            
            article_data = {
                'title': final_title,
                'content': content,
                'published_at': published_at,
                'original_link': url,
                'source': REGION_NAME,
                'category': CATEGORY_NAME,
                'region': REGION_CODE,
                'thumbnail_url': thumbnail_url,
            }
            
            is_valid, msg = validate_article(article_data)
            print(f"      {msg}")
            
            if is_valid:
                results.append(article_data)
                
                if args.dry_run:
                    print(f"      🧪 [DRY-RUN] DB 저장 스킵")
                    success_count += 1
                else:
                    result = send_article_to_server(article_data)
                    if result and result.get('status') == 'created':
                        print(f"      ✅ [DB 저장 완료]")
                        success_count += 1
                    else:
                        status = result.get('status', 'unknown') if result else 'no response'
                        print(f"      ⚠️ [DB 결과] {status}")
            
            await asyncio.sleep(1)
        
    finally:
        await browser.close()
    
    elapsed_time = time.time() - start_time
    
    print(f"\n🎉 작업 완료: {success_count}건 성공")
    print(f"⏱️ 소요 시간: {elapsed_time:.2f}초")
    
    # 결과 JSON 저장
    if args.output:
        output_data = {
            'scraper_version': 'v5.0_pyppeteer',
            'scraped_at': datetime.now().isoformat(),
            'elapsed_seconds': round(elapsed_time, 2),
            'total_count': len(results),
            'success_count': success_count,
            'articles': results
        }
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        print(f"📁 결과 저장: {args.output}")
    
    return results


def main():
    args = parse_args()
    # Python 3.10+ 호환
    asyncio.run(collect_articles(args))


if __name__ == "__main__":
    main()

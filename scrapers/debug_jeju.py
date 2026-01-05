"""제주 페이지 구조 디버그"""
from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    Stealth().apply_stealth_sync(page)
    page.goto('https://www.jeju.go.kr/news/bodo/list.htm', wait_until='networkidle', timeout=30000)

    selectors = [
        'ul.board-list li', 'ul.news-list li', 'div.board-list',
        '.bbs-list li', 'ul li.row', 'div.list-item', 'article',
        '.news-item', 'ul.list li', 'div.row', 'li.item',
        'ul.bbs-list li', '.list-wrap li', 'ul li a[href*="view"]',
        'div.list-body', 'ul.thumb-list li', 'div.article-list',
        'ul.article-list li', '.board-body li', 'ul.clearfix li'
    ]

    print('=== Checking selectors ===')
    for sel in selectors:
        count = page.locator(sel).count()
        if count > 0:
            print(f'{sel}: {count} items')

    # Check view links
    view_links = page.locator('a[href*="list.htm?act=view"]')
    count = view_links.count()
    print(f'\na[href*=list.htm?act=view]: {count} items')

    if count > 0:
        # Get parent element structure
        for i in range(min(2, count)):
            link = view_links.nth(i)
            href = link.get_attribute('href') or ''
            text = link.inner_text()[:40].replace('\n', ' ').strip()
            print(f'  [{i}] {text}... | {href[:60]}')

        # Find parent structure
        print('\n=== Parent structure ===')
        parent_tag = page.evaluate('''() => {
            const link = document.querySelector('a[href*="list.htm?act=view"]');
            if (!link) return 'none';
            let el = link.parentElement;
            let path = [];
            for (let i = 0; i < 5 && el; i++) {
                path.push(el.tagName.toLowerCase() + (el.className ? '.' + el.className.split(' ')[0] : ''));
                el = el.parentElement;
            }
            return path.join(' < ');
        }''')
        print(f'Parent path: {parent_tag}')

        # Get list container
        list_container = page.evaluate('''() => {
            const links = document.querySelectorAll('a[href*="list.htm?act=view"]');
            if (!links.length) return 'none';

            // Find common parent
            const first = links[0].parentElement;
            const second = links[1] ? links[1].parentElement : null;

            if (first && second && first.parentElement === second.parentElement) {
                const parent = first.parentElement;
                return parent.tagName.toLowerCase() + (parent.className ? '.' + parent.className.split(' ')[0] : '') + ' > ' + first.tagName.toLowerCase();
            }
            return 'unknown';
        }''')
        print(f'List container: {list_container}')

    browser.close()
    print('\nDone!')

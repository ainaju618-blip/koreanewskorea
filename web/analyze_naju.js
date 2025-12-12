/**
 * 나주시 보도자료 페이지 구조 분석
 */

const fs = require('fs');

async function analyzeNajuPressRelease() {
    const url = 'https://www.naju.go.kr/www/administration/reporting/coverage';

    console.log('🔍 나주시 보도자료 페이지 분석 중...\n');

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'ko-KR,ko;q=0.9',
        },
    });

    const html = await response.text();

    // HTML 저장 (분석용)
    fs.writeFileSync('naju_press_raw.html', html, 'utf8');
    console.log('📄 HTML 저장: naju_press_raw.html\n');

    const results = [];
    results.push('# 나주시 보도자료 페이지 분석\n');

    // 1. 게시판 목록 영역 찾기
    // 보통 <table>, <ul class="list">, <div class="board-list"> 등

    // 테이블 구조 분석
    const tableMatch = html.match(/<table[^>]*class=["'][^"']*list[^"']*["'][^>]*>([\s\S]*?)<\/table>/i);
    if (tableMatch) {
        results.push('## 테이블 구조 발견');

        // 행 분석
        const rows = tableMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
        results.push(`행 수: ${rows.length}개\n`);

        if (rows.length > 1) {
            // 첫 번째 데이터 행 분석
            const dataRow = rows[1];
            results.push('### 샘플 행 구조');
            results.push('```html');
            results.push(dataRow.substring(0, 1000));
            results.push('```\n');

            // 제목 링크 추출
            const linkMatch = dataRow.match(/<a[^>]*href=["']([^"']+)["'][^>]*>([^<]+(?:<[^>]+>[^<]*)*)<\/a>/i);
            if (linkMatch) {
                results.push(`링크 패턴: ${linkMatch[1]}`);
                results.push(`제목: ${linkMatch[2].replace(/<[^>]+>/g, '').trim()}`);
            }
        }
    }

    // 리스트 구조 분석
    const listMatch = html.match(/<ul[^>]*class=["'][^"']*(?:list|board)[^"']*["'][^>]*>([\s\S]*?)<\/ul>/i);
    if (listMatch) {
        results.push('\n## 리스트(UL) 구조 발견');
        const items = listMatch[1].match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
        results.push(`항목 수: ${items.length}개\n`);

        if (items.length > 0) {
            results.push('### 샘플 항목');
            results.push('```html');
            results.push(items[0].substring(0, 800));
            results.push('```');
        }
    }

    // 게시판 div 구조 분석
    const boardMatch = html.match(/<div[^>]*class=["'][^"']*(?:board|bbs|list)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    if (boardMatch) {
        results.push('\n## 게시판 DIV 구조 발견');
    }

    // 보도자료 링크 패턴 분석
    results.push('\n## 보도자료 링크 패턴 분석');
    const allLinks = html.match(/<a[^>]*href=["']([^"']*(?:view|read|detail|coverage)[^"']*)["'][^>]*>/gi) || [];
    results.push(`관련 링크 수: ${allLinks.length}개\n`);

    // 고유 패턴 추출
    const patterns = new Set();
    allLinks.forEach(link => {
        const hrefMatch = link.match(/href=["']([^"']+)["']/i);
        if (hrefMatch) {
            patterns.add(hrefMatch[1].replace(/\d+/g, 'XXX'));
        }
    });
    results.push('### 링크 패턴');
    [...patterns].slice(0, 5).forEach(p => results.push(`- ${p}`));

    // 날짜 패턴 분석
    const datePatterns = html.match(/\d{4}[-./]\d{2}[-./]\d{2}/g) || [];
    results.push(`\n## 날짜 패턴: ${datePatterns.length}개 발견`);
    if (datePatterns.length > 0) {
        results.push(`예: ${[...new Set(datePatterns)].slice(0, 3).join(', ')}`);
    }

    const output = results.join('\n');
    fs.writeFileSync('naju_analysis.md', output, 'utf8');
    console.log(output);
    console.log('\n📊 분석 저장: naju_analysis.md');
}

analyzeNajuPressRelease().catch(console.error);

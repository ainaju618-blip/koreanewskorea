/**
 * 나주시 보도자료 상세 페이지 구조 분석
 */

const fs = require('fs');

async function analyzeDetailPage() {
    const url = 'https://www.naju.go.kr/www/administration/reporting/coverage?idx=591764&mode=view';

    console.log('🔍 나주시 보도자료 상세 페이지 분석 중...\n');

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html',
            'Accept-Language': 'ko-KR,ko;q=0.9',
        },
    });

    const html = await response.text();

    // HTML 저장
    fs.writeFileSync('naju_detail_raw.html', html, 'utf8');
    console.log('📄 HTML 저장: naju_detail_raw.html');
    console.log(`HTML 크기: ${html.length}자\n`);

    // 본문 관련 영역 찾기
    const patterns = [
        { name: 'view_conts', regex: /class=["'][^"']*view[_-]?conts[^"']*["']/i },
        { name: 'view_content', regex: /class=["'][^"']*view[_-]?content[^"']*["']/i },
        { name: 'board_view', regex: /class=["'][^"']*board[_-]?view[^"']*["']/i },
        { name: 'cont_view', regex: /class=["'][^"']*cont[_-]?view[^"']*["']/i },
        { name: 'detail_cont', regex: /class=["'][^"']*detail[_-]?cont[^"']*["']/i },
        { name: 'article', regex: /<article[^>]*>/i },
        { name: 'bbs_view', regex: /class=["'][^"']*bbs[_-]?view[^"']*["']/i },
        { name: 'txt_area', regex: /class=["'][^"']*txt[_-]?area[^"']*["']/i },
    ];

    console.log('### 패턴 검색 결과:');
    for (const p of patterns) {
        const found = p.regex.test(html);
        console.log(`${found ? '✅' : '❌'} ${p.name}`);
    }

    // 본문 키워드 위치 찾기
    console.log('\n### 본문 키워드 검색:');
    const keywords = ['꽃소마루', '나주혁신점', '빛가람동', '협약'];
    for (const kw of keywords) {
        const idx = html.indexOf(kw);
        console.log(`"${kw}": ${idx > -1 ? `위치 ${idx}` : '없음'}`);
    }

    // 본문 영역 주변 HTML 추출
    const kwIdx = html.indexOf('빛가람동');
    if (kwIdx > -1) {
        console.log('\n### 본문 주변 HTML (2000자):');
        const start = Math.max(0, kwIdx - 500);
        const end = Math.min(html.length, kwIdx + 1500);
        const snippet = html.substring(start, end);

        fs.writeFileSync('naju_detail_snippet.html', snippet, 'utf8');
        console.log('저장: naju_detail_snippet.html');

        // 부모 태그 찾기
        const beforeContent = html.substring(Math.max(0, kwIdx - 300), kwIdx);
        const divMatches = beforeContent.match(/<div[^>]*class=["']([^"']+)["'][^>]*>/gi) || [];
        console.log('\n### 본문 앞의 div 클래스들:');
        divMatches.forEach(m => {
            const classMatch = m.match(/class=["']([^"']+)["']/i);
            if (classMatch) console.log(`  - ${classMatch[1]}`);
        });
    }
}

analyzeDetailPage().catch(console.error);

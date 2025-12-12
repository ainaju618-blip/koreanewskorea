/**
 * 전남일보 HTML 구조 분석
 */

const fs = require('fs');

async function analyzeJnilbo() {
    const url = 'https://www.jnilbo.com/news/articleView.html?idxno=90000015817';

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
    });

    const html = await response.text();

    // HTML 저장
    fs.writeFileSync('jnilbo_raw.html', html, 'utf8');
    console.log('HTML이 jnilbo_raw.html에 저장되었습니다.');

    // article-view-content-div 찾기
    const results = [];
    results.push('# 전남일보 HTML 분석\n');

    // 1. article#article-view-content-div
    const articleMatch = html.match(/<article[^>]*id=["']article-view-content-div["'][^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
        results.push('## article#article-view-content-div 발견:');
        results.push('길이: ' + articleMatch[1].length + '자');
        results.push('```html');
        results.push(articleMatch[1].substring(0, 2000));
        results.push('```\n');
    } else {
        results.push('## article#article-view-content-div: 없음\n');
    }

    // 2. div#article-view-content-div  
    const divMatch = html.match(/<div[^>]*id=["']article-view-content-div["'][^>]*>([\s\S]*?)<\/div>/i);
    if (divMatch) {
        results.push('## div#article-view-content-div 발견:');
        results.push('길이: ' + divMatch[1].length + '자');
        results.push('```html');
        results.push(divMatch[1].substring(0, 2000));
        results.push('```\n');
    } else {
        results.push('## div#article-view-content-div: 없음\n');
    }

    // 3. 다른 가능한 본문 영역 찾기
    const bodyPatterns = [
        [/class=["']article-body["'][^>]*>([\s\S]*?)<\/div>/i, 'article-body'],
        [/class=["']view-content["'][^>]*>([\s\S]*?)<\/div>/i, 'view-content'],
        [/class=["']article-content["'][^>]*>([\s\S]*?)<\/div>/i, 'article-content'],
        [/class=["']news-content["'][^>]*>([\s\S]*?)<\/div>/i, 'news-content'],
        [/<article[^>]*>([\s\S]*?)<\/article>/i, 'article 태그'],
    ];

    for (const [pattern, name] of bodyPatterns) {
        const match = html.match(pattern);
        if (match) {
            results.push(`## ${name} 발견:`);
            results.push('길이: ' + match[1].length + '자');
            results.push('```html');
            results.push(match[1].substring(0, 500));
            results.push('```\n');
        }
    }

    // 파일에 저장
    fs.writeFileSync('jnilbo_analysis.md', results.join('\n'), 'utf8');
    console.log('분석 결과가 jnilbo_analysis.md에 저장되었습니다.');
}

analyzeJnilbo().catch(console.error);

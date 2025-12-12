/**
 * 전남일보 article-body 분석 v2 - 파일로 저장
 */

const fs = require('fs');

async function analyzeArticleBody() {
    const html = fs.readFileSync('jnilbo_raw.html', 'utf8');
    const results = [];

    // 1. article-body 전체 내용 추출
    const startPattern = /<div\s+class=["']article-body["'][^>]*>/i;
    const match = html.match(startPattern);

    if (match) {
        const startIdx = match.index;
        const chunk = html.substring(startIdx, startIdx + 20000);

        results.push('# article-body 분석');
        results.push(`시작 위치: ${startIdx}`);
        results.push('\n## HTML 구조 (처음 3000자)\n```html');
        results.push(chunk.substring(0, 3000));
        results.push('```\n');

        // 본문 text만 추출
        const textOnly = chunk
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        results.push('## 텍스트만 추출\n```');
        results.push(textOnly.substring(0, 1500));
        results.push('```');
    }

    // 2. 다른 본문 패턴들 찾기
    results.push('\n\n# 다른 본문 관련 패턴 검색');

    const patterns = [
        [/<div[^>]*id=["']news_body_area["'][^>]*>/i, 'news_body_area'],
        [/<div[^>]*class=["'][^"']*article-txt[^"']*["'][^>]*>/i, 'article-txt'],
        [/<div[^>]*class=["'][^"']*view-txt[^"']*["'][^>]*>/i, 'view-txt'],
        [/<p[^>]*class=["'][^"']*article[^"']*["'][^>]*>/i, 'p.article'],
    ];

    for (const [pattern, name] of patterns) {
        const m = html.match(pattern);
        if (m) {
            const idx = m.index;
            const snippet = html.substring(idx, idx + 500);
            results.push(`\n## ${name} 발견 (위치: ${idx})`);
            results.push('```html');
            results.push(snippet);
            results.push('```');
        }
    }

    // 3. 기사 본문이 있을 만한 위치 찾기 - "광주FC" 텍스트 주변
    const contentKeyword = '광주FC가';
    const keywordIdx = html.indexOf(contentKeyword);
    if (keywordIdx > -1) {
        results.push(`\n\n# "${contentKeyword}" 키워드 위치: ${keywordIdx}`);
        results.push('```html');
        results.push(html.substring(Math.max(0, keywordIdx - 200), keywordIdx + 500));
        results.push('```');
    }

    fs.writeFileSync('body_analysis_v2.md', results.join('\n'), 'utf8');
    console.log('분석 완료! body_analysis_v2.md에 저장됨');
}

analyzeArticleBody();

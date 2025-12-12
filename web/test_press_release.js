/**
 * 지자체 보도자료 스크래핑 테스트
 */

const fs = require('fs');

async function testPressRelease() {
    const results = [];
    results.push('# 지자체 보도자료 스크래핑 테스트\n');
    results.push(`테스트 시간: ${new Date().toLocaleString('ko-KR')}\n`);

    const testUrls = [
        ['나주시', 'https://www.naju.go.kr/www/administration/reporting/coverage'],
        ['광주시', 'https://www.gwangju.go.kr/boardList.do?boardId=BD_0000000027&pageId=www789'],
        ['전라남도', 'https://www.jeonnam.go.kr/M7116/boardList.do?menuId=jeonnam0202000000'],
    ];

    for (const [name, url] of testUrls) {
        results.push(`\n## ${name}`);
        results.push(`URL: ${url}\n`);

        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'ko-KR,ko;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                },
                signal: AbortSignal.timeout(15000),
            });

            results.push(`HTTP 상태: ${response.status}`);

            if (!response.ok) {
                results.push(`❌ 접근 실패`);
                continue;
            }

            const html = await response.text();
            results.push(`HTML 크기: ${html.length}자`);

            // 보도자료 제목 링크 찾기
            const titleMatches = html.match(/<a[^>]*href=["']([^"']*)['""][^>]*>([^<]+)<\/a>/gi) || [];
            const newsLinks = titleMatches.filter(t =>
                t.includes('View') || t.includes('view') ||
                t.includes('read') || t.includes('detail')
            ).slice(0, 5);

            if (newsLinks.length > 0) {
                results.push(`\n### 발견된 링크 (최대 5개)`);
                newsLinks.forEach((link, i) => {
                    const textMatch = link.match(/>([^<]+)</);
                    const text = textMatch ? textMatch[1].trim().substring(0, 50) : 'N/A';
                    results.push(`${i + 1}. ${text}...`);
                });
                results.push(`\n✅ 스크래핑 가능!`);
            } else {
                // 다른 패턴 시도
                const listItems = html.match(/<li[^>]*>[\s\S]*?<\/li>/gi) || [];
                results.push(`목록 항목 수: ${listItems.length}개`);

                if (listItems.length > 5) {
                    results.push(`✅ 스크래핑 가능 (목록 발견)`);
                } else {
                    results.push(`⚠️ 추가 분석 필요`);
                }
            }

        } catch (error) {
            results.push(`❌ 오류: ${error.message}`);
        }
    }

    const output = results.join('\n');
    fs.writeFileSync('press_release_test.md', output, 'utf8');
    console.log(output);
    console.log('\n결과 저장: press_release_test.md');
}

testPressRelease().catch(console.error);

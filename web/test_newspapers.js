/**
 * 광주/전남 신문사 스크래핑 테스트
 * 기존 스크래퍼로 여러 신문사 테스트
 */

const fs = require('fs');

async function scrapeArticlePage(url) {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'ko-KR,ko;q=0.9',
            },
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            return { error: `HTTP ${response.status}` };
        }

        const html = await response.text();

        // og:image 추출
        let thumbnailUrl = null;
        const ogImageMatch = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i)
            || html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i);
        if (ogImageMatch && ogImageMatch[1]) {
            thumbnailUrl = ogImageMatch[1];
        }

        // 본문 추출 (여러 패턴)
        let articleContent = '';

        // 패턴 1: article-body
        const articleBodyMatch = html.match(/<div\s+class=["']article-body["'][^>]*>([\s\S]*?)(?=<div\s+class=["']article-(?:footer|relate|tag)|<\/article>)/i);
        if (articleBodyMatch) {
            articleContent = articleBodyMatch[1];
        }

        // 패턴 2: article-view-content-div
        if (!articleContent || articleContent.length < 200) {
            const viewContentMatch = html.match(/<div[^>]*id=["']article-view-content-div["'][^>]*>([\s\S]*?)(?=<\/div>\s*<\/div>)/i);
            if (viewContentMatch) {
                articleContent = viewContentMatch[1];
            }
        }

        // 패턴 3: entry-content
        if (!articleContent || articleContent.length < 200) {
            const entryMatch = html.match(/<div[^>]*class=["'][^"']*entry-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
            if (entryMatch) {
                articleContent = entryMatch[1];
            }
        }

        // 패턴 4: article 태그
        if (!articleContent || articleContent.length < 200) {
            const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
            if (articleMatch) {
                articleContent = articleMatch[1];
            }
        }

        // HTML 정리
        let plainText = articleContent
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<figcaption[\s\S]*?<\/figcaption>/gi, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/\s+/g, ' ')
            .trim();

        return {
            content: plainText,
            contentLength: plainText.length,
            thumbnailUrl,
            rawHtmlLength: html.length,
        };

    } catch (error) {
        return { error: error.message };
    }
}

async function testNewsSites() {
    const results = [];
    results.push('# 광주/전남 신문사 스크래핑 테스트 결과\n');
    results.push(`테스트 시간: ${new Date().toLocaleString('ko-KR')}\n`);

    // 테스트할 신문사들 (최신 기사 URL 필요)
    const testSites = [
        ['전남일보', 'https://www.jnilbo.com/news/articleList.html'],
        ['광남일보', 'https://www.gwangnam.co.kr/news/articleList.html'],
        ['남도일보', 'https://www.namdonews.com/news/articleList.html'],
    ];

    for (const [name, listUrl] of testSites) {
        results.push(`\n## ${name}`);
        results.push(`목록 URL: ${listUrl}\n`);

        try {
            // 1. 기사 목록에서 첫 번째 기사 URL 가져오기
            const listResponse = await fetch(listUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                signal: AbortSignal.timeout(10000),
            });

            if (!listResponse.ok) {
                results.push(`❌ 목록 페이지 접근 실패: HTTP ${listResponse.status}`);
                continue;
            }

            const listHtml = await listResponse.text();

            // 기사 링크 추출 (articleView.html?idxno=XXX 패턴)
            const articleMatch = listHtml.match(/href=["']([^"']*articleView\.html\?idxno=\d+)["']/i);

            if (!articleMatch) {
                results.push(`❌ 기사 링크를 찾을 수 없음`);
                continue;
            }

            // 상대 URL을 절대 URL로 변환
            const baseUrl = listUrl.replace(/\/news\/.*$/, '');
            let articleUrl = articleMatch[1];
            if (!articleUrl.startsWith('http')) {
                articleUrl = baseUrl + (articleUrl.startsWith('/') ? '' : '/') + articleUrl;
            }

            results.push(`📎 테스트 기사: ${articleUrl}`);

            // 2. 기사 페이지 스크래핑
            const scraped = await scrapeArticlePage(articleUrl);

            if (scraped.error) {
                results.push(`❌ 스크래핑 실패: ${scraped.error}`);
            } else {
                results.push(`- HTML 크기: ${scraped.rawHtmlLength}자`);
                results.push(`- 본문 길이: **${scraped.contentLength}자** ${scraped.contentLength > 500 ? '✅' : '⚠️'}`);
                results.push(`- 이미지: ${scraped.thumbnailUrl ? '✅ ' + scraped.thumbnailUrl.substring(0, 60) + '...' : '❌ 없음'}`);

                if (scraped.contentLength > 100) {
                    results.push(`\n### 본문 미리보기 (300자)`);
                    results.push('```');
                    results.push(scraped.content.substring(0, 300) + '...');
                    results.push('```');
                }
            }

        } catch (error) {
            results.push(`❌ 오류: ${error.message}`);
        }
    }

    // 결과 저장
    const output = results.join('\n');
    fs.writeFileSync('newspaper_test_result.md', output, 'utf8');
    console.log('테스트 완료! newspaper_test_result.md에 저장됨');
}

testNewsSites().catch(console.error);

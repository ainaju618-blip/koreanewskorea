/**
 * 기사 페이지 직접 스크래핑 테스트 v2
 * 결과를 파일로 저장
 */

const Parser = require('rss-parser');
const fs = require('fs');

const parser = new Parser({
    customFields: {
        item: [
            ['content:encoded', 'contentEncoded'],
            ['media:content', 'mediaContent'],
            ['media:thumbnail', 'mediaThumbnail'],
        ]
    }
});

/**
 * 기사 페이지를 직접 스크래핑해서 본문과 이미지 추출
 */
async function scrapeArticlePage(url) {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            }
        });

        if (!response.ok) {
            return { error: `HTTP ${response.status}` };
        }

        const html = await response.text();

        // 1. og:image 메타 태그에서 이미지 추출
        let thumbnailUrl = null;
        const ogImageMatch = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i)
            || html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i);
        if (ogImageMatch && ogImageMatch[1]) {
            thumbnailUrl = ogImageMatch[1];
        }

        // 2. 본문 추출 (사이트별로 다른 선택자 사용)
        let articleContent = '';

        // 전남일보/광주일보/AI타임스 (MediaUs CMS 사용)
        const articleBodyMatch = html.match(/<article[^>]*id=["']article-view-content-div["'][^>]*>([\s\S]*?)<\/article>/i);
        if (articleBodyMatch) {
            articleContent = articleBodyMatch[1];
        } else {
            // 대체: div#article-view-content-div
            const divMatch = html.match(/<div[^>]*id=["']article-view-content-div["'][^>]*>([\s\S]*?)<\/div>/i);
            if (divMatch) {
                articleContent = divMatch[1];
            }
        }

        // 3. 본문에서 첫 번째 이미지 추출 (og:image가 없는 경우)
        if (!thumbnailUrl && articleContent) {
            const imgMatch = articleContent.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (imgMatch && imgMatch[1]) {
                thumbnailUrl = imgMatch[1];
            }
        }

        // 4. HTML 태그 제거하고 텍스트만 추출
        let plainText = articleContent
            .replace(/<script[\s\S]*?<\/script>/gi, '')  // 스크립트 제거
            .replace(/<style[\s\S]*?<\/style>/gi, '')    // 스타일 제거
            .replace(/<[^>]*>/g, ' ')                     // HTML 태그 제거
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ')                         // 연속 공백 정리
            .trim();

        return {
            content: plainText,
            contentLength: plainText.length,
            thumbnailUrl: thumbnailUrl,
            rawHtmlLength: html.length,
        };

    } catch (error) {
        return { error: error.message };
    }
}

async function testScraping() {
    const results = [];
    results.push('# 기사 페이지 직접 스크래핑 테스트 결과\n');

    // 테스트할 URL들
    const testUrls = [
        ['AI타임스', 'https://www.aitimes.com/news/articleView.html?idxno=204573'],
        ['전남일보', 'https://www.jnilbo.com/news/articleView.html?idxno=90000015817'],
    ];

    for (const [name, url] of testUrls) {
        results.push('---');
        results.push(`## ${name}`);
        results.push(`URL: ${url}\n`);

        const result = await scrapeArticlePage(url);

        if (result.error) {
            results.push(`**에러**: ${result.error}`);
        } else {
            results.push(`- HTML 크기: ${result.rawHtmlLength}자`);
            results.push(`- 본문 길이: ${result.contentLength}자`);
            results.push(`- 이미지: ${result.thumbnailUrl || '없음'}`);
            results.push(`\n### 본문 미리보기 (처음 500자)\n`);
            results.push('```');
            results.push(result.content.substring(0, 500));
            results.push('```');
        }

        results.push('\n');
    }

    // 파일로 저장
    const output = results.join('\n');
    fs.writeFileSync('scrape_result.md', output, 'utf8');
    console.log('결과가 scrape_result.md에 저장되었습니다.');
}

testScraping().catch(console.error);

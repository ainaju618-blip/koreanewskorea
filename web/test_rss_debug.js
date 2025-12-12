/**
 * RSS 피드 심층 디버깅 스크립트 v3
 * 각 필드 존재 여부만 간결하게 출력
 */

const Parser = require('rss-parser');

const parser = new Parser({
    customFields: {
        item: [
            ['content:encoded', 'contentEncoded'],
            ['media:content', 'mediaContent'],
            ['media:thumbnail', 'mediaThumbnail'],
        ]
    }
});

async function debugRssFeed(feedUrl, feedName) {
    const result = [];
    result.push('');
    result.push('='.repeat(70));
    result.push(`🔍 피드: ${feedName}`);
    result.push(`📍 URL: ${feedUrl}`);
    result.push('='.repeat(70));

    try {
        const feed = await parser.parseURL(feedUrl);
        result.push(`✅ 파싱 성공! ${feed.items.length}개 아이템`);

        if (feed.items.length > 0) {
            const item = feed.items[0];

            result.push(`\n📰 제목: ${item.title?.substring(0, 50)}...`);
            result.push(`📎 링크: ${item.link}`);

            // 본문 분석
            result.push('\n📝 본문:');
            const contentEncoded = item.contentEncoded || item['content:encoded'];
            const content = item.content;
            const contentSnippet = item.contentSnippet;

            if (contentEncoded) {
                result.push(`  ✅ contentEncoded: ${contentEncoded.length}자`);
            } else {
                result.push(`  ❌ contentEncoded: 없음`);
            }

            if (content) {
                result.push(`  ${content.length > 500 ? '✅' : '⚠️'} content: ${content.length}자`);
            } else {
                result.push(`  ❌ content: 없음`);
            }

            if (contentSnippet) {
                result.push(`  📌 contentSnippet: ${contentSnippet.length}자`);
            }

            // 이미지 분석
            result.push('\n📷 이미지:');

            // enclosure
            if (item.enclosure?.url) {
                result.push(`  ✅ enclosure: ${item.enclosure.url.substring(0, 60)}...`);
            } else {
                result.push(`  ❌ enclosure: 없음`);
            }

            // media:content
            const mediaContent = item.mediaContent || item['media:content'];
            if (mediaContent) {
                let url = null;
                if (Array.isArray(mediaContent) && mediaContent[0]?.$?.url) {
                    url = mediaContent[0].$.url;
                } else if (mediaContent.$?.url) {
                    url = mediaContent.$.url;
                } else if (mediaContent.url) {
                    url = mediaContent.url;
                }
                if (url) {
                    result.push(`  ✅ media:content: ${url.substring(0, 60)}...`);
                } else {
                    result.push(`  ⚠️ media:content 있지만 URL 추출 실패: ${JSON.stringify(mediaContent).substring(0, 50)}`);
                }
            } else {
                result.push(`  ❌ media:content: 없음`);
            }

            // media:thumbnail
            const mediaThumbnail = item.mediaThumbnail || item['media:thumbnail'];
            if (mediaThumbnail) {
                let url = null;
                if (Array.isArray(mediaThumbnail) && mediaThumbnail[0]?.$?.url) {
                    url = mediaThumbnail[0].$.url;
                } else if (mediaThumbnail.$?.url) {
                    url = mediaThumbnail.$.url;
                } else if (typeof mediaThumbnail === 'string') {
                    url = mediaThumbnail;
                }
                if (url) {
                    result.push(`  ✅ media:thumbnail: ${url.substring(0, 60)}...`);
                } else {
                    result.push(`  ⚠️ media:thumbnail 있지만 URL 추출 실패`);
                }
            } else {
                result.push(`  ❌ media:thumbnail: 없음`);
            }

            // 본문 img 태그
            const rawContent = contentEncoded || content || '';
            const imgMatch = rawContent.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (imgMatch) {
                result.push(`  ✅ 본문 <img>: ${imgMatch[1].substring(0, 60)}...`);
            } else {
                result.push(`  ❌ 본문 <img>: 없음`);
            }

            // 모든 키 출력
            result.push('\n📋 아이템의 모든 키:');
            result.push(`  ${Object.keys(item).join(', ')}`);
        }

        // 한꺼번에 출력
        console.log(result.join('\n'));
        return true;

    } catch (error) {
        result.push(`❌ 피드 파싱 실패: ${error.message}`);
        console.log(result.join('\n'));
        return false;
    }
}

async function main() {
    console.log('🚀 RSS 피드 심층 디버깅 v3');

    const feeds = [
        ['AI타임스', 'https://www.aitimes.com/rss/allArticle.xml'],
    ];

    for (const [name, url] of feeds) {
        await debugRssFeed(url, name);
    }
}

main().catch(console.error);

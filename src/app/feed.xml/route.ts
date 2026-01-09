import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.koreanewskorea.com';

    // 최근 50개 기사
    const { data: posts } = await supabaseAdmin
        .from('posts')
        .select('id, title, content, ai_summary, category, published_at, thumbnail_url, author_name')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(50);

    const items = (posts || []).map(post => {
        const description = post.ai_summary || post.content?.slice(0, 200) || '';
        // XML 특수문자 이스케이프
        const escapedDescription = description
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        return `
        <item>
            <title><![CDATA[${post.title}]]></title>
            <link>${siteUrl}/news/${post.id}</link>
            <guid isPermaLink="true">${siteUrl}/news/${post.id}</guid>
            <description><![CDATA[${escapedDescription}]]></description>
            <pubDate>${new Date(post.published_at).toUTCString()}</pubDate>
            <category>${post.category}</category>
            ${post.author_name ? `<dc:creator>${post.author_name}</dc:creator>` : ''}
            ${post.thumbnail_url ? `<media:thumbnail url="${post.thumbnail_url}" />` : ''}
        </item>`;
    }).join('');

    const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:media="http://search.yahoo.com/mrss/"
    xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>코리아NEWS</title>
        <link>${siteUrl}</link>
        <description>광주, 전남, 나주시 뉴스와 AI/교육 정보를 가장 빠르게 전달합니다.</description>
        <language>ko</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
        <image>
            <url>${siteUrl}/logo.png</url>
            <title>코리아NEWS</title>
            <link>${siteUrl}</link>
        </image>
        ${items}
    </channel>
</rss>`;

    return new Response(feed, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
    });
}

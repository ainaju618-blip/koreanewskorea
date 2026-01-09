import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * RSS 2.0 Feed for Korea NEWS
 * Used for: Naver News, RSS readers, content aggregators
 */
export async function GET() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.koreanewskorea.com';

    // Get latest 50 published articles
    const { data: posts, error } = await supabaseAdmin
        .from('posts')
        .select(`
            id,
            title,
            content,
            excerpt,
            thumbnail_url,
            published_at,
            updated_at,
            reporter:reporters(name, slug),
            category:categories(name, slug),
            region:regions(name)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('RSS feed error:', error);
        return new Response('Error generating RSS feed', { status: 500 });
    }

    const now = new Date().toUTCString();

    const items = (posts || []).map(post => {
        const pubDate = new Date(post.published_at).toUTCString();
        const description = post.excerpt || extractExcerpt(post.content, 200);
        // Handle both array and object types from Supabase relations
        const reporter = Array.isArray(post.reporter) ? post.reporter[0] : post.reporter;
        const category = Array.isArray(post.category) ? post.category[0] : post.category;
        const authorName = reporter?.name || 'Korea NEWS';
        const categoryName = category?.name || '';
        const imageUrl = post.thumbnail_url || `${siteUrl}/og-image.png`;

        return `
    <item>
        <title><![CDATA[${post.title}]]></title>
        <link>${siteUrl}/news/${post.id}</link>
        <guid isPermaLink="true">${siteUrl}/news/${post.id}</guid>
        <pubDate>${pubDate}</pubDate>
        <author>${authorName}</author>
        <category><![CDATA[${categoryName}]]></category>
        <description><![CDATA[${description}]]></description>
        <enclosure url="${imageUrl}" type="image/jpeg" />
    </item>`;
    }).join('');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:media="http://search.yahoo.com/mrss/">
    <channel>
        <title>코리아NEWS - 로컬과 세계를 잇는 AI 저널리즘</title>
        <link>${siteUrl}</link>
        <description>광주, 전남, 나주시 뉴스와 AI/교육 정보를 가장 빠르게 전달합니다.</description>
        <language>ko</language>
        <lastBuildDate>${now}</lastBuildDate>
        <pubDate>${now}</pubDate>
        <ttl>60</ttl>
        <copyright>Copyright (c) 코리아NEWS. All rights reserved.</copyright>
        <managingEditor>contact@koreanewskorea.com (코리아NEWS)</managingEditor>
        <webMaster>contact@koreanewskorea.com (코리아NEWS)</webMaster>
        <image>
            <url>${siteUrl}/logo.png</url>
            <title>코리아NEWS</title>
            <link>${siteUrl}</link>
            <width>144</width>
            <height>40</height>
        </image>
        <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
${items}
    </channel>
</rss>`;

    return new Response(rss, {
        headers: {
            'Content-Type': 'application/rss+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=1800, s-maxage=1800',
        },
    });
}

function extractExcerpt(content: string, maxLength: number): string {
    if (!content) return '';
    // Remove HTML tags
    const text = content.replace(/<[^>]*>/g, '').trim();
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

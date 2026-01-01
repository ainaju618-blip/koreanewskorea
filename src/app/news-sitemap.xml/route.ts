import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

/**
 * Google News Sitemap
 * Reference: https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 *
 * Google News requires articles published within the last 2 days
 * Maximum 1000 URLs per sitemap
 */
export async function GET() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.koreanewsone.com';

    // Get articles published within last 2 days (Google News requirement)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const { data: posts, error } = await supabaseAdmin
        .from('posts')
        .select('id, title, published_at, category, author_name')
        .eq('status', 'published')
        .gte('published_at', twoDaysAgo.toISOString())
        .order('published_at', { ascending: false })
        .limit(1000);

    if (error) {
        console.error('News sitemap error:', error);
        return new NextResponse('Error generating sitemap', { status: 500 });
    }

    const newsItems = (posts || []).map(post => {
        const pubDate = new Date(post.published_at);
        return `
    <url>
        <loc>${siteUrl}/news/${post.id}</loc>
        <news:news>
            <news:publication>
                <news:name>코리아NEWS</news:name>
                <news:language>ko</news:language>
            </news:publication>
            <news:publication_date>${pubDate.toISOString()}</news:publication_date>
            <news:title><![CDATA[${escapeXml(post.title)}]]></news:title>
        </news:news>
    </url>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${newsItems}
</urlset>`;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
    });
}

function escapeXml(text: string): string {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

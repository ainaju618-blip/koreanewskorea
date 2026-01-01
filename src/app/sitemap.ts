import { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabase-admin';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.koreanewsone.com';

    // 1. 정적 페이지
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: siteUrl,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 1.0,
        },
        {
            url: `${siteUrl}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${siteUrl}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${siteUrl}/terms`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
    ];

    // 2. 카테고리별 페이지
    const categories = ['gwangju', 'jeonnam', 'ai', 'education'];
    const categoryPages: MetadataRoute.Sitemap = categories.map(cat => ({
        url: `${siteUrl}/category/${cat}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
    }));

    // 3. 27개 지역별 페이지
    const regions = [
        'gwangju', 'jeonnam', 'mokpo', 'yeosu', 'suncheon', 'naju', 'gwangyang',
        'damyang', 'gokseong', 'gurye', 'goheung', 'boseong', 'hwasun', 'jangheung',
        'gangjin', 'haenam', 'yeongam', 'muan', 'hampyeong', 'yeonggwang', 'jangseong',
        'wando', 'jindo', 'shinan', 'gwangju_edu', 'jeonnam_edu'
    ];
    const regionPages: MetadataRoute.Sitemap = regions.map(region => ({
        url: `${siteUrl}/category/jeonnam/${region}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
    }));

    // 4. 기사 페이지 (published 상태만)
    const { data: posts } = await supabaseAdmin
        .from('posts')
        .select('id, updated_at, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(5000);

    const newsPages: MetadataRoute.Sitemap = (posts || []).map(post => ({
        url: `${siteUrl}/news/${post.id}`,
        lastModified: new Date(post.updated_at || post.published_at),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    // 5. 기자 프로필 페이지
    const { data: reporters } = await supabaseAdmin
        .from('reporters')
        .select('id, slug, updated_at')
        .eq('status', 'Active');

    const authorPages: MetadataRoute.Sitemap = (reporters || []).map(reporter => ({
        url: `${siteUrl}/author/${reporter.slug || reporter.id}`,
        lastModified: new Date(reporter.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
    }));

    return [...staticPages, ...categoryPages, ...regionPages, ...newsPages, ...authorPages];
}

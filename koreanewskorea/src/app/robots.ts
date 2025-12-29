import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gwangju.koreanewsone.com';

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/admin/',
                    '/api/',
                    '/reporter/',
                    '/_next/',
                    '/idea/',
                ],
            },
            {
                userAgent: 'Googlebot',
                allow: '/',
                disallow: ['/admin/', '/api/', '/reporter/', '/idea/'],
            },
            {
                userAgent: 'Yeti', // 네이버
                allow: '/',
                disallow: ['/admin/', '/api/', '/reporter/', '/idea/'],
            },
        ],
        sitemap: [
            `${siteUrl}/sitemap.xml`,
            `${siteUrl}/news-sitemap.xml`,
        ],
        host: siteUrl,
    };
}

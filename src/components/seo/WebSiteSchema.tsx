/**
 * WebSite Schema Component
 * Provides site-wide structured data for search engines
 * Enables Google Sitelinks Search Box
 */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.koreanewskorea.com';

export default function WebSiteSchema() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        name: 'Korea NEWS',
        alternateName: ['Korea NEWS', 'koreanewsone'],
        url: siteUrl,
        description: 'Gwangju, Jeonnam, Naju news and AI/Education information delivered fastest',
        inLanguage: 'ko-KR',
        publisher: {
            '@id': `${siteUrl}/#organization`,
        },
        // Enable Google Sitelinks Search Box
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${siteUrl}/search?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}

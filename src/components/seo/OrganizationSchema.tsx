/**
 * Organization Schema (JSON-LD)
 * For NewsMediaOrganization - helps with Google News and AI search
 *
 * @see https://schema.org/NewsMediaOrganization
 */

interface OrganizationSchemaProps {
    siteUrl?: string;
}

export default function OrganizationSchema({ siteUrl = 'https://www.koreanewskorea.com' }: OrganizationSchemaProps) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'NewsMediaOrganization',
        '@id': `${siteUrl}/#organization`,
        name: '코리아NEWS',
        alternateName: ['Korea NEWS', 'KoreaNews', '코리아뉴스'],
        url: siteUrl,
        logo: {
            '@type': 'ImageObject',
            url: `${siteUrl}/logo.png`,
            width: 600,
            height: 60,
        },
        image: {
            '@type': 'ImageObject',
            url: `${siteUrl}/og-image.png`,
            width: 1200,
            height: 630,
        },
        description: '로컬과 세계를 잇는 AI 저널리즘 플랫폼. 광주, 전남, 나주시 뉴스와 AI/교육 정보를 전달합니다.',
        slogan: '로컬과 세계를 잇는 AI 저널리즘',
        foundingDate: '2024',
        foundingLocation: {
            '@type': 'Place',
            name: '대한민국 광주광역시',
        },
        areaServed: {
            '@type': 'Country',
            name: '대한민국',
        },
        // Contact information
        contactPoint: [
            {
                '@type': 'ContactPoint',
                contactType: 'customer service',
                email: 'contact@koreanewskorea.com',
                availableLanguage: ['Korean', 'English'],
            },
        ],
        // Social media profiles
        sameAs: [
            // Add actual social media URLs when available
            // 'https://twitter.com/koreanews',
            // 'https://facebook.com/koreanews',
            // 'https://youtube.com/@koreanews',
        ],
        // News-specific properties
        ethicsPolicy: `${siteUrl}/ethical-code`,
        correctionsPolicy: `${siteUrl}/corrections`,
        masthead: `${siteUrl}/organizational`,
        ownershipFundingInfo: `${siteUrl}/about`,
        // Publishing principles
        publishingPrinciples: `${siteUrl}/ethical-code`,
        // Action - for AI assistants
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
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

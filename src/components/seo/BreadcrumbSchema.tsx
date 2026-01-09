/**
 * BreadcrumbList Schema (JSON-LD)
 * Improves search result appearance and navigation
 *
 * @see https://schema.org/BreadcrumbList
 */

interface BreadcrumbItem {
    name: string;
    url: string;
}

interface BreadcrumbSchemaProps {
    items: BreadcrumbItem[];
    siteUrl?: string;
}

export default function BreadcrumbSchema({
    items,
    siteUrl = 'https://www.koreanewskorea.com'
}: BreadcrumbSchemaProps) {
    // Always start with home
    const breadcrumbItems = [
        { name: '홈', url: siteUrl },
        ...items.map(item => ({
            name: item.name,
            url: item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`,
        })),
    ];

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbItems.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

/**
 * Helper function to generate breadcrumb items for news articles
 */
export function generateNewsBreadcrumbs(article: {
    id: string;
    title: string;
    category?: { name: string; slug: string } | null;
    region?: { name: string; slug?: string } | null;
}): BreadcrumbItem[] {
    const items: BreadcrumbItem[] = [];

    // Add category if available
    if (article.category) {
        items.push({
            name: article.category.name,
            url: `/category/${article.category.slug}`,
        });
    }

    // Add region if available (for local news)
    if (article.region) {
        items.push({
            name: article.region.name,
            url: `/category/jeonnam/${article.region.slug || article.region.name}`,
        });
    }

    // Add article title (truncated)
    const truncatedTitle = article.title.length > 50
        ? article.title.substring(0, 50) + '...'
        : article.title;

    items.push({
        name: truncatedTitle,
        url: `/news/${article.id}`,
    });

    return items;
}

/**
 * Helper function for category pages
 */
export function generateCategoryBreadcrumbs(
    category: { name: string; slug: string },
    subcategory?: { name: string; slug: string }
): BreadcrumbItem[] {
    const items: BreadcrumbItem[] = [
        {
            name: category.name,
            url: `/category/${category.slug}`,
        },
    ];

    if (subcategory) {
        items.push({
            name: subcategory.name,
            url: `/category/${category.slug}/${subcategory.slug}`,
        });
    }

    return items;
}

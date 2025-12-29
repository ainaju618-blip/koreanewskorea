import CategoryPageTemplate from '@/components/category/CategoryPageTemplate';

interface PageProps {
    searchParams: Promise<{ page?: string }>;
}

export default async function PoliticsEconomyPage({ searchParams }: PageProps) {
    const params = await searchParams;
    return <CategoryPageTemplate categoryCode="politics-economy" searchParams={params} />;
}

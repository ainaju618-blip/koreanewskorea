import CategoryPageTemplate from '@/components/category/CategoryPageTemplate';

interface PageProps {
    searchParams: Promise<{ page?: string }>;
}

export default async function OpinionPage({ searchParams }: PageProps) {
    const params = await searchParams;
    return <CategoryPageTemplate categoryCode="opinion" searchParams={params} />;
}

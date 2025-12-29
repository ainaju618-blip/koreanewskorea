import { notFound } from 'next/navigation';
import { isValidRegion, VALID_REGIONS } from '@/config/site-regions';
import { RegionProvider } from '@/contexts/RegionContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Generate static params for all valid regions
export function generateStaticParams() {
    return VALID_REGIONS.map((region) => ({
        region: region,
    }));
}

interface RegionLayoutProps {
    children: React.ReactNode;
    params: Promise<{ region: string }>;
}

export default async function RegionLayout({
    children,
    params,
}: RegionLayoutProps) {
    const { region } = await params;

    // Validate region
    if (!isValidRegion(region)) {
        notFound();
    }

    return (
        <RegionProvider region={region}>
            <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow">
                    {children}
                </main>
                <Footer />
            </div>
        </RegionProvider>
    );
}

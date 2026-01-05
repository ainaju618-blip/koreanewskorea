import StitchHeaderEN from '@/components/StitchHeaderEN';
import StitchFooterEN from '@/components/StitchFooterEN';

export default function EnglishSiteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen">
            <StitchHeaderEN />
            <main className="flex-grow">
                {children}
            </main>
            <StitchFooterEN />
        </div>
    );
}

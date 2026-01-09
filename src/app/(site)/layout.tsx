import StitchHeader from '@/components/StitchHeader';
import StitchFooter from '@/components/StitchFooter';

export default function SiteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen">
            <StitchHeader>
                <main className="flex-grow">
                    {children}
                </main>
                <StitchFooter />
            </StitchHeader>
        </div>
    );
}

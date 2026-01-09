import StitchHeader from '@/components/StitchHeader';
import StitchFooter from '@/components/StitchFooter';
import MobileTabBar from '@/components/MobileTabBar';

export default function SiteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen">
            <StitchHeader>
                <main className="flex-grow pb-16 lg:pb-0">
                    {children}
                </main>
                <StitchFooter />
                <MobileTabBar />
            </StitchHeader>
        </div>
    );
}

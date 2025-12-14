
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingAdminPanel from '@/components/admin/FloatingAdminPanel';

export default function SiteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
            <FloatingAdminPanel />
        </div>
    );
}

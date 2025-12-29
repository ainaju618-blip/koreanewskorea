import { Suspense } from 'react';
import BlogAdminSidebarLayout from '@/components/blogadmin/BlogAdminSidebar';

export const metadata = {
    title: 'CosmicPulse Admin | Blog Management',
    description: 'AI-powered SF & Space blog management system',
};

export default function BlogAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={
            <div className="flex-1 ml-64 min-h-screen bg-[#0a0a0f] animate-pulse flex items-center justify-center">
                <div className="text-purple-400">Loading...</div>
            </div>
        }>
            <BlogAdminSidebarLayout>
                {children}
            </BlogAdminSidebarLayout>
        </Suspense>
    );
}

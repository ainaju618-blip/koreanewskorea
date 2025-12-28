import { Suspense } from 'react';
import AdminSidebarLayout from '@/components/admin/AdminSidebar';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AdminAuthGuard>
            <Suspense fallback={<div className="flex-1 ml-64 min-h-screen bg-slate-50/50 animate-pulse" />}>
                <AdminSidebarLayout>
                    {children}
                </AdminSidebarLayout>
            </Suspense>
        </AdminAuthGuard>
    );
}


import AdminSidebarLayout from '@/components/admin/AdminSidebar';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AdminAuthGuard>
            <AdminSidebarLayout>
                {children}
            </AdminSidebarLayout>
        </AdminAuthGuard>
    );
}


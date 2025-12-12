import AdminSidebarLayout from '@/components/admin/AdminSidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AdminSidebarLayout>
            {children}
        </AdminSidebarLayout>
    );
}


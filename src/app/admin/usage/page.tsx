import { redirect } from 'next/navigation';

// Redirect to new unified monitoring center
export default function UsagePage() {
    redirect('/admin/monitor');
}

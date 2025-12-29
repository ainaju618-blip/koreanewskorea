"use client";

import { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import { ConfirmProvider } from '@/components/ui/ConfirmModal';

export default function Providers({ children }: { children: ReactNode }) {
    return (
        <ToastProvider>
            <ConfirmProvider>
                {children}
            </ConfirmProvider>
        </ToastProvider>
    );
}

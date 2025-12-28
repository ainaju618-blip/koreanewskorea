"use client";

import { useState, useEffect } from 'react';
import { Share } from 'lucide-react';
import ShareToast from '@/components/ui/ShareToast';

interface ShareButtonProps {
    title: string;
    className?: string;
    size?: 'sm' | 'md';
}

export default function ShareButton({ title, className = '', size = 'md' }: ShareButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentUrl, setCurrentUrl] = useState('');

    useEffect(() => {
        setCurrentUrl(window.location.href);
    }, []);

    const iconClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

    return (
        <div className="relative">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsOpen(true);
                }}
                className={`p-2 text-slate-400 hover:text-slate-600 transition-colors ${className}`}
                title="공유하기"
                type="button"
            >
                <Share className={iconClass} />
            </button>

            <ShareToast
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                url={currentUrl}
                title={title}
            />
        </div>
    );
}

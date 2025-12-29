'use client';

import Link from 'next/link';
import Image from 'next/image';

/**
 * Animated Advertisement Banner Component
 * For homepage right sidebar
 */

interface AdBannerProps {
    variant: 'polytechnic' | 'hitech';
}

export default function AdBanner({ variant }: AdBannerProps) {
    const handlePolytechnicClick = () => {
        // Image ratio: 2752x1536 = 1.79:1, menu bar ~56px
        const imageRatio = 2752 / 1536;
        const menuBarHeight = 56;

        // Calculate popup size based on screen size (max 90% of screen)
        const maxWidth = Math.min(1100, window.screen.width * 0.9);
        const imageHeight = maxWidth / imageRatio;
        const popupWidth = Math.round(maxWidth);
        const popupHeight = Math.round(imageHeight + menuBarHeight);

        const left = (window.screen.width - popupWidth) / 2;
        const top = (window.screen.height - popupHeight) / 2;

        window.open(
            '/popup/polytechnic',
            'polytechnicPopup',
            `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
        );
    };

    if (variant === 'polytechnic') {
        return (
            <button
                onClick={handlePolytechnicClick}
                className="group relative flex h-full w-full rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] cursor-pointer"
            >
                {/* Background Image */}
                <Image
                    src="/images/ads/naju01.png"
                    alt="2026 Korea Polytechnic Admission"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 400px"
                />

                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-10" />

                {/* Subtle overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </button>
        );
    }

    // Hi-Tech Course variant
    return (
        <Link
            href="/files/hitech-course.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col h-full bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]"
        >
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-300 rounded-full blur-2xl animate-float" />
            </div>

            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-between h-full p-4">
                {/* Top: Badge */}
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-bold">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        PDF
                    </span>
                    <span className="text-white/60 text-xs">AD</span>
                </div>

                {/* Middle: Main text */}
                <div className="flex-1 flex flex-col justify-center py-2">
                    <div className="text-white/80 text-xs font-medium mb-1 tracking-wide">
                        HI-TECH PROGRAM
                    </div>
                    <h3 className="text-white text-xl font-bold leading-tight mb-1">
                        Course Guide
                    </h3>
                    <p className="text-emerald-100 text-sm font-medium">
                        Future Tech Talent
                    </p>
                </div>

                {/* Bottom: CTA */}
                <div className="flex items-center justify-between">
                    <span className="text-white/90 text-sm font-semibold group-hover:text-white transition-colors">
                        View PDF
                    </span>
                    <span className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full group-hover:bg-white/30 transition-all group-hover:translate-x-1">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </span>
                </div>
            </div>

            {/* Decorative gear icon */}
            <div className="absolute -bottom-6 -right-6 w-24 h-24 text-white/5">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z" />
                </svg>
            </div>
        </Link>
    );
}

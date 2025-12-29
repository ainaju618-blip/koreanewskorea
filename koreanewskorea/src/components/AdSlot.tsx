/**
 * AdSlot Component
 * ================
 * Reusable ad slot placeholder for future monetization
 *
 * Usage:
 *   <AdSlot id="sidebar-top" size="300x250" />
 *   <AdSlot id="header-right" width={120} height={40} />
 *
 * Slot IDs (standardized):
 *   - header-right: 120x40 (desktop only)
 *   - mobile-menu: 280x100 (mobile drawer)
 *   - sidebar-top: 300x250 (sidebar first)
 *   - sidebar-bottom: 300x250 (sidebar second)
 *   - content-inline: 728x90 (between articles)
 *   - footer-banner: 970x90 (footer area)
 *
 * TODO: Integrate with ad network or site_settings DB
 */

interface AdSlotProps {
    id: string;
    width?: number;
    height?: number;
    size?: '300x250' | '728x90' | '970x90' | '120x40' | '280x100';
    className?: string;
    label?: string;
}

// Predefined sizes
const SIZES: Record<string, { width: number; height: number }> = {
    '300x250': { width: 300, height: 250 },
    '728x90': { width: 728, height: 90 },
    '970x90': { width: 970, height: 90 },
    '120x40': { width: 120, height: 40 },
    '280x100': { width: 280, height: 100 },
};

export default function AdSlot({
    id,
    width,
    height,
    size,
    className = '',
    label = '광고',
}: AdSlotProps) {
    // Determine dimensions
    const dimensions = size ? SIZES[size] : { width: width || 300, height: height || 250 };

    return (
        <div
            id={`ad-slot-${id}`}
            data-ad-slot={id}
            className={`bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/50 rounded-xl flex flex-col items-center justify-center text-slate-400 shadow-inner ${className}`}
            style={{
                width: dimensions.width,
                height: dimensions.height,
                maxWidth: '100%',
            }}
        >
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2">
                <span className="text-sm font-bold text-slate-300">AD</span>
            </div>
            <span className="text-xs font-medium">{label}</span>
            <span className="text-[10px] text-slate-300 mt-1">010-2631-3865</span>
        </div>
    );
}

// Inline Ad (between content sections)
export function InlineAd({ className = '' }: { className?: string }) {
    return (
        <div className={`w-full py-6 ${className}`}>
            <div className="max-w-[728px] mx-auto">
                <AdSlot id="content-inline" size="728x90" label="광고 문의" />
            </div>
        </div>
    );
}

// Sidebar Ad Stack
export function SidebarAds() {
    return (
        <div className="space-y-4">
            <AdSlot id="sidebar-top" size="300x250" label="광고 영역" />
            <AdSlot id="sidebar-bottom" size="300x250" label="광고 영역" />
        </div>
    );
}

/**
 * Regional Header Component
 * Brand: "코리아뉴스 {지역명}"
 */

import { RegionConfig } from '@/common/lib/regions';

interface RegionalHeaderProps {
    region: RegionConfig;
}

export default function RegionalHeader({ region }: RegionalHeaderProps) {
    return (
        <header
            style={{
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                padding: '1rem 0',
                position: 'sticky',
                top: 0,
                zIndex: 100,
            }}
        >
            <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Brand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                        코리아뉴스 <span style={{ color: 'var(--color-accent)' }}>{region.nameKo}</span>
                    </h1>
                </div>

                {/* Navigation */}
                <nav style={{ display: 'flex', gap: '1.5rem' }}>
                    <a href="/" style={{ color: 'white', fontSize: '0.875rem' }}>홈</a>
                    <a href="#local" style={{ color: 'white', fontSize: '0.875rem' }}>지역뉴스</a>
                    <a href="#nearby" style={{ color: 'white', fontSize: '0.875rem' }}>주변소식</a>
                </nav>
            </div>
        </header>
    );
}

/**
 * Footer Component
 * Common footer for all regional pages
 */

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer
            style={{
                backgroundColor: 'var(--color-primary-dark)',
                color: 'white',
                padding: '2rem 0',
                marginTop: '3rem',
            }}
        >
            <div className="container">
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1rem',
                    }}
                >
                    {/* Brand */}
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                            코리아NEWS
                        </h2>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                            전남/광주 지역 뉴스 플랫폼
                        </p>
                    </div>

                    {/* Links */}
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <a href="https://koreanewsone.com" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                            메인 사이트
                        </a>
                        <a href="/about" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                            소개
                        </a>
                        <a href="/contact" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                            문의
                        </a>
                    </div>
                </div>

                {/* Copyright */}
                <div
                    style={{
                        marginTop: '1.5rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)',
                    }}
                >
                    &copy; {currentYear} Korea NEWS. All rights reserved.
                </div>
            </div>
        </footer>
    );
}

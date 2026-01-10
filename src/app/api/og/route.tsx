import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || '나주뉴스';
    const type = searchParams.get('type') || 'naju';

    // 나주 배경 이미지 URL (배밭 + 영산강)
    const backgroundUrl = type === 'naju'
        ? 'https://koreanewskorea.com/images/hero/main-hero-naju.png'
        : null;

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    fontFamily: 'sans-serif',
                }}
            >
                {/* 배경 이미지 */}
                {backgroundUrl && (
                    <img
                        src={backgroundUrl}
                        alt=""
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />
                )}

                {/* 그라데이션 오버레이 */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: backgroundUrl
                            ? 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)'
                            : '#0a192f',
                    }}
                />

                {/* 콘텐츠 */}
                <div
                    style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        textAlign: 'center',
                        padding: '40px',
                    }}
                >
                    {/* 로고 */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: 30,
                        gap: 16,
                    }}>
                        <div style={{
                            fontSize: 72,
                            fontWeight: 900,
                            color: '#ffffff',
                            textShadow: '2px 2px 8px rgba(0,0,0,0.5)',
                        }}>
                            ㅋ
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'baseline',
                        }}>
                            <span style={{
                                fontSize: 56,
                                fontWeight: 800,
                                color: '#ffffff',
                                textShadow: '2px 2px 8px rgba(0,0,0,0.5)',
                            }}>
                                코리아
                            </span>
                            <span style={{
                                fontSize: 56,
                                fontWeight: 800,
                                color: '#3b82f6',
                                textShadow: '2px 2px 8px rgba(0,0,0,0.5)',
                            }}>
                                NEWS
                            </span>
                        </div>
                    </div>

                    {/* 제목 */}
                    <div style={{
                        fontSize: 42,
                        fontWeight: 700,
                        maxWidth: 900,
                        lineHeight: 1.3,
                        textShadow: '2px 2px 8px rgba(0,0,0,0.7)',
                        marginBottom: 20,
                    }}>
                        {title}
                    </div>

                    {/* 서브타이틀 */}
                    <div style={{
                        fontSize: 24,
                        color: '#22d3ee',
                        textShadow: '1px 1px 4px rgba(0,0,0,0.5)',
                        fontWeight: 600,
                    }}>
                        천년의 역사, 영산강의 고장
                    </div>
                </div>
            </div>
        ),
        { width: 1200, height: 630 }
    );
}

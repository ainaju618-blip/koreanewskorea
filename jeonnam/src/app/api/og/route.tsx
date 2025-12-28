import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || '코리아NEWS';

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
                    backgroundColor: '#0a192f',
                    color: 'white',
                    fontFamily: 'sans-serif',
                }}
            >
                <div style={{ fontSize: 60, fontWeight: 'bold', marginBottom: 20 }}>
                    코리아NEWS
                </div>
                <div style={{ fontSize: 30, textAlign: 'center', maxWidth: 800, padding: '0 40px' }}>
                    {title}
                </div>
                <div style={{ fontSize: 20, marginTop: 30, color: '#64ffda' }}>
                    광주·전남 지역 뉴스
                </div>
            </div>
        ),
        { width: 1200, height: 630 }
    );
}

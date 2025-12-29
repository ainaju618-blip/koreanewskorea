import { NextResponse } from 'next/server';

// Cloudinary API
async function getCloudinaryUsage() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  try {
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/usage`, {
      headers: { 'Authorization': `Basic ${auth}` },
      next: { revalidate: 300 } // 5분 캐시
    });

    if (!res.ok) return null;

    const data = await res.json();
    return {
      storage: {
        used: data.storage?.usage || 0,
        limit: 25 * 1024 * 1024 * 1024, // 25GB
      },
      bandwidth: {
        used: data.bandwidth?.usage || 0,
        limit: 25 * 1024 * 1024 * 1024, // 25GB/월
      },
      credits: {
        used: data.credits?.usage || 0,
        limit: 25, // 25 크레딧
      }
    };
  } catch {
    return null;
  }
}

// Supabase는 API로 직접 용량 조회 불가 - 대략적인 추정만 가능
async function getSupabaseUsage() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  try {
    // 각 테이블의 행 수 조회
    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'count=exact'
    };

    const [posts, logs, sources] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/posts?select=id`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/bot_logs?select=id`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/sources?select=id`, { headers })
    ]);

    const postsCount = parseInt(posts.headers.get('content-range')?.split('/')[1] || '0');
    const logsCount = parseInt(logs.headers.get('content-range')?.split('/')[1] || '0');
    const sourcesCount = parseInt(sources.headers.get('content-range')?.split('/')[1] || '0');

    // 대략적인 용량 추정 (행당 평균 크기)
    // posts: 약 5KB/행, logs: 약 1KB/행, sources: 약 0.5KB/행
    const estimatedMB = (postsCount * 5 + logsCount * 1 + sourcesCount * 0.5) / 1024;

    return {
      database: {
        used: estimatedMB * 1024 * 1024, // bytes
        limit: 500 * 1024 * 1024, // 500MB
        rows: { posts: postsCount, logs: logsCount, sources: sourcesCount }
      }
    };
  } catch {
    return null;
  }
}

// Vercel 사용량 (API로 직접 조회 어려움 - 고정값 표시)
function getVercelUsage() {
  return {
    bandwidth: {
      limit: 100 * 1024 * 1024 * 1024, // 100GB/월
      note: 'Vercel 대시보드에서 확인'
    },
    functions: {
      limit: 100 * 1000, // 100K 실행/일
      note: 'Vercel 대시보드에서 확인'
    }
  };
}

export async function GET() {
  try {
    const [cloudinary, supabase] = await Promise.all([
      getCloudinaryUsage(),
      getSupabaseUsage()
    ]);

    return NextResponse.json({
      cloudinary,
      supabase,
      vercel: getVercelUsage(),
      github: {
        storage: {
          limit: 500 * 1024 * 1024, // 500MB (무료 LFS)
          note: 'GitHub에서 확인'
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 });
  }
}

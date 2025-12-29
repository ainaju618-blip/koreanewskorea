import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Region configurations
const REGIONS = [
  { id: 'gwangju', name: 'Gwangju', nameKo: '광주' },
  { id: 'jeonnam', name: 'Jeonnam', nameKo: '전남' },
  { id: 'mokpo', name: 'Mokpo', nameKo: '목포' },
  { id: 'yeosu', name: 'Yeosu', nameKo: '여수' },
  { id: 'suncheon', name: 'Suncheon', nameKo: '순천' },
  { id: 'naju', name: 'Naju', nameKo: '나주' },
  { id: 'gwangyang', name: 'Gwangyang', nameKo: '광양' },
  { id: 'damyang', name: 'Damyang', nameKo: '담양' },
  { id: 'gokseong', name: 'Gokseong', nameKo: '곡성' },
  { id: 'gurye', name: 'Gurye', nameKo: '구례' },
  { id: 'goheung', name: 'Goheung', nameKo: '고흥' },
  { id: 'boseong', name: 'Boseong', nameKo: '보성' },
  { id: 'hwasun', name: 'Hwasun', nameKo: '화순' },
  { id: 'jangheung', name: 'Jangheung', nameKo: '장흥' },
  { id: 'gangjin', name: 'Gangjin', nameKo: '강진' },
  { id: 'haenam', name: 'Haenam', nameKo: '해남' },
  { id: 'yeongam', name: 'Yeongam', nameKo: '영암' },
  { id: 'muan', name: 'Muan', nameKo: '무안' },
  { id: 'hampyeong', name: 'Hampyeong', nameKo: '함평' },
  { id: 'yeonggwang', name: 'Yeonggwang', nameKo: '영광' },
  { id: 'jangseong', name: 'Jangseong', nameKo: '장성' },
  { id: 'wando', name: 'Wando', nameKo: '완도' },
  { id: 'jindo', name: 'Jindo', nameKo: '진도' },
  { id: 'shinan', name: 'Shinan', nameKo: '신안' },
  { id: 'gwangju_edu', name: 'Gwangju Education', nameKo: '광주교육청' },
  { id: 'jeonnam_edu', name: 'Jeonnam Education', nameKo: '전남교육청' },
];

export async function GET() {
  return NextResponse.json({ regions: REGIONS });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { regions } = body as { regions: string[] };

    if (!regions || !Array.isArray(regions) || regions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No regions specified' },
        { status: 400 }
      );
    }

    // Validate regions
    const validRegions = regions.filter(r => REGIONS.some(reg => reg.id === r));
    if (validRegions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid regions specified' },
        { status: 400 }
      );
    }

    const results: Array<{ region: string; success: boolean; message: string }> = [];
    const scraperBasePath = path.resolve(process.cwd(), '..', 'scrapers');

    for (const region of validRegions) {
      try {
        const scraperPath = path.join(scraperBasePath, region, `${region}_scraper.py`);

        const { stdout, stderr } = await execAsync(
          `python "${scraperPath}"`,
          {
            timeout: 120000,
            cwd: scraperBasePath
          }
        );

        results.push({
          region,
          success: true,
          message: stdout || 'Completed'
        });
      } catch (error) {
        const err = error as Error & { stderr?: string };
        results.push({
          region,
          success: false,
          message: err.stderr || err.message || 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      processed: successCount,
      total: validRegions.length,
      results
    });

  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

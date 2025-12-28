import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/bot/scraper-status
 * 각 지역 스크래퍼 폴더의 파일 개수를 조회하여 활성 상태 반환
 * 
 * 활성 기준: 폴더 내 파일 3개 이상 (스크래퍼 + ALGORITHM.md + README.md 등)
 * __pycache__ 폴더는 제외
 */
export async function GET(req: NextRequest) {
    try {
        const scrapersDir = path.join(process.cwd(), 'scrapers');

        // 모든 지역 폴더 목록
        const regionFolders = [
            'boseong', 'damyang', 'gangjin', 'goheung', 'gokseong', 'gurye',
            'gwangju', 'gwangju_edu', 'gwangyang', 'hadong', 'haenam', 'hampyeong',
            'hwasun', 'jangheung', 'jangseong', 'jeonnam', 'jeonnam_edu', 'jindo',
            'mokpo', 'muan', 'naju', 'shinan', 'suncheon', 'wando', 'yeongam',
            'yeonggwang', 'yeosu'
        ];

        const scraperStatus: Record<string, { fileCount: number; active: boolean; files: string[] }> = {};
        const MIN_FILES_FOR_ACTIVE = 3; // 활성 상태 기준 파일 개수

        for (const region of regionFolders) {
            const regionPath = path.join(scrapersDir, region);

            try {
                if (fs.existsSync(regionPath) && fs.statSync(regionPath).isDirectory()) {
                    // 폴더 내 파일/폴더 목록 (단, __pycache__ 제외)
                    const items = fs.readdirSync(regionPath).filter(item => {
                        // __pycache__ 폴더 제외
                        if (item === '__pycache__') return false;

                        const itemPath = path.join(regionPath, item);
                        // 파일만 카운트 (하위 폴더 제외)
                        return fs.statSync(itemPath).isFile();
                    });

                    scraperStatus[region] = {
                        fileCount: items.length,
                        active: items.length >= MIN_FILES_FOR_ACTIVE,
                        files: items
                    };
                } else {
                    scraperStatus[region] = {
                        fileCount: 0,
                        active: false,
                        files: []
                    };
                }
            } catch (err) {
                scraperStatus[region] = {
                    fileCount: 0,
                    active: false,
                    files: []
                };
            }
        }

        // 활성 지역 목록
        const activeRegions = Object.entries(scraperStatus)
            .filter(([_, status]) => status.active)
            .map(([region]) => region);

        return NextResponse.json({
            scrapers: scraperStatus,
            activeRegions,
            minFilesRequired: MIN_FILES_FOR_ACTIVE,
            totalRegions: regionFolders.length,
            activeCount: activeRegions.length
        });

    } catch (error: any) {
        console.error('[Scraper Status API Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

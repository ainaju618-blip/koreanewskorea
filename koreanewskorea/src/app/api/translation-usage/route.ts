import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/translation-usage
 * Google Translation API 사용량 조회
 */
export async function GET() {
    try {
        // scrapers/configs/translation_usage.json 읽기
        const usageFilePath = path.join(process.cwd(), 'scrapers', 'configs', 'translation_usage.json');
        const keysFilePath = path.join(process.cwd(), 'scrapers', 'configs', 'translation_keys.json');

        // 기본 응답 (파일 없을 경우)
        const defaultResponse = {
            projects: [],
            total_used: 0,
            total_limit: 0,
            total_percent: 0,
            days_left: getDaysUntilReset()
        };

        // 키 설정 파일 읽기
        if (!fs.existsSync(keysFilePath)) {
            return NextResponse.json(defaultResponse);
        }

        const keysData = JSON.parse(fs.readFileSync(keysFilePath, 'utf-8'));
        const projects = keysData.projects || [];

        // 사용량 파일 읽기
        let usageData: Record<string, number> = {};
        if (fs.existsSync(usageFilePath)) {
            const usage = JSON.parse(fs.readFileSync(usageFilePath, 'utf-8'));

            // 월이 바뀌었으면 리셋
            const currentMonth = new Date().toISOString().substring(0, 7);
            if (usage.month === currentMonth) {
                usageData = usage.usage || {};
            }
        }

        // 프로젝트별 통계 생성
        let totalUsed = 0;
        let totalLimit = 0;
        let activeIndex = 0;

        const projectStats = projects.map((proj: any, index: number) => {
            const used = usageData[proj.name] || 0;
            const limit = proj.limit || 500000;
            const percent = (used / limit) * 100;

            totalUsed += used;
            totalLimit += limit;

            // 첫 번째로 한도 안 찬 프로젝트가 활성
            if (used < limit * 0.95 && activeIndex === 0) {
                activeIndex = index;
            }

            return {
                name: proj.name,
                used,
                limit,
                percent,
                is_active: false // 아래에서 설정
            };
        });

        // 활성 프로젝트 표시
        if (projectStats.length > 0) {
            projectStats[activeIndex].is_active = true;
        }

        return NextResponse.json({
            projects: projectStats,
            total_used: totalUsed,
            total_limit: totalLimit,
            total_percent: totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0,
            days_left: getDaysUntilReset()
        });

    } catch (error) {
        console.error('Translation usage API error:', error);
        return NextResponse.json({
            projects: [],
            total_used: 0,
            total_limit: 0,
            total_percent: 0,
            days_left: getDaysUntilReset(),
            error: 'Failed to load usage data'
        });
    }
}

/**
 * 월 리셋까지 남은 일수 계산
 */
function getDaysUntilReset(): number {
    const now = new Date();
    let nextMonth: Date;

    if (now.getMonth() === 11) {
        nextMonth = new Date(now.getFullYear() + 1, 0, 1);
    } else {
        nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    const diffTime = nextMonth.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

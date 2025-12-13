import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase Admin Client (Service Role)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
    try {
        // 1. Basic Auth Check (Simple API Key)
        const authHeader = request.headers.get('Authorization');
        if (authHeader !== `Bearer ${process.env.BOT_API_KEY}`) {
            if (process.env.BOT_API_KEY) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const body = await request.json();
        const { title, content, original_link, source, published_at, category, thumbnail_url, ai_summary, category_slug, region } = body;

        // 2. Validation
        if (!title || !original_link) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 3. Avoid Duplicates - 기존 기사가 있으면 thumbnail_url만 업데이트
        // 단, trash 상태 기사는 제외 (삭제 후 재수집 가능하도록)
        const { data: existing } = await supabaseAdmin
            .from('posts')
            .select('id, thumbnail_url')
            .eq('original_link', original_link)
            .neq('status', 'trash')  // 휴지통 제외
            .single();

        if (existing) {
            // 기존 기사에 thumbnail_url이 없고, 새 요청에 thumbnail_url이 있으면 업데이트
            if (!existing.thumbnail_url && thumbnail_url) {
                await supabaseAdmin
                    .from('posts')
                    .update({ thumbnail_url })
                    .eq('id', existing.id);
                return NextResponse.json({
                    message: 'Thumbnail updated',
                    id: existing.id,
                    thumbnail_url
                }, { status: 200 });
            }
            return NextResponse.json({ message: 'Already exists', id: existing.id, status: 'exists' }, { status: 200 });
        }

        // 3-1. 추가 중복 방지: title + published_at(날짜만) 조합 체크
        if (published_at) {
            const publishedDate = published_at.split('T')[0]; // YYYY-MM-DD만 추출
            const { data: duplicateByTitleDate } = await supabaseAdmin
                .from('posts')
                .select('id')
                .eq('title', title)
                .neq('status', 'trash')  // 휴지통 제외
                .gte('published_at', `${publishedDate}T00:00:00`)
                .lt('published_at', `${publishedDate}T23:59:59`)
                .single();

            if (duplicateByTitleDate) {
                return NextResponse.json({
                    message: 'Duplicate by title+date',
                    id: duplicateByTitleDate.id,
                    status: 'exists'
                }, { status: 200 });
            }
        }

        // 4. category_slug → category_id 변환 (CMS v2.0)
        let category_id = null;
        const categorySlug = category_slug || category; // 우선순위: category_slug > category

        if (categorySlug) {
            const { data: categoryData } = await supabaseAdmin
                .from('categories')
                .select('id')
                .eq('slug', categorySlug.toLowerCase())
                .single();

            if (categoryData) {
                category_id = categoryData.id;
            } else {
                // slug로 못 찾으면 name으로 시도
                const { data: categoryByName } = await supabaseAdmin
                    .from('categories')
                    .select('id')
                    .eq('name', categorySlug)
                    .single();

                if (categoryByName) {
                    category_id = categoryByName.id;
                }
            }
        }

        // 5. source → region 자동 매핑
        const SOURCE_TO_REGION: Record<string, string> = {
            '나주시': 'naju',
            '목포시': 'mokpo',
            '여수시': 'yeosu',
            '순천시': 'suncheon',
            '광양시': 'gwangyang',
            '담양군': 'damyang',
            '곡성군': 'gokseong',
            '구례군': 'gurye',
            '고흥군': 'goheung',
            '보성군': 'boseong',
            '화순군': 'hwasun',
            '장흥군': 'jangheung',
            '강진군': 'gangjin',
            '해남군': 'haenam',
            '영암군': 'yeongam',
            '무안군': 'muan',
            '함평군': 'hampyeong',
            '영광군': 'yeonggwang',
            '장성군': 'jangseong',
            '완도군': 'wando',
            '진도군': 'jindo',
            '신안군': 'shinan',
            '광주광역시': 'gwangju',
            '광주시': 'gwangju',
            '전라남도': 'jeonnam',
            '광주광역시교육청': 'gwangju_edu',
            '전라남도교육청': 'jeonnam_edu',
        };

        // region이 없으면 source에서 자동 매핑
        let finalRegion = region;
        if (!finalRegion && source) {
            finalRegion = SOURCE_TO_REGION[source] || null;
        }

        // 수집된 기사 상태 결정:
        // - 모든 수집 기사 → 'pending' (승인대기)
        // - 관리자 승인 후 → 'published' (발행)
        // - 이미지/본문 품질에 따라 quality_score 저장 (추후 필터링용)
        const hasTitle = title && title.trim().length > 0;
        const hasContent = content && content.trim().length > 50;
        const hasImage = thumbnail_url && thumbnail_url.trim().length > 0;

        // 품질 점수 계산 (관리자 승인 시 참고용)
        let qualityScore = 0;
        if (hasTitle) qualityScore += 1;
        if (hasContent) qualityScore += 1;
        if (hasImage) qualityScore += 1;

        // ★ 핵심 변경: 모든 수집 기사는 'draft' 상태로 저장
        // 관리자가 승인해야 'published'로 변경됨
        // (DB 제약조건: draft | review | published | rejected | archived | trash)
        const articleStatus = 'draft';

        // 5. Insert
        const { data, error } = await supabaseAdmin
            .from('posts')
            .insert({
                title,
                content: content || '',
                original_link,
                source: source || 'Bot',
                category: category || '뉴스', // 기존 TEXT 필드 (하위 호환)
                category_id, // 새 FK 필드 (CMS v2.0)
                region: finalRegion, // 지역 필터링용 코드 (source에서 자동 매핑)
                published_at: published_at || new Date().toISOString(),
                thumbnail_url,
                ai_summary: ai_summary || '',
                status: articleStatus, // 조건에 따른 상태
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase Insert Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            id: data.id,
            category_id: category_id || null,
            message: category_id ? '카테고리 연동 완료' : '카테고리 미발견 (TEXT 필드만 저장)'
        }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

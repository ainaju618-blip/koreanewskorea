import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
// NOTE: autoAssignReporter is now called in PATCH /api/posts/[id] on approval

// Initialize Supabase Admin Client (Service Role)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// ============================================================
// 기사 검증 시스템 (Article Validation System)
// ============================================================

interface ValidationResult {
    isValid: boolean;
    status: 'published' | 'limited' | 'draft' | 'rejected';
    errors: string[];
    warnings: string[];
}

/**
 * 기사 검증 함수
 * - CRITICAL 체크 실패 → rejected (노출 불가)
 * - 이미지 없음 → limited (지역 게시판만 노출)
 * - 모두 통과 → draft (관리자 승인 대기)
 */
function validateArticle(article: {
    title?: string;
    content?: string;
    published_at?: string;
    source?: string;
    original_link?: string;
    thumbnail_url?: string;
    department?: string;
}): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // === CRITICAL 체크 (하나라도 실패 시 rejected) ===

    // 제목 검증
    if (!article.title || article.title.trim().length < 10) {
        errors.push('제목 없음 또는 10자 미만');
    } else {
        // 무의미한 제목 체크
        const invalidTitles = ['제목없음', '제목 없음', '...', 'untitled', 'no title', '무제'];
        if (invalidTitles.some(t => article.title?.toLowerCase().includes(t.toLowerCase()))) {
            errors.push('무의미한 제목');
        }
    }

    // 본문 검증
    if (!article.content) {
        errors.push('본문 없음');
    } else {
        // HTML 태그 제거 후 길이 체크
        const textContent = article.content.replace(/<[^>]*>/g, '').trim();
        if (textContent.length < 100) {
            errors.push('본문 100자 미만');
        }
        // 본문이 제목과 동일한 경우
        if (article.title && textContent === article.title.trim()) {
            errors.push('본문이 제목과 동일');
        }
    }

    // 날짜 검증
    if (!article.published_at) {
        errors.push('날짜 없음');
    } else {
        const dateRegex = /^\d{4}-\d{2}-\d{2}/;
        if (!dateRegex.test(article.published_at)) {
            errors.push('날짜 형식 오류');
        } else {
            // 미래 날짜 체크 (내일까지는 허용)
            const articleDate = new Date(article.published_at);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            if (articleDate > tomorrow) {
                errors.push('미래 날짜');
            }
        }
    }

    // 출처 검증
    if (!article.source || article.source.trim() === '') {
        errors.push('출처(지역) 없음');
    }

    // 원본 URL 검증
    if (!article.original_link || !article.original_link.startsWith('http')) {
        errors.push('원본 URL 오류');
    }

    // 인코딩 오류 체크 (깨진 문자)
    const brokenChars = /[�]/;
    if ((article.title && brokenChars.test(article.title)) ||
        (article.content && brokenChars.test(article.content))) {
        errors.push('인코딩 오류 감지');
    }

    // === WARNING 체크 (limited 처리) ===

    // 이미지 검증 - 공공누리 이미지 패턴 제외
    const invalidImagePatterns = [
        'opentype', 'kor_type', 'type0', 'type1', 'type2', 'type3', 'type4',
        'copyright', 'license', 'footer', 'banner', 'logo'
    ];
    const thumbnailUrl = article.thumbnail_url?.toLowerCase() || '';
    const isInvalidImage = invalidImagePatterns.some(pattern => thumbnailUrl.includes(pattern));

    if (!article.thumbnail_url || article.thumbnail_url.trim() === '' || isInvalidImage) {
        warnings.push('썸네일 이미지 없음');
        // 공공누리 등 무효 이미지인 경우 명시적으로 삭제
        if (isInvalidImage) {
            article.thumbnail_url = undefined;
            warnings.push('공공누리/비콘텐츠 이미지 제외됨');
        }
    }

    // 담당부서 검증 (경고만)
    if (!article.department) {
        warnings.push('담당부서 없음');
    }

    // === 최종 상태 결정 ===
    // DB 체크 제약조건(posts_status_check)과 호환되는 값만 사용
    // published, draft, hidden, trash만 허용됨
    let status: ValidationResult['status'];

    if (errors.length > 0) {
        status = 'rejected'; // API 응답용 (실제 DB에는 'hidden'으로 저장)
    } else if (warnings.includes('썸네일 이미지 없음')) {
        status = 'limited'; // API 응답용 (실제 DB에는 'draft'로 저장)
    } else {
        status = 'draft'; // 관리자 승인 대기
    }

    return {
        isValid: errors.length === 0,
        status,
        errors,
        warnings
    };
}
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
        // trash, rejected 상태 기사는 제외 (삭제/반려 후 재수집 가능하도록)
        // NOTE: .maybeSingle() 사용 - 중복이 이미 있어도 에러 안 남
        const { data: existingList } = await supabaseAdmin
            .from('posts')
            .select('id, thumbnail_url')
            .eq('original_link', original_link)
            .not('status', 'in', '("trash","rejected")')
            .limit(1);

        const existing = existingList?.[0];

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
            const { data: duplicateList } = await supabaseAdmin
                .from('posts')
                .select('id')
                .eq('title', title)
                .not('status', 'in', '("trash","rejected")')
                .gte('published_at', `${publishedDate}T00:00:00`)
                .lte('published_at', `${publishedDate}T23:59:59.999`)
                .limit(1);

            const duplicateByTitleDate = duplicateList?.[0];

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
            const { data: categoryList } = await supabaseAdmin
                .from('categories')
                .select('id')
                .eq('slug', categorySlug.toLowerCase())
                .limit(1);

            if (categoryList?.[0]) {
                category_id = categoryList[0].id;
            } else {
                // slug로 못 찾으면 name으로 시도
                const { data: categoryByNameList } = await supabaseAdmin
                    .from('categories')
                    .select('id')
                    .eq('name', categorySlug)
                    .limit(1);

                if (categoryByNameList?.[0]) {
                    category_id = categoryByNameList[0].id;
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
            '신안군': 'sinan',
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

        // NOTE: Reporter auto-assignment is handled in PATCH /api/posts/[id]
        // when article status changes to 'published' (approval time)
        // This allows draft articles to remain unassigned until approved

        // ============================================================
        // 기사 검증 실행 (Article Validation)
        // ============================================================
        const validation = validateArticle({
            title,
            content,
            published_at,
            source,
            original_link,
            thumbnail_url,
        });

        // 검증 결과 로깅
        if (validation.status === 'rejected') {
            console.warn(`[REJECTED] ${title?.substring(0, 30)}...`, validation.errors);
        } else if (validation.status === 'limited') {
            console.info(`[LIMITED] ${title?.substring(0, 30)}...`, validation.warnings);
        }

        // 5. Insert (검증 결과 포함)
        // DB 체크 제약조건 호환: draft, review, published, rejected, archived, trash
        // rejected와 limited는 DB 허용 값으로 매핑
        const dbStatus = validation.status === 'rejected' ? 'rejected'
            : validation.status === 'limited' ? 'draft'
                : validation.status;

        const { data, error } = await supabaseAdmin
            .from('posts')
            .insert({
                title,
                content: content || '',
                original_link,
                source: source || 'Bot',
                category: category || '뉴스', // Legacy TEXT field
                category_id, // New FK field (CMS v2.0)
                region: finalRegion, // Region code for filtering
                published_at: published_at || new Date().toISOString(),
                thumbnail_url,
                ai_summary: ai_summary || '',
                status: dbStatus, // DB compatible status
                // author_id/author_name: assigned on approval (PATCH)
            })
            .select()
            .single();

        if (error) {
            // Race condition 처리: 유니크 제약조건 위반 시 중복으로 처리
            if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
                console.info(`[DUPLICATE] Race condition caught for: ${title?.substring(0, 30)}...`);
                // 이미 존재하는 기사 찾기
                const { data: raceExisting } = await supabaseAdmin
                    .from('posts')
                    .select('id')
                    .eq('original_link', original_link)
                    .neq('status', 'trash')
                    .limit(1);

                return NextResponse.json({
                    message: 'Already exists (race condition)',
                    id: raceExisting?.[0]?.id || null,
                    status: 'exists'
                }, { status: 200 });
            }

            console.error('Supabase Insert Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            id: data.id,
            status: validation.status,
            validation: {
                isValid: validation.isValid,
                errors: validation.errors,
                warnings: validation.warnings,
            },
            category_id: category_id || null,
            message: validation.status === 'rejected'
                ? '검증 실패: ' + validation.errors.join(', ')
                : category_id ? '카테고리 연동 완료' : '저장 완료'
        }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

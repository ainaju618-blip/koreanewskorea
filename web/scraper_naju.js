/**
 * 나주시 보도자료 스크래퍼
 * 보도자료 목록 및 상세 내용 수집
 */

const fs = require('fs');

const BASE_URL = 'https://www.naju.go.kr';
const LIST_URL = `${BASE_URL}/www/administration/reporting/coverage`;

// 목록 페이지에서 보도자료 추출
async function fetchPressReleaseList(page = 1) {
    const url = page === 1 ? LIST_URL : `${LIST_URL}?page=${page}`;

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html',
            'Accept-Language': 'ko-KR,ko;q=0.9',
        },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();
    const items = [];

    // 테이블 행에서 보도자료 추출
    // 패턴: /www/administration/reporting/coverage?idx=591764&amp;mode=view
    const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const rows = html.match(rowPattern) || [];

    for (const row of rows) {
        // 링크 추출
        const linkMatch = row.match(/href=["']([^"']*coverage\?idx=(\d+)[^"']*)["']/i);
        if (!linkMatch) continue;

        const detailPath = linkMatch[1].replace(/&amp;/g, '&');
        const idx = linkMatch[2];

        // 제목 추출
        const titleMatch = row.match(/<a[^>]*>([^<]+(?:<[^>]+>[^<]*)*)<\/a>/i);
        const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

        // 날짜 추출
        const dateMatch = row.match(/(\d{4}-\d{2}-\d{2})/);
        const date = dateMatch ? dateMatch[1] : '';

        // 조회수 추출
        const viewMatch = row.match(/<td[^>]*class=["']web_only["'][^>]*>(\d+)<\/td>/i);
        const views = viewMatch ? parseInt(viewMatch[1]) : 0;

        if (title && idx) {
            items.push({
                idx,
                title,
                date,
                views,
                detailUrl: `${BASE_URL}${detailPath}`,
            });
        }
    }

    return items;
}

// 상세 페이지에서 본문 추출
async function fetchPressReleaseDetail(url) {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html',
            'Accept-Language': 'ko-KR,ko;q=0.9',
        },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();

    // 본문 영역 추출 (다양한 패턴 시도)
    let content = '';

    // 패턴 1: view_content, view-content, board-content 등
    const contentPatterns = [
        /<div[^>]*class=["'][^"']*(?:view[_-]?content|board[_-]?content|article[_-]?content|detail[_-]?content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class=["'][^"']*(?:contents|cont)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
        /<td[^>]*class=["'][^"']*(?:view[_-]?content)[^"']*["'][^>]*>([\s\S]*?)<\/td>/i,
    ];

    for (const pattern of contentPatterns) {
        const match = html.match(pattern);
        if (match && match[1].length > 100) {
            content = match[1];
            break;
        }
    }

    // 패턴이 안 맞으면 큰 div 영역 찾기
    if (!content) {
        const divMatch = html.match(/<div[^>]*>([\s\S]{500,}?)<\/div>/gi);
        if (divMatch) {
            // 가장 긴 div 선택
            content = divMatch.sort((a, b) => b.length - a.length)[0];
        }
    }

    // HTML 정리
    let plainText = content
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();

    // 이미지 추출
    const imageMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    const imageUrl = imageMatch ? imageMatch[1] : null;

    // 첨부파일 추출
    const attachments = [];
    const attachPattern = /<a[^>]*href=["']([^"']*(?:download|file|attach)[^"']*)["'][^>]*>([^<]+)/gi;
    let attachMatch;
    while ((attachMatch = attachPattern.exec(html)) !== null) {
        attachments.push({
            url: attachMatch[1],
            name: attachMatch[2].trim(),
        });
    }

    return {
        content: plainText.substring(0, 5000),
        contentLength: plainText.length,
        imageUrl,
        attachments,
    };
}

// 메인 실행
async function main() {
    console.log('🏛️ 나주시 보도자료 스크래핑 시작...\n');

    const results = [];
    results.push('# 나주시 보도자료 스크래핑 결과\n');
    results.push(`수집 시간: ${new Date().toLocaleString('ko-KR')}\n`);

    try {
        // 1. 목록 가져오기
        console.log('📋 보도자료 목록 수집 중...');
        const list = await fetchPressReleaseList(1);
        console.log(`   발견: ${list.length}개\n`);

        results.push(`## 보도자료 목록 (${list.length}개)\n`);

        // 2. 각 보도자료 상세 내용 가져오기 (최대 3개만 테스트)
        const testCount = Math.min(3, list.length);

        for (let i = 0; i < testCount; i++) {
            const item = list[i];
            console.log(`📰 [${i + 1}/${testCount}] ${item.title.substring(0, 30)}...`);

            results.push(`### ${i + 1}. ${item.title}`);
            results.push(`- 날짜: ${item.date}`);
            results.push(`- 조회수: ${item.views}`);
            results.push(`- URL: ${item.detailUrl}\n`);

            try {
                const detail = await fetchPressReleaseDetail(item.detailUrl);
                results.push(`- 본문 길이: **${detail.contentLength}자** ${detail.contentLength > 200 ? '✅' : '⚠️'}`);
                results.push(`- 이미지: ${detail.imageUrl ? '✅ 있음' : '❌ 없음'}`);
                results.push(`- 첨부파일: ${detail.attachments.length}개\n`);

                if (detail.contentLength > 50) {
                    results.push('**본문 미리보기:**');
                    results.push('```');
                    results.push(detail.content.substring(0, 300) + '...');
                    results.push('```\n');
                }

            } catch (err) {
                results.push(`❌ 상세 내용 수집 실패: ${err.message}\n`);
            }

            // 서버 부하 방지
            await new Promise(r => setTimeout(r, 500));
        }

        results.push('\n---\n');
        results.push('## ✅ 스크래핑 성공!');
        results.push('나주시 보도자료를 정상적으로 수집할 수 있습니다.');

    } catch (error) {
        results.push(`\n❌ 오류: ${error.message}`);
    }

    const output = results.join('\n');
    fs.writeFileSync('naju_scrape_result.md', output, 'utf8');
    console.log('\n' + output);
    console.log('\n📊 결과 저장: naju_scrape_result.md');
}

main().catch(console.error);

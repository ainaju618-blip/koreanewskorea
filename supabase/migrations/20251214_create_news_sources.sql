-- =============================================
-- news_sources 테이블 생성
-- 수집 대상 기관 정보 관리
-- 최종수정: 2025-12-14
-- =============================================

CREATE TABLE IF NOT EXISTS news_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 기본 정보
    name VARCHAR(100) NOT NULL,              -- 기관명 (나주시)
    code VARCHAR(50) NOT NULL UNIQUE,        -- 영문 코드 (naju) - 스크래퍼 폴더명
    region VARCHAR(20) NOT NULL DEFAULT '전남',  -- 지역 (광주/전남)
    org_type VARCHAR(20) NOT NULL DEFAULT '군',  -- 기관 유형 (광역시/도/시/군/교육청)

    -- URL 정보
    homepage_url TEXT,                       -- 기관 홈페이지
    press_list_url TEXT,                     -- 보도자료 목록 페이지
    press_detail_pattern TEXT,               -- 상세 URL 패턴

    -- 연락처 정보
    main_phone VARCHAR(50),                  -- 대표 전화
    contact_dept VARCHAR(100),               -- 홍보 담당 부서
    contact_name VARCHAR(50),                -- 담당자명
    contact_phone VARCHAR(50),               -- 담당자 전화
    contact_email VARCHAR(100),              -- 담당자 이메일

    -- 개발 상태
    scraper_status VARCHAR(20) NOT NULL DEFAULT 'none',  -- completed/developing/planned/none
    tech_notes TEXT,                         -- 기술 메모 (특이사항)

    -- 메타
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_news_sources_code ON news_sources(code);
CREATE INDEX IF NOT EXISTS idx_news_sources_region ON news_sources(region);
CREATE INDEX IF NOT EXISTS idx_news_sources_scraper_status ON news_sources(scraper_status);

-- 초기 데이터 삽입 (27개 기관) - 스크래퍼에서 추출한 실제 URL 정보 포함
INSERT INTO news_sources (name, code, region, org_type, homepage_url, press_list_url, scraper_status, tech_notes) VALUES

-- ===== 광역/도 (2) =====
('광주광역시', 'gwangju', '광주', '광역시',
 'https://www.gwangju.go.kr',
 'https://www.gwangju.go.kr/boardList.do?boardId=BD_0000000027&pageId=www789',
 'completed', '핫링크 방지 대응 필요, 표준 구조'),

('전라남도', 'jeonnam', '전남', '도',
 'https://www.jeonnam.go.kr',
 'https://www.jeonnam.go.kr/M7116/boardList.do?menuId=jeonnam0202000000',
 'completed', 'HWP iframe, 첨부파일 이미지 처리'),

-- ===== 시 (5) =====
('목포시', 'mokpo', '전남', '시',
 'https://www.mokpo.go.kr',
 'https://www.mokpo.go.kr/www/mokpo_news/press_release/report_material',
 'completed', 'URL 패턴: ?idx={ID}&mode=view, 카드형 레이아웃'),

('여수시', 'yeosu', '전남', '시',
 'https://www.yeosu.go.kr',
 'https://www.yeosu.go.kr/www/govt/news/release/press',
 'completed', 'URL 패턴: ?idx={ID}&mode=view, 로컬 이미지 저장'),

('순천시', 'suncheon', '전남', '시',
 'http://www.suncheon.go.kr',
 'http://www.suncheon.go.kr/kr/news/0006/0001/',
 'completed', 'URL 패턴: ?mode=view&seq={ID}, 첨부파일 다운로드 방식'),

('나주시', 'naju', '전남', '시',
 'https://www.naju.go.kr',
 'https://www.naju.go.kr/www/administration/reporting/coverage',
 'completed', 'URL 패턴: ?idx={ID}&mode=view, img 다음 div 본문'),

('광양시', 'gwangyang', '전남', '시',
 'https://gwangyang.go.kr',
 'https://gwangyang.go.kr/contentsView.do?pageId=www51',
 'completed', NULL),

-- ===== 군 (17) =====
('담양군', 'damyang', '전남', '군',
 'https://www.damyang.go.kr',
 'https://www.damyang.go.kr/board/list?domainId=DOM_0000001&boardId=BBS_0000007&contentsSid=12&menuCd=DOM_000000190001005001',
 'completed', NULL),

('곡성군', 'gokseong', '전남', '군',
 'https://www.gokseong.go.kr',
 'https://www.gokseong.go.kr/kr/board/list.do?bbsId=BBS_000000000000151&menuNo=102001002000',
 'completed', NULL),

('구례군', 'gurye', '전남', '군',
 'https://www.gurye.go.kr',
 'https://www.gurye.go.kr/board/list?domainId=DOM_0000001&boardId=BBS_0000007&contentsSid=12&menuCd=DOM_000000190001006002',
 'completed', NULL),

('고흥군', 'goheung', '전남', '군',
 'https://www.goheung.go.kr',
 'https://www.goheung.go.kr/contentsView.do?pageId=goheung36',
 'completed', NULL),

('보성군', 'boseong', '전남', '군',
 'https://www.boseong.go.kr',
 'https://www.boseong.go.kr/contentsView.do?pageId=boseong58',
 'completed', NULL),

('화순군', 'hwasun', '전남', '군',
 'https://www.hwasun.go.kr',
 'https://www.hwasun.go.kr/board/list?domainId=DOM_0000001&boardId=BBS_0000007&contentsSid=12&menuCd=DOM_000000190001001003',
 'completed', NULL),

('장흥군', 'jangheung', '전남', '군',
 'https://www.jangheung.go.kr',
 'https://www.jangheung.go.kr/contentsView.do?pageId=jangheung61',
 'completed', NULL),

('강진군', 'gangjin', '전남', '군',
 'https://www.gangjin.go.kr',
 'https://www.gangjin.go.kr/www/government/news/press',
 'completed', NULL),

('해남군', 'haenam', '전남', '군',
 'https://www.haenam.go.kr',
 'https://www.haenam.go.kr/contentsView.do?pageId=haenam171',
 'completed', NULL),

('영암군', 'yeongam', '전남', '군',
 'https://www.yeongam.go.kr',
 'https://www.yeongam.go.kr/contentsView.do?pageId=yeongam90',
 'completed', NULL),

('무안군', 'muan', '전남', '군',
 'https://www.muan.go.kr',
 'https://www.muan.go.kr/www/openmuan/new/report',
 'completed', NULL),

('함평군', 'hampyeong', '전남', '군',
 'https://www.hampyeong.go.kr',
 'https://www.hampyeong.go.kr/contentsView.do?pageId=hampyeong68',
 'completed', NULL),

('영광군', 'yeonggwang', '전남', '군',
 'https://www.yeonggwang.go.kr',
 'https://www.yeonggwang.go.kr/_prog/gboard/?b_id=news&site=yeonggwang&mn=B03_01_01_01&type=lists',
 'completed', NULL),

('장성군', 'jangseong', '전남', '군',
 'https://www.jangseong.go.kr',
 'https://www.jangseong.go.kr/home/www/news/jangseong/bodo',
 'completed', NULL),

('완도군', 'wando', '전남', '군',
 'https://www.wando.go.kr',
 'https://www.wando.go.kr/contentsView.do?pageId=wando50',
 'completed', NULL),

('진도군', 'jindo', '전남', '군',
 'https://www.jindo.go.kr',
 'https://www.jindo.go.kr/contentsView.do?pageId=jindo50',
 'completed', NULL),

('신안군', 'shinan', '전남', '군',
 'https://www.shinan.go.kr',
 'https://www.shinan.go.kr/home/www/openinfo/participation_07/participation_07_03/page.wscms',
 'completed', NULL),

-- ===== 교육청 (2) =====
('광주광역시교육청', 'gwangju_edu', '광주', '교육청',
 'https://enews.gen.go.kr',
 'https://enews.gen.go.kr/v5/?sid=25',
 'completed', 'URL 경로에 /v5/와 /v4/ 혼용, 이미지 핫링크 허용'),

('전라남도교육청', 'jeonnam_edu', '전남', '교육청',
 'https://www.jnedu.kr',
 'https://www.jnedu.kr/news/articleList.html?sc_section_code=S1N1&view_type=sm',
 'completed', '전남교육통 사이트')

ON CONFLICT (code) DO UPDATE SET
    homepage_url = EXCLUDED.homepage_url,
    press_list_url = EXCLUDED.press_list_url,
    scraper_status = EXCLUDED.scraper_status,
    tech_notes = EXCLUDED.tech_notes,
    updated_at = NOW();

-- RLS 정책 (필요시)
-- ALTER TABLE news_sources ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all for authenticated users" ON news_sources FOR ALL USING (true);

COMMENT ON TABLE news_sources IS '뉴스 수집 대상 기관 정보';
COMMENT ON COLUMN news_sources.code IS '영문 코드 - scrapers/ 폴더명과 매칭';
COMMENT ON COLUMN news_sources.scraper_status IS 'completed: 완료 / developing: 개발중 / planned: 예정 / none: 미개발';

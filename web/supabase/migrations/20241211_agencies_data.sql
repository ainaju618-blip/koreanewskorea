-- agencies 테이블 초기 데이터 삽입
-- Supabase SQL Editor에서 실행하세요

INSERT INTO public.agencies (region_code, name, category, base_url, press_release_url, is_active) VALUES
('gwangju', '광주광역시', '광주', 'https://www.gwangju.go.kr', 'https://www.gwangju.go.kr/boardList.do?boardId=BD_0000000027&pageId=www789', true),
('gwangju_edu', '광주광역시교육청', '교육청', 'https://enews.gen.go.kr', 'https://enews.gen.go.kr/v5/?sid=25', true),
('jeonnam_edu', '전라남도교육청', '교육청', 'https://www.jne.go.kr', 'https://www.jne.go.kr/jne/na/ntt/selectNttList.do?mi=3989&bbsId=37', true),
('jeonnam', '전라남도', '전남', 'https://www.jeonnam.go.kr', 'https://www.jeonnam.go.kr/M7116/boardList.do?menuId=jeonnam0202000000', true),
('naju', '나주시', '전남', 'https://www.naju.go.kr', 'https://www.naju.go.kr/www/administration/reporting/coverage', true),
('mokpo', '목포시', '전남', 'https://www.mokpo.go.kr', 'https://www.mokpo.go.kr/www/mokpo_news/press_release/report_material', true),
('yeosu', '여수시', '전남', 'https://www.yeosu.go.kr', 'https://www.yeosu.go.kr/www/administration/news/press', true),
('suncheon', '순천시', '전남', 'https://www.suncheon.go.kr', 'https://www.suncheon.go.kr/kr/news/0004/0005/0001/', true),
('gwangyang', '광양시', '전남', 'https://www.gwangyang.go.kr', 'https://gwangyang.go.kr/board.es?mid=a11007000000&bid=0057', true),
('damyang', '담양군', '전남', 'https://www.damyang.go.kr', 'https://www.damyang.go.kr/board/list?domainId=DOM_0000001&boardId=BBS_0000007', true),
('gokseong', '곡성군', '전남', 'https://www.gokseong.go.kr', 'https://www.gokseong.go.kr/kr/board/list.do?boardId=BBS_0000125', true),
('gurye', '구례군', '전남', 'https://www.gurye.go.kr', 'https://www.gurye.go.kr/kr/board/list.do?boardId=BBS_0000072', true),
('goheung', '고흥군', '전남', 'https://www.goheung.go.kr', 'https://www.goheung.go.kr/board/list.do?boardId=BBS_0000029', true),
('boseong', '보성군', '전남', 'https://www.boseong.go.kr', 'https://www.boseong.go.kr/board/list.do?boardId=BBS_0000061', true),
('hwasun', '화순군', '전남', 'https://www.hwasun.go.kr', 'https://www.hwasun.go.kr/gallery.do?S=S01&M=020101000000&b_code=0000000001', true),
('jangheung', '장흥군', '전남', 'https://www.jangheung.go.kr', 'https://www.jangheung.go.kr/board/list.do?boardId=BBS_0000041', true),
('gangjin', '강진군', '전남', 'https://www.gangjin.go.kr', 'https://www.gangjin.go.kr/board/list.do?boardId=BBS_0000039', true),
('haenam', '해남군', '전남', 'https://www.haenam.go.kr', 'https://www.haenam.go.kr/board/list.do?boardId=BBS_0000035', true),
('yeongam', '영암군', '전남', 'https://www.yeongam.go.kr', 'https://www.yeongam.go.kr/board/list.do?boardId=BBS_0000047', true),
('muan', '무안군', '전남', 'https://www.muan.go.kr', 'https://www.muan.go.kr/www/muan02/muan0203/muan020301.jsp', true),
('hampyeong', '함평군', '전남', 'https://www.hampyeong.go.kr', 'https://www.hampyeong.go.kr/main/board.do?menu=03&boardId=news', true),
('yeonggwang', '영광군', '전남', 'https://www.yeonggwang.go.kr', 'https://www.yeonggwang.go.kr/board/list.do?boardId=BBS_0000053', true),
('jangseong', '장성군', '전남', 'https://www.jangseong.go.kr', 'https://www.jangseong.go.kr/board/list.do?boardId=BBS_0000051', true),
('wando', '완도군', '전남', 'https://www.wando.go.kr', 'https://www.wando.go.kr/board/list.do?boardId=BBS_0000043', true),
('jindo', '진도군', '전남', 'https://www.jindo.go.kr', 'https://www.jindo.go.kr/board/list.do?boardId=BBS_0000037', true),
('shinan', '신안군', '전남', 'https://www.shinan.go.kr', 'https://www.shinan.go.kr/board/list.do?boardId=BBS_0000045', true)
ON CONFLICT (region_code) DO NOTHING;

SELECT '✅ ' || COUNT(*) || '개 기관 데이터 삽입 완료!' AS result FROM public.agencies;

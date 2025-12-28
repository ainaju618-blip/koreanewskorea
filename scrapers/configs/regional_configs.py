"""
Universal Regional Scraper Configuration Registry
- 각 지자체별 크롤링 설정을 정의합니다.
"""

from typing import Dict, Any

# Common settings (default values) - Updated Dec 2025
DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
}

# 지역별 설정
REGIONAL_CONFIGS: Dict[str, Dict[str, Any]] = {
    # 1. 광주광역시청
    'gwangju': {
        'name': '광주광역시',
        'category': '광주',
        'base_url': 'https://www.gwangju.go.kr',
        'list_url': 'https://www.gwangju.go.kr/boardList.do?boardId=BD_0000000027&pageId=www789', 
        'encoding': 'utf-8',
        'parser_type': 'json_ld',
        'selectors': {
            'list_item': 'tbody tr', 
            'list_title': 'td.title a',
            'list_date': 'td:nth-of-type(5)',     
            'list_link': 'td.title a',
            'detail_title': 'div.board_view_head h6',
            'detail_content': 'div.board_view_body', 
            'detail_date': 'div.board_view_info span:first-child', 
            'detail_image': 'div.view_image img',
        },
        'date_format': '%Y-%m-%d',
    },
    
    # 2. 전라남도청
    'jeonnam': {
        'name': '전라남도',
        'category': '전남',
        'base_url': 'https://www.jeonnam.go.kr',
        'list_url': 'https://www.jeonnam.go.kr/M7116/boardList.do?menuId=jeonnam0202000000', # 보도자료
        'encoding': 'utf-8',
        'selectors': {
            'list_item': 'tbody tr',
            'list_title': 'td.title a',  # 수정: td.subject → td.title
            'list_date': 'td.date',      # 수정: 클래스 기반 선택
            'list_link': 'td.title a',   # 수정
            'detail_title': 'h4.view_title',
            'detail_content': 'div.view_content',
            'detail_date': 'ul.view_info_ul li:first-child span',
            'detail_image': 'div.view_content img',
        },
    },

    # 3. 목포시청
    'mokpo': {
        'name': '목포시',
        'base_url': 'https://www.mokpo.go.kr',
        'list_url': 'https://www.mokpo.go.kr/www/mokpo_news/press_release/report_material',
        'page_param': 'page',
        'selectors': {
            'list_item': 'a.item_cont',
            'list_title': 'strong.tit',
            'list_link': None,
            'list_date': 'span.date',
            'detail_title': 'div.board_view_cont h3', 
            'detail_content': 'div.board_view_cont',
            'detail_image': 'div.board_view_cont img',
            'detail_attachments': "a[href*='/common/file_download/']"
        }
    },
    
    # 4. 여수시청
    'yeosu': {
        'name': '여수시',
        'category': '전남',
        'base_url': 'https://www.yeosu.go.kr',
        'list_url': 'https://www.yeosu.go.kr/www/administration/news/press',
        'encoding': 'utf-8',
        'selectors': {
            'list_item': 'tbody tr',
            'list_title': 'td.subject a',
            'list_date': 'td:nth-of-type(5)',
            'list_link': 'td.subject a',
            'detail_title': 'h4.title',
            'detail_content': 'div.view_con',
            'detail_date': 'ul.view_info li:first-child',
            'detail_image': 'div.view_con img',
        }
    },

    # 5. 순천시청
    'suncheon': {
        'name': '순천시',
        'category': '전남',
        'base_url': 'https://www.suncheon.go.kr',
        'list_url': 'https://www.suncheon.go.kr/kr/news/0004/0005/0001/',
        'encoding': 'utf-8',
        'selectors': {
            'list_item': 'tbody tr',
            'list_title': 'td.subject a',
            'list_date': 'td:nth-of-type(5)',
            'list_link': 'td.subject a',
            'detail_title': 'div.view_tit h4',
            'detail_content': 'div.view_cont',
            'detail_date': 'ul.view_info li:first-child',
            'detail_image': 'div.view_content img',
        }
    },

    # 6. 나주시청
    'naju': {
        'name': '나주시',
        'category': '전남',
        'base_url': 'https://www.naju.go.kr',
        'list_url': 'https://www.naju.go.kr/www/news/notice/notice',
        'encoding': 'utf-8',
        'selectors': {
            'list_item': 'tbody tr',
            'list_title': 'td.subject a, td.title a',
            'list_date': 'td:nth-of-type(4)',
            'list_link': 'td.subject a, td.title a',
            'detail_title': 'h4.view_title, div.view_header h4',
            'detail_content': 'div.view_content, div.board_content',
            'detail_date': 'ul.view_info li:first-child',
            'detail_image': 'div.view_content img',
        }
    },

    # 7. 무안군청
    'muan': {
        'name': '무안군',
        'category': '전남',
        'base_url': 'https://www.muan.go.kr',
        'list_url': 'https://www.muan.go.kr/www/muan02/muan0203/muan020301.jsp',
        'encoding': 'utf-8',
        'selectors': {
            'list_item': 'tbody tr',
            'list_title': 'td.subject a',
            'list_date': 'td:nth-of-type(4)',
            'list_link': 'td.subject a',
            'detail_title': 'div.view_header h4',
            'detail_content': 'div.view_content',
            'detail_date': 'div.view_info span',
            'detail_image': 'div.view_content img',
        }
    },

    # 8. 함평군청
    'hampyeong': {
        'name': '함평군',
        'category': '전남',
        'base_url': 'https://www.hampyeong.go.kr',
        'list_url': 'https://www.hampyeong.go.kr/main/board.do?menu=03&boardId=news',
        'encoding': 'utf-8',
        'selectors': {
            'list_item': 'tbody tr',
            'list_title': 'td.title a',
            'list_date': 'td:nth-of-type(4)',
            'list_link': 'td.title a',
            'detail_title': 'div.board_view h4',
            'detail_content': 'div.board_content',
            'detail_date': 'ul.view_info li:first-child',
            'detail_image': 'div.board_content img',
        }
    },

    # ============================================================
    # 🚀 Phase 5-A: 전남 16개 시군 추가 (2024-12-07)
    # ============================================================

    # 9. 광양시청
    'gwangyang': {
        'name': '광양시',
        'category': '전남',
        'base_url': 'https://www.gwangyang.go.kr',
        'list_url': 'https://gwangyang.go.kr/board.es?mid=a11007000000&bid=0057',
        'encoding': 'utf-8',
        'selectors': {
            'list_item': 'tbody tr',
            'list_title': 'td.list_tit a',
            'list_date': 'td.list_date',
            'list_link': 'td.list_tit a',
            'detail_title': 'h2.bbs_stitle, div.bbs_top h2',
            'detail_content': 'div.bbs_content, div.view_cont',
            'detail_date': 'span.date, ul.bbs_info li:first-child',
            'detail_image': 'div.bbs_content img, div.view_cont img',
        }
    },

    # 10. 담양군청
    'damyang': {
        'name': '담양군',
        'category': '전남',
        'base_url': 'https://www.damyang.go.kr',
        'list_url': 'https://www.damyang.go.kr/board/list?domainId=DOM_0000001&boardId=BBS_0000007&contentsSid=12&menuCd=DOM_000000190001005001',
        'encoding': 'utf-8',
        'selectors': {
            'list_item': 'tbody tr',
            'list_title': 'td.subject a, td.title a',
            'list_date': 'td:nth-of-type(4), td:nth-of-type(5)',
            'list_link': 'td.subject a, td.title a',
            'detail_title': 'h4.subject, div.view_header h4',
            'detail_content': 'div.view_content, div.con_txt',
            'detail_date': 'ul.view_info li:first-child, span.date',
            'detail_image': 'div.view_content img, div.con_txt img',
        }
    },

    # 11. 곡성군청
    'gokseong': {
        'name': '곡성군',
        'category': '전남',
        'base_url': 'https://www.gokseong.go.kr',
        'list_url': 'https://www.gokseong.go.kr/kr/board/list.do?boardId=BBS_0000125',
        'encoding': 'utf-8',
        'selectors': {
            'list_item': 'tbody tr',
            'list_title': 'td.subject a, td.title a',
            'list_date': 'td:nth-of-type(4)',
            'list_link': 'td.subject a, td.title a',
            'detail_title': 'h4.view_title, div.view_header h4',
            'detail_content': 'div.view_content, div.board_content',
            'detail_date': 'ul.view_info li:first-child',
            'detail_image': 'div.view_content img',
        }
    },

    # 12. 구례군청
    'gurye': {
        'name': '구례군',
        'category': '전남',
        'base_url': 'https://www.gurye.go.kr',
        'list_url': 'https://www.gurye.go.kr/kr/board/list.do?boardId=BBS_0000072',
        'encoding': 'utf-8',
        'selectors': {
            'list_item': 'tbody tr',
            'list_title': 'td.subject a, td.title a',
            'list_date': 'td:nth-of-type(4)',
            'list_link': 'td.subject a, td.title a',
            'detail_title': 'h4.view_title, div.view_header h4',
            'detail_content': 'div.view_content, div.board_content',
            'detail_date': 'ul.view_info li:first-child',
            'detail_image': 'div.view_content img',
        }
    },

    # 13. 고흥군청
    'goheung': {
        'name': '고흥군',
        'category': '전남',
        'base_url': 'https://www.goheung.go.kr',
        'list_url': 'https://www.goheung.go.kr/board/list.do?boardId=BBS_0000029',
        'encoding': 'utf-8',
        'selectors': {
            'list_item': 'tbody tr',
            'list_title': 'td.subject a, td.title a',
            'list_date': 'td:nth-of-type(4)',
            'list_link': 'td.subject a, td.title a',
            'detail_title': 'h4.view_title, div.view_header h4',
            'detail_content': 'div.view_content, div.board_content',
            'detail_date': 'ul.view_info li:first-child',
            'detail_image': 'div.view_content img',
        }
    },

    # 14. 보성군청
    'boseong': {
        'name': '보성군',
        'category': '전남',
        'base_url': 'https://www.boseong.go.kr',
        'list_url': 'https://www.boseong.go.kr/board/list.do?boardId=BBS_0000061',
        'encoding': 'utf-8',
        'selectors': {
            'list_item': 'tbody tr',
            'list_title': 'td.subject a, td.title a',
            'list_date': 'td:nth-of-type(4)',
            'list_link': 'td.subject a, td.title a',
            'detail_title': 'h4.view_title, div.view_header h4',
            'detail_content': 'div.view_content, div.board_content',
            'detail_date': 'ul.view_info li:first-child',
            'detail_image': 'div.view_content img',
        }
    },

    # 15. 화순군청
    'hwasun': {
        'name': '화순군',
        'category': '전남',
        'base_url': 'https://www.hwasun.go.kr',
        'list_url': 'https://www.hwasun.go.kr/gallery.do?S=S01&M=020101000000&b_code=0000000001',
        'encoding': 'utf-8',
        'selectors': {
            'list_item': 'ul.gallery_list li, tbody tr',
            'list_title': 'a.title, td.subject a',
            'list_date': 'span.date, td:nth-of-type(4)',
            'list_link': 'a.title, td.subject a',
            'detail_title': 'h4.view_title, div.view_header h4',
            'detail_content': 'div.view_content, div.board_content',
            'detail_date': 'ul.view_info li:first-child',
            'detail_image': 'div.view_content img',
        }
    },

    # 16. 장흥군청
    'jangheung': {
        'name': '장흥군',
        'category': '전남',
        'base_url': 'https://www.jangheung.go.kr',
        'list_url': 'https://www.jangheung.go.kr/board/list.do?boardId=BBS_0000041',
        'encoding': 'utf-8',
        'selectors': {
            'list_item': 'tbody tr',
            'list_title': 'td.subject a, td.title a',
            'list_date': 'td:nth-of-type(4)',
            'list_link': 'td.subject a, td.title a',
            'detail_title': 'h4.view_title, div.view_header h4',
            'detail_content': 'div.view_content, div.board_content',
            'detail_date': 'ul.view_info li:first-child',
            'detail_image': 'div.view_content img',
        }
    },

    # 17. 강진군청
    'gangjin': {
        'name': '강진군',
        'category': '전남',
        'base_url': 'https://www.gangjin.go.kr',
        'list_url': 'https://www.gangjin.go.kr/board/list.do?boardId=BBS_0000039',
        'encoding': 'utf-8',
        'selectors': {
            'list_item': 'tbody tr',
            'list_title': 'td.subject a, td.title a',
            'list_date': 'td:nth-of-type(4)',
            'list_link': 'td.subject a, td.title a',
            'detail_title': 'h4.view_title, div.view_header h4',
            'detail_content': 'div.view_content, div.board_content',
            'detail_date': 'ul.view_info li:first-child',
            'detail_image': 'div.view_content img',
        }
    },

    # 18. 해남군청
    'haenam': {
        'name': '해남군',
        'category': '전남',
        'base_url': 'https://www.haenam.go.kr',
        'list_url': 'https://www.haenam.go.kr/board/list.do?boardId=BBS_0000035',
        'encoding': 'utf-8',
        'selectors': {
            'list_item': 'tbody tr',
            'list_title': 'td.subject a, td.title a',
            'list_date': 'td:nth-of-type(4)',
            'list_link': 'td.subject a, td.title a',
            'detail_title': 'h4.view_title, div.view_header h4',
            'detail_content': 'div.view_content, div.board_content',
            'detail_date': 'ul.view_info li:first-child',
            'detail_image': 'div.view_content img',
        }
    },

    # 19. 영암군청
    'yeongam': {
        'name': '영암군',
        'category': '전남',
        'base_url': 'https://www.yeongam.go.kr',
        'list_url': 'https://www.yeongam.go.kr/board/list.do?boardId=BBS_0000047',
        'encoding': 'utf-8',
        'selectors': {
            'list_item': 'tbody tr',
            'list_title': 'td.subject a, td.title a',
            'list_date': 'td:nth-of-type(4)',
            'list_link': 'td.subject a, td.title a',
            'detail_title': 'h4.view_title, div.view_header h4',
            'detail_content': 'div.view_content, div.board_content',
            'detail_date': 'ul.view_info li:first-child',
            'detail_image': 'div.view_content img',
        }
    },

    # 20. 영광군청
    'yeonggwang': {
        'name': '영광군',
        'category': '전남',
        'base_url': 'https://www.yeonggwang.go.kr',
        'list_url': 'https://www.yeonggwang.go.kr/board/list.do?boardId=BBS_0000053',
        'encoding': 'utf-8',
        'selectors': {
            'list_item': 'tbody tr',
            'list_title': 'td.subject a, td.title a',
            'list_date': 'td:nth-of-type(4)',
            'list_link': 'td.subject a, td.title a',
            'detail_title': 'h4.view_title, div.view_header h4',
            'detail_content': 'div.view_content, div.board_content',
            'detail_date': 'ul.view_info li:first-child',
            'detail_image': 'div.view_content img',
        }
    },

    # 21. 장성군청
    'jangseong': {
        'name': '장성군',
        'category': '전남',
        'base_url': 'https://www.jangseong.go.kr',
        'list_url': 'https://www.jangseong.go.kr/board/list.do?boardId=BBS_0000051',
        'encoding': 'utf-8',
        'selectors': {
            'list_item': 'tbody tr',
            'list_title': 'td.subject a, td.title a',
            'list_date': 'td:nth-of-type(4)',
            'list_link': 'td.subject a, td.title a',
            'detail_title': 'h4.view_title, div.view_header h4',
            'detail_content': 'div.view_content, div.board_content',
            'detail_date': 'ul.view_info li:first-child',
            'detail_image': 'div.view_content img',
        }
    },

    # 22. 완도군청
    'wando': {
        'name': '완도군',
        'category': '전남',
        'base_url': 'https://www.wando.go.kr',
        'list_url': 'https://www.wando.go.kr/board/list.do?boardId=BBS_0000043',
        'encoding': 'utf-8',
        'selectors': {
            'list_item': 'tbody tr',
            'list_title': 'td.subject a, td.title a',
            'list_date': 'td:nth-of-type(4)',
            'list_link': 'td.subject a, td.title a',
            'detail_title': 'h4.view_title, div.view_header h4',
            'detail_content': 'div.view_content, div.board_content',
            'detail_date': 'ul.view_info li:first-child',
            'detail_image': 'div.view_content img',
        }
    },

    # 23. 진도군청
    'jindo': {
        'name': '진도군',
        'category': '전남',
        'base_url': 'https://www.jindo.go.kr',
        'list_url': 'https://www.jindo.go.kr/board/list.do?boardId=BBS_0000037',
        'encoding': 'utf-8',
        'selectors': {
            'list_item': 'tbody tr',
            'list_title': 'td.subject a, td.title a',
            'list_date': 'td:nth-of-type(4)',
            'list_link': 'td.subject a, td.title a',
            'detail_title': 'h4.view_title, div.view_header h4',
            'detail_content': 'div.view_content, div.board_content',
            'detail_date': 'ul.view_info li:first-child',
            'detail_image': 'div.view_content img',
        }
    },

    # 24. 신안군청
    'shinan': {
        'name': '신안군',
        'category': '전남',
        'base_url': 'https://www.shinan.go.kr',
        'list_url': 'https://www.shinan.go.kr/board/list.do?boardId=BBS_0000045',
        'encoding': 'utf-8',
        'selectors': {
            'list_item': 'tbody tr',
            'list_title': 'td.subject a, td.title a',
            'list_date': 'td:nth-of-type(4)',
            'list_link': 'td.subject a, td.title a',
            'detail_title': 'h4.view_title, div.view_header h4',
            'detail_content': 'div.view_content, div.board_content',
            'detail_date': 'ul.view_info li:first-child',
            'detail_image': 'div.view_content img',
        }
    },

    # ============================================================
    # Education Offices (25-26)
    # ============================================================

    # 25. 광주광역시교육청
    'gwangju_edu': {
        'name': '광주교육청',
        'category': '교육',
        'base_url': 'https://www.gen.go.kr',
        'list_url': 'https://www.gen.go.kr/main/bbs/bbsList.do?bbsId=BBSMSTR_000000000021',
        'encoding': 'utf-8',
        'selectors': {
            'list_item': 'tbody tr',
            'list_title': 'td.title a, td.subject a',
            'list_date': 'td:nth-of-type(4), td.date',
            'list_link': 'td.title a, td.subject a',
            'detail_title': 'h4.view_title, div.view_header h4, h3.bbsV_title',
            'detail_content': 'div.view_content, div.board_content, div.bbsV_cont',
            'detail_date': 'ul.view_info li:first-child, span.date',
            'detail_image': 'div.view_content img, div.bbsV_cont img',
        }
    },

    # 26. 전라남도교육청
    'jeonnam_edu': {
        'name': '전남교육청',
        'category': '교육',
        'base_url': 'https://www.jne.go.kr',
        'list_url': 'https://www.jne.go.kr/main/bbs/bbsList.do?bbsId=BBSMSTR_000000000041',
        'encoding': 'utf-8',
        'selectors': {
            'list_item': 'tbody tr',
            'list_title': 'td.title a, td.subject a',
            'list_date': 'td:nth-of-type(4), td.date',
            'list_link': 'td.title a, td.subject a',
            'detail_title': 'h4.view_title, div.view_header h4, h3.bbsV_title',
            'detail_content': 'div.view_content, div.board_content, div.bbsV_cont',
            'detail_date': 'ul.view_info li:first-child, span.date',
            'detail_image': 'div.view_content img, div.bbsV_cont img',
        }
    },
}

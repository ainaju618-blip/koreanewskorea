"""
기관 정보 마이그레이션 스크립트 (API 버전)
- localhost:3001 API를 통해 데이터 마이그레이션
- 개발 서버가 실행 중이어야 함
"""

import requests
import time

API_BASE = "http://localhost:3001/api/agencies"

# 기관 데이터 정의
AGENCIES_DATA = [
    {"region_code": "gwangju", "name": "광주광역시", "category": "광주", 
     "base_url": "https://www.gwangju.go.kr", 
     "press_release_url": "https://www.gwangju.go.kr/boardList.do?boardId=BD_0000000027&pageId=www789"},
    
    {"region_code": "gwangju_edu", "name": "광주광역시교육청", "category": "교육청",
     "base_url": "https://enews.gen.go.kr",
     "press_release_url": "https://enews.gen.go.kr/v5/?sid=25"},
    {"region_code": "jeonnam_edu", "name": "전라남도교육청", "category": "교육청",
     "base_url": "https://www.jne.go.kr",
     "press_release_url": "https://www.jne.go.kr/jne/na/ntt/selectNttList.do?mi=3989&bbsId=37"},
    
    {"region_code": "jeonnam", "name": "전라남도", "category": "전남",
     "base_url": "https://www.jeonnam.go.kr",
     "press_release_url": "https://www.jeonnam.go.kr/M7116/boardList.do?menuId=jeonnam0202000000"},
    
    {"region_code": "naju", "name": "나주시", "category": "전남",
     "base_url": "https://www.naju.go.kr",
     "press_release_url": "https://www.naju.go.kr/www/administration/reporting/coverage"},
    {"region_code": "mokpo", "name": "목포시", "category": "전남",
     "base_url": "https://www.mokpo.go.kr",
     "press_release_url": "https://www.mokpo.go.kr/www/mokpo_news/press_release/report_material"},
    {"region_code": "yeosu", "name": "여수시", "category": "전남",
     "base_url": "https://www.yeosu.go.kr",
     "press_release_url": "https://www.yeosu.go.kr/www/administration/news/press"},
    {"region_code": "suncheon", "name": "순천시", "category": "전남",
     "base_url": "https://www.suncheon.go.kr",
     "press_release_url": "https://www.suncheon.go.kr/kr/news/0004/0005/0001/"},
    {"region_code": "gwangyang", "name": "광양시", "category": "전남",
     "base_url": "https://www.gwangyang.go.kr",
     "press_release_url": "https://gwangyang.go.kr/board.es?mid=a11007000000&bid=0057"},
    {"region_code": "damyang", "name": "담양군", "category": "전남",
     "base_url": "https://www.damyang.go.kr",
     "press_release_url": "https://www.damyang.go.kr/board/list?domainId=DOM_0000001&boardId=BBS_0000007"},
    {"region_code": "gokseong", "name": "곡성군", "category": "전남",
     "base_url": "https://www.gokseong.go.kr",
     "press_release_url": "https://www.gokseong.go.kr/kr/board/list.do?boardId=BBS_0000125"},
    {"region_code": "gurye", "name": "구례군", "category": "전남",
     "base_url": "https://www.gurye.go.kr",
     "press_release_url": "https://www.gurye.go.kr/kr/board/list.do?boardId=BBS_0000072"},
    {"region_code": "goheung", "name": "고흥군", "category": "전남",
     "base_url": "https://www.goheung.go.kr",
     "press_release_url": "https://www.goheung.go.kr/board/list.do?boardId=BBS_0000029"},
    {"region_code": "boseong", "name": "보성군", "category": "전남",
     "base_url": "https://www.boseong.go.kr",
     "press_release_url": "https://www.boseong.go.kr/board/list.do?boardId=BBS_0000061"},
    {"region_code": "hwasun", "name": "화순군", "category": "전남",
     "base_url": "https://www.hwasun.go.kr",
     "press_release_url": "https://www.hwasun.go.kr/gallery.do?S=S01&M=020101000000&b_code=0000000001"},
    {"region_code": "jangheung", "name": "장흥군", "category": "전남",
     "base_url": "https://www.jangheung.go.kr",
     "press_release_url": "https://www.jangheung.go.kr/board/list.do?boardId=BBS_0000041"},
    {"region_code": "gangjin", "name": "강진군", "category": "전남",
     "base_url": "https://www.gangjin.go.kr",
     "press_release_url": "https://www.gangjin.go.kr/board/list.do?boardId=BBS_0000039"},
    {"region_code": "haenam", "name": "해남군", "category": "전남",
     "base_url": "https://www.haenam.go.kr",
     "press_release_url": "https://www.haenam.go.kr/board/list.do?boardId=BBS_0000035"},
    {"region_code": "yeongam", "name": "영암군", "category": "전남",
     "base_url": "https://www.yeongam.go.kr",
     "press_release_url": "https://www.yeongam.go.kr/board/list.do?boardId=BBS_0000047"},
    {"region_code": "muan", "name": "무안군", "category": "전남",
     "base_url": "https://www.muan.go.kr",
     "press_release_url": "https://www.muan.go.kr/www/muan02/muan0203/muan020301.jsp"},
    {"region_code": "hampyeong", "name": "함평군", "category": "전남",
     "base_url": "https://www.hampyeong.go.kr",
     "press_release_url": "https://www.hampyeong.go.kr/main/board.do?menu=03&boardId=news"},
    {"region_code": "yeonggwang", "name": "영광군", "category": "전남",
     "base_url": "https://www.yeonggwang.go.kr",
     "press_release_url": "https://www.yeonggwang.go.kr/board/list.do?boardId=BBS_0000053"},
    {"region_code": "jangseong", "name": "장성군", "category": "전남",
     "base_url": "https://www.jangseong.go.kr",
     "press_release_url": "https://www.jangseong.go.kr/board/list.do?boardId=BBS_0000051"},
    {"region_code": "wando", "name": "완도군", "category": "전남",
     "base_url": "https://www.wando.go.kr",
     "press_release_url": "https://www.wando.go.kr/board/list.do?boardId=BBS_0000043"},
    {"region_code": "jindo", "name": "진도군", "category": "전남",
     "base_url": "https://www.jindo.go.kr",
     "press_release_url": "https://www.jindo.go.kr/board/list.do?boardId=BBS_0000037"},
    {"region_code": "shinan", "name": "신안군", "category": "전남",
     "base_url": "https://www.shinan.go.kr",
     "press_release_url": "https://www.shinan.go.kr/board/list.do?boardId=BBS_0000045"},
]


def migrate():
    print(f"🚀 {len(AGENCIES_DATA)}개 기관 데이터 마이그레이션 시작...")
    print(f"   API: {API_BASE}")
    
    # 기존 데이터 확인
    try:
        resp = requests.get(API_BASE)
        if resp.status_code == 200:
            data = resp.json()
            existing = {a['region_code'] for a in data.get('data', [])}
            print(f"   기존 데이터: {len(existing)}개")
        else:
            existing = set()
            print(f"   ⚠️ 기존 데이터 확인 실패: {resp.status_code}")
    except Exception as e:
        existing = set()
        print(f"   ⚠️ API 연결 실패: {e}")
    
    success_count = 0
    skip_count = 0
    error_count = 0
    
    for agency in AGENCIES_DATA:
        if agency['region_code'] in existing:
            print(f"   ⏭️ {agency['name']} - 이미 존재 (건너뜀)")
            skip_count += 1
            continue
        
        try:
            resp = requests.post(API_BASE, json=agency)
            if resp.status_code in [200, 201]:
                print(f"   ✅ {agency['name']} 추가 완료")
                success_count += 1
            else:
                error_msg = resp.json().get('error', resp.text[:50])
                print(f"   ❌ {agency['name']} 오류: {error_msg}")
                error_count += 1
        except Exception as e:
            print(f"   ❌ {agency['name']} 예외: {str(e)[:50]}")
            error_count += 1
        
        time.sleep(0.1)
    
    print(f"\n📊 마이그레이션 결과:")
    print(f"   - 성공: {success_count}개")
    print(f"   - 건너뜀: {skip_count}개")
    print(f"   - 오류: {error_count}개")


if __name__ == "__main__":
    migrate()

"""
수집된 데이터 분석 스크립트 - 결과 파일 저장
"""
import urllib.request
import json
from collections import Counter

OUTPUT_FILE = 'scrapers/debug/data_analysis_result.txt'

def main():
    url = 'http://localhost:3000/api/posts?limit=2000'
    
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=30) as response:
            raw = response.read().decode('utf-8')
            data = json.loads(raw)
        
        # dict이면 posts 키에서 배열 추출
        if isinstance(data, dict):
            data = data.get('posts', [])
        
        if not isinstance(data, list):
            print("데이터 형식 오류")
            return
        
        lines = []
        lines.append(f"총 기사 수: {len(data)}건\n")
        
        # source 통계
        sources = Counter(str(item.get('source', 'N/A')) for item in data)
        lines.append("=" * 50)
        lines.append("📌 SOURCE (스크래퍼 출처) 통계")
        lines.append("=" * 50)
        for k, v in sources.most_common(30):
            lines.append(f"  {k}: {v}건")
        
        # region 통계
        regions = Counter(str(item.get('region', 'N/A')) for item in data)
        lines.append("\n" + "=" * 50)
        lines.append("📌 REGION (지역 코드) 통계")
        lines.append("=" * 50)
        for k, v in regions.most_common(30):
            lines.append(f"  {k}: {v}건")
        
        # category 통계
        categories = Counter(str(item.get('category', 'N/A')) for item in data)
        lines.append("\n" + "=" * 50)
        lines.append("📌 CATEGORY 통계")
        lines.append("=" * 50)
        for k, v in categories.most_common(30):
            lines.append(f"  {k}: {v}건")
        
        # status 통계
        statuses = Counter(str(item.get('status', 'N/A')) for item in data)
        lines.append("\n" + "=" * 50)
        lines.append("📌 STATUS 통계")
        lines.append("=" * 50)
        for k, v in statuses.most_common():
            lines.append(f"  {k}: {v}건")
        
        # 샘플 기사 하나 출력
        if data:
            lines.append("\n" + "=" * 50)
            lines.append("📌 샘플 기사 필드")
            lines.append("=" * 50)
            sample = data[0]
            for f in ['id', 'title', 'source', 'region', 'category', 'status', 'published_at']:
                lines.append(f"  {f}: {sample.get(f, 'N/A')}")
        
        # 결과 출력 및 저장
        result = '\n'.join(lines)
        print(result)
        
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            f.write(result)
        print(f"\n결과 저장: {OUTPUT_FILE}")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

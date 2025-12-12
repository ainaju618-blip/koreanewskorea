export interface Article {
    id: string;
    title: string;
    summary?: string;
    content?: string;
    thumbnail_url?: string;
    author?: string;
    category?: string;
    published_at?: string;
}

export const MOCK_HERO_ARTICLES: Article[] = [
    {
        id: 'mock-1',
        title: '강원 바이오 특화단지 유치 총력전... 지자체-대학 "원팀"',
        summary: '강원특별자치도가 바이오 국가첨단전략산업 특화단지 유치를 위해 행정력을 집중하고 있다. 춘천과 강릉을 중심으로 바이오 산업 생태계를 조성한다는 계획이다.',
        thumbnail_url: 'https://placehold.co/870x350/A6121D/white?text=KOREA+NEWS+Main',
        author: '정치부',
        published_at: new Date().toISOString(),
        category: 'Politics'
    },
    {
        id: 'mock-2',
        title: '동해항 자유무역지역 지정 속도... "북방경제 중심지로"',
        summary: '동해항의 자유무역지역 지정 추진이 탄력을 받고 있다. 강원도는 동해항을 북방경제 시대의 물류 거점으로 육성하겠다는 청사진을 제시했다.',
        thumbnail_url: 'https://placehold.co/260x170/2c3e50/white?text=Economy',
        author: '경제부',
        published_at: new Date().toISOString(),
        category: 'Economy'
    },
    {
        id: 'mock-3',
        title: '춘천 마임축제 26일 개막... "도시가 무대가 된다"',
        summary: '세계 3대 마임축제인 춘천마임축제가 오는 26일 개막한다. 물의 도시 춘천에서 펼쳐지는 이번 축제는 시민과 예술가가 하나되는 축제의 장이 될 전망이다.',
        thumbnail_url: 'https://placehold.co/260x170/27ae60/white?text=Culture',
        author: '문화부',
        published_at: new Date().toISOString(),
        category: 'Culture'
    },
    {
        id: 'mock-4',
        title: '도내 대학 수시모집 경쟁률 상승... 의대 쏠림 여전',
        summary: '2025학년도 강원도내 4년제 대학 수시모집 경쟁률이 전년 대비 소폭 상승했다. 하지만 의과대학 쏠림 현상은 여전히 심각한 것으로 나타났다.',
        thumbnail_url: 'https://placehold.co/260x170/f39c12/white?text=Education',
        author: '사회부',
        published_at: new Date().toISOString(),
        category: 'Society'
    },
    {
        id: 'mock-5',
        title: '강원랜드, 글로벌 복합리조트로 도약 선언',
        summary: '강원랜드가 개장 25주년을 맞아 글로벌 복합리조트로의 도약을 선언했다. 카지노 중심에서 벗어나 가족형 휴양 리조트로 거듭나겠다는 계획이다.',
        author: '경제부',
        published_at: new Date().toISOString(),
    },
    {
        id: 'mock-6',
        title: '설악산 단풍 절정... 주말 10만 인파 북적',
        summary: '단풍이 절정을 이룬 설악산 국립공원에 지난 주말 10만 명이 넘는 탐방객이 몰렸다. 대청봉을 비롯한 주요 등산로는 가을 정취를 만끽하려는 등산객들로 붐볐다.',
        author: '사회부',
        published_at: new Date().toISOString(),
    },
    {
        id: 'mock-7',
        title: '강원FC, K리그1 파이널A 진출 확정',
        summary: '프로축구 강원FC가 구단 역사상 처음으로 2년 연속 파이널A 진출을 확정 지었다. 윤정환 감독의 리더십과 선수들의 투혼이 빚어낸 결과다.',
        author: '스포츠부',
        published_at: new Date().toISOString(),
    },
    {
        id: 'mock-8',
        title: '양양국제공항, 겨울 시즌 동남아 전세기 운항 확대',
        summary: '양양국제공항이 겨울 성수기를 맞아 베트남, 필리핀 등 동남아 노선 전세기 운항을 대폭 확대한다. 침체된 지역 관광 활성화에 기여할 것으로 기대된다.',
        author: '경제부',
        published_at: new Date().toISOString(),
    },
    {
        id: 'mock-9',
        title: '반도체 교육센터 원주 건립 본격화... 2026년 준공',
        summary: '강원형 반도체 공유대학의 핵심 거점이 될 반도체 교육센터가 원주에 건립된다. 강원도는 이를 통해 반도체 전문 인력 양성에 박차를 가할 계획이다.',
        author: '사회부',
        published_at: new Date().toISOString(),
    },
    {
        id: 'mock-10',
        title: '화천 산천어축제 준비 한창... "세계 겨울 축제 명성 잇는다"',
        summary: '대한민국 대표 겨울 축제인 화천 산천어축제 개막이 한 달 앞으로 다가왔다. 화천군은 결빙 상태를 점검하는 등 축제 준비에 만전을 기하고 있다.',
        author: '문화부',
        published_at: new Date().toISOString(),
    }
];

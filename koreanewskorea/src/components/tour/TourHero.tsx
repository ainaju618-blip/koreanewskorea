import Image from 'next/image';
import { MapPin, TrendingUp, Calendar } from 'lucide-react';
import { CURRENT_SITE } from '@/config/site-regions';

interface TourHeroProps {
    regionName: string;     // Display name like '목포/영암/무안/신안'
    regionKeys: string[];   // Slugs like ['mokpo', 'yeongam', 'muan', 'sinan']
}

// Region-specific hero images and taglines
const REGION_THEMES: Record<string, { image: string; tagline: string; features: string[] }> = {
    '목포': {
        image: '/images/tour/mokpo-hero.jpg',
        tagline: '바다와 항구의 도시',
        features: ['유달산', '목포대교', '해상케이블카', '근대역사관'],
    },
    '영암': {
        image: '/images/tour/yeongam-hero.jpg',
        tagline: '월출산의 품',
        features: ['월출산', '왕인박사유적지', 'F1서킷', '도갑사'],
    },
    '무안': {
        image: '/images/tour/muan-hero.jpg',
        tagline: '연꽃의 향연',
        features: ['무안연꽃축제', '회산백련지', '무안갯벌', '황토마을'],
    },
    '신안': {
        image: '/images/tour/sinan-hero.jpg',
        tagline: '천사의 섬',
        features: ['퍼플섬', '태평염전', '증도갯벌', '홍도/흑산도'],
    },
    '여수': {
        image: '/images/tour/yeosu-hero.jpg',
        tagline: '밤바다의 낭만',
        features: ['여수밤바다', '오동도', '해상케이블카', '여수엑스포'],
    },
    '순천': {
        image: '/images/tour/suncheon-hero.jpg',
        tagline: '생태수도',
        features: ['순천만습지', '순천만국가정원', '낙안읍성', '선암사'],
    },
    '나주': {
        image: '/images/tour/naju-hero.jpg',
        tagline: '빛고을 천년역사',
        features: ['나주목사고을', '빛가람호수공원', '영산강', '배배마을'],
    },
    '화순': {
        image: '/images/tour/hwasun-hero.jpg',
        tagline: '고인돌의 고장',
        features: ['화순고인돌', '백아산', '세량제', '쌍봉사'],
    },
    '광양': {
        image: '/images/tour/gwangyang-hero.jpg',
        tagline: '매화향기 가득',
        features: ['광양매화마을', '백운산', '광양제철', '섬진강'],
    },
    '곡성': {
        image: '/images/tour/gokseong-hero.jpg',
        tagline: '기차타고 섬진강',
        features: ['섬진강기차마을', '도림사', '태안사', '심청마을'],
    },
    '구례': {
        image: '/images/tour/gurye-hero.jpg',
        tagline: '지리산 품에서',
        features: ['지리산', '화엄사', '산수유마을', '피아골'],
    },
    '담양': {
        image: '/images/tour/damyang-hero.jpg',
        tagline: '대나무 푸른 향기',
        features: ['죽녹원', '메타세쿼이아길', '소쇄원', '가사문학관'],
    },
    '함평': {
        image: '/images/tour/hampyeong-hero.jpg',
        tagline: '나비와 국화의 고장',
        features: ['함평나비축제', '함평국화축제', '돌머리해변', '해수찜질방'],
    },
    '영광': {
        image: '/images/tour/yeonggwang-hero.jpg',
        tagline: '굴비의 본향',
        features: ['법성포굴비', '불갑사', '백수해안도로', '원불교성지'],
    },
    '장성': {
        image: '/images/tour/jangseong-hero.jpg',
        tagline: '노란꽃물결',
        features: ['백양사', '황룡강', '축령산', '편백나무숲'],
    },
    '고흥': {
        image: '/images/tour/goheung-hero.jpg',
        tagline: '우주로 가는 길',
        features: ['나로우주센터', '팔영산', '소록도', '녹동항'],
    },
    '보성': {
        image: '/images/tour/boseong-hero.jpg',
        tagline: '녹차밭 푸른 물결',
        features: ['보성녹차밭', '대한다원', '율포해수욕장', '벌교갯벌'],
    },
    '장흥': {
        image: '/images/tour/jangheung-hero.jpg',
        tagline: '문학과 청정바다',
        features: ['천관산', '정남진', '이청준생가', '억불산'],
    },
    '강진': {
        image: '/images/tour/gangjin-hero.jpg',
        tagline: '다산의 고장',
        features: ['다산초당', '청자박물관', '가우도', '마량항'],
    },
    '해남': {
        image: '/images/tour/haenam-hero.jpg',
        tagline: '땅끝에서 시작',
        features: ['땅끝마을', '대흥사', '우수영관광지', '달마산'],
    },
    '완도': {
        image: '/images/tour/wando-hero.jpg',
        tagline: '청정바다의 섬',
        features: ['완도타워', '청해진', '명사십리', '보길도'],
    },
    '진도': {
        image: '/images/tour/jindo-hero.jpg',
        tagline: '신비의 바닷길',
        features: ['진도개', '신비의바닷길', '운림산방', '세방낙조'],
    },
    '광주': {
        image: '/images/tour/gwangju-hero.jpg',
        tagline: '예술과 민주의 도시',
        features: ['5.18기념공원', '국립아시아문화전당', '무등산', '양림동'],
    },
};

export default async function TourHero({ regionName, regionKeys }: TourHeroProps) {
    // Get Korean names from CURRENT_SITE for theme lookup
    const koreanNames = CURRENT_SITE.regions.primary.names;
    const primaryRegion = koreanNames[0];
    const theme = REGION_THEMES[primaryRegion] || {
        image: '/images/tour/default-hero.jpg',
        tagline: '전남의 아름다운 여행',
        features: ['자연', '문화', '역사', '미식'],
    };

    // Combine features from all primary regions
    const allFeatures = koreanNames
        .flatMap(name => REGION_THEMES[name]?.features || [])
        .slice(0, 6);

    return (
        <section className="relative">
            {/* Hero Image */}
            <div className="relative aspect-[21/9] min-h-[300px] bg-gradient-to-r from-primary to-blue-800 overflow-hidden">
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-10" />

                {/* Content */}
                <div className="absolute inset-0 z-20 flex flex-col justify-center px-8 md:px-12">
                    <div className="max-w-2xl">
                        {/* Region Badge */}
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin className="w-5 h-5 text-primary" />
                            <span className="text-white/80 text-sm">
                                {CURRENT_SITE.name} 관광
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
                            {CURRENT_SITE.name} 관광 BEST
                        </h1>

                        {/* Tagline */}
                        <p className="text-xl md:text-2xl text-white/90 mb-6">
                            {koreanNames.map(name => REGION_THEMES[name]?.tagline).filter(Boolean).join(' · ')}
                        </p>

                        {/* Feature Tags */}
                        <div className="flex flex-wrap gap-2">
                            {allFeatures.map((feature, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm"
                                >
                                    {feature}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="absolute bottom-0 left-0 right-0 z-20 bg-black/30 backdrop-blur-sm">
                    <div className="container-kn flex items-center justify-between py-3 px-8 text-white/80 text-sm">
                        <div className="flex items-center gap-6">
                            <span className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" />
                                실시간 인기 관광지
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date().toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>
                        <span className="hidden md:block">
                            한국관광공사 데이터 기반
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}

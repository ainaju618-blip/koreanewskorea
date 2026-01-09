import { Metadata } from 'next';
import {
  Newspaper,
  Clock,
  Sun,
  CloudSun,
  MapPin,
  ChevronRight,
  Quote,
  Utensils,
  Map,
  Calendar
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '나주NEWS - 샘플 레이아웃',
  description: '나주 지역신문 레이아웃 샘플',
};

// 샘플 데이터
const SAMPLE_DATA = {
  headline: {
    title: '나주시, 에너지밸리 2단계 착공 본격화',
    subtitle: '2026년 완공 목표... 1,500개 일자리 창출 기대',
    image: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=800&h=500&fit=crop',
    date: '2026.01.07',
    category: '정치/행정',
  },
  breaking: [
    { id: 1, title: '나주시, 신규 일자리 500개 창출 계획 발표', time: '10분 전' },
    { id: 2, title: '전남교육청, 나주 특성화고 지원 확대', time: '25분 전' },
    { id: 3, title: '나주시의회, 2026년 예산안 심의 착수', time: '1시간 전' },
    { id: 4, title: '빛가람혁신도시 인구 5만 돌파 눈앞', time: '2시간 전' },
    { id: 5, title: '영산강 황포돛배 축제 내달 개최', time: '3시간 전' },
  ],
  weather: { temp: 3, condition: '맑음', icon: Sun },
  categories: {
    politics: [
      { id: 1, title: '나주시장, 중앙정부와 에너지 정책 협력 논의', image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=300&h=200&fit=crop', summary: '지역 에너지 산업 활성화를 위한 협력 방안 모색' },
      { id: 2, title: '시의회, 주민복지 조례안 만장일치 통과', image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=300&h=200&fit=crop', summary: '어르신 복지 예산 20% 증액 확정' },
      { id: 3, title: '혁신도시 활성화 특별위원회 구성', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&h=200&fit=crop', summary: '한전공대 연계 산학협력 추진' },
      { id: 4, title: '나주시, 청년 창업 지원 펀드 조성', image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=300&h=200&fit=crop', summary: '100억 원 규모, 최대 5천만 원 지원' },
    ],
    society: [
      { id: 1, title: '나주교육지원청, 미래교육 비전 발표', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300&h=200&fit=crop', summary: 'AI 교육 도입, 디지털 역량 강화' },
      { id: 2, title: '금성초, 전국 환경교육 대상 수상', image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=300&h=200&fit=crop', summary: '탄소중립 실천 프로그램 운영 성과' },
      { id: 3, title: '나주 소방서, 겨울철 안전 캠페인', image: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=300&h=200&fit=crop', summary: '화재 예방 및 한파 대비 당부' },
      { id: 4, title: '영산포 어르신 문화학교 개강', image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=300&h=200&fit=crop', summary: '서예, 사진, 스마트폰 활용 강좌' },
    ],
    economy: [
      { id: 1, title: '나주배, 대만 수출 300톤 달성', image: 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=300&h=200&fit=crop', summary: '고당도 품질 인정, 수출 확대 전망' },
      { id: 2, title: '한전공대 산학협력단 출범', image: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=300&h=200&fit=crop', summary: '지역 기업 기술이전 본격화' },
      { id: 3, title: '영산강 수변경제 활성화 사업', image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=300&h=200&fit=crop', summary: '관광·레저 복합단지 조성 추진' },
      { id: 4, title: '나주 전통시장 현대화 완료', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&h=200&fit=crop', summary: '스마트 결제 시스템 도입' },
    ],
  },
  opinion: {
    column: {
      author: '우미옥',
      authorTitle: '논설위원',
      source: '나주시니어신문',
      title: '기다림의 연금술',
      excerpt: '겨울 아침, 창가에 맺힌 성에를 바라보며 기다림의 의미를 되새긴다. 우리 삶에서 기다림이란...',
      date: '2025.11.11',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
    },
    editorial: {
      title: '에너지밸리, 지역 상생의 모델이 되려면',
      excerpt: '나주 에너지밸리가 2단계 사업에 본격 착수한다. 그러나 진정한 성공을 위해서는 지역민과의 상생이 필수적이다...',
    },
    column2: {
      title: '빛가람 10년, 성적표를 보다',
      author: '김철수 기자',
      type: '기자수첩',
    },
  },
  lifestyle: {
    food: [
      { name: '나주곰탕거리', desc: '70년 전통' },
      { name: '영산포 홍어거리', desc: '삭힌 홍어 맛집' },
      { name: '빛가람 카페거리', desc: '신도시 핫플' },
    ],
    travel: [
      { name: '금성관', desc: '사적 제337호' },
      { name: '영산강 황포돛배', desc: '전통 뱃놀이' },
      { name: '나주목문화관', desc: '천년 목사골' },
    ],
    events: [
      { name: '나주배축제', date: '10월' },
      { name: '영산강 문화제', date: '5월' },
      { name: '빛가람 빛축제', date: '12월' },
    ],
  },
};

export default function NajuNewsSamplePage() {
  const today = new Date();
  const dateStr = today.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    timeZone: 'Asia/Seoul',
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== 헤더 ===== */}
      <header className="bg-white border-b-4 border-red-700">
        <div className="max-w-7xl mx-auto px-4">
          {/* 상단 바 */}
          <div className="flex items-center justify-between py-2 text-sm text-gray-500 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {dateStr}
              </span>
              <span className="flex items-center gap-1">
                <Sun className="w-4 h-4 text-yellow-500" />
                나주 {SAMPLE_DATA.weather.temp}°C {SAMPLE_DATA.weather.condition}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="#" className="hover:text-red-700">로그인</Link>
              <Link href="#" className="hover:text-red-700">회원가입</Link>
            </div>
          </div>

          {/* 로고 */}
          <div className="py-4 text-center">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">
              <span className="text-red-700">나주</span>NEWS
            </h1>
            <p className="text-sm text-gray-500 mt-1">천년의 역사, 영산강의 고장</p>
          </div>

          {/* 네비게이션 */}
          <nav className="flex items-center justify-center gap-1 py-2 border-t border-gray-200">
            {['전체', '정치/행정', '사회/교육', '경제/산업', '오피니언', '생활/문화', '시청소식', '의회소식'].map((item, idx) => (
              <Link
                key={item}
                href="#"
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  idx === 0
                    ? 'bg-red-700 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* ===== 헤드라인 영역 ===== */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 메인 뉴스 */}
          <div className="lg:col-span-2 bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
            <div className="relative aspect-[16/9]">
              <Image
                src={SAMPLE_DATA.headline.image}
                alt={SAMPLE_DATA.headline.title}
                fill
                className="object-cover"
              />
              <div className="absolute top-4 left-4">
                <span className="bg-red-700 text-white px-3 py-1 text-sm font-bold">
                  {SAMPLE_DATA.headline.category}
                </span>
              </div>
            </div>
            <div className="p-6">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                {SAMPLE_DATA.headline.title}
              </h2>
              <p className="text-lg text-gray-600 mb-3">{SAMPLE_DATA.headline.subtitle}</p>
              <span className="text-sm text-gray-400">{SAMPLE_DATA.headline.date}</span>
            </div>
          </div>

          {/* 사이드: 속보 + 날씨 */}
          <div className="flex flex-col gap-4">
            {/* 속보 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex-1">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                속보
              </h3>
              <ul className="space-y-3">
                {SAMPLE_DATA.breaking.map((item) => (
                  <li key={item.id} className="group">
                    <Link href="#" className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0 group-hover:text-red-700" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-700 group-hover:text-red-700 line-clamp-1">
                          {item.title}
                        </p>
                        <span className="text-xs text-gray-400">{item.time}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* 날씨 */}
            <div className="bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg shadow-sm p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    나주시 빛가람동
                  </p>
                  <p className="text-3xl font-bold mt-1">{SAMPLE_DATA.weather.temp}°C</p>
                  <p className="text-sm opacity-90">{SAMPLE_DATA.weather.condition}</p>
                </div>
                <Sun className="w-16 h-16 opacity-80" />
              </div>
            </div>
          </div>
        </section>

        {/* ===== 정치/행정 섹션 ===== */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-6 bg-red-700"></span>
              정치/행정
            </h2>
            <Link href="#" className="text-sm text-gray-500 hover:text-red-700 flex items-center gap-1">
              더보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {SAMPLE_DATA.categories.politics.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        {/* ===== 사회/교육 섹션 ===== */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-600"></span>
              사회/교육
            </h2>
            <Link href="#" className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1">
              더보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {SAMPLE_DATA.categories.society.map((item) => (
              <NewsCard key={item.id} item={item} accentColor="blue" />
            ))}
          </div>
        </section>

        {/* ===== 경제/산업 섹션 ===== */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-6 bg-emerald-600"></span>
              경제/산업
            </h2>
            <Link href="#" className="text-sm text-gray-500 hover:text-emerald-600 flex items-center gap-1">
              더보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {SAMPLE_DATA.categories.economy.map((item) => (
              <NewsCard key={item.id} item={item} accentColor="emerald" />
            ))}
          </div>
        </section>

        {/* ===== 오피니언 섹션 ===== */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-6 bg-purple-600"></span>
              오피니언
            </h2>
            <Link href="#" className="text-sm text-gray-500 hover:text-purple-600 flex items-center gap-1">
              더보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 칼럼 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Quote className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">칼럼</span>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                    <Image
                      src={SAMPLE_DATA.opinion.column.image}
                      alt={SAMPLE_DATA.opinion.column.author}
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {SAMPLE_DATA.opinion.column.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {SAMPLE_DATA.opinion.column.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-900">{SAMPLE_DATA.opinion.column.author}</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-500">{SAMPLE_DATA.opinion.column.authorTitle}</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-400">{SAMPLE_DATA.opinion.column.source}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 사설 + 기자수첩 */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <span className="inline-block bg-gray-800 text-white text-xs px-2 py-1 mb-3">사설</span>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {SAMPLE_DATA.opinion.editorial.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {SAMPLE_DATA.opinion.editorial.excerpt}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <span className="inline-block bg-amber-500 text-white text-xs px-2 py-1 mb-3">기자수첩</span>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {SAMPLE_DATA.opinion.column2.title}
                </h3>
                <p className="text-sm text-gray-500">{SAMPLE_DATA.opinion.column2.author}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 생활/문화 (축소) ===== */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-6 bg-orange-500"></span>
              생활/문화
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 맛집 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-3">
                <Utensils className="w-5 h-5 text-orange-500" />
                맛집
              </h3>
              <ul className="space-y-2">
                {SAMPLE_DATA.lifestyle.food.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{item.name}</span>
                    <span className="text-gray-400">{item.desc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 여행 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-3">
                <Map className="w-5 h-5 text-cyan-500" />
                여행
              </h3>
              <ul className="space-y-2">
                {SAMPLE_DATA.lifestyle.travel.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{item.name}</span>
                    <span className="text-gray-400">{item.desc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 행사 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-3">
                <Calendar className="w-5 h-5 text-purple-500" />
                축제/행사
              </h3>
              <ul className="space-y-2">
                {SAMPLE_DATA.lifestyle.events.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{item.name}</span>
                    <span className="text-gray-400">{item.date}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ===== 광고 배너 ===== */}
        <section className="mb-8">
          <div className="bg-gray-200 rounded-lg h-24 flex items-center justify-center text-gray-500">
            광고 배너 영역
          </div>
        </section>
      </main>

      {/* ===== 푸터 ===== */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                <span className="text-red-500">나주</span>NEWS
              </h2>
              <p className="text-sm">전라남도 나주시 빛가람로 000</p>
            </div>
            <div className="text-sm text-center md:text-right">
              <p>대표전화: 061-000-0000 | 팩스: 061-000-0001</p>
              <p>© 2026 나주NEWS. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// 뉴스 카드 컴포넌트
function NewsCard({
  item,
  accentColor = 'red'
}: {
  item: { id: number; title: string; image: string; summary: string };
  accentColor?: 'red' | 'blue' | 'emerald';
}) {
  const hoverColors = {
    red: 'group-hover:text-red-700',
    blue: 'group-hover:text-blue-600',
    emerald: 'group-hover:text-emerald-600',
  };

  return (
    <Link href="#" className="group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="relative aspect-[3/2]">
        <Image
          src={item.image}
          alt={item.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-3">
        <h3 className={`text-sm font-bold text-gray-900 mb-1 line-clamp-2 ${hoverColors[accentColor]}`}>
          {item.title}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-1">{item.summary}</p>
      </div>
    </Link>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import {
    Building2, FileText, Phone, Mail, MapPin, Scale,
    Target, Newspaper, GraduationCap, Map, Users, TrendingUp,
    CheckCircle2, BookOpen, Globe
} from 'lucide-react';

export const metadata: Metadata = {
    title: '회사 소개',
    description: '코리아NEWS는 광주·전남 26개 기관의 소식을 빠르고 정확하게 전달하는 지역 밀착형 디지털 미디어입니다.',
    openGraph: {
        title: '회사 소개 | 코리아NEWS',
        description: '코리아NEWS는 광주·전남 26개 기관의 소식을 빠르고 정확하게 전달하는 지역 밀착형 디지털 미디어입니다.',
        type: 'website',
    },
};

export default function AboutPage() {
    // Organization 구조화 데이터
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: '코리아NEWS',
        alternateName: 'KoreaNEWS',
        url: 'https://gwangju.koreanewsone.com',
        logo: 'https://gwangju.koreanewsone.com/logo.png',
        description: '광주·전남 지역의 소식을 빠르고 정확하게 전달하는 지역 밀착형 디지털 미디어',
        foundingDate: '2024',
        address: {
            '@type': 'PostalAddress',
            streetAddress: '독립로 338, 501호 (계림동)',
            addressLocality: '동구',
            addressRegion: '광주광역시',
            postalCode: '61421',
            addressCountry: 'KR',
        },
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+82-10-2631-3865',
            email: 'news@gwangju.koreanewsone.com',
            contactType: 'customer service',
        },
        sameAs: [],
    };

    const coverageAreas = [
        { type: '광역시', count: 1, name: '광주광역시' },
        { type: '도', count: 1, name: '전라남도' },
        { type: '시', count: 5, name: '목포·여수·순천·나주·광양' },
        { type: '군', count: 17, name: '담양·곡성·구례 외 14개군' },
        { type: '교육청', count: 2, name: '광주·전남 교육청' },
    ];

    return (
        <div className="min-h-screen bg-white">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* 헤더 */}
            <div className="bg-slate-900 text-white py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">
                        코리아NEWS
                    </h1>
                    <p className="text-xl text-slate-300">
                        지역의 목소리를 세상에 전합니다
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* 회사 소개 */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Building2 className="w-6 h-6" />
                        회사 소개
                    </h2>
                    <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
                        <p>
                            코리아NEWS는 광주광역시, 전라남도 및 나주시를 중심으로
                            지역 뉴스를 빠르고 정확하게 전달하는 디지털 미디어입니다.
                        </p>
                        <p>
                            광주·전남 26개 기관의 보도자료를 실시간으로 취재하여
                            도민 여러분께 필요한 정보를 신속하게 제공합니다.
                            단순한 뉴스 전달을 넘어, 지역민의 삶에 실질적으로 도움이 되는
                            정보 플랫폼을 지향합니다.
                        </p>
                    </div>
                </section>

                {/* 비전 및 미션 */}
                <section className="mb-12 bg-blue-50 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-600" />
                        비전 및 미션
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg p-5 shadow-sm">
                            <h3 className="font-bold text-blue-800 mb-2">VISION</h3>
                            <p className="text-gray-700">
                                "광주·전남을 대표하는 신뢰받는 지역 미디어"
                            </p>
                        </div>
                        <div className="bg-white rounded-lg p-5 shadow-sm">
                            <h3 className="font-bold text-blue-800 mb-2">MISSION</h3>
                            <p className="text-gray-700">
                                지역민의 알 권리 실현과 지역 발전에 기여
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">정확하고 신속한 지역 뉴스 전달</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">투명하고 공정한 보도 원칙</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">지역 사회와 함께 성장</span>
                        </div>
                    </div>
                </section>

                {/* 취재 네트워크 */}
                <section className="mb-12">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Newspaper className="w-5 h-5" />
                        취재 네트워크
                    </h2>
                    <div className="bg-gray-50 rounded-xl p-6">
                        <div className="flex flex-col md:flex-row justify-center gap-8 mb-6">
                            <div className="text-center">
                                <span className="text-4xl font-bold text-blue-600">26</span>
                                <span className="text-gray-600 ml-2">개 지역</span>
                                <p className="text-sm text-gray-500 mt-1">지역기자 활동</p>
                            </div>
                            <div className="text-center">
                                <span className="text-4xl font-bold text-green-600">200</span>
                                <span className="text-gray-600 ml-2">여 명</span>
                                <p className="text-sm text-gray-500 mt-1">시민기자 활동</p>
                            </div>
                        </div>
                        <p className="text-center text-gray-600 text-sm mb-6">
                            광주·전남 전역에서 지역기자와 시민기자들이 현장의 생생한 소식을 전합니다.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {coverageAreas.map((area) => (
                                <div key={area.type} className="text-center p-3 bg-white rounded-lg shadow-sm">
                                    <div className="text-2xl font-bold text-slate-800">{area.count}</div>
                                    <div className="text-sm font-medium text-gray-600">{area.type}</div>
                                    <div className="text-xs text-gray-400 mt-1">{area.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 특화 서비스 */}
                <section className="mb-12">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        특화 서비스
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 교육 전문 콘텐츠 */}
                        <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <GraduationCap className="w-6 h-6 text-green-600" />
                                </div>
                                <h3 className="font-bold text-gray-900">교육 전문 콘텐츠</h3>
                            </div>
                            <p className="text-gray-600 text-sm mb-4">
                                광주·전남 교육청 소식, 입시 정보, 학교 현장 뉴스를
                                전문적으로 다룹니다. 학부모와 학생에게 필요한
                                교육 정보를 한눈에 제공합니다.
                            </p>
                            <ul className="text-sm text-gray-500 space-y-1">
                                <li>• 교육청 정책 및 공지사항</li>
                                <li>• 입시·진학 정보</li>
                                <li>• 학교 행사 및 소식</li>
                            </ul>
                        </div>

                        {/* 남도 다이소 - 지역 정보 지도 */}
                        <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                    <Map className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">남도 다이소</h3>
                                    <span className="text-xs text-orange-600">준비중</span>
                                </div>
                            </div>
                            <p className="text-gray-600 text-sm mb-4">
                                광주·전남 22개 시군의 축제, 맛집, 관광지 정보를
                                지도 위에서 한눈에! 보도자료로 접한 행사를
                                바로 찾아갈 수 있는 원스톱 서비스입니다.
                            </p>
                            <ul className="text-sm text-gray-500 space-y-1">
                                <li>• 지역 축제·행사 정보</li>
                                <li>• 맛집·관광지 추천</li>
                                <li>• 위치 기반 검색</li>
                            </ul>
                        </div>

                        {/* 평생교육원 */}
                        <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                    <BookOpen className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">코리아NEWS 평생교육원</h3>
                                    <span className="text-xs text-purple-600">2025년 설립 예정</span>
                                </div>
                            </div>
                            <p className="text-gray-600 text-sm mb-4">
                                교육 현장의 경험을 바탕으로 선생님들의 업무 경감과
                                학생들의 학습 효율을 높이는 교육 플랫폼을 운영합니다.
                                이미 전기기능사 CBT 학습 플랫폼과 콘텐츠 공유 플랫폼을
                                개발·운영하고 있습니다.
                            </p>
                            <ul className="text-sm text-gray-500 space-y-1">
                                <li>• 학교 업무 자동화 프로그램 개발</li>
                                <li>• 전기기능사 CBT 학습 플랫폼 <span className="text-green-600">(운영중)</span></li>
                                <li>• 교육 콘텐츠 공유 플랫폼 <span className="text-green-600">(운영중)</span></li>
                                <li>• 자격증 취득 지원 과정</li>
                            </ul>
                        </div>

                        {/* AI 뉴스 */}
                        <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Globe className="w-6 h-6 text-blue-600" />
                                </div>
                                <h3 className="font-bold text-gray-900">글로벌 AI 트렌드</h3>
                            </div>
                            <p className="text-gray-600 text-sm mb-4">
                                빠르게 변화하는 인공지능 기술 동향을
                                쉽고 정확하게 전달합니다. 지역민도 글로벌
                                기술 트렌드를 놓치지 않도록 합니다.
                            </p>
                            <ul className="text-sm text-gray-500 space-y-1">
                                <li>• 해외 AI 뉴스 큐레이션</li>
                                <li>• 기술 트렌드 분석</li>
                                <li>• 산업 동향 리포트</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* 독자 참여 */}
                <section className="mb-12 bg-slate-900 text-white rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        독자 참여
                    </h2>
                    <p className="text-slate-300 mb-6">
                        여러분의 제보가 뉴스가 됩니다. 지역의 소식, 불편 사항, 좋은 이야기를
                        코리아NEWS에 알려주세요.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <a
                            href="mailto:news@gwangju.koreanewsone.com?subject=[제보]"
                            className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-lg font-medium hover:bg-slate-100 transition-colors"
                        >
                            <Mail className="w-4 h-4" />
                            제보하기
                        </a>
                        <Link
                            href="/report"
                            className="inline-flex items-center justify-center gap-2 border border-slate-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors"
                        >
                            제보 양식 바로가기
                        </Link>
                    </div>
                </section>

                {/* 프로그램 제작 의뢰 */}
                <section className="mb-12 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        프로그램 제작 의뢰
                    </h2>
                    <p className="text-purple-100 mb-4">
                        학교 업무 자동화, CBT 학습 프로그램, 웹사이트 제작 등
                        교육 현장에 필요한 맞춤형 프로그램을 개발해 드립니다.
                    </p>
                    <ul className="text-purple-100 text-sm mb-6 space-y-1">
                        <li>• 학교 업무 자동화 프로그램 (성적처리, 출결관리 등)</li>
                        <li>• CBT 학습 프로그램 (자격증, 시험대비)</li>
                        <li>• 교육용 웹사이트 및 플랫폼 개발</li>
                    </ul>
                    <a
                        href="mailto:news@gwangju.koreanewsone.com?subject=[프로그램 제작 의뢰]"
                        className="inline-flex items-center justify-center gap-2 bg-white text-purple-700 px-6 py-3 rounded-lg font-medium hover:bg-purple-50 transition-colors"
                    >
                        <Mail className="w-4 h-4" />
                        제작 문의하기
                    </a>
                </section>

                {/* 등록 정보 */}
                <section className="mb-12 bg-gray-50 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        등록 정보
                    </h2>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <dt className="text-gray-500">발행인/편집인</dt>
                            <dd className="font-medium text-gray-900">고광욱</dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">인터넷신문 등록번호</dt>
                            <dd className="font-medium text-gray-900">광주, 아00517</dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">등록일</dt>
                            <dd className="font-medium text-gray-900">2024년 9월 19일</dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">사업자등록번호</dt>
                            <dd className="font-medium text-gray-900">801-07-03054</dd>
                        </div>
                    </dl>
                </section>

                {/* 연락처 */}
                <section className="mb-12">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Phone className="w-5 h-5" />
                        연락처
                    </h2>
                    <div className="space-y-3 text-gray-700">
                        <p className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            (우 61421) 광주광역시 동구 독립로 338, 501호 (계림동)
                        </p>
                        <p className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <a href="mailto:news@gwangju.koreanewsone.com" className="text-blue-600 hover:underline">
                                news@gwangju.koreanewsone.com
                            </a>
                        </p>
                    </div>
                </section>

                {/* 보도 윤리 */}
                <section className="mb-12">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Scale className="w-5 h-5" />
                        보도 윤리 강령
                    </h2>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>정확하고 공정한 보도를 위해 노력합니다.</li>
                        <li>취재원의 신뢰를 보호합니다.</li>
                        <li>독자의 알 권리를 존중합니다.</li>
                        <li>인권과 명예를 존중하며 사생활을 보호합니다.</li>
                        <li>오보 발생 시 신속하게 정정합니다.</li>
                    </ul>
                </section>

                {/* 관련 링크 */}
                <section className="flex flex-wrap gap-4 text-sm border-t pt-8">
                    <Link href="/privacy" className="text-gray-500 hover:text-gray-700">
                        개인정보처리방침
                    </Link>
                    <Link href="/terms" className="text-gray-500 hover:text-gray-700">
                        이용약관
                    </Link>
                    <Link href="/ethical-code" className="text-gray-500 hover:text-gray-700">
                        윤리강령
                    </Link>
                    <Link href="/youth-policy" className="text-gray-500 hover:text-gray-700">
                        청소년보호정책
                    </Link>
                </section>
            </div>
        </div>
    );
}

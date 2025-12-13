import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, FileText, Phone, Mail, MapPin, Scale } from 'lucide-react';

export const metadata: Metadata = {
    title: '회사 소개',
    description: '코리아NEWS는 광주·전남 지역의 소식을 AI 기술로 빠르고 정확하게 전달하는 디지털 미디어입니다.',
    openGraph: {
        title: '회사 소개 | 코리아NEWS',
        description: '코리아NEWS는 광주·전남 지역의 소식을 AI 기술로 빠르고 정확하게 전달하는 디지털 미디어입니다.',
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
        url: 'https://koreanewsone.com',
        logo: 'https://koreanewsone.com/logo.png',
        description: '광주·전남 지역의 소식을 AI 기술로 빠르고 정확하게 전달하는 디지털 미디어',
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
            email: 'news@koreanewsone.com',
            contactType: 'customer service',
        },
        sameAs: [],
    };

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
                        로컬과 세계를 잇는 AI 저널리즘
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
                    <div className="prose prose-lg max-w-none text-gray-700">
                        <p>
                            코리아NEWS는 광주광역시, 전라남도 및 나주 혁신도시를 중심으로
                            지역 뉴스를 빠르고 정확하게 전달하는 디지털 미디어입니다.
                        </p>
                        <p>
                            AI 기술을 활용하여 각 지방자치단체의 보도자료를 자동으로 수집·정리하고,
                            독자들에게 필요한 정보를 신속하게 제공합니다.
                        </p>
                    </div>
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
                            <dd className="font-medium text-gray-900">고광옥</dd>
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
                            <a href="mailto:news@koreanewsone.com" className="text-blue-600 hover:underline">
                                news@koreanewsone.com
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
                <section className="flex gap-4 text-sm">
                    <Link href="/privacy" className="text-gray-500 hover:text-gray-700">
                        개인정보처리방침
                    </Link>
                    <Link href="/terms" className="text-gray-500 hover:text-gray-700">
                        이용약관
                    </Link>
                </section>
            </div>
        </div>
    );
}

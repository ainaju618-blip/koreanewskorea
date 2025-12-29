import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Megaphone, Send, CheckCircle, BarChart3, Users, Zap } from 'lucide-react';
import { getSiteConfig, isValidRegion } from '@/config/site-regions';

interface AdInquiryPageProps {
    params: Promise<{ region: string }>;
}

export async function generateMetadata({ params }: AdInquiryPageProps): Promise<Metadata> {
    const { region } = await params;
    const config = getSiteConfig(region);

    return {
        title: `광고문의 | ${config.name} | 코리아NEWS`,
        description: '코리아NEWS 광고 문의 페이지입니다. 효과적인 지역 마케팅을 시작하세요.',
    };
}

const adTypes = [
    { name: '배너 광고', desc: '메인/기사 페이지 배너' },
    { name: '기사형 광고', desc: '네이티브 콘텐츠 광고' },
    { name: '이메일 광고', desc: '뉴스레터 광고' },
    { name: '영상 광고', desc: '뉴스TV 영상 광고' },
];

export default async function AdInquiryPage({ params }: AdInquiryPageProps) {
    const { region } = await params;

    if (!isValidRegion(region)) {
        notFound();
    }

    const config = getSiteConfig(region);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-4xl mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                        <Megaphone className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        광고문의
                    </h1>
                    <p className="text-lg text-gray-600">
                        광주·전남 지역 타겟 광고로 효과적인 마케팅을 시작하세요.
                    </p>
                </div>

                {/* Benefits */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white rounded-xl p-6 border text-center">
                        <Users className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                        <h3 className="font-bold text-gray-900 mb-1">지역 밀착</h3>
                        <p className="text-sm text-gray-600">광주·전남 독자층 타겟팅</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 border text-center">
                        <BarChart3 className="w-8 h-8 text-green-600 mx-auto mb-3" />
                        <h3 className="font-bold text-gray-900 mb-1">합리적 비용</h3>
                        <p className="text-sm text-gray-600">맞춤형 광고 단가</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 border text-center">
                        <Zap className="w-8 h-8 text-amber-600 mx-auto mb-3" />
                        <h3 className="font-bold text-gray-900 mb-1">빠른 집행</h3>
                        <p className="text-sm text-gray-600">신속한 광고 게재</p>
                    </div>
                </div>

                {/* Ad Types */}
                <div className="bg-slate-100 rounded-2xl p-8 mb-12">
                    <h2 className="font-bold text-lg text-gray-900 mb-6 text-center">광고 상품</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {adTypes.map((ad) => (
                            <div key={ad.name} className="bg-white rounded-xl p-4 text-center">
                                <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                                <h3 className="font-medium text-gray-900 text-sm">{ad.name}</h3>
                                <p className="text-xs text-gray-500 mt-1">{ad.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Inquiry Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="font-bold text-xl text-gray-900 mb-6">광고 문의하기</h2>
                    <form className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                                    회사/기관명 *
                                </label>
                                <input
                                    type="text"
                                    id="company"
                                    name="company"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
                                    담당자 연락처 *
                                </label>
                                <input
                                    type="text"
                                    id="contact"
                                    name="contact"
                                    placeholder="전화번호 또는 이메일"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="adType" className="block text-sm font-medium text-gray-700 mb-2">
                                희망 광고 유형
                            </label>
                            <select
                                id="adType"
                                name="adType"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            >
                                <option value="">선택하세요</option>
                                {adTypes.map((ad) => (
                                    <option key={ad.name} value={ad.name}>{ad.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                                문의 내용
                            </label>
                            <textarea
                                id="content"
                                name="content"
                                rows={4}
                                placeholder="광고 목적, 예산, 기간 등을 알려주시면 맞춤 제안을 드립니다."
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Send className="w-5 h-5" />
                            문의하기
                        </button>
                    </form>
                </div>

                {/* Direct Contact */}
                <div className="text-center mt-8 text-gray-500">
                    <p>
                        직접 문의:{' '}
                        <a href={`mailto:${config.email}`} className="text-blue-600 hover:underline">
                            {config.email}
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

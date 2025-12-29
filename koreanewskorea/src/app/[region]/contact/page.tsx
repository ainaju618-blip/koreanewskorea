import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Handshake, Send, Building2, Globe, Lightbulb } from 'lucide-react';
import { getSiteConfig, isValidRegion } from '@/config/site-regions';

interface ContactPageProps {
    params: Promise<{ region: string }>;
}

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
    const { region } = await params;
    const config = getSiteConfig(region);

    return {
        title: `제휴문의 | ${config.name} | 코리아NEWS`,
        description: '코리아NEWS와의 제휴 및 협력 문의 페이지입니다.',
    };
}

const partnerTypes = [
    { icon: Building2, name: '기관/단체', desc: '지자체, 공공기관, 협회' },
    { icon: Globe, name: '미디어', desc: '언론사, 콘텐츠 제작사' },
    { icon: Lightbulb, name: '기업', desc: '스타트업, 중소기업, 대기업' },
];

export default async function ContactPage({ params }: ContactPageProps) {
    const { region } = await params;

    if (!isValidRegion(region)) {
        notFound();
    }

    const config = getSiteConfig(region);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-3xl mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
                        <Handshake className="w-8 h-8 text-purple-600" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        제휴문의
                    </h1>
                    <p className="text-lg text-gray-600">
                        코리아NEWS와 함께 새로운 가치를 만들어가실 파트너를 찾습니다.
                    </p>
                </div>

                {/* Partner Types */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {partnerTypes.map((type) => (
                        <div key={type.name} className="bg-white rounded-xl p-6 border text-center">
                            <type.icon className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                            <h3 className="font-bold text-gray-900 mb-1">{type.name}</h3>
                            <p className="text-sm text-gray-600">{type.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Partnership Areas */}
                <div className="bg-purple-50 rounded-2xl p-8 mb-12">
                    <h2 className="font-bold text-lg text-gray-900 mb-4 text-center">제휴 가능 분야</h2>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
                        <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-purple-600 rounded-full" />
                            콘텐츠 공유 및 배급
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-purple-600 rounded-full" />
                            공동 취재 및 보도
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-purple-600 rounded-full" />
                            AI/기술 협력
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-purple-600 rounded-full" />
                            지역 행사 후원/협력
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-purple-600 rounded-full" />
                            교육/연구 프로젝트
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-purple-600 rounded-full" />
                            기타 협력 제안
                        </li>
                    </ul>
                </div>

                {/* Inquiry Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="font-bold text-xl text-gray-900 mb-6">제휴 문의하기</h2>
                    <form className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-2">
                                    기관/회사명 *
                                </label>
                                <input
                                    type="text"
                                    id="organization"
                                    name="organization"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    담당자명 *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    이메일 *
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                    연락처
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="proposal" className="block text-sm font-medium text-gray-700 mb-2">
                                제휴 제안 내용 *
                            </label>
                            <textarea
                                id="proposal"
                                name="proposal"
                                rows={5}
                                placeholder="제휴 목적, 기대 효과, 구체적인 협력 방안 등을 작성해 주세요."
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Send className="w-5 h-5" />
                            제휴 문의하기
                        </button>
                    </form>
                </div>

                {/* Direct Contact */}
                <div className="text-center mt-8 text-gray-500">
                    <p>
                        직접 문의:{' '}
                        <a href={`mailto:${config.email}`} className="text-purple-600 hover:underline">
                            {config.email}
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

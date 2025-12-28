import type { Metadata } from 'next';
import { Mail, Bell, CheckCircle, Newspaper } from 'lucide-react';

export const metadata: Metadata = {
    title: '구독신청',
    description: '코리아NEWS 뉴스레터를 구독하고 광주·전남 지역 소식을 이메일로 받아보세요.',
    openGraph: {
        title: '구독신청 | 코리아NEWS',
        description: '코리아NEWS 뉴스레터를 구독하고 광주·전남 지역 소식을 이메일로 받아보세요.',
        type: 'website',
    },
};

export default function SubscribePage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-4xl mx-auto px-4 py-16">
                {/* 헤더 */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#A6121D]/10 rounded-full mb-6">
                        <Bell className="w-8 h-8 text-[#A6121D]" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        뉴스레터 구독
                    </h1>
                    <p className="text-lg text-gray-600 max-w-xl mx-auto">
                        광주·전남 지역의 주요 소식을 매일 아침 이메일로 받아보세요.
                        <br />무료로 구독하실 수 있습니다.
                    </p>
                </div>

                {/* 구독 폼 */}
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-12">
                    <form className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                이메일 주소
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    placeholder="example@email.com"
                                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#A6121D] focus:border-transparent outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                이름 (선택)
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                placeholder="홍길동"
                                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#A6121D] focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="agree"
                                name="agree"
                                className="mt-1 w-4 h-4 text-[#A6121D] border-gray-300 rounded focus:ring-[#A6121D]"
                                required
                            />
                            <label htmlFor="agree" className="text-sm text-gray-600">
                                <a href="/privacy" className="text-[#A6121D] hover:underline">개인정보처리방침</a>에
                                동의하며, 뉴스레터 수신에 동의합니다.
                            </label>
                        </div>
                        <button
                            type="submit"
                            className="w-full py-4 bg-[#A6121D] text-white font-bold rounded-xl hover:bg-[#8a0f18] transition-colors shadow-lg shadow-[#A6121D]/25"
                        >
                            무료 구독하기
                        </button>
                    </form>
                </div>

                {/* 혜택 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-start gap-4 p-6 bg-white rounded-xl border">
                        <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold text-gray-900 mb-1">매일 아침 배송</h3>
                            <p className="text-sm text-gray-600">출근 전 주요 뉴스 요약</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 p-6 bg-white rounded-xl border">
                        <Newspaper className="w-6 h-6 text-blue-500 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold text-gray-900 mb-1">지역 뉴스 특화</h3>
                            <p className="text-sm text-gray-600">광주·전남 밀착 소식</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 p-6 bg-white rounded-xl border">
                        <Bell className="w-6 h-6 text-purple-500 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold text-gray-900 mb-1">속보 알림</h3>
                            <p className="text-sm text-gray-600">긴급 뉴스 즉시 전달</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import type { Metadata } from 'next';
import { FileText, Send, Camera, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
    title: '기사제보',
    description: '코리아NEWS에 뉴스 제보를 해주세요. 지역의 소중한 소식을 기다립니다.',
    openGraph: {
        title: '기사제보 | 코리아NEWS',
        description: '코리아NEWS에 뉴스 제보를 해주세요. 지역의 소중한 소식을 기다립니다.',
        type: 'website',
    },
};

export default function ReportPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-3xl mx-auto px-4 py-16">
                {/* 헤더 */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#A6121D]/10 rounded-full mb-6">
                        <FileText className="w-8 h-8 text-[#A6121D]" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        기사제보
                    </h1>
                    <p className="text-lg text-gray-600">
                        광주·전남 지역의 소중한 소식을 알려주세요.
                        <br />제보해 주신 내용은 취재 후 기사화됩니다.
                    </p>
                </div>

                {/* 제보 폼 */}
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
                    <form className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    이름 (익명 가능)
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    placeholder="홍길동"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#A6121D] focus:border-transparent outline-none"
                                />
                            </div>
                            <div>
                                <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
                                    연락처 *
                                </label>
                                <input
                                    type="text"
                                    id="contact"
                                    name="contact"
                                    placeholder="010-0000-0000 또는 이메일"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#A6121D] focus:border-transparent outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                제보 제목 *
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                placeholder="제보 내용을 요약해 주세요"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#A6121D] focus:border-transparent outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                                제보 내용 *
                            </label>
                            <textarea
                                id="content"
                                name="content"
                                rows={6}
                                placeholder="육하원칙(누가, 언제, 어디서, 무엇을, 어떻게, 왜)에 따라 상세히 작성해 주세요."
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#A6121D] focus:border-transparent outline-none resize-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                파일 첨부 (선택)
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#A6121D] transition-colors">
                                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">
                                    사진/영상 파일을 드래그하거나 클릭하여 첨부하세요
                                </p>
                                <p className="text-xs text-gray-400 mt-1">최대 20MB</p>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-800">
                                제보자의 신원은 철저히 보호됩니다. 기사화 여부와 관계없이 연락드릴 수 있습니다.
                            </p>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 bg-[#A6121D] text-white font-bold rounded-xl hover:bg-[#8a0f18] transition-colors flex items-center justify-center gap-2"
                        >
                            <Send className="w-5 h-5" />
                            제보하기
                        </button>
                    </form>
                </div>

                {/* 연락처 */}
                <div className="text-center mt-8 text-gray-500">
                    <p>
                        직접 제보:{' '}
                        <a href="mailto:news@koreanewsone.com" className="text-[#A6121D] hover:underline">
                            news@koreanewsone.com
                        </a>
                        {' '}또는{' '}
                        <a href="tel:010-2631-3865" className="text-[#A6121D] hover:underline">
                            010-2631-3865
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

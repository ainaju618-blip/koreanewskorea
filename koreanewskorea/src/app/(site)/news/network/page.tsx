import type { Metadata } from 'next';
import Link from 'next/link';
import { Tv, Play, Radio } from 'lucide-react';

export const metadata: Metadata = {
    title: '뉴스TV',
    description: '코리아NEWS의 동영상 뉴스 콘텐츠를 시청하세요.',
    openGraph: {
        title: '뉴스TV | 코리아NEWS',
        description: '코리아NEWS의 동영상 뉴스 콘텐츠를 시청하세요.',
        type: 'website',
    },
};

export default function NewsNetworkPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="flex justify-center mb-4">
                        <Tv className="w-16 h-16 text-[#A6121D]" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">
                        뉴스<span className="text-[#A6121D]">TV</span>
                    </h1>
                    <p className="text-xl text-slate-300">
                        광주·전남 소식을 영상으로 만나보세요
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-12">
                {/* 서비스 준비 중 안내 */}
                <div className="text-center py-16 bg-slate-50 rounded-2xl mb-12">
                    <Radio className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-pulse" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        뉴스TV 서비스 준비 중
                    </h2>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        더 나은 영상 뉴스 서비스를 위해 준비하고 있습니다.
                        <br />곧 다양한 영상 콘텐츠로 찾아뵙겠습니다.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#A6121D] text-white rounded-lg hover:bg-[#8a0f18] transition-colors"
                    >
                        <Play className="w-4 h-4" />
                        홈으로 돌아가기
                    </Link>
                </div>

                {/* 예정 콘텐츠 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border rounded-xl p-6 shadow-sm">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                            <Tv className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">지역 뉴스</h3>
                        <p className="text-sm text-gray-600">
                            광주·전남 지역의 주요 이슈를 영상으로 전달합니다.
                        </p>
                    </div>
                    <div className="bg-white border rounded-xl p-6 shadow-sm">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                            <Radio className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">인터뷰</h3>
                        <p className="text-sm text-gray-600">
                            지역 주요 인사들과의 심층 인터뷰 콘텐츠입니다.
                        </p>
                    </div>
                    <div className="bg-white border rounded-xl p-6 shadow-sm">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                            <Play className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">현장 리포트</h3>
                        <p className="text-sm text-gray-600">
                            생생한 현장의 모습을 영상으로 담아 전달합니다.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Building2, Newspaper, Award } from 'lucide-react';

export const metadata: Metadata = {
    title: '연혁',
    description: '코리아NEWS의 역사와 발자취를 소개합니다.',
    openGraph: {
        title: '연혁 | 코리아NEWS',
        description: '코리아NEWS의 역사와 발자취를 소개합니다.',
        type: 'website',
    },
};

const history = [
    {
        year: '2024',
        events: [
            { month: '9월', title: '인터넷신문 등록', desc: '광주, 아00517 등록 완료' },
            { month: '9월', title: '코리아NEWS 창간', desc: 'AI 기반 지역 뉴스 서비스 시작' },
            { month: '10월', title: 'AI 뉴스 시스템 구축', desc: '자동 보도자료 수집 시스템 개발' },
        ],
    },
    {
        year: '2025',
        events: [
            { month: '1월', title: '서비스 고도화', desc: '전남 22개 시군 뉴스 커버리지 확대' },
        ],
    },
];

export default function HistoryPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* 헤더 */}
            <div className="bg-slate-900 text-white py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-[#A6121D]" />
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">연혁</h1>
                    <p className="text-xl text-slate-300">코리아NEWS의 발자취</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* 타임라인 */}
                <div className="relative">
                    {/* 세로선 */}
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200" />

                    {history.map((yearData) => (
                        <div key={yearData.year} className="mb-12">
                            {/* 연도 */}
                            <div className="relative flex items-center mb-8">
                                <div className="w-16 h-16 bg-[#A6121D] rounded-full flex items-center justify-center text-white font-bold text-lg z-10">
                                    {yearData.year}
                                </div>
                            </div>

                            {/* 이벤트들 */}
                            <div className="ml-20 space-y-6">
                                {yearData.events.map((event, idx) => (
                                    <div key={idx} className="relative">
                                        <div className="absolute -left-12 top-2 w-4 h-4 bg-white border-4 border-[#A6121D] rounded-full" />
                                        <div className="bg-slate-50 rounded-xl p-6">
                                            <span className="text-sm text-[#A6121D] font-medium">{event.month}</span>
                                            <h3 className="text-lg font-bold text-gray-900 mt-1">{event.title}</h3>
                                            <p className="text-gray-600 mt-1">{event.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 관련 링크 */}
                <div className="flex gap-4 text-sm mt-12 pt-8 border-t">
                    <Link href="/about" className="text-gray-500 hover:text-gray-700">회사 소개</Link>
                    <Link href="/organization" className="text-gray-500 hover:text-gray-700">조직도</Link>
                    <Link href="/location" className="text-gray-500 hover:text-gray-700">오시는 길</Link>
                </div>
            </div>
        </div>
    );
}

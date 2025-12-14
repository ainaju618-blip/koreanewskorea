import type { Metadata } from 'next';
import Link from 'next/link';
import { Bell, Calendar, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
    title: '공지사항',
    description: '코리아NEWS의 공지사항을 확인하세요.',
    openGraph: {
        title: '공지사항 | 코리아NEWS',
        description: '코리아NEWS의 공지사항을 확인하세요.',
        type: 'website',
    },
};

const notices = [
    {
        id: 1,
        title: '코리아NEWS 서비스 이용 안내',
        date: '2024-12-01',
        isImportant: true,
    },
    {
        id: 2,
        title: '개인정보처리방침 개정 안내',
        date: '2024-11-15',
        isImportant: false,
    },
    {
        id: 3,
        title: '코리아NEWS 창간 안내',
        date: '2024-09-19',
        isImportant: true,
    },
];

export default function NoticePage() {
    return (
        <div className="min-h-screen bg-white">
            {/* 헤더 */}
            <div className="bg-slate-900 text-white py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <Bell className="w-12 h-12 mx-auto mb-4 text-[#A6121D]" />
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">공지사항</h1>
                    <p className="text-xl text-slate-300">코리아NEWS 소식을 알려드립니다</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* 공지사항 목록 */}
                <div className="divide-y">
                    {notices.map((notice) => (
                        <div
                            key={notice.id}
                            className="py-5 flex items-center justify-between hover:bg-slate-50 px-4 -mx-4 transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center gap-3">
                                {notice.isImportant && (
                                    <span className="px-2 py-0.5 bg-[#A6121D] text-white text-xs font-bold rounded">
                                        중요
                                    </span>
                                )}
                                <h3 className="font-medium text-gray-900 group-hover:text-[#A6121D] transition-colors">
                                    {notice.title}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm">{notice.date}</span>
                                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* 안내 메시지 */}
                <div className="mt-12 text-center py-12 bg-slate-50 rounded-xl">
                    <p className="text-gray-500">
                        추가 문의사항은{' '}
                        <a href="mailto:news@koreanewsone.com" className="text-[#A6121D] hover:underline">
                            news@koreanewsone.com
                        </a>
                        으로 연락해 주세요.
                    </p>
                </div>

                {/* 관련 링크 */}
                <div className="flex gap-4 text-sm mt-12 pt-8 border-t">
                    <Link href="/report" className="text-gray-500 hover:text-gray-700">기사제보</Link>
                    <Link href="/contact" className="text-gray-500 hover:text-gray-700">제휴문의</Link>
                    <Link href="/about" className="text-gray-500 hover:text-gray-700">회사 소개</Link>
                </div>
            </div>
        </div>
    );
}

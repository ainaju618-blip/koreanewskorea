import type { Metadata } from 'next';
import Link from 'next/link';
import { Users, User, Mail, Phone } from 'lucide-react';

export const metadata: Metadata = {
    title: '조직도',
    description: '코리아NEWS의 조직 구성을 소개합니다.',
    openGraph: {
        title: '조직도 | 코리아NEWS',
        description: '코리아NEWS의 조직 구성을 소개합니다.',
        type: 'website',
    },
};

const organization = {
    ceo: {
        title: '대표이사 / 발행인·편집인',
        name: '고광욱',
        email: 'ceo@gwangju.koreanewsone.com',
    },
    departments: [
        {
            name: '편집국',
            members: [
                { role: '편집국장', name: '-' },
                { role: '취재기자', name: '-' },
            ],
        },
        {
            name: 'AI기술팀',
            members: [
                { role: 'AI개발', name: '-' },
            ],
        },
        {
            name: '경영지원',
            members: [
                { role: '광고/마케팅', name: '-' },
            ],
        },
    ],
};

export default function OrganizationPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* 헤더 */}
            <div className="bg-slate-900 text-white py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <Users className="w-12 h-12 mx-auto mb-4 text-[#A6121D]" />
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">조직도</h1>
                    <p className="text-xl text-slate-300">코리아NEWS를 만들어가는 사람들</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* CEO */}
                <div className="text-center mb-12">
                    <div className="inline-block bg-gradient-to-b from-[#A6121D] to-[#8a0f18] text-white rounded-2xl p-8 shadow-xl">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="w-10 h-10" />
                        </div>
                        <p className="text-sm opacity-80 mb-1">{organization.ceo.title}</p>
                        <h2 className="text-2xl font-bold">{organization.ceo.name}</h2>
                        <p className="text-sm opacity-80 mt-2 flex items-center justify-center gap-1">
                            <Mail className="w-3 h-3" />
                            {organization.ceo.email}
                        </p>
                    </div>
                </div>

                {/* 연결선 */}
                <div className="flex justify-center mb-8">
                    <div className="w-0.5 h-12 bg-slate-300" />
                </div>

                {/* 부서들 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {organization.departments.map((dept) => (
                        <div key={dept.name} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                            <h3 className="font-bold text-lg text-gray-900 mb-4 pb-3 border-b">
                                {dept.name}
                            </h3>
                            <ul className="space-y-3">
                                {dept.members.map((member, idx) => (
                                    <li key={idx} className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border">
                                            <User className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">{member.role}</p>
                                            <p className="font-medium text-gray-900">{member.name}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* 채용 안내 */}
                <div className="mt-12 text-center p-8 bg-blue-50 rounded-xl">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">함께 할 인재를 찾습니다</h3>
                    <p className="text-gray-600 mb-4">코리아NEWS와 함께 지역 저널리즘의 미래를 만들어갈 분을 기다립니다.</p>
                    <a href="mailto:recruit@gwangju.koreanewsone.com" className="inline-flex items-center gap-2 text-[#A6121D] font-medium hover:underline">
                        <Mail className="w-4 h-4" />
                        recruit@gwangju.koreanewsone.com
                    </a>
                </div>

                {/* 관련 링크 */}
                <div className="flex gap-4 text-sm mt-12 pt-8 border-t">
                    <Link href="/about" className="text-gray-500 hover:text-gray-700">회사 소개</Link>
                    <Link href="/history" className="text-gray-500 hover:text-gray-700">연혁</Link>
                    <Link href="/location" className="text-gray-500 hover:text-gray-700">오시는 길</Link>
                </div>
            </div>
        </div>
    );
}

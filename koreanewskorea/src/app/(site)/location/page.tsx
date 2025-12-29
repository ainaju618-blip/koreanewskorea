import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, Car, Train } from 'lucide-react';
import { CURRENT_SITE } from '@/config/site-regions';

export const metadata: Metadata = {
    title: '오시는 길',
    description: '코리아NEWS 본사 위치 및 찾아오시는 방법을 안내합니다.',
    openGraph: {
        title: '오시는 길 | 코리아NEWS',
        description: '코리아NEWS 본사 위치 및 찾아오시는 방법을 안내합니다.',
        type: 'website',
    },
};

const contactInfo = {
    address: '(우 61421) 광주광역시 동구 독립로 338, 501호 (계림동)',
    phone: '010-2631-3865',
    email: CURRENT_SITE.email,
    hours: '평일 09:00 - 18:00 (주말/공휴일 휴무)',
};

export default function LocationPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* 헤더 */}
            <div className="bg-slate-900 text-white py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <MapPin className="w-12 h-12 mx-auto mb-4 text-[#A6121D]" />
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">오시는 길</h1>
                    <p className="text-xl text-slate-300">코리아NEWS 본사 위치 안내</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* 지도 영역 */}
                <div className="bg-slate-100 rounded-2xl h-80 flex items-center justify-center mb-8 overflow-hidden">
                    <div className="text-center">
                        <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-gray-500">광주광역시 동구 독립로 338</p>
                        <a
                            href="https://map.naver.com/v5/search/광주광역시%20동구%20독립로%20338"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-4 px-6 py-2 bg-[#03C75A] text-white rounded-lg hover:bg-[#02b350] transition-colors"
                        >
                            네이버 지도에서 보기
                        </a>
                    </div>
                </div>

                {/* 연락처 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <div className="bg-slate-50 rounded-xl p-6">
                        <h2 className="font-bold text-lg text-gray-900 mb-4">연락처</h2>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-[#A6121D] flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700">{contactInfo.address}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-[#A6121D]" />
                                <a href={`tel:${contactInfo.phone}`} className="text-gray-700 hover:text-[#A6121D]">
                                    {contactInfo.phone}
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-[#A6121D]" />
                                <a href={`mailto:${contactInfo.email}`} className="text-gray-700 hover:text-[#A6121D]">
                                    {contactInfo.email}
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-[#A6121D]" />
                                <span className="text-gray-700">{contactInfo.hours}</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-6">
                        <h2 className="font-bold text-lg text-gray-900 mb-4">교통 안내</h2>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <Car className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900">자가용</p>
                                    <p className="text-sm text-gray-600">건물 내 주차 가능 (방문 시 사전 연락)</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <Train className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900">대중교통</p>
                                    <p className="text-sm text-gray-600">계림동 정류장 하차 후 도보 5분</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* 관련 링크 */}
                <div className="flex gap-4 text-sm pt-8 border-t">
                    <Link href="/about" className="text-gray-500 hover:text-gray-700">회사 소개</Link>
                    <Link href="/history" className="text-gray-500 hover:text-gray-700">연혁</Link>
                    <Link href="/organization" className="text-gray-500 hover:text-gray-700">조직도</Link>
                </div>
            </div>
        </div>
    );
}

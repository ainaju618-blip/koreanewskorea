import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, AlertTriangle, Phone, Mail } from 'lucide-react';

export const metadata: Metadata = {
    title: '청소년보호정책',
    description: '코리아NEWS 청소년보호정책입니다.',
    robots: { index: true, follow: true },
};

export default function YouthPolicyPage() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* 헤더 */}
                <div className="flex items-center gap-3 mb-8">
                    <Shield className="w-8 h-8 text-[#A6121D]" />
                    <h1 className="text-2xl font-bold text-gray-900">청소년보호정책</h1>
                </div>

                <div className="prose prose-gray max-w-none">
                    <p className="text-gray-500 mb-6">시행일: 2025년 1월 1일</p>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-3">1. 목적</h2>
                        <p>
                            코리아NEWS는 청소년이 건전한 인격체로 성장할 수 있도록 청소년유해매체물로부터
                            청소년을 보호하고, 청소년의 건전한 성장에 기여함을 목적으로 합니다.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-3">2. 청소년보호책임자</h2>
                        <div className="bg-slate-50 rounded-xl p-6">
                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <dt className="text-gray-500">직책</dt>
                                    <dd className="font-medium text-gray-900">청소년보호책임자</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">성명</dt>
                                    <dd className="font-medium text-gray-900">고광욱</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">전화</dt>
                                    <dd className="font-medium text-gray-900">010-2631-3865</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">이메일</dt>
                                    <dd className="font-medium text-gray-900">youth@koreanewsone.com</dd>
                                </div>
                            </dl>
                        </div>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-3">3. 청소년유해매체물 표시</h2>
                        <p>
                            청소년에게 유해한 것으로 분류되는 매체물에 대해서는 청소년유해매체물의 표시를
                            하여 청소년이 해당 정보에 접근하지 못하도록 합니다.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-3">4. 유해정보 신고</h2>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-amber-800 font-medium">유해 콘텐츠 발견 시</p>
                                <p className="text-amber-700 text-sm mt-1">
                                    청소년에게 유해한 정보를 발견하신 경우 아래 연락처로 신고해 주시기 바랍니다.
                                    신속하게 조치하겠습니다.
                                </p>
                            </div>
                        </div>
                        <ul className="mt-4 space-y-2">
                            <li className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span>전화: 010-2631-3865</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span>이메일: youth@koreanewsone.com</span>
                            </li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-3">5. 관련 법령</h2>
                        <ul className="list-disc list-inside space-y-1">
                            <li>청소년 보호법</li>
                            <li>정보통신망 이용촉진 및 정보보호 등에 관한 법률</li>
                            <li>방송통신위원회 설치 및 운영에 관한 법률</li>
                        </ul>
                    </section>
                </div>

                {/* 관련 링크 */}
                <div className="flex gap-4 text-sm mt-12 pt-8 border-t">
                    <Link href="/terms" className="text-gray-500 hover:text-gray-700">이용약관</Link>
                    <Link href="/privacy" className="text-gray-500 hover:text-gray-700">개인정보처리방침</Link>
                    <Link href="/ethical-code" className="text-gray-500 hover:text-gray-700">윤리강령</Link>
                </div>
            </div>
        </div>
    );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { Scale, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
    title: '윤리강령',
    description: '코리아NEWS 언론 윤리강령입니다.',
    robots: { index: true, follow: true },
};

const principles = [
    {
        title: '정확성',
        desc: '우리는 사실에 기반한 정확한 보도를 최우선 가치로 삼습니다.',
    },
    {
        title: '공정성',
        desc: '우리는 어떠한 이해관계에도 치우치지 않는 공정한 보도를 추구합니다.',
    },
    {
        title: '독립성',
        desc: '우리는 정치적, 경제적 압력으로부터 독립적인 편집권을 유지합니다.',
    },
    {
        title: '투명성',
        desc: '우리는 취재 과정과 출처를 투명하게 밝히고, 오보 발생 시 신속히 정정합니다.',
    },
    {
        title: '인권존중',
        desc: '우리는 취재 대상자의 인권과 명예, 사생활을 존중합니다.',
    },
    {
        title: '공익추구',
        desc: '우리는 지역사회와 공공의 이익을 위한 보도에 힘씁니다.',
    },
];

export default function EthicalCodePage() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* 헤더 */}
                <div className="flex items-center gap-3 mb-8">
                    <Scale className="w-8 h-8 text-[#A6121D]" />
                    <h1 className="text-2xl font-bold text-gray-900">윤리강령</h1>
                </div>

                <div className="prose prose-gray max-w-none">
                    <p className="text-gray-500 mb-6">시행일: 2025년 1월 1일</p>

                    {/* 서문 */}
                    <section className="mb-10 bg-slate-50 rounded-2xl p-8">
                        <h2 className="text-xl font-semibold mb-4">전문</h2>
                        <p className="text-gray-700 leading-relaxed">
                            코리아NEWS는 광주·전남 지역의 건전한 여론 형성과 민주주의 발전에 기여하기 위해
                            언론의 자유와 책임을 다하고자 합니다. 우리는 정확하고 공정한 보도를 통해
                            시민의 알 권리를 충족시키고, 사회 정의 실현에 앞장서겠습니다.
                            <br /><br />
                            이에 코리아NEWS 임직원 모두는 다음의 윤리강령을 준수할 것을 선언합니다.
                        </p>
                    </section>

                    {/* 핵심 원칙 */}
                    <section className="mb-10">
                        <h2 className="text-xl font-semibold mb-6">핵심 원칙</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {principles.map((p) => (
                                <div key={p.title} className="bg-white border rounded-xl p-5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                        <h3 className="font-bold text-gray-900">{p.title}</h3>
                                    </div>
                                    <p className="text-sm text-gray-600">{p.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 세부 조항 */}
                    <section className="mb-10">
                        <h2 className="text-xl font-semibold mb-4">세부 조항</h2>

                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">제1조 (취재윤리)</h3>
                                <ul className="list-disc list-inside space-y-1 text-gray-700">
                                    <li>취재원의 신원 보호를 약속하고 이를 준수합니다.</li>
                                    <li>위장 취재는 공익을 위해 불가피한 경우에만 허용됩니다.</li>
                                    <li>취재 대상자에게 기자 신분을 밝히고 취재합니다.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">제2조 (보도윤리)</h3>
                                <ul className="list-disc list-inside space-y-1 text-gray-700">
                                    <li>확인되지 않은 정보는 보도하지 않습니다.</li>
                                    <li>피의사실 보도 시 무죄추정의 원칙을 준수합니다.</li>
                                    <li>선정적이거나 자극적인 표현을 지양합니다.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">제3조 (정정보도)</h3>
                                <ul className="list-disc list-inside space-y-1 text-gray-700">
                                    <li>오보 발견 시 지체 없이 정정보도를 게재합니다.</li>
                                    <li>정정 내용은 원래 보도와 동등한 수준으로 처리합니다.</li>
                                    <li>피해자의 반론권을 보장합니다.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">제4조 (이해충돌 방지)</h3>
                                <ul className="list-disc list-inside space-y-1 text-gray-700">
                                    <li>취재원으로부터 금품을 수수하지 않습니다.</li>
                                    <li>광고와 기사를 명확히 구분합니다.</li>
                                    <li>개인적 이해관계가 있는 사안의 취재를 회피합니다.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* 하단 문구 */}
                    <div className="text-center py-8 bg-slate-50 rounded-xl">
                        <p className="text-gray-600">
                            본 윤리강령은 한국신문윤리위원회의 신문윤리강령 및<br />
                            인터넷신문윤리강령을 참고하여 제정되었습니다.
                        </p>
                    </div>
                </div>

                {/* 관련 링크 */}
                <div className="flex gap-4 text-sm mt-12 pt-8 border-t">
                    <Link href="/terms" className="text-gray-500 hover:text-gray-700">이용약관</Link>
                    <Link href="/privacy" className="text-gray-500 hover:text-gray-700">개인정보처리방침</Link>
                    <Link href="/youth-policy" className="text-gray-500 hover:text-gray-700">청소년보호정책</Link>
                </div>
            </div>
        </div>
    );
}

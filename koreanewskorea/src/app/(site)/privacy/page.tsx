import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '개인정보처리방침',
    description: '코리아NEWS 개인정보처리방침입니다.',
    robots: { index: true, follow: true },
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-4xl mx-auto px-4 py-12">
                <h1 className="text-2xl font-bold text-gray-900 mb-8">개인정보처리방침</h1>

                <div className="prose prose-gray max-w-none">
                    <p className="text-gray-500 mb-6">시행일: 2025년 1월 1일</p>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-3">1. 개인정보의 처리 목적</h2>
                        <p>
                            코리아NEWS는 다음 목적을 위하여 개인정보를 처리합니다:
                        </p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>서비스 제공 및 운영</li>
                            <li>회원 관리</li>
                            <li>민원 처리</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-3">2. 수집하는 개인정보 항목</h2>
                        <p>
                            필수항목: 이메일 주소<br />
                            선택항목: 이름, 연락처
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-3">3. 개인정보의 보유 및 이용 기간</h2>
                        <p>
                            회원 탈퇴 시까지 보유하며, 법령에 따른 보존 기간이 있는 경우 해당 기간 동안 보존합니다.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-3">4. 개인정보의 제3자 제공</h2>
                        <p>
                            코리아NEWS는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-3">5. 개인정보 보호책임자</h2>
                        <p>
                            성명: [담당자명]<br />
                            이메일: privacy@gwangju.koreanewsone.com
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}

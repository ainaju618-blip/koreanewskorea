import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '이용약관',
    description: '코리아NEWS 서비스 이용약관입니다.',
    robots: { index: true, follow: true },
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-4xl mx-auto px-4 py-12">
                <h1 className="text-2xl font-bold text-gray-900 mb-8">이용약관</h1>

                <div className="prose prose-gray max-w-none">
                    <p className="text-gray-500 mb-6">시행일: 2025년 1월 1일</p>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-3">제1조 (목적)</h2>
                        <p>
                            이 약관은 코리아NEWS가 제공하는 인터넷 뉴스 서비스의 이용조건 및
                            절차에 관한 사항을 규정함을 목적으로 합니다.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-3">제2조 (서비스의 내용)</h2>
                        <p>코리아NEWS는 다음 서비스를 제공합니다:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>광주·전남 지역 뉴스 제공</li>
                            <li>AI/교육 관련 뉴스 제공</li>
                            <li>기타 정보 서비스</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-3">제3조 (저작권)</h2>
                        <p>
                            코리아NEWS가 작성한 저작물에 대한 저작권은 코리아NEWS에 귀속됩니다.
                            단, 지방자치단체 보도자료의 저작권은 해당 기관에 있습니다.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-3">제4조 (면책조항)</h2>
                        <p>
                            코리아NEWS는 천재지변, 시스템 장애 등 불가항력적 사유로 인한
                            서비스 중단에 대해 책임을 지지 않습니다.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}

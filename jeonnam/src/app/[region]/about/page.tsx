import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSiteConfig, isValidRegion } from '@/config/site-regions';

interface AboutPageProps {
    params: Promise<{ region: string }>;
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
    const { region } = await params;
    const config = getSiteConfig(region);

    return {
        title: `회사소개 | ${config.name} | 코리아NEWS`,
        description: `${config.name} 코리아NEWS 회사 소개 페이지입니다.`,
    };
}

export default async function AboutPage({ params }: AboutPageProps) {
    const { region } = await params;

    if (!isValidRegion(region)) {
        notFound();
    }

    const config = getSiteConfig(region);

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-4xl mx-auto px-4 py-16">
                <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
                    회사소개
                </h1>

                <div className="prose prose-lg max-w-none">
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">코리아NEWS 소개</h2>
                        <p className="text-gray-700 leading-relaxed">
                            코리아NEWS는 광주·전남 지역의 뉴스를 AI 기술을 활용하여
                            빠르고 정확하게 전달하는 혁신적인 뉴스 플랫폼입니다.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">{config.name} 서비스</h2>
                        <p className="text-gray-700 leading-relaxed">
                            {config.subtitle}를 제공합니다.
                            지역 밀착형 뉴스로 주민들에게 필요한 정보를 신속하게 전달합니다.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">연락처</h2>
                        <ul className="text-gray-700">
                            <li>이메일: {config.email}</li>
                            <li>웹사이트: {config.siteUrl}</li>
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    );
}

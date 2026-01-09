/**
 * FAQ Schema (JSON-LD)
 * Helps with AI search citation and Google rich results
 *
 * @see https://schema.org/FAQPage
 */

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQSchemaProps {
    items: FAQItem[];
}

export default function FAQSchema({ items }: FAQSchemaProps) {
    if (!items || items.length === 0) return null;

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map(item => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
            },
        })),
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

/**
 * Default FAQ items for Korea NEWS about page
 */
export const defaultFAQItems: FAQItem[] = [
    {
        question: '코리아NEWS는 어떤 뉴스를 다루나요?',
        answer: '코리아NEWS는 광주, 전남, 나주시를 중심으로 한 지역 뉴스와 AI, 교육 관련 정보를 전달하는 디지털 저널리즘 플랫폼입니다. 전국 27개 지역의 로컬 뉴스를 AI 기술로 연결합니다.',
    },
    {
        question: '코리아NEWS의 기사는 어떻게 작성되나요?',
        answer: '코리아NEWS는 전문 기자들이 직접 취재한 기사와 AI 기술을 활용한 뉴스 큐레이션을 결합합니다. 모든 기사는 편집 검증 과정을 거쳐 정확성을 보장합니다.',
    },
    {
        question: '코리아NEWS에 제보하려면 어떻게 해야 하나요?',
        answer: '코리아NEWS 홈페이지의 제보 페이지나 이메일(contact@koreanewskorea.com)을 통해 뉴스 제보가 가능합니다. 지역 관련 소식, 사건사고, 이벤트 등 다양한 정보를 받고 있습니다.',
    },
    {
        question: '코리아NEWS는 무료인가요?',
        answer: '네, 코리아NEWS의 모든 기사는 무료로 열람 가능합니다. 별도의 회원가입이나 구독료 없이 누구나 뉴스를 읽을 수 있습니다.',
    },
    {
        question: '광고 문의는 어떻게 하나요?',
        answer: '광고 및 제휴 문의는 광고 문의 페이지를 통해 가능합니다. 배너 광고, 기사형 광고, 협찬 등 다양한 형태의 광고를 지원합니다.',
    },
];

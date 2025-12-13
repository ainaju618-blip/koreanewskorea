"use client";

import { useState } from 'react';
import {
    FileSearch,
    Search,
    ExternalLink,
    CheckCircle,
    AlertCircle,
    Eye,
    Send,
    Edit2,
    Trash2,
    X,
    FileText,
    BarChart3
} from 'lucide-react';
import { PageHeader } from '@/components/admin/shared/PageHeader';

// 가공된 기사 타입
interface ProcessedArticle {
    id: string;
    raw_id: string;
    source_name: string;
    source_url: string;
    original_title: string;
    title_ko?: string;
    rewritten_title?: string;
    rewritten_content?: string;
    facts?: {
        who?: string;
        what?: string;
        when?: string;
        where?: string;
        why?: string;
        how?: string;
        numbers?: string[];
        key_facts?: string[];
    };
    similarity_score?: number;
    quality_passed: boolean;
    quality_notes?: string;
    process_mode: 'reference' | 'rewrite';
    processed_at: string;
    post_id?: number;
    tags?: string[];
}

// 샘플 데이터
const SAMPLE_PROCESSED: ProcessedArticle[] = [
    {
        id: '1',
        raw_id: '1',
        source_name: 'TechCrunch',
        source_url: 'https://techcrunch.com/2025/01/15/openai-gpt5',
        original_title: 'OpenAI announces GPT-5 with breakthrough reasoning capabilities',
        title_ko: 'OpenAI, 획기적인 추론 능력을 갖춘 GPT-5 발표',
        rewritten_title: '오픈AI, 차세대 언어모델 GPT-5 전격 공개',
        rewritten_content: '오픈AI가 차세대 대형 언어모델 GPT-5를 15일 공개했다. 이번 모델은 기존 GPT-4 대비 추론 속도가 100배 빨라졌으며, 1조 개의 파라미터를 탑재했다.\n\n새로운 모델은 복잡한 논리적 문제 해결에서 획기적인 성능 향상을 보였다. 특히 수학적 추론과 코딩 능력이 크게 개선되어 전문가 수준의 작업 지원이 가능해졌다.\n\n오픈AI는 AI 기술의 안전성과 유용성 향상을 위해 새로운 아키텍처를 개발했다고 밝혔다. 200개 이상의 언어를 지원해 글로벌 사용자 접근성도 높였다.\n\n업계에서는 이번 발표가 AI 기술 경쟁을 더욱 가속화할 것으로 전망하고 있다. GPT-5는 올해 상반기 중 ChatGPT Plus 가입자에게 먼저 제공될 예정이다.\n\n원문 출처: TechCrunch',
        facts: {
            who: 'OpenAI',
            what: 'GPT-5 모델 발표',
            when: '2025-01-15',
            where: '샌프란시스코',
            why: 'AI 추론 능력 향상',
            how: '새로운 아키텍처와 학습 방법 적용',
            numbers: ['100배 빠른 추론 속도', '1조 파라미터', '200개 언어 지원'],
            key_facts: [
                'OpenAI가 차세대 언어모델 GPT-5를 공개했다',
                '추론 능력이 대폭 향상되어 복잡한 문제 해결 가능',
                '올해 상반기 내 ChatGPT Plus 사용자에게 제공 예정'
            ]
        },
        similarity_score: 0.18,
        quality_passed: true,
        process_mode: 'rewrite',
        processed_at: '2025-01-15T11:00:00Z',
        tags: ['OpenAI', 'GPT-5', '인공지능', '언어모델']
    },
    {
        id: '2',
        raw_id: '2',
        source_name: 'The Verge',
        source_url: 'https://www.theverge.com/2025/1/14/google-gemini-update',
        original_title: 'Google updates Gemini with new multimodal features',
        title_ko: 'Google, 새로운 멀티모달 기능으로 Gemini 업데이트',
        rewritten_title: '구글 제미나이, 이미지 이해·생성 기능 대폭 강화',
        rewritten_content: '구글이 자사 AI 모델 제미나이(Gemini)의 대규모 업데이트를 14일 발표했다.\n\n이번 업데이트의 핵심은 멀티모달 기능 강화다. 이미지를 더 정확하게 분석하고, 텍스트 설명만으로 고품질 이미지를 생성할 수 있게 됐다.\n\n구글은 제미나이가 경쟁 모델 대비 이미지 처리 속도가 2배 빨라졌다고 밝혔다. 또한 여러 이미지를 동시에 분석해 맥락을 파악하는 능력도 개선됐다.\n\n원문 출처: The Verge',
        facts: {
            who: 'Google',
            what: 'Gemini AI 모델 업데이트',
            when: '2025-01-14',
            numbers: ['이미지 처리 속도 2배 향상'],
            key_facts: [
                '구글이 제미나이 AI 모델 대규모 업데이트 발표',
                '이미지 이해 및 생성 기능 크게 개선'
            ]
        },
        similarity_score: 0.22,
        quality_passed: true,
        process_mode: 'rewrite',
        processed_at: '2025-01-14T16:00:00Z',
        post_id: 1234,
        tags: ['Google', 'Gemini', '멀티모달', 'AI']
    },
    {
        id: '3',
        raw_id: '3',
        source_name: 'VentureBeat',
        source_url: 'https://venturebeat.com/ai/anthropic-claude-enterprise',
        original_title: 'Anthropic launches Claude for Enterprise with enhanced security',
        title_ko: 'Anthropic, 강화된 보안 기능의 엔터프라이즈용 Claude 출시',
        similarity_score: 0.35,
        quality_passed: false,
        quality_notes: '유사도가 30%를 초과합니다. 재작성이 필요합니다.',
        process_mode: 'rewrite',
        processed_at: '2025-01-14T10:00:00Z',
        tags: ['Anthropic', 'Claude', '엔터프라이즈']
    }
];

// 품질 배지
function QualityBadge({ passed, score }: { passed: boolean; score?: number }) {
    if (passed) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                <CheckCircle className="w-3 h-3" />
                통과 {score !== undefined && `(${Math.round(score * 100)}%)`}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <AlertCircle className="w-3 h-3" />
            실패 {score !== undefined && `(${Math.round(score * 100)}%)`}
        </span>
    );
}

// 발행 상태 배지
function PublishBadge({ postId }: { postId?: number }) {
    if (postId) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                <Send className="w-3 h-3" />
                발행됨
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
            <FileText className="w-3 h-3" />
            대기
        </span>
    );
}

// 기사 상세 모달
function ArticleDetailModal({
    article,
    onClose,
    onPublish
}: {
    article: ProcessedArticle | null;
    onClose: () => void;
    onPublish: () => void;
}) {
    if (!article) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <span className="text-xs text-gray-500">{article.source_name}</span>
                        <h2 className="text-lg font-bold text-gray-900 mt-1">
                            {article.rewritten_title || article.title_ko || article.original_title}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-2 gap-6">
                        {/* 왼쪽: 가공 결과 */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <FileSearch className="w-4 h-4 text-amber-500" />
                                가공된 기사
                            </h3>

                            {article.rewritten_content ? (
                                <div className="bg-amber-50 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-2">
                                        {article.rewritten_title}
                                    </h4>
                                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                        {article.rewritten_content}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                                    재작성된 콘텐츠가 없습니다
                                </div>
                            )}

                            {/* 태그 */}
                            {article.tags && article.tags.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">태그</p>
                                    <div className="flex flex-wrap gap-1">
                                        {article.tags.map((tag, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 오른쪽: 추출된 사실 + 품질 정보 */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-blue-500" />
                                추출된 사실
                            </h3>

                            {article.facts ? (
                                <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                                    {article.facts.who && (
                                        <div className="text-sm">
                                            <span className="font-medium text-gray-700">누가:</span>{' '}
                                            <span className="text-gray-600">{article.facts.who}</span>
                                        </div>
                                    )}
                                    {article.facts.what && (
                                        <div className="text-sm">
                                            <span className="font-medium text-gray-700">무엇을:</span>{' '}
                                            <span className="text-gray-600">{article.facts.what}</span>
                                        </div>
                                    )}
                                    {article.facts.when && (
                                        <div className="text-sm">
                                            <span className="font-medium text-gray-700">언제:</span>{' '}
                                            <span className="text-gray-600">{article.facts.when}</span>
                                        </div>
                                    )}
                                    {article.facts.where && (
                                        <div className="text-sm">
                                            <span className="font-medium text-gray-700">어디서:</span>{' '}
                                            <span className="text-gray-600">{article.facts.where}</span>
                                        </div>
                                    )}
                                    {article.facts.why && (
                                        <div className="text-sm">
                                            <span className="font-medium text-gray-700">왜:</span>{' '}
                                            <span className="text-gray-600">{article.facts.why}</span>
                                        </div>
                                    )}
                                    {article.facts.how && (
                                        <div className="text-sm">
                                            <span className="font-medium text-gray-700">어떻게:</span>{' '}
                                            <span className="text-gray-600">{article.facts.how}</span>
                                        </div>
                                    )}
                                    {article.facts.numbers && article.facts.numbers.length > 0 && (
                                        <div className="text-sm">
                                            <span className="font-medium text-gray-700">수치:</span>
                                            <ul className="list-disc list-inside text-gray-600 mt-1">
                                                {article.facts.numbers.map((n, i) => (
                                                    <li key={i}>{n}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {article.facts.key_facts && article.facts.key_facts.length > 0 && (
                                        <div className="text-sm">
                                            <span className="font-medium text-gray-700">핵심 사실:</span>
                                            <ul className="list-disc list-inside text-gray-600 mt-1">
                                                {article.facts.key_facts.map((f, i) => (
                                                    <li key={i}>{f}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                                    추출된 사실이 없습니다
                                </div>
                            )}

                            {/* 품질 정보 */}
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">품질 검사</span>
                                    <QualityBadge passed={article.quality_passed} score={article.similarity_score} />
                                </div>
                                {article.quality_notes && (
                                    <p className="text-sm text-red-600">{article.quality_notes}</p>
                                )}
                                <div className="text-xs text-gray-500">
                                    유사도 기준: 30% 이하
                                </div>
                            </div>

                            {/* 원문 링크 */}
                            <a
                                href={article.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                            >
                                원문 보기 <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        닫기
                    </button>
                    {article.quality_passed && !article.post_id && (
                        <button
                            onClick={onPublish}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            기사 발행
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ProcessedArticlesPage() {
    const [articles, setArticles] = useState<ProcessedArticle[]>(SAMPLE_PROCESSED);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterQuality, setFilterQuality] = useState<'all' | 'passed' | 'failed'>('all');
    const [filterPublish, setFilterPublish] = useState<'all' | 'published' | 'pending'>('all');
    const [selectedArticle, setSelectedArticle] = useState<ProcessedArticle | null>(null);

    // 필터링
    const filteredArticles = articles.filter(article => {
        const matchesSearch = (article.rewritten_title || article.title_ko || article.original_title)
            .toLowerCase().includes(searchQuery.toLowerCase());
        const matchesQuality = filterQuality === 'all' ||
            (filterQuality === 'passed' && article.quality_passed) ||
            (filterQuality === 'failed' && !article.quality_passed);
        const matchesPublish = filterPublish === 'all' ||
            (filterPublish === 'published' && article.post_id) ||
            (filterPublish === 'pending' && !article.post_id);
        return matchesSearch && matchesQuality && matchesPublish;
    });

    // 통계
    const stats = {
        total: articles.length,
        passed: articles.filter(a => a.quality_passed).length,
        failed: articles.filter(a => !a.quality_passed).length,
        published: articles.filter(a => a.post_id).length
    };

    // 발행
    const handlePublish = (id: string) => {
        setArticles(articles.map(a =>
            a.id === id ? { ...a, post_id: Date.now() } : a
        ));
        setSelectedArticle(null);
    };

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <PageHeader
                title="가공된 기사"
                description="AI로 재작성된 기사 목록 및 품질 검사 결과"
                icon={FileSearch}
                iconBgColor="bg-emerald-500"
            />

            {/* 통계 */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-xs text-gray-500">전체</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                    <p className="text-2xl font-bold text-emerald-700">{stats.passed}</p>
                    <p className="text-xs text-emerald-600">품질 통과</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                    <p className="text-2xl font-bold text-red-700">{stats.failed}</p>
                    <p className="text-xs text-red-600">품질 실패</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <p className="text-2xl font-bold text-blue-700">{stats.published}</p>
                    <p className="text-xs text-blue-600">발행됨</p>
                </div>
            </div>

            {/* 필터 */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="기사 제목 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                </div>
                <select
                    value={filterQuality}
                    onChange={(e) => setFilterQuality(e.target.value as 'all' | 'passed' | 'failed')}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                    <option value="all">모든 품질</option>
                    <option value="passed">통과</option>
                    <option value="failed">실패</option>
                </select>
                <select
                    value={filterPublish}
                    onChange={(e) => setFilterPublish(e.target.value as 'all' | 'published' | 'pending')}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                    <option value="all">모든 상태</option>
                    <option value="published">발행됨</option>
                    <option value="pending">대기</option>
                </select>
            </div>

            {/* 기사 목록 */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">기사</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">소스</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">품질</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">발행</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">가공일</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">작업</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredArticles.map((article) => (
                            <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="max-w-md">
                                        <p className="font-medium text-gray-900 truncate">
                                            {article.rewritten_title || article.title_ko || article.original_title}
                                        </p>
                                        {article.tags && article.tags.length > 0 && (
                                            <div className="flex gap-1 mt-1">
                                                {article.tags.slice(0, 3).map((tag, i) => (
                                                    <span key={i} className="text-xs text-gray-400">#{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-sm text-gray-600">{article.source_name}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <QualityBadge passed={article.quality_passed} score={article.similarity_score} />
                                </td>
                                <td className="px-4 py-3">
                                    <PublishBadge postId={article.post_id} />
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-sm text-gray-500">
                                        {new Date(article.processed_at).toLocaleDateString('ko-KR')}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => setSelectedArticle(article)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="상세 보기"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        {article.quality_passed && !article.post_id && (
                                            <button
                                                onClick={() => handlePublish(article.id)}
                                                className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="발행"
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredArticles.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <FileSearch className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>가공된 기사가 없습니다</p>
                    </div>
                )}
            </div>

            {/* 상세 모달 */}
            <ArticleDetailModal
                article={selectedArticle}
                onClose={() => setSelectedArticle(null)}
                onPublish={() => selectedArticle && handlePublish(selectedArticle.id)}
            />
        </div>
    );
}

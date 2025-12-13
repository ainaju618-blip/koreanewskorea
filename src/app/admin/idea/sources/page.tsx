"use client";

import { useState } from 'react';
import {
    Globe,
    Plus,
    Search,
    Edit2,
    Trash2,
    Rss,
    Code,
    ExternalLink,
    CheckCircle,
    Clock,
    AlertCircle,
    PlayCircle,
    X
} from 'lucide-react';
import { PageHeader } from '@/components/admin/shared/PageHeader';

// AI 뉴스 수집처 타입
interface AISource {
    id: string;
    name: string;
    code: string;
    collection_type: 'rss' | 'scraping' | 'api';
    feed_url?: string;
    scrape_url?: string;
    selectors?: {
        list?: string;
        title?: string;
        content?: string;
        date?: string;
        author?: string;
        thumbnail?: string;
    };
    default_mode: 'reference' | 'rewrite';
    auto_process: boolean;
    priority: number;
    enabled: boolean;
    last_collected_at?: string;
    last_error?: string;
}

// 초기 수집처 데이터 (idea/SOURCES.md 기반)
const INITIAL_SOURCES: AISource[] = [
    {
        id: '1',
        name: 'TechCrunch AI',
        code: 'techcrunch',
        collection_type: 'rss',
        feed_url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
        default_mode: 'rewrite',
        auto_process: true,
        priority: 1,
        enabled: true
    },
    {
        id: '2',
        name: 'The Verge AI',
        code: 'theverge',
        collection_type: 'rss',
        feed_url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
        default_mode: 'rewrite',
        auto_process: true,
        priority: 2,
        enabled: true
    },
    {
        id: '3',
        name: 'VentureBeat AI',
        code: 'venturebeat',
        collection_type: 'rss',
        feed_url: 'https://venturebeat.com/category/ai/feed/',
        default_mode: 'rewrite',
        auto_process: true,
        priority: 3,
        enabled: true
    },
    {
        id: '4',
        name: 'OpenAI Blog',
        code: 'openai_blog',
        collection_type: 'scraping',
        scrape_url: 'https://openai.com/blog',
        selectors: {
            list: "div[data-testid='blog-card']",
            title: 'h3',
            date: 'time'
        },
        default_mode: 'rewrite',
        auto_process: true,
        priority: 4,
        enabled: false
    },
    {
        id: '5',
        name: 'Google AI Blog',
        code: 'google_ai',
        collection_type: 'scraping',
        scrape_url: 'https://blog.google/technology/ai/',
        selectors: {
            list: 'article.post-card',
            title: 'h3.headline',
            date: 'time.post-card__date'
        },
        default_mode: 'rewrite',
        auto_process: true,
        priority: 5,
        enabled: false
    },
    {
        id: '6',
        name: 'Anthropic News',
        code: 'anthropic',
        collection_type: 'scraping',
        scrape_url: 'https://www.anthropic.com/news',
        selectors: {
            list: 'article',
            title: 'h2',
            date: 'time'
        },
        default_mode: 'rewrite',
        auto_process: true,
        priority: 6,
        enabled: false
    }
];

// 상태 배지 컴포넌트
function StatusBadge({ enabled }: { enabled: boolean }) {
    return enabled ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            <CheckCircle className="w-3 h-3" />
            활성
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <Clock className="w-3 h-3" />
            비활성
        </span>
    );
}

// 수집 타입 배지
function TypeBadge({ type }: { type: 'rss' | 'scraping' | 'api' }) {
    const config = {
        rss: { color: 'bg-blue-100 text-blue-700', icon: Rss, label: 'RSS' },
        scraping: { color: 'bg-purple-100 text-purple-700', icon: Code, label: '스크래핑' },
        api: { color: 'bg-green-100 text-green-700', icon: Globe, label: 'API' }
    };
    const { color, icon: Icon, label } = config[type];

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${color}`}>
            <Icon className="w-3 h-3" />
            {label}
        </span>
    );
}

// 모드 배지
function ModeBadge({ mode }: { mode: 'reference' | 'rewrite' }) {
    return mode === 'rewrite' ? (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
            재구성
        </span>
    ) : (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
            참조용
        </span>
    );
}

// 수집처 추가/수정 모달
function SourceModal({
    isOpen,
    onClose,
    source,
    onSave
}: {
    isOpen: boolean;
    onClose: () => void;
    source: AISource | null;
    onSave: (source: Partial<AISource>) => void;
}) {
    const [formData, setFormData] = useState<Partial<AISource>>(
        source || {
            name: '',
            code: '',
            collection_type: 'rss',
            feed_url: '',
            scrape_url: '',
            default_mode: 'rewrite',
            auto_process: true,
            priority: 10,
            enabled: true
        }
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">
                        {source ? '수집처 수정' : '새 수집처 추가'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* 기본 정보 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                수집처 이름 *
                            </label>
                            <input
                                type="text"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                placeholder="예: TechCrunch AI"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                코드 *
                            </label>
                            <input
                                type="text"
                                value={formData.code || ''}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                placeholder="예: techcrunch"
                            />
                        </div>
                    </div>

                    {/* 수집 방식 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            수집 방식 *
                        </label>
                        <select
                            value={formData.collection_type || 'rss'}
                            onChange={(e) => setFormData({ ...formData, collection_type: e.target.value as 'rss' | 'scraping' | 'api' })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="rss">RSS 피드</option>
                            <option value="scraping">웹 스크래핑</option>
                            <option value="api">API</option>
                        </select>
                    </div>

                    {/* RSS URL */}
                    {formData.collection_type === 'rss' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                RSS URL *
                            </label>
                            <input
                                type="url"
                                value={formData.feed_url || ''}
                                onChange={(e) => setFormData({ ...formData, feed_url: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                placeholder="https://example.com/feed/"
                            />
                        </div>
                    )}

                    {/* 스크래핑 URL */}
                    {formData.collection_type === 'scraping' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    스크래핑 URL *
                                </label>
                                <input
                                    type="url"
                                    value={formData.scrape_url || ''}
                                    onChange={(e) => setFormData({ ...formData, scrape_url: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    placeholder="https://example.com/blog"
                                />
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">CSS 셀렉터</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        placeholder="목록 셀렉터"
                                        className="border border-gray-300 rounded px-2 py-1.5 text-sm"
                                        value={formData.selectors?.list || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            selectors: { ...formData.selectors, list: e.target.value }
                                        })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="제목 셀렉터"
                                        className="border border-gray-300 rounded px-2 py-1.5 text-sm"
                                        value={formData.selectors?.title || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            selectors: { ...formData.selectors, title: e.target.value }
                                        })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="본문 셀렉터"
                                        className="border border-gray-300 rounded px-2 py-1.5 text-sm"
                                        value={formData.selectors?.content || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            selectors: { ...formData.selectors, content: e.target.value }
                                        })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="날짜 셀렉터"
                                        className="border border-gray-300 rounded px-2 py-1.5 text-sm"
                                        value={formData.selectors?.date || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            selectors: { ...formData.selectors, date: e.target.value }
                                        })}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* 처리 모드 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                처리 모드
                            </label>
                            <select
                                value={formData.default_mode || 'rewrite'}
                                onChange={(e) => setFormData({ ...formData, default_mode: e.target.value as 'reference' | 'rewrite' })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="rewrite">재구성 (AI 재작성)</option>
                                <option value="reference">참조용 (링크 제공)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                우선순위
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={formData.priority || 10}
                                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    {/* 옵션 */}
                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.auto_process ?? true}
                                onChange={(e) => setFormData({ ...formData, auto_process: e.target.checked })}
                                className="rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-700">자동 처리</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.enabled ?? true}
                                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                                className="rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-700">활성화</span>
                        </label>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={() => {
                            onSave(formData);
                            onClose();
                        }}
                        className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                    >
                        {source ? '수정' : '추가'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AISourcesPage() {
    const [sources, setSources] = useState<AISource[]>(INITIAL_SOURCES);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'rss' | 'scraping' | 'api'>('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSource, setEditingSource] = useState<AISource | null>(null);

    // 필터링된 수집처
    const filteredSources = sources.filter(source => {
        const matchesSearch = source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            source.code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || source.collection_type === filterType;
        return matchesSearch && matchesType;
    });

    // 수집처 토글
    const toggleSource = (id: string) => {
        setSources(sources.map(s =>
            s.id === id ? { ...s, enabled: !s.enabled } : s
        ));
    };

    // 수집처 삭제
    const deleteSource = (id: string) => {
        if (confirm('이 수집처를 삭제하시겠습니까?')) {
            setSources(sources.filter(s => s.id !== id));
        }
    };

    // 수집처 저장
    const saveSource = (data: Partial<AISource>) => {
        if (editingSource) {
            setSources(sources.map(s =>
                s.id === editingSource.id ? { ...s, ...data } : s
            ));
        } else {
            setSources([...sources, { ...data, id: Date.now().toString() } as AISource]);
        }
    };

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <PageHeader
                title="AI 수집처 관리"
                description="해외 AI 뉴스 매체의 RSS/스크래핑 설정을 관리합니다"
                icon={Globe}
                iconBgColor="bg-blue-500"
                actions={
                    <button
                        onClick={() => {
                            setEditingSource(null);
                            setModalOpen(true);
                        }}
                        className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        수집처 추가
                    </button>
                }
            />

            {/* 필터 */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="수집처 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                </div>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as 'all' | 'rss' | 'scraping' | 'api')}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                    <option value="all">모든 타입</option>
                    <option value="rss">RSS</option>
                    <option value="scraping">스크래핑</option>
                    <option value="api">API</option>
                </select>
            </div>

            {/* 수집처 목록 */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">수집처</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">타입</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">모드</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">우선순위</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">상태</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">작업</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredSources.map((source) => (
                            <tr key={source.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3">
                                    <div>
                                        <p className="font-medium text-gray-900">{source.name}</p>
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <code className="bg-gray-100 px-1 rounded">{source.code}</code>
                                            {source.feed_url || source.scrape_url ? (
                                                <a
                                                    href={source.feed_url || source.scrape_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-500 hover:underline flex items-center gap-0.5"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            ) : null}
                                        </p>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <TypeBadge type={source.collection_type} />
                                </td>
                                <td className="px-4 py-3">
                                    <ModeBadge mode={source.default_mode} />
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-sm text-gray-600">{source.priority}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <StatusBadge enabled={source.enabled} />
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => toggleSource(source.id)}
                                            className={`p-1.5 rounded-lg transition-colors ${source.enabled ? 'text-amber-600 hover:bg-amber-50' : 'text-gray-400 hover:bg-gray-100'}`}
                                            title={source.enabled ? '비활성화' : '활성화'}
                                        >
                                            <PlayCircle className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingSource(source);
                                                setModalOpen(true);
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="수정"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteSource(source.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="삭제"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredSources.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Globe className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>검색 결과가 없습니다</p>
                    </div>
                )}
            </div>

            {/* 추가/수정 모달 */}
            <SourceModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditingSource(null);
                }}
                source={editingSource}
                onSave={saveSource}
            />
        </div>
    );
}

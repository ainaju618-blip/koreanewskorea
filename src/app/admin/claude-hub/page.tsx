'use client';

import { useState, useEffect } from 'react';
import {
    Database, FolderGit2, BookOpen, MessageSquare, RefreshCw, ExternalLink, Trash2,
    ChevronRight, ChevronDown, Folder, FileText, Globe, Layers, Box, X,
    Eye, Calendar, Tag
} from 'lucide-react';

interface Project {
    id: string;
    code: string;
    name: string;
    description?: string;
    path?: string;
    git_email: string;
    git_name: string;
    git_repo?: string;
    vercel_project?: string;
    tech_stack?: string[];
    status: string;
    created_at: string;
}

interface KnowledgeEntry {
    id: string;
    scope: string;
    project_code?: string;
    topic: string;
    title: string;
    summary: string;
    content?: string;
    tags?: string[];
    source_type?: string;
    created_at: string;
}

interface Stats {
    projects: number;
    knowledge: number;
    sessions: number;
    recentKnowledge: KnowledgeEntry[];
    topicCounts: Record<string, number>;
}

type TabType = 'dashboard' | 'projects' | 'knowledge';

// Korean translations
const SCOPE_LABELS: Record<string, string> = {
    global: '전역 (Global)',
    stack: '스택 (Stack)',
    project: '프로젝트 (Project)'
};

const SCOPE_ICONS: Record<string, React.ReactNode> = {
    global: <Globe className="w-4 h-4" />,
    stack: <Layers className="w-4 h-4" />,
    project: <Box className="w-4 h-4" />
};

const TOPIC_LABELS: Record<string, string> = {
    prompting: '프롬프팅',
    development: '개발',
    troubleshooting: '문제해결',
    workflow: '워크플로우',
    reference: '참조',
    general: '일반'
};

export default function ClaudeHubPage() {
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [stats, setStats] = useState<Stats | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTopic, setSelectedTopic] = useState<string>('');

    // For hierarchical view
    const [expandedScopes, setExpandedScopes] = useState<Set<string>>(new Set(['global', 'stack', 'project']));
    const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
    const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        if (activeTab === 'projects') {
            fetchProjects();
        } else if (activeTab === 'knowledge') {
            fetchKnowledge();
        }
    }, [activeTab, selectedTopic]);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/claude-hub/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/claude-hub/projects');
            if (res.ok) {
                const data = await res.json();
                setProjects(data.projects || []);
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchKnowledge = async () => {
        setLoading(true);
        try {
            let url = '/api/claude-hub/knowledge?limit=100';
            if (selectedTopic) {
                url += `&topic=${selectedTopic}`;
            }
            if (searchQuery) {
                url += `&search=${encodeURIComponent(searchQuery)}`;
            }
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setKnowledge(data.entries || []);
            }
        } catch (error) {
            console.error('Failed to fetch knowledge:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        if (activeTab === 'knowledge') {
            fetchKnowledge();
        }
    };

    const deleteKnowledge = async (id: string) => {
        if (!confirm('이 지식 항목을 삭제하시겠습니까?')) return;
        try {
            const res = await fetch(`/api/claude-hub/knowledge/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchKnowledge();
                fetchStats();
                if (selectedEntry?.id === id) {
                    setSelectedEntry(null);
                }
            }
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    const toggleScope = (scope: string) => {
        const newExpanded = new Set(expandedScopes);
        if (newExpanded.has(scope)) {
            newExpanded.delete(scope);
        } else {
            newExpanded.add(scope);
        }
        setExpandedScopes(newExpanded);
    };

    const toggleTopic = (key: string) => {
        const newExpanded = new Set(expandedTopics);
        if (newExpanded.has(key)) {
            newExpanded.delete(key);
        } else {
            newExpanded.add(key);
        }
        setExpandedTopics(newExpanded);
    };

    // Group knowledge by scope and topic
    const groupedKnowledge = knowledge.reduce((acc, entry) => {
        const scope = entry.scope || 'global';
        const topic = entry.topic || 'general';

        if (!acc[scope]) acc[scope] = {};
        if (!acc[scope][topic]) acc[scope][topic] = [];
        acc[scope][topic].push(entry);

        return acc;
    }, {} as Record<string, Record<string, KnowledgeEntry[]>>);

    const TOPICS = ['prompting', 'development', 'troubleshooting', 'workflow', 'reference', 'general'];
    const SCOPES = ['global', 'stack', 'project'];

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                        <Database className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-100">Claude Hub</h1>
                        <p className="text-sm text-slate-400">AI 지식 관리 시스템</p>
                    </div>
                </div>
                <button
                    onClick={() => { fetchStats(); if (activeTab === 'projects') fetchProjects(); else if (activeTab === 'knowledge') fetchKnowledge(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    새로고침
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-slate-800 p-1 rounded-lg w-fit">
                {[
                    { id: 'dashboard', label: '대시보드', icon: Database },
                    { id: 'projects', label: '프로젝트', icon: FolderGit2 },
                    { id: 'knowledge', label: '지식 관리', icon: BookOpen },
                ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                                activeTab === tab.id
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && stats && (
                <div className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-900/50 rounded-lg flex items-center justify-center">
                                    <FolderGit2 className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-slate-100">{stats.projects}</p>
                                    <p className="text-sm text-slate-400">프로젝트</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-900/50 rounded-lg flex items-center justify-center">
                                    <BookOpen className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-slate-100">{stats.knowledge}</p>
                                    <p className="text-sm text-slate-400">지식 항목</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-900/50 rounded-lg flex items-center justify-center">
                                    <MessageSquare className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-slate-100">{stats.sessions}</p>
                                    <p className="text-sm text-slate-400">세션 로그</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Topic Distribution */}
                    {Object.keys(stats.topicCounts).length > 0 && (
                        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                            <h3 className="text-lg font-semibold text-slate-100 mb-4">주제별 지식 분포</h3>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(stats.topicCounts).map(([topic, count]) => (
                                    <span
                                        key={topic}
                                        className="px-3 py-1.5 bg-slate-700 rounded-full text-sm font-medium text-slate-300"
                                    >
                                        {TOPIC_LABELS[topic] || topic}: {count}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Knowledge */}
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                        <h3 className="text-lg font-semibold text-slate-100 mb-4">최근 지식</h3>
                        {stats.recentKnowledge.length > 0 ? (
                            <div className="space-y-3">
                                {stats.recentKnowledge.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                                        onClick={() => { setActiveTab('knowledge'); }}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-100 truncate">{entry.title}</p>
                                            <p className="text-sm text-slate-400">
                                                {SCOPE_LABELS[entry.scope] || entry.scope} / {TOPIC_LABELS[entry.topic] || entry.topic}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-center py-8">등록된 지식이 없습니다</p>
                        )}
                    </div>
                </div>
            )}

            {/* Projects Tab */}
            {activeTab === 'projects' && (
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-12 text-slate-400">불러오는 중...</div>
                    ) : projects.length > 0 ? (
                        <div className="grid gap-4">
                            {projects.map((project) => (
                                <div
                                    key={project.id}
                                    className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-slate-100">{project.name}</h3>
                                                <span className="px-2 py-0.5 bg-emerald-900/50 text-emerald-400 text-xs font-medium rounded-full">
                                                    {project.status === 'active' ? '활성' : project.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-400 mb-3">{project.code}</p>
                                            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                                                <span>Git: {project.git_email}</span>
                                                {project.git_repo && (
                                                    <a
                                                        href={`https://github.com/${project.git_repo}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-blue-400 hover:underline"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                        {project.git_repo}
                                                    </a>
                                                )}
                                            </div>
                                            {project.tech_stack && project.tech_stack.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-3">
                                                    {project.tech_stack.map((tech) => (
                                                        <span
                                                            key={tech}
                                                            className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded"
                                                        >
                                                            {tech}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-400">프로젝트가 없습니다</div>
                    )}
                </div>
            )}

            {/* Knowledge Tab - Hierarchical View */}
            {activeTab === 'knowledge' && (
                <div className="flex gap-6">
                    {/* Left Panel - Tree View */}
                    <div className="w-1/2 space-y-4">
                        {/* Search Filter */}
                        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="지식 검색..."
                                    className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                <button
                                    onClick={handleSearch}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                                >
                                    검색
                                </button>
                            </div>
                        </div>

                        {/* Tree View */}
                        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                                지식 계층 구조
                            </h3>

                            {loading ? (
                                <div className="text-center py-8 text-slate-400">불러오는 중...</div>
                            ) : knowledge.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">등록된 지식이 없습니다</div>
                            ) : (
                                <div className="space-y-1">
                                    {SCOPES.map((scope) => {
                                        const scopeData = groupedKnowledge[scope];
                                        if (!scopeData || Object.keys(scopeData).length === 0) return null;

                                        const isExpanded = expandedScopes.has(scope);
                                        const totalCount = Object.values(scopeData).reduce((sum, arr) => sum + arr.length, 0);

                                        return (
                                            <div key={scope}>
                                                {/* Scope Level */}
                                                <button
                                                    onClick={() => toggleScope(scope)}
                                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors text-left"
                                                >
                                                    {isExpanded ? (
                                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                                    )}
                                                    <span className="text-emerald-400">{SCOPE_ICONS[scope]}</span>
                                                    <span className="font-medium text-slate-200">{SCOPE_LABELS[scope]}</span>
                                                    <span className="ml-auto text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">
                                                        {totalCount}
                                                    </span>
                                                </button>

                                                {/* Topics under this scope */}
                                                {isExpanded && (
                                                    <div className="ml-6 mt-1 space-y-1">
                                                        {Object.entries(scopeData).map(([topic, entries]) => {
                                                            const topicKey = `${scope}-${topic}`;
                                                            const isTopicExpanded = expandedTopics.has(topicKey);

                                                            return (
                                                                <div key={topicKey}>
                                                                    {/* Topic Level */}
                                                                    <button
                                                                        onClick={() => toggleTopic(topicKey)}
                                                                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-700/50 transition-colors text-left"
                                                                    >
                                                                        {isTopicExpanded ? (
                                                                            <ChevronDown className="w-3 h-3 text-slate-500" />
                                                                        ) : (
                                                                            <ChevronRight className="w-3 h-3 text-slate-500" />
                                                                        )}
                                                                        <Folder className="w-4 h-4 text-yellow-500" />
                                                                        <span className="text-sm text-slate-300">{TOPIC_LABELS[topic] || topic}</span>
                                                                        <span className="ml-auto text-xs text-slate-500">
                                                                            {entries.length}
                                                                        </span>
                                                                    </button>

                                                                    {/* Entries under this topic */}
                                                                    {isTopicExpanded && (
                                                                        <div className="ml-6 mt-1 space-y-0.5">
                                                                            {entries.map((entry) => (
                                                                                <button
                                                                                    key={entry.id}
                                                                                    onClick={() => setSelectedEntry(entry)}
                                                                                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-left ${
                                                                                        selectedEntry?.id === entry.id
                                                                                            ? 'bg-emerald-900/50 text-emerald-300'
                                                                                            : 'hover:bg-slate-700/30 text-slate-400'
                                                                                    }`}
                                                                                >
                                                                                    <FileText className="w-3 h-3 flex-shrink-0" />
                                                                                    <span className="text-sm truncate">{entry.title}</span>
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Detail View */}
                    <div className="w-1/2">
                        {selectedEntry ? (
                            <div className="bg-slate-800 rounded-xl border border-slate-700 h-full">
                                {/* Header */}
                                <div className="flex items-start justify-between p-4 border-b border-slate-700">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-0.5 bg-emerald-900/50 text-emerald-400 text-xs font-medium rounded">
                                                {SCOPE_LABELS[selectedEntry.scope] || selectedEntry.scope}
                                            </span>
                                            <span className="px-2 py-0.5 bg-blue-900/50 text-blue-400 text-xs font-medium rounded">
                                                {TOPIC_LABELS[selectedEntry.topic] || selectedEntry.topic}
                                            </span>
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-100">{selectedEntry.title}</h2>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => deleteKnowledge(selectedEntry.id)}
                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                                            title="삭제"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setSelectedEntry(null)}
                                            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
                                            title="닫기"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Meta Info */}
                                <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
                                    <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(selectedEntry.created_at)}
                                        </span>
                                        {selectedEntry.source_type && (
                                            <span className="flex items-center gap-1">
                                                <FileText className="w-3 h-3" />
                                                {selectedEntry.source_type}
                                            </span>
                                        )}
                                    </div>
                                    {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {selectedEntry.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700 text-slate-400 text-xs rounded"
                                                >
                                                    <Tag className="w-2.5 h-2.5" />
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-4 overflow-y-auto max-h-[calc(100vh-400px)]">
                                    <div className="space-y-4">
                                        {/* Summary */}
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                                요약
                                            </h3>
                                            <p className="text-slate-300 leading-relaxed">{selectedEntry.summary}</p>
                                        </div>

                                        {/* Full Content */}
                                        {selectedEntry.content && (
                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                                    상세 내용
                                                </h3>
                                                <div className="prose prose-invert prose-sm max-w-none">
                                                    <pre className="whitespace-pre-wrap text-slate-300 text-sm leading-relaxed bg-slate-900/50 p-4 rounded-lg overflow-x-auto">
                                                        {selectedEntry.content}
                                                    </pre>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-800 rounded-xl border border-slate-700 h-full flex items-center justify-center">
                                <div className="text-center text-slate-500 p-8">
                                    <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-medium mb-2">지식 항목을 선택하세요</p>
                                    <p className="text-sm">왼쪽 트리에서 항목을 클릭하면<br />상세 내용을 확인할 수 있습니다</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

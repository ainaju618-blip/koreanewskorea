'use client';

import { useState, useEffect } from 'react';
import { Database, FolderGit2, BookOpen, MessageSquare, Plus, Search, RefreshCw, ExternalLink, Trash2, Edit, ChevronRight } from 'lucide-react';

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

export default function ClaudeHubPage() {
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [stats, setStats] = useState<Stats | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTopic, setSelectedTopic] = useState<string>('');

    // Load stats
    useEffect(() => {
        fetchStats();
    }, []);

    // Load data based on active tab
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
        if (!confirm('Are you sure you want to delete this entry?')) return;
        try {
            const res = await fetch(`/api/claude-hub/knowledge/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchKnowledge();
                fetchStats();
            }
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    const TOPICS = ['prompting', 'development', 'troubleshooting', 'workflow', 'reference', 'general'];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                        <Database className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Claude Hub</h1>
                        <p className="text-sm text-slate-500">Knowledge Management System</p>
                    </div>
                </div>
                <button
                    onClick={() => { fetchStats(); if (activeTab === 'projects') fetchProjects(); else if (activeTab === 'knowledge') fetchKnowledge(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
                {[
                    { id: 'dashboard', label: 'Dashboard', icon: Database },
                    { id: 'projects', label: 'Projects', icon: FolderGit2 },
                    { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
                ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                                activeTab === tab.id
                                    ? 'bg-white text-emerald-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
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
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FolderGit2 className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-slate-900">{stats.projects}</p>
                                    <p className="text-sm text-slate-500">Projects</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                                    <BookOpen className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-slate-900">{stats.knowledge}</p>
                                    <p className="text-sm text-slate-500">Knowledge Entries</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <MessageSquare className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-slate-900">{stats.sessions}</p>
                                    <p className="text-sm text-slate-500">Session Logs</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Topic Distribution */}
                    {Object.keys(stats.topicCounts).length > 0 && (
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Knowledge by Topic</h3>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(stats.topicCounts).map(([topic, count]) => (
                                    <span
                                        key={topic}
                                        className="px-3 py-1.5 bg-slate-100 rounded-full text-sm font-medium text-slate-700"
                                    >
                                        {topic}: {count}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Knowledge */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Knowledge</h3>
                        {stats.recentKnowledge.length > 0 ? (
                            <div className="space-y-3">
                                {stats.recentKnowledge.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                        onClick={() => { setActiveTab('knowledge'); }}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 truncate">{entry.title}</p>
                                            <p className="text-sm text-slate-500">
                                                {entry.scope} / {entry.topic}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-center py-8">No knowledge entries yet</p>
                        )}
                    </div>
                </div>
            )}

            {/* Projects Tab */}
            {activeTab === 'projects' && (
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-12 text-slate-500">Loading...</div>
                    ) : projects.length > 0 ? (
                        <div className="grid gap-4">
                            {projects.map((project) => (
                                <div
                                    key={project.id}
                                    className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-slate-900">{project.name}</h3>
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                                                    {project.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-3">{project.code}</p>
                                            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                                                <span>Git: {project.git_email}</span>
                                                {project.git_repo && (
                                                    <a
                                                        href={`https://github.com/${project.git_repo}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-blue-600 hover:underline"
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
                                                            className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded"
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
                        <div className="text-center py-12 text-slate-500">No projects found</div>
                    )}
                </div>
            )}

            {/* Knowledge Tab */}
            {activeTab === 'knowledge' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Search knowledge..."
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                        <select
                            value={selectedTopic}
                            onChange={(e) => setSelectedTopic(e.target.value)}
                            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="">All Topics</option>
                            {TOPICS.map((topic) => (
                                <option key={topic} value={topic}>{topic}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleSearch}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                        >
                            Search
                        </button>
                    </div>

                    {/* Knowledge List */}
                    {loading ? (
                        <div className="text-center py-12 text-slate-500">Loading...</div>
                    ) : knowledge.length > 0 ? (
                        <div className="space-y-3">
                            {knowledge.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                                                    {entry.scope}
                                                </span>
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                                    {entry.topic}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-slate-900 mb-2">{entry.title}</h3>
                                            <p className="text-sm text-slate-600 line-clamp-2">{entry.summary}</p>
                                            {entry.tags && entry.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-3">
                                                    {entry.tags.map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded"
                                                        >
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => deleteKnowledge(entry.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500">No knowledge entries found</div>
                    )}
                </div>
            )}
        </div>
    );
}

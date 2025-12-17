'use client';

import { useState, useEffect } from 'react';
import {
    Database, FolderGit2, BookOpen, MessageSquare, RefreshCw, ExternalLink, Trash2,
    ChevronRight, ChevronDown, Folder, FileText, Globe, Layers, Box, X,
    Eye, Calendar, Tag, Plus, Save, Link, History, Clock
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

interface UsageLog {
    id: string;
    knowledge_id: string;
    used_at: string;
    context: string;
    outcome?: string;
    project_code?: string;
}

interface KnowledgeEntry {
    id: string;
    scope: string;
    project_code?: string;
    project_codes?: string[];
    topic: string;
    title: string;
    summary: string;
    content?: string;
    tags?: string[];
    source_type?: string;
    created_at: string;
    usage_count?: number;
}

interface Stats {
    projects: number;
    knowledge: number;
    sessions: number;
    recentKnowledge: KnowledgeEntry[];
    topicCounts: Record<string, number>;
}

interface NewKnowledge {
    title: string;
    scope: string;
    topic: string;
    summary: string;
    content: string;
    tags: string;
    source_type: string;
    project_codes: string[];
}

interface NewProject {
    code: string;
    name: string;
    description: string;
    git_email: string;
    git_name: string;
    git_repo: string;
    tech_stack: string;
}

interface NewUsageLog {
    context: string;
    outcome: string;
    project_code: string;
}

interface Session {
    id: string;
    project_code?: string;
    session_date: string;
    summary: string;
    tasks_completed: string[];
    decisions_made: string[];
    issues_found: string[];
    knowledge_ids: string[];
    created_at: string;
}

interface NewSession {
    project_code: string;
    summary: string;
    tasks_completed: string;
    decisions_made: string;
    issues_found: string;
    knowledge_ids: string[];
}

type TabType = 'dashboard' | 'projects' | 'knowledge' | 'sessions';
type ModalType = 'none' | 'addKnowledge' | 'addProject' | 'addUsage' | 'viewUsage' | 'addSession' | 'viewSession' | 'createKnowledgeFromSession';

// Korean translations
const SCOPE_LABELS: Record<string, string> = {
    global: '(Global)',
    stack: '(Stack)',
    project: '(Project)'
};

const SCOPE_ICONS: Record<string, React.ReactNode> = {
    global: <Globe className="w-4 h-4" />,
    stack: <Layers className="w-4 h-4" />,
    project: <Box className="w-4 h-4" />
};

const TOPIC_LABELS: Record<string, string> = {
    prompting: 'Prompting',
    development: 'Development',
    troubleshooting: 'Troubleshooting',
    workflow: 'Workflow',
    reference: 'Reference',
    general: 'General'
};

const SOURCE_TYPES = [
    { value: 'manual', label: 'Manual Input' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'document', label: 'Document' },
    { value: 'article', label: 'Article/Blog' },
    { value: 'code', label: 'Code' },
    { value: 'session', label: 'Session Log' },
    { value: 'other', label: 'Other' }
];

export default function ClaudeHubPage() {
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [stats, setStats] = useState<Stats | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // For hierarchical view
    const [expandedScopes, setExpandedScopes] = useState<Set<string>>(new Set(['global', 'stack', 'project']));
    const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
    const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);

    // Modals
    const [activeModal, setActiveModal] = useState<ModalType>('none');
    const [saving, setSaving] = useState(false);

    // New Knowledge form
    const [newKnowledge, setNewKnowledge] = useState<NewKnowledge>({
        title: '',
        scope: 'global',
        topic: 'general',
        summary: '',
        content: '',
        tags: '',
        source_type: 'manual',
        project_codes: []
    });

    // New Project form
    const [newProject, setNewProject] = useState<NewProject>({
        code: '',
        name: '',
        description: '',
        git_email: '',
        git_name: '',
        git_repo: '',
        tech_stack: ''
    });

    // Usage logs
    const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
    const [newUsageLog, setNewUsageLog] = useState<NewUsageLog>({
        context: '',
        outcome: '',
        project_code: ''
    });

    // Sessions
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [newSession, setNewSession] = useState<NewSession>({
        project_code: '',
        summary: '',
        tasks_completed: '',
        decisions_made: '',
        issues_found: '',
        knowledge_ids: []
    });

    useEffect(() => {
        fetchStats();
        fetchProjects();
    }, []);

    useEffect(() => {
        if (activeTab === 'projects') {
            fetchProjects();
        } else if (activeTab === 'knowledge') {
            fetchKnowledge();
        } else if (activeTab === 'sessions') {
            fetchSessions();
        }
    }, [activeTab]);

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
        try {
            const res = await fetch('/api/claude-hub/projects');
            if (res.ok) {
                const data = await res.json();
                setProjects(data.projects || []);
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        }
    };

    const fetchKnowledge = async () => {
        setLoading(true);
        try {
            let url = '/api/claude-hub/knowledge?limit=100';
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

    const fetchUsageLogs = async (knowledgeId: string) => {
        try {
            const res = await fetch(`/api/claude-hub/knowledge/${knowledgeId}/usage`);
            if (res.ok) {
                const data = await res.json();
                setUsageLogs(data.logs || []);
            }
        } catch {
            setUsageLogs([]);
        }
    };

    const fetchSessions = async () => {
        try {
            const res = await fetch('/api/claude-hub/sessions');
            if (res.ok) {
                const data = await res.json();
                setSessions(data || []);
            }
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        }
    };

    const handleAddSession = async () => {
        if (!newSession.summary.trim()) return;
        setSaving(true);
        try {
            const res = await fetch('/api/claude-hub/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project_code: newSession.project_code || null,
                    summary: newSession.summary.trim(),
                    tasks_completed: newSession.tasks_completed.split('\n').filter(t => t.trim()),
                    decisions_made: newSession.decisions_made.split('\n').filter(d => d.trim()),
                    issues_found: newSession.issues_found.split('\n').filter(i => i.trim()),
                    knowledge_ids: newSession.knowledge_ids
                })
            });
            if (res.ok) {
                setActiveModal('none');
                setNewSession({
                    project_code: '',
                    summary: '',
                    tasks_completed: '',
                    decisions_made: '',
                    issues_found: '',
                    knowledge_ids: []
                });
                fetchSessions();
                fetchStats();
            }
        } catch (error) {
            console.error('Failed to create session:', error);
        } finally {
            setSaving(false);
        }
    };

    const deleteSession = async (id: string) => {
        if (!confirm('Delete this session log?')) return;
        try {
            const res = await fetch(`/api/claude-hub/sessions/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchSessions();
                fetchStats();
                setSelectedSession(null);
            }
        } catch (error) {
            console.error('Failed to delete session:', error);
        }
    };

    const toggleSessionKnowledge = (id: string) => {
        const ids = [...newSession.knowledge_ids];
        const idx = ids.indexOf(id);
        if (idx >= 0) {
            ids.splice(idx, 1);
        } else {
            ids.push(id);
        }
        setNewSession({ ...newSession, knowledge_ids: ids });
    };

    const createKnowledgeFromSession = (session: Session) => {
        setNewKnowledge({
            title: `Session: ${session.session_date}`,
            scope: 'project',
            topic: 'workflow',
            summary: session.summary,
            content: [
                '## Tasks Completed',
                ...(session.tasks_completed || []).map(t => `- ${t}`),
                '',
                '## Decisions Made',
                ...(session.decisions_made || []).map(d => `- ${d}`),
                '',
                '## Issues Found',
                ...(session.issues_found || []).map(i => `- ${i}`)
            ].join('\n'),
            tags: 'session',
            source_type: 'session',
            project_codes: session.project_code ? [session.project_code] : []
        });
        setActiveModal('addKnowledge');
    };

    const handleSearch = () => {
        if (activeTab === 'knowledge') {
            fetchKnowledge();
        }
    };

    const deleteKnowledge = async (id: string) => {
        if (!confirm('Delete this knowledge entry?')) return;
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

    const deleteProject = async (id: string) => {
        if (!confirm('Delete this project?')) return;
        try {
            const res = await fetch(`/api/claude-hub/projects/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchProjects();
                fetchStats();
            }
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    const handleAddKnowledge = async () => {
        if (!newKnowledge.title.trim() || !newKnowledge.summary.trim()) {
            alert('Title and summary are required.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...newKnowledge,
                tags: newKnowledge.tags.split(',').map(t => t.trim()).filter(t => t),
                project_codes: newKnowledge.project_codes
            };

            const res = await fetch('/api/claude-hub/knowledge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setActiveModal('none');
                setNewKnowledge({
                    title: '',
                    scope: 'global',
                    topic: 'general',
                    summary: '',
                    content: '',
                    tags: '',
                    source_type: 'manual',
                    project_codes: []
                });
                fetchKnowledge();
                fetchStats();
            } else {
                const error = await res.json();
                alert(`Save failed: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to save:', error);
            alert('Error occurred while saving.');
        } finally {
            setSaving(false);
        }
    };

    const handleAddProject = async () => {
        if (!newProject.code.trim() || !newProject.name.trim() || !newProject.git_email.trim()) {
            alert('Code, name, and git email are required.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...newProject,
                tech_stack: newProject.tech_stack.split(',').map(t => t.trim()).filter(t => t)
            };

            const res = await fetch('/api/claude-hub/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setActiveModal('none');
                setNewProject({
                    code: '',
                    name: '',
                    description: '',
                    git_email: '',
                    git_name: '',
                    git_repo: '',
                    tech_stack: ''
                });
                fetchProjects();
                fetchStats();
            } else {
                const error = await res.json();
                alert(`Save failed: ${error.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to save:', error);
            alert('Error occurred while saving.');
        } finally {
            setSaving(false);
        }
    };

    const handleAddUsageLog = async () => {
        if (!selectedEntry || !newUsageLog.context.trim()) {
            alert('Please provide usage context.');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/claude-hub/knowledge/${selectedEntry.id}/usage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUsageLog)
            });

            if (res.ok) {
                setActiveModal('none');
                setNewUsageLog({ context: '', outcome: '', project_code: '' });
                fetchUsageLogs(selectedEntry.id);
                fetchKnowledge();
            } else {
                alert('Failed to add usage log.');
            }
        } catch (error) {
            console.error('Failed to save:', error);
        } finally {
            setSaving(false);
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

    const toggleProjectCode = (code: string) => {
        const codes = [...newKnowledge.project_codes];
        const idx = codes.indexOf(code);
        if (idx >= 0) {
            codes.splice(idx, 1);
        } else {
            codes.push(code);
        }
        setNewKnowledge({ ...newKnowledge, project_codes: codes });
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

    const openUsageModal = () => {
        if (selectedEntry) {
            fetchUsageLogs(selectedEntry.id);
            setActiveModal('viewUsage');
        }
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
                        <p className="text-sm text-slate-400">AI Knowledge Management System</p>
                    </div>
                </div>
                <button
                    onClick={() => { fetchStats(); fetchProjects(); if (activeTab === 'knowledge') fetchKnowledge(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-slate-800 p-1 rounded-lg w-fit">
                {[
                    { id: 'dashboard', label: 'Dashboard', icon: Database },
                    { id: 'projects', label: 'Projects', icon: FolderGit2 },
                    { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
                    { id: 'sessions', label: 'Sessions', icon: MessageSquare },
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
                                    <p className="text-sm text-slate-400">Projects</p>
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
                                    <p className="text-sm text-slate-400">Knowledge Entries</p>
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
                                    <p className="text-sm text-slate-400">Session Logs</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Topic Distribution */}
                    {Object.keys(stats.topicCounts).length > 0 && (
                        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                            <h3 className="text-lg font-semibold text-slate-100 mb-4">Knowledge Distribution by Topic</h3>
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
                        <h3 className="text-lg font-semibold text-slate-100 mb-4">Recent Knowledge</h3>
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
                            <p className="text-slate-500 text-center py-8">No knowledge entries yet</p>
                        )}
                    </div>
                </div>
            )}

            {/* Projects Tab */}
            {activeTab === 'projects' && (
                <div className="space-y-4">
                    {/* Add Project Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={() => setActiveModal('addProject')}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Project
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-slate-400">Loading...</div>
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
                                                    {project.status === 'active' ? 'Active' : project.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 mb-3 font-mono">{project.code}</p>
                                            {project.description && (
                                                <p className="text-sm text-slate-400 mb-3">{project.description}</p>
                                            )}
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
                                        <button
                                            onClick={() => deleteProject(project.code)}
                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-slate-400 mb-4">No projects registered yet</p>
                            <button
                                onClick={() => setActiveModal('addProject')}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add First Project
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Knowledge Tab - Hierarchical View */}
            {activeTab === 'knowledge' && (
                <div className="flex gap-6">
                    {/* Left Panel - Tree View */}
                    <div className="w-1/2 space-y-4">
                        {/* Search Filter & Add Button */}
                        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Search knowledge..."
                                    className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                <button
                                    onClick={handleSearch}
                                    className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
                                >
                                    Search
                                </button>
                                <button
                                    onClick={() => setActiveModal('addKnowledge')}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Tree View */}
                        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                                Knowledge Hierarchy
                            </h3>

                            {loading ? (
                                <div className="text-center py-8 text-slate-400">Loading...</div>
                            ) : knowledge.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <p className="mb-4">No knowledge entries yet</p>
                                    <button
                                        onClick={() => setActiveModal('addKnowledge')}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add First Entry
                                    </button>
                                </div>
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
                                                                                    {entry.usage_count && entry.usage_count > 0 && (
                                                                                        <span className="ml-auto text-xs bg-blue-900/50 text-blue-400 px-1.5 py-0.5 rounded">
                                                                                            {entry.usage_count}x
                                                                                        </span>
                                                                                    )}
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
                                            onClick={openUsageModal}
                                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"
                                            title="Usage History"
                                        >
                                            <History className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setActiveModal('addUsage')}
                                            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-900/30 rounded-lg transition-colors"
                                            title="Log Usage"
                                        >
                                            <Clock className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteKnowledge(selectedEntry.id)}
                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setSelectedEntry(null)}
                                            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
                                            title="Close"
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
                                                {SOURCE_TYPES.find(s => s.value === selectedEntry.source_type)?.label || selectedEntry.source_type}
                                            </span>
                                        )}
                                    </div>
                                    {/* Linked Projects */}
                                    {selectedEntry.project_codes && selectedEntry.project_codes.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <Link className="w-3 h-3" />
                                                Projects:
                                            </span>
                                            {selectedEntry.project_codes.map((code) => (
                                                <span
                                                    key={code}
                                                    className="px-2 py-0.5 bg-purple-900/50 text-purple-400 text-xs rounded"
                                                >
                                                    {code}
                                                </span>
                                            ))}
                                        </div>
                                    )}
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
                                                Summary
                                            </h3>
                                            <p className="text-slate-300 leading-relaxed">{selectedEntry.summary}</p>
                                        </div>

                                        {/* Full Content */}
                                        {selectedEntry.content && (
                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                                    Full Content
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
                                    <p className="text-lg font-medium mb-2">Select a Knowledge Entry</p>
                                    <p className="text-sm">Click an item in the tree<br />to view details</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Sessions Tab */}
            {activeTab === 'sessions' && (
                <div className="grid grid-cols-2 gap-6">
                    {/* Left Panel - Session List */}
                    <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-200">Session Logs</h2>
                            <button
                                onClick={() => {
                                    fetchKnowledge();
                                    setActiveModal('addSession');
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Session
                            </button>
                        </div>

                        {/* Session List */}
                        <div className="bg-slate-800 rounded-xl border border-slate-700 divide-y divide-slate-700">
                            {sessions.length === 0 ? (
                                <div className="text-center py-12">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                                    <p className="text-slate-400 mb-4">No session logs yet</p>
                                    <button
                                        onClick={() => {
                                            fetchKnowledge();
                                            setActiveModal('addSession');
                                        }}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add First Session
                                    </button>
                                </div>
                            ) : (
                                sessions.map((session) => (
                                    <div
                                        key={session.id}
                                        onClick={() => setSelectedSession(session)}
                                        className={`p-4 cursor-pointer transition-colors ${
                                            selectedSession?.id === session.id
                                                ? 'bg-emerald-900/30'
                                                : 'hover:bg-slate-700/50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm font-medium text-slate-300">{session.session_date}</span>
                                            </div>
                                            {session.project_code && (
                                                <span className="px-2 py-0.5 bg-purple-900/50 text-purple-400 text-xs rounded">
                                                    {session.project_code}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-slate-300 text-sm line-clamp-2">{session.summary}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                            {session.tasks_completed?.length > 0 && (
                                                <span>{session.tasks_completed.length} tasks</span>
                                            )}
                                            {session.knowledge_ids?.length > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <BookOpen className="w-3 h-3" />
                                                    {session.knowledge_ids.length} knowledge
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Session Detail */}
                    <div>
                        {selectedSession ? (
                            <div className="bg-slate-800 rounded-xl border border-slate-700">
                                {/* Header */}
                                <div className="flex items-start justify-between p-4 border-b border-slate-700">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="w-4 h-4 text-emerald-400" />
                                            <span className="font-semibold text-slate-200">{selectedSession.session_date}</span>
                                            {selectedSession.project_code && (
                                                <span className="px-2 py-0.5 bg-purple-900/50 text-purple-400 text-xs rounded">
                                                    {selectedSession.project_code}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => createKnowledgeFromSession(selectedSession)}
                                            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-900/30 rounded-lg transition-colors"
                                            title="Create Knowledge from Session"
                                        >
                                            <BookOpen className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteSession(selectedSession.id)}
                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setSelectedSession(null)}
                                            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
                                            title="Close"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4 space-y-4">
                                    {/* Summary */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Summary</h3>
                                        <p className="text-slate-300">{selectedSession.summary}</p>
                                    </div>

                                    {/* Tasks Completed */}
                                    {selectedSession.tasks_completed?.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Tasks Completed</h3>
                                            <ul className="space-y-1">
                                                {selectedSession.tasks_completed.map((task, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-slate-300">
                                                        <span className="text-emerald-400 mt-1">-</span>
                                                        {task}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Decisions Made */}
                                    {selectedSession.decisions_made?.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Decisions Made</h3>
                                            <ul className="space-y-1">
                                                {selectedSession.decisions_made.map((decision, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-slate-300">
                                                        <span className="text-blue-400 mt-1">-</span>
                                                        {decision}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Issues Found */}
                                    {selectedSession.issues_found?.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Issues Found</h3>
                                            <ul className="space-y-1">
                                                {selectedSession.issues_found.map((issue, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-slate-300">
                                                        <span className="text-yellow-400 mt-1">-</span>
                                                        {issue}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Linked Knowledge */}
                                    {selectedSession.knowledge_ids?.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                                <Link className="w-3 h-3 inline mr-1" />
                                                Referenced Knowledge
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedSession.knowledge_ids.map((id) => {
                                                    const k = knowledge.find(k => k.id === id);
                                                    return k ? (
                                                        <span
                                                            key={id}
                                                            onClick={() => {
                                                                setSelectedEntry(k);
                                                                setActiveTab('knowledge');
                                                            }}
                                                            className="px-2 py-1 bg-slate-700 text-slate-300 text-sm rounded cursor-pointer hover:bg-slate-600"
                                                        >
                                                            {k.title}
                                                        </span>
                                                    ) : (
                                                        <span key={id} className="px-2 py-1 bg-slate-700/50 text-slate-500 text-sm rounded">
                                                            {id.slice(0, 8)}...
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-800 rounded-xl border border-slate-700 h-full flex items-center justify-center min-h-[400px]">
                                <div className="text-center text-slate-500 p-8">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-medium mb-2">Select a Session</p>
                                    <p className="text-sm">Click a session to view details</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Add Knowledge Modal */}
            {activeModal === 'addKnowledge' && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-700 sticky top-0 bg-slate-800">
                            <h2 className="text-xl font-bold text-slate-100">Add New Knowledge</h2>
                            <button
                                onClick={() => setActiveModal('none')}
                                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Title <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newKnowledge.title}
                                    onChange={(e) => setNewKnowledge({ ...newKnowledge, title: e.target.value })}
                                    placeholder="Enter knowledge title"
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            {/* Scope & Topic */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Scope</label>
                                    <select
                                        value={newKnowledge.scope}
                                        onChange={(e) => setNewKnowledge({ ...newKnowledge, scope: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        {SCOPES.map((scope) => (
                                            <option key={scope} value={scope}>{SCOPE_LABELS[scope]}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Topic</label>
                                    <select
                                        value={newKnowledge.topic}
                                        onChange={(e) => setNewKnowledge({ ...newKnowledge, topic: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        {TOPICS.map((topic) => (
                                            <option key={topic} value={topic}>{TOPIC_LABELS[topic]}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Source Type */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Source Type</label>
                                <select
                                    value={newKnowledge.source_type}
                                    onChange={(e) => setNewKnowledge({ ...newKnowledge, source_type: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    {SOURCE_TYPES.map((type) => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Linked Projects */}
                            {projects.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        <Link className="w-3 h-3 inline mr-1" />
                                        Link to Projects
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {projects.map((proj) => (
                                            <button
                                                key={proj.code}
                                                type="button"
                                                onClick={() => toggleProjectCode(proj.code)}
                                                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                                    newKnowledge.project_codes.includes(proj.code)
                                                        ? 'bg-purple-600 text-white'
                                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                                }`}
                                            >
                                                {proj.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Summary */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Summary <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    value={newKnowledge.summary}
                                    onChange={(e) => setNewKnowledge({ ...newKnowledge, summary: e.target.value })}
                                    placeholder="Enter core summary"
                                    rows={3}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                />
                            </div>

                            {/* Content */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Full Content (Optional)
                                </label>
                                <textarea
                                    value={newKnowledge.content}
                                    onChange={(e) => setNewKnowledge({ ...newKnowledge, content: e.target.value })}
                                    placeholder="Enter original document or detailed content"
                                    rows={8}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-mono text-sm"
                                />
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Tags (comma separated)
                                </label>
                                <input
                                    type="text"
                                    value={newKnowledge.tags}
                                    onChange={(e) => setNewKnowledge({ ...newKnowledge, tags: e.target.value })}
                                    placeholder="claude, prompting, best-practices"
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700 sticky bottom-0 bg-slate-800">
                            <button
                                onClick={() => setActiveModal('none')}
                                className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddKnowledge}
                                disabled={saving || !newKnowledge.title.trim() || !newKnowledge.summary.trim()}
                                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Project Modal */}
            {activeModal === 'addProject' && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-700 sticky top-0 bg-slate-800">
                            <h2 className="text-xl font-bold text-slate-100">Add New Project</h2>
                            <button
                                onClick={() => setActiveModal('none')}
                                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            {/* Code */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Project Code <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newProject.code}
                                    onChange={(e) => setNewProject({ ...newProject, code: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                    placeholder="koreanews"
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                                />
                                <p className="text-xs text-slate-500 mt-1">Lowercase letters, numbers, hyphens only</p>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Project Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newProject.name}
                                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                    placeholder="Korea NEWS"
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={newProject.description}
                                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                    placeholder="News automation platform"
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            {/* Git Email */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Git Email <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={newProject.git_email}
                                    onChange={(e) => setNewProject({ ...newProject, git_email: e.target.value })}
                                    placeholder="user@example.com"
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            {/* Git Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Git Name
                                </label>
                                <input
                                    type="text"
                                    value={newProject.git_name}
                                    onChange={(e) => setNewProject({ ...newProject, git_name: e.target.value })}
                                    placeholder="Username"
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            {/* Git Repo */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    GitHub Repository
                                </label>
                                <input
                                    type="text"
                                    value={newProject.git_repo}
                                    onChange={(e) => setNewProject({ ...newProject, git_repo: e.target.value })}
                                    placeholder="owner/repo"
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            {/* Tech Stack */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Tech Stack (comma separated)
                                </label>
                                <input
                                    type="text"
                                    value={newProject.tech_stack}
                                    onChange={(e) => setNewProject({ ...newProject, tech_stack: e.target.value })}
                                    placeholder="Next.js, TypeScript, Tailwind"
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700 sticky bottom-0 bg-slate-800">
                            <button
                                onClick={() => setActiveModal('none')}
                                className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddProject}
                                disabled={saving || !newProject.code.trim() || !newProject.name.trim() || !newProject.git_email.trim()}
                                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Usage Log Modal */}
            {activeModal === 'addUsage' && selectedEntry && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <h2 className="text-xl font-bold text-slate-100">Log Usage</h2>
                            <button
                                onClick={() => setActiveModal('none')}
                                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-400">
                                Recording usage of: <span className="text-slate-200 font-medium">{selectedEntry.title}</span>
                            </p>

                            {/* Context */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Usage Context <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    value={newUsageLog.context}
                                    onChange={(e) => setNewUsageLog({ ...newUsageLog, context: e.target.value })}
                                    placeholder="How did you use this knowledge?"
                                    rows={3}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                />
                            </div>

                            {/* Outcome */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Outcome/Result
                                </label>
                                <textarea
                                    value={newUsageLog.outcome}
                                    onChange={(e) => setNewUsageLog({ ...newUsageLog, outcome: e.target.value })}
                                    placeholder="What was the result?"
                                    rows={2}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                />
                            </div>

                            {/* Related Project */}
                            {projects.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Related Project
                                    </label>
                                    <select
                                        value={newUsageLog.project_code}
                                        onChange={(e) => setNewUsageLog({ ...newUsageLog, project_code: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">-- Select Project --</option>
                                        {projects.map((proj) => (
                                            <option key={proj.code} value={proj.code}>{proj.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700">
                            <button
                                onClick={() => setActiveModal('none')}
                                className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddUsageLog}
                                disabled={saving || !newUsageLog.context.trim()}
                                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Log Usage
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Usage History Modal */}
            {activeModal === 'viewUsage' && selectedEntry && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <h2 className="text-xl font-bold text-slate-100">Usage History</h2>
                            <button
                                onClick={() => setActiveModal('none')}
                                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 overflow-y-auto flex-1">
                            <p className="text-sm text-slate-400 mb-4">
                                Usage history for: <span className="text-slate-200 font-medium">{selectedEntry.title}</span>
                            </p>

                            {usageLogs.length > 0 ? (
                                <div className="space-y-3">
                                    {usageLogs.map((log) => (
                                        <div key={log.id} className="p-3 bg-slate-700/50 rounded-lg">
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                                                <Clock className="w-3 h-3" />
                                                {formatDate(log.used_at)}
                                                {log.project_code && (
                                                    <span className="px-2 py-0.5 bg-purple-900/50 text-purple-400 rounded">
                                                        {log.project_code}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-300">{log.context}</p>
                                            {log.outcome && (
                                                <p className="text-sm text-slate-400 mt-2 pt-2 border-t border-slate-600">
                                                    Result: {log.outcome}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>No usage records yet</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between gap-3 p-4 border-t border-slate-700">
                            <button
                                onClick={() => { setActiveModal('addUsage'); }}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Usage
                            </button>
                            <button
                                onClick={() => setActiveModal('none')}
                                className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Session Modal */}
            {activeModal === 'addSession' && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-700 sticky top-0 bg-slate-800">
                            <h2 className="text-xl font-bold text-slate-100">Add Session Log</h2>
                            <button
                                onClick={() => setActiveModal('none')}
                                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            {/* Project */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Project</label>
                                <select
                                    value={newSession.project_code}
                                    onChange={(e) => setNewSession({ ...newSession, project_code: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">-- Select Project --</option>
                                    {projects.map((proj) => (
                                        <option key={proj.code} value={proj.code}>{proj.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Summary */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Summary <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    value={newSession.summary}
                                    onChange={(e) => setNewSession({ ...newSession, summary: e.target.value })}
                                    placeholder="Brief summary of the session"
                                    rows={3}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                />
                            </div>

                            {/* Tasks Completed */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Tasks Completed (one per line)
                                </label>
                                <textarea
                                    value={newSession.tasks_completed}
                                    onChange={(e) => setNewSession({ ...newSession, tasks_completed: e.target.value })}
                                    placeholder="Implemented feature X&#10;Fixed bug in Y&#10;Refactored Z component"
                                    rows={4}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-mono text-sm"
                                />
                            </div>

                            {/* Decisions Made */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Decisions Made (one per line)
                                </label>
                                <textarea
                                    value={newSession.decisions_made}
                                    onChange={(e) => setNewSession({ ...newSession, decisions_made: e.target.value })}
                                    placeholder="Chose library X over Y because...&#10;Decided to use pattern Z"
                                    rows={3}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-mono text-sm"
                                />
                            </div>

                            {/* Issues Found */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Issues Found (one per line)
                                </label>
                                <textarea
                                    value={newSession.issues_found}
                                    onChange={(e) => setNewSession({ ...newSession, issues_found: e.target.value })}
                                    placeholder="Bug in component X&#10;Performance issue in Y"
                                    rows={3}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-mono text-sm"
                                />
                            </div>

                            {/* Reference Knowledge */}
                            {knowledge.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        <Link className="w-3 h-3 inline mr-1" />
                                        Reference Knowledge
                                    </label>
                                    <div className="max-h-40 overflow-y-auto bg-slate-700/30 rounded-lg p-2 space-y-1">
                                        {knowledge.map((k) => (
                                            <label
                                                key={k.id}
                                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-700 rounded cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={newSession.knowledge_ids.includes(k.id)}
                                                    onChange={() => toggleSessionKnowledge(k.id)}
                                                    className="rounded border-slate-500 bg-slate-600 text-emerald-500 focus:ring-emerald-500"
                                                />
                                                <span className="text-sm text-slate-300 truncate">{k.title}</span>
                                                <span className="ml-auto text-xs text-slate-500">{SCOPE_LABELS[k.scope]}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700 sticky bottom-0 bg-slate-800">
                            <button
                                onClick={() => setActiveModal('none')}
                                className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddSession}
                                disabled={saving || !newSession.summary.trim()}
                                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

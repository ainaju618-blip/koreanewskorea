"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Loader2, GitBranch, Clock, FileText, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

type TabType = 'summary' | 'commits' | 'status';

interface TabConfig {
    id: TabType;
    label: string;
}

const TABS: TabConfig[] = [
    { id: 'summary', label: '요약' },
    { id: 'commits', label: '최근 커밋' },
    { id: 'status', label: '현재 상태' }
];

interface GitSummary {
    currentBranch: string;
    totalCommits: number;
    changedFiles: number;
    uncommittedChanges: number;
    branchCount: number;
    lastCommit: {
        hash: string;
        date: string;
        author: string;
        message: string;
    } | null;
    lastActivity: string;
}

interface GitCommit {
    hash: string;
    date: string;
    author: string;
    message: string;
    filesChanged: number;
    status: 'success' | 'merge' | 'revert' | 'normal';
}

interface GitFileStatus {
    filename: string;
    status: string;
    statusKo: string;
    additions: number;
    deletions: number;
}

interface CommitsResponse {
    data: GitCommit[];
    totalCount: number;
    page: number;
    totalPages: number;
    error: string | null;
}

const COMMITS_PER_PAGE = 30;

export default function GitStatusPage() {
    const [activeTab, setActiveTab] = useState<TabType>('summary');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data states
    const [summaryData, setSummaryData] = useState<GitSummary | null>(null);
    const [commitsData, setCommitsData] = useState<GitCommit[]>([]);
    const [commitsPage, setCommitsPage] = useState(1);
    const [commitsTotalPages, setCommitsTotalPages] = useState(1);
    const [commitsTotalCount, setCommitsTotalCount] = useState(0);
    const [statusData, setStatusData] = useState<GitFileStatus[]>([]);

    const fetchTabData = useCallback(async (tab: TabType, page: number = 1) => {
        setLoading(true);
        setError(null);

        try {
            let url = `/api/admin/git-status?tab=${tab}`;
            if (tab === 'commits') {
                url += `&page=${page}&limit=${COMMITS_PER_PAGE}`;
            }

            const res = await fetch(url);
            const result = await res.json();

            if (result.error) {
                setError(result.error);
                return;
            }

            switch (tab) {
                case 'summary':
                    setSummaryData(result.data);
                    break;
                case 'commits':
                    setCommitsData(result.data);
                    setCommitsPage(result.page);
                    setCommitsTotalPages(result.totalPages);
                    setCommitsTotalCount(result.totalCount);
                    break;
                case 'status':
                    setStatusData(result.data);
                    break;
            }
        } catch (e: any) {
            setError(e.message || 'Failed to fetch git status');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch data when tab changes
    useEffect(() => {
        fetchTabData(activeTab, activeTab === 'commits' ? commitsPage : 1);
    }, [activeTab, fetchTabData]);

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        if (tab === 'commits') {
            setCommitsPage(1);
        }
    };

    const handleRefresh = () => {
        fetchTabData(activeTab, activeTab === 'commits' ? commitsPage : 1);
    };

    const handlePageChange = (newPage: number) => {
        setCommitsPage(newPage);
        fetchTabData('commits', newPage);
    };

    return (
        <div className="min-h-screen bg-[#0d1117]">
            <div className="max-w-5xl mx-auto px-4 py-6">
                {/* Header */}
                <header className="mb-6">
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-2 text-[#8b949e] hover:text-[#c9d1d9] mb-4 text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Dashboard
                    </Link>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <GitBranch className="w-6 h-6 text-[#c9d1d9]" />
                            <div>
                                <h1 className="text-xl font-bold text-[#e6edf3]">Git 상태 관리</h1>
                                <p className="text-sm text-[#8b949e]">저장소 상태 및 커밋 이력</p>
                            </div>
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 text-sm border border-[#30363d] rounded-lg text-[#c9d1d9] hover:bg-[#21262d] transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            새로고침
                        </button>
                    </div>
                </header>

                {/* Tab Navigation - Fixed at top */}
                <div className="sticky top-0 z-10 bg-[#0d1117] border-b border-[#30363d] mb-6">
                    <div className="flex">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`flex-1 px-4 py-3 text-sm font-semibold transition-all border-b-2 ${
                                    activeTab === tab.id
                                        ? 'border-[#58a6ff] text-[#e6edf3]'
                                        : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22]'
                                }`}
                            >
                                {tab.label}
                                {tab.id === 'commits' && commitsTotalCount > 0 && (
                                    <span className="ml-2 text-xs text-[#8b949e]">({commitsTotalCount})</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="mb-6 p-4 border-2 border-red-500 bg-red-900/20 rounded-lg">
                        <div className="flex items-center gap-2 text-red-400">
                            <AlertCircle className="w-5 h-5" />
                            <span className="font-semibold">Git 상태 확인 실패</span>
                        </div>
                        <p className="text-sm text-red-300 mt-1">{error}</p>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-[#8b949e]" />
                    </div>
                )}

                {/* Tab Content */}
                {!loading && (
                    <div className="space-y-6">
                        {activeTab === 'summary' && summaryData && (
                            <SummaryTab data={summaryData} />
                        )}
                        {activeTab === 'commits' && (
                            <CommitsTab
                                data={commitsData}
                                page={commitsPage}
                                totalPages={commitsTotalPages}
                                totalCount={commitsTotalCount}
                                onPageChange={handlePageChange}
                            />
                        )}
                        {activeTab === 'status' && (
                            <StatusTab data={statusData} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ===== Summary Tab =====
function SummaryTab({ data }: { data: GitSummary }) {
    return (
        <div className="space-y-6">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBox label="현재 브랜치" value={data.currentBranch} />
                <StatBox label="변경된 파일" value={`${data.changedFiles}개`} highlight={data.changedFiles > 0} />
                <StatBox label="총 커밋 수" value={`${data.totalCommits}개`} />
                <StatBox label="최근 활동" value={data.lastActivity} />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatBox label="미커밋 변경" value={`${data.uncommittedChanges}개`} highlight={data.uncommittedChanges > 0} />
                <StatBox label="브랜치 수" value={`${data.branchCount}개`} />
                <StatBox label="마지막 커밋" value={data.lastCommit?.date || '-'} />
            </div>

            {/* Last Commit Detail */}
            {data.lastCommit && (
                <div className="border border-[#30363d] bg-[#161b22] rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        마지막 커밋 정보
                    </h3>
                    <table className="w-full text-sm">
                        <tbody>
                            <tr className="border-b border-[#21262d]">
                                <td className="py-2 text-[#8b949e] w-24">해시</td>
                                <td className="py-2">
                                    <Link
                                        href={`/admin/git-status/${data.lastCommit.hash}`}
                                        className="font-mono text-[#58a6ff] hover:text-[#79c0ff] hover:underline"
                                    >
                                        {data.lastCommit.hash}
                                    </Link>
                                </td>
                            </tr>
                            <tr className="border-b border-[#21262d]">
                                <td className="py-2 text-[#8b949e]">작성자</td>
                                <td className="py-2 text-[#e6edf3]">{data.lastCommit.author}</td>
                            </tr>
                            <tr className="border-b border-[#21262d]">
                                <td className="py-2 text-[#8b949e]">날짜</td>
                                <td className="py-2 text-[#e6edf3]">{data.lastCommit.date}</td>
                            </tr>
                            <tr>
                                <td className="py-2 text-[#8b949e]">메시지</td>
                                <td className="py-2 text-[#e6edf3]">{data.lastCommit.message}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className={`border rounded-lg p-4 ${highlight ? 'border-[#58a6ff] bg-[#161b22]' : 'border-[#30363d] bg-[#161b22]'}`}>
            <p className="text-xs text-[#8b949e] mb-1">{label}</p>
            <p className={`text-lg font-bold ${highlight ? 'text-[#58a6ff]' : 'text-[#e6edf3]'}`}>{value}</p>
        </div>
    );
}

// ===== Commits Tab with Pagination =====
function CommitsTab({
    data,
    page,
    totalPages,
    totalCount,
    onPageChange
}: {
    data: GitCommit[];
    page: number;
    totalPages: number;
    totalCount: number;
    onPageChange: (page: number) => void;
}) {
    if (data.length === 0) {
        return (
            <div className="text-center py-20 text-[#8b949e]">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>커밋 이력이 없습니다</p>
            </div>
        );
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success': return '(완료)';
            case 'merge': return '(병합)';
            case 'revert': return '(되돌림)';
            default: return '';
        }
    };

    return (
        <div>
            {/* Pagination Info */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[#8b949e]">
                    총 <strong className="text-[#e6edf3]">{totalCount}</strong>개 커밋 중{' '}
                    <strong className="text-[#e6edf3]">{(page - 1) * 30 + 1}-{Math.min(page * 30, totalCount)}</strong>번째
                </p>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-[#8b949e]">페이지 {page} / {totalPages}</span>
                </div>
            </div>

            <div className="border border-[#30363d] rounded-lg overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto" style={{ maxHeight: '60vh' }}>
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-[#161b22] border-b border-[#30363d]">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-[#c9d1d9]">날짜</th>
                                <th className="px-4 py-3 text-left font-semibold text-[#c9d1d9]">작성자</th>
                                <th className="px-4 py-3 text-left font-semibold text-[#c9d1d9]">커밋 메시지</th>
                                <th className="px-4 py-3 text-center font-semibold text-[#c9d1d9]">파일수</th>
                                <th className="px-4 py-3 text-center font-semibold text-[#c9d1d9]">상태</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#21262d]">
                            {data.map((commit, idx) => (
                                <tr key={idx} className="hover:bg-[#161b22]">
                                    <td className="px-4 py-3 text-[#8b949e] whitespace-nowrap">{commit.date}</td>
                                    <td className="px-4 py-3 text-[#e6edf3]">{commit.author}</td>
                                    <td className="px-4 py-3 text-[#e6edf3] max-w-md">
                                        <Link
                                            href={`/admin/git-status/${commit.hash}`}
                                            className="hover:text-[#58a6ff] hover:underline block"
                                        >
                                            <span className="font-mono text-xs text-[#8b949e] mr-2">{commit.hash}</span>
                                            <span className="truncate">{commit.message}</span>
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-center text-[#8b949e]">{commit.filesChanged}개</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`text-xs font-medium ${
                                            commit.status === 'success' ? 'text-green-400' :
                                            commit.status === 'merge' ? 'text-[#58a6ff]' :
                                            commit.status === 'revert' ? 'text-orange-400' :
                                            'text-[#8b949e]'
                                        }`}>
                                            {getStatusIcon(commit.status)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-[#21262d]" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {data.map((commit, idx) => (
                        <Link
                            key={idx}
                            href={`/admin/git-status/${commit.hash}`}
                            className="block p-4 hover:bg-[#161b22]"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-[#8b949e]">{commit.date}</span>
                                <span className={`text-xs font-medium ${
                                    commit.status === 'success' ? 'text-green-400' :
                                    commit.status === 'merge' ? 'text-[#58a6ff]' :
                                    commit.status === 'revert' ? 'text-orange-400' :
                                    'text-[#8b949e]'
                                }`}>
                                    {getStatusIcon(commit.status)}
                                </span>
                            </div>
                            <p className="text-sm font-medium text-[#e6edf3] mb-1">{commit.message}</p>
                            <div className="flex items-center gap-4 text-xs text-[#8b949e]">
                                <span>{commit.author}</span>
                                <span className="font-mono">{commit.hash}</span>
                                <span>{commit.filesChanged}개</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                        onClick={() => onPageChange(1)}
                        disabled={page === 1}
                        className="px-3 py-2 text-sm border border-[#30363d] rounded-lg text-[#c9d1d9] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#21262d]"
                    >
                        처음
                    </button>
                    <button
                        onClick={() => onPageChange(page - 1)}
                        disabled={page === 1}
                        className="p-2 border border-[#30363d] rounded-lg text-[#c9d1d9] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#21262d]"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Page Numbers */}
                    <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (page <= 3) {
                                pageNum = i + 1;
                            } else if (page >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = page - 2 + i;
                            }
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => onPageChange(pageNum)}
                                    className={`w-10 h-10 text-sm rounded-lg transition-colors ${
                                        page === pageNum
                                            ? 'bg-[#58a6ff] text-white'
                                            : 'border border-[#30363d] text-[#c9d1d9] hover:bg-[#21262d]'
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => onPageChange(page + 1)}
                        disabled={page === totalPages}
                        className="p-2 border border-[#30363d] rounded-lg text-[#c9d1d9] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#21262d]"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onPageChange(totalPages)}
                        disabled={page === totalPages}
                        className="px-3 py-2 text-sm border border-[#30363d] rounded-lg text-[#c9d1d9] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#21262d]"
                    >
                        끝
                    </button>
                </div>
            )}
        </div>
    );
}

// ===== Status Tab =====
function StatusTab({ data }: { data: GitFileStatus[] }) {
    if (data.length === 0) {
        return (
            <div className="text-center py-20 text-[#8b949e]">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>작업 트리가 깨끗합니다 (변경 없음)</p>
            </div>
        );
    }

    const getStatusStyle = (status: string) => {
        if (status.includes('untracked')) return 'bg-green-900/30 text-green-400';
        if (status.includes('modified')) return 'bg-yellow-900/30 text-yellow-400';
        if (status.includes('deleted')) return 'bg-red-900/30 text-red-400';
        if (status.includes('added') || status.includes('staged')) return 'bg-blue-900/30 text-[#58a6ff]';
        if (status.includes('conflict')) return 'bg-red-900/50 text-red-300';
        return 'bg-[#21262d] text-[#8b949e]';
    };

    return (
        <div className="border border-[#30363d] rounded-lg overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto" style={{ maxHeight: '70vh' }}>
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-[#161b22] border-b border-[#30363d]">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-[#c9d1d9]">파일명</th>
                            <th className="px-4 py-3 text-left font-semibold text-[#c9d1d9]">상태</th>
                            <th className="px-4 py-3 text-center font-semibold text-[#c9d1d9]">변경 라인</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#21262d]">
                        {data.map((file, idx) => (
                            <tr key={idx} className="hover:bg-[#161b22]">
                                <td className="px-4 py-3 font-mono text-sm text-[#e6edf3] max-w-md truncate" title={file.filename}>
                                    {file.filename}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusStyle(file.status)}`}>
                                        {file.statusKo}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="text-green-400 font-medium">+{file.additions}</span>
                                    {file.deletions > 0 && (
                                        <span className="text-red-400 font-medium ml-2">-{file.deletions}</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-[#21262d]" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {data.map((file, idx) => (
                    <div key={idx} className="p-4">
                        <p className="font-mono text-sm text-[#e6edf3] mb-2 truncate" title={file.filename}>
                            {file.filename}
                        </p>
                        <div className="flex items-center justify-between">
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusStyle(file.status)}`}>
                                {file.statusKo}
                            </span>
                            <div className="text-xs">
                                <span className="text-green-400 font-medium">+{file.additions}</span>
                                {file.deletions > 0 && (
                                    <span className="text-red-400 font-medium ml-2">-{file.deletions}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

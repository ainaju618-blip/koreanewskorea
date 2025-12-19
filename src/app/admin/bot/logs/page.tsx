"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Activity,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Search,
    Filter,
    Download,
    RotateCcw,
    ExternalLink,
    Calendar,
    Clock,
    ChevronLeft,
    ChevronRight,
    X,
    type LucideIcon
} from "lucide-react";

interface LogEntry {
    id: number;
    region: string;
    status: string;
    started_at: string;
    ended_at: string | null;
    articles_count: number;
    log_message: string | null;
}

export default function BotLogsPage() {
    const router = useRouter();
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Date filter
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 20;

    const fetchLogs = useCallback(async () => {
        if (!autoRefresh && isLoading) return;

        try {
            const params = new URLSearchParams();
            if (filterStatus !== "all") params.append("status", filterStatus);
            if (appliedSearch) params.append("search", appliedSearch);
            if (dateFrom) params.append("from", dateFrom);
            if (dateTo) params.append("to", dateTo);
            params.append("limit", String(pageSize));
            params.append("offset", String((currentPage - 1) * pageSize));

            const res = await fetch(`/api/bot/bot-logs?${params.toString()}`);
            const data = await res.json();
            if (data.logs) {
                setLogs(data.logs);
                setTotalCount(data.total || data.logs.length);
            }
        } catch (err) {
            console.error("Failed to fetch logs:", err);
        } finally {
            setIsLoading(false);
        }
    }, [filterStatus, appliedSearch, dateFrom, dateTo, currentPage, autoRefresh, isLoading]);

    useEffect(() => {
        setIsLoading(true);
        fetchLogs();
    }, [filterStatus, appliedSearch, dateFrom, dateTo, currentPage]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (autoRefresh) {
            interval = setInterval(fetchLogs, 5000);
        }
        return () => clearInterval(interval);
    }, [autoRefresh, fetchLogs]);

    const handleSearch = () => {
        setAppliedSearch(searchQuery);
        setCurrentPage(1);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    const clearFilters = () => {
        setFilterStatus("all");
        setSearchQuery("");
        setAppliedSearch("");
        setDateFrom("");
        setDateTo("");
        setCurrentPage(1);
    };

    const handleDownload = () => {
        const header = "ID,StartedAt,EndedAt,Region,Status,Articles,Duration,Message\n";
        const csv = logs.map(l => {
            const duration = l.ended_at
                ? ((new Date(l.ended_at).getTime() - new Date(l.started_at).getTime()) / 1000).toFixed(1)
                : 'running';
            return `${l.id},${l.started_at},${l.ended_at || ''},${l.region},${l.status},${l.articles_count},${duration},"${(l.log_message || '').replace(/"/g, '""')}"`;
        }).join("\n");

        const blob = new Blob([header + csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bot_logs_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const goToDetail = (id: number) => {
        router.push(`/admin/bot/logs/${id}`);
    };

    // Stats calculation
    const stats = {
        total: logs.filter(l => l.status !== 'running').length,
        running: logs.filter(l => l.status === 'running').length,
        success: logs.filter(l => l.status === "success").length,
        warning: logs.filter(l => l.status === "warning").length,
        error: logs.filter(l => ["failed", "failure", "error"].includes(l.status)).length,
    };

    const getDuration = (start: string, end: string | null) => {
        if (!end) return <span className="text-blue-400 font-bold animate-pulse">Running</span>;
        const diff = new Date(end).getTime() - new Date(start).getTime();
        const seconds = diff / 1000;
        if (seconds < 60) return `${seconds.toFixed(1)}s`;
        return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
    };

    const totalPages = Math.ceil(totalCount / pageSize);
    const hasActiveFilters = filterStatus !== "all" || appliedSearch || dateFrom || dateTo;

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-[#e6edf3] flex items-center gap-3">
                        <Activity className="w-7 h-7 text-green-500" />
                        수집 로그
                    </h1>
                    <p className="text-sm text-[#8b949e] mt-2">
                        봇의 실행 내역과 상세 에러 로그를 실시간으로 확인합니다.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition flex items-center gap-2 ${
                            autoRefresh
                                ? 'bg-green-900/30 text-green-400 border-green-800'
                                : 'bg-[#21262d] text-[#8b949e] border-[#30363d]'
                        }`}
                    >
                        {autoRefresh ? <Activity className="w-4 h-4 animate-pulse" /> : <div className="w-4 h-4 rounded-full bg-[#484f58]" />}
                        {autoRefresh ? "자동 갱신 (5s)" : "자동 갱신 OFF"}
                    </button>
                    <button
                        onClick={() => { setIsLoading(true); fetchLogs(); }}
                        className="p-2 bg-[#21262d] border border-[#30363d] text-[#c9d1d9] rounded-lg hover:bg-[#30363d]"
                        title="새로고침"
                    >
                        <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 bg-[#21262d] border border-[#30363d] text-[#c9d1d9] rounded-lg font-medium hover:bg-[#30363d] transition"
                    >
                        <Download className="w-4 h-4" />
                        CSV 내보내기
                    </button>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-5 gap-4">
                <StatCard label="실행 중" value={stats.running} color="blue" icon={Activity} />
                <StatCard label="성공" value={stats.success} color="green" icon={CheckCircle} />
                <StatCard label="경고" value={stats.warning} color="amber" icon={AlertTriangle} />
                <StatCard label="실패" value={stats.error} color="red" icon={XCircle} />
                <StatCard label="완료 합계" value={stats.total} color="gray" icon={Clock} />
            </div>

            {/* Filters */}
            <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-4">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6e7681]" />
                        <input
                            type="text"
                            placeholder="지역 또는 메시지 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full pl-10 pr-4 py-2 border border-[#30363d] rounded-lg text-sm bg-[#0d1117] text-[#c9d1d9] placeholder-[#6e7681] focus:ring-2 focus:ring-[#1f6feb] focus:border-[#1f6feb] outline-none"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-[#6e7681]" />
                        <select
                            value={filterStatus}
                            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                            className="border border-[#30363d] rounded-lg px-3 py-2 text-sm bg-[#0d1117] text-[#c9d1d9] outline-none focus:ring-2 focus:ring-[#1f6feb]"
                        >
                            <option value="all">전체 상태</option>
                            <option value="running">실행중</option>
                            <option value="success">성공</option>
                            <option value="warning">경고</option>
                            <option value="failed">실패</option>
                        </select>
                    </div>

                    {/* Date Filter */}
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#6e7681]" />
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                            className="border border-[#30363d] rounded-lg px-3 py-2 text-sm bg-[#0d1117] text-[#c9d1d9] outline-none focus:ring-2 focus:ring-[#1f6feb]"
                        />
                        <span className="text-[#6e7681]">~</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                            className="border border-[#30363d] rounded-lg px-3 py-2 text-sm bg-[#0d1117] text-[#c9d1d9] outline-none focus:ring-2 focus:ring-[#1f6feb]"
                        />
                    </div>

                    {/* Search Button */}
                    <button
                        onClick={handleSearch}
                        className="px-4 py-2 bg-[#238636] text-white rounded-lg text-sm font-medium hover:bg-[#2ea043] transition"
                    >
                        검색
                    </button>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="px-3 py-2 text-[#8b949e] hover:text-[#c9d1d9] text-sm flex items-center gap-1"
                        >
                            <X className="w-4 h-4" />
                            필터 초기화
                        </button>
                    )}
                </div>

                {/* Active Filters Display */}
                {hasActiveFilters && (
                    <div className="mt-3 pt-3 border-t border-[#21262d] flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-[#8b949e]">적용된 필터:</span>
                        {filterStatus !== "all" && (
                            <span className="px-2 py-0.5 bg-[#1f6feb]/20 text-[#58a6ff] rounded text-xs">
                                상태: {filterStatus}
                            </span>
                        )}
                        {appliedSearch && (
                            <span className="px-2 py-0.5 bg-purple-900/30 text-purple-400 rounded text-xs">
                                검색: {appliedSearch}
                            </span>
                        )}
                        {dateFrom && (
                            <span className="px-2 py-0.5 bg-green-900/30 text-green-400 rounded text-xs">
                                시작: {dateFrom}
                            </span>
                        )}
                        {dateTo && (
                            <span className="px-2 py-0.5 bg-green-900/30 text-green-400 rounded text-xs">
                                종료: {dateTo}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Logs Table */}
            <div className="bg-[#161b22] rounded-xl border border-[#30363d] overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#21262d] border-b border-[#30363d] text-xs text-[#8b949e] uppercase tracking-wider">
                            <th className="px-4 py-3 font-medium w-16">ID</th>
                            <th className="px-4 py-3 font-medium">시각</th>
                            <th className="px-4 py-3 font-medium">지역</th>
                            <th className="px-4 py-3 font-medium w-24">상태</th>
                            <th className="px-4 py-3 font-medium">메시지</th>
                            <th className="px-4 py-3 font-medium text-center w-20">수집</th>
                            <th className="px-4 py-3 font-medium text-center w-24">소요시간</th>
                            <th className="px-4 py-3 font-medium text-center w-20">상세</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#21262d]">
                        {isLoading && logs.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-12 text-center">
                                    <div className="flex items-center justify-center gap-2 text-[#8b949e]">
                                        <RotateCcw className="w-5 h-5 animate-spin" />
                                        로딩 중...
                                    </div>
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-12 text-center text-[#8b949e]">
                                    검색 결과가 없습니다.
                                </td>
                            </tr>
                        ) : logs.map((log) => (
                            <tr
                                key={log.id}
                                className="hover:bg-[#21262d] transition cursor-pointer"
                                onClick={() => goToDetail(log.id)}
                            >
                                <td className="px-4 py-3 text-xs font-mono text-[#8b949e]">
                                    #{log.id}
                                </td>
                                <td className="px-4 py-3 text-xs font-mono text-[#c9d1d9]">
                                    {new Date(log.started_at).toLocaleString('ko-KR', { hour12: false })}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-[#e6edf3]">{log.region}</td>
                                <td className="px-4 py-3">
                                    <LogStatusBadge status={log.status} />
                                </td>
                                <td className="px-4 py-3 text-sm text-[#c9d1d9] max-w-xs truncate" title={log.log_message || ''}>
                                    {log.log_message?.split('\n')[0] || '-'}
                                </td>
                                <td className="px-4 py-3 text-center text-sm font-medium text-[#e6edf3]">
                                    {log.articles_count}건
                                </td>
                                <td className="px-4 py-3 text-center text-xs font-mono text-[#8b949e]">
                                    {getDuration(log.started_at, log.ended_at)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); goToDetail(log.id); }}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#58a6ff] hover:text-[#79c0ff] hover:bg-[#1f6feb]/10 rounded-lg transition"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        상세
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-[#21262d] flex items-center justify-between">
                        <div className="text-sm text-[#8b949e]">
                            총 {totalCount}개 중 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)}개 표시
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-[#30363d] text-[#c9d1d9] hover:bg-[#21262d] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-3 py-1 text-sm text-[#c9d1d9]">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-[#30363d] text-[#c9d1d9] hover:bg-[#21262d] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Components ---

interface StatCardProps {
    label: string;
    value: number;
    color: "blue" | "green" | "amber" | "red" | "gray";
    icon: LucideIcon;
}

function StatCard({ label, value, color, icon: Icon }: StatCardProps) {
    const colors: Record<StatCardProps['color'], string> = {
        blue: "bg-blue-900/30 text-blue-400 border-blue-800",
        green: "bg-green-900/30 text-green-400 border-green-800",
        amber: "bg-amber-900/30 text-amber-400 border-amber-800",
        red: "bg-red-900/30 text-red-400 border-red-800",
        gray: "bg-[#21262d] text-[#c9d1d9] border-[#30363d]",
    };

    const iconColors: Record<StatCardProps['color'], string> = {
        blue: "text-blue-400",
        green: "text-green-400",
        amber: "text-amber-400",
        red: "text-red-400",
        gray: "text-[#8b949e]",
    };

    return (
        <div className={`rounded-lg border p-4 ${colors[color]}`}>
            <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${iconColors[color] || ''}`} />
                <p className="text-sm font-medium opacity-80">{label}</p>
            </div>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    );
}

function LogStatusBadge({ status }: { status: string }) {
    const styles: Record<string, { bg: string; text: string; border: string; icon: LucideIcon; label: string }> = {
        success: { bg: "bg-green-900/40", text: "text-green-400", border: "border-green-800", icon: CheckCircle, label: "성공" },
        warning: { bg: "bg-amber-900/40", text: "text-amber-400", border: "border-amber-800", icon: AlertTriangle, label: "경고" },
        failed: { bg: "bg-red-900/40", text: "text-red-400", border: "border-red-800", icon: XCircle, label: "실패" },
        failure: { bg: "bg-red-900/40", text: "text-red-400", border: "border-red-800", icon: XCircle, label: "실패" },
        error: { bg: "bg-red-900/40", text: "text-red-400", border: "border-red-800", icon: XCircle, label: "에러" },
        running: { bg: "bg-blue-900/40", text: "text-blue-400", border: "border-blue-800", icon: Activity, label: "실행중" },
        stopped: { bg: "bg-orange-900/40", text: "text-orange-400", border: "border-orange-800", icon: AlertTriangle, label: "중지됨" },
    };

    const config = styles[status] || styles['warning'];
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${config.bg} ${config.text} ${config.border}`}>
            <Icon className={`w-3.5 h-3.5 ${status === 'running' ? 'animate-spin' : ''}`} />
            {config.label}
        </span>
    );
}

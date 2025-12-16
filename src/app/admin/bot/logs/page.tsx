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
    X
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

            const res = await fetch(`/api/bot/logs?${params.toString()}`);
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
        if (!end) return <span className="text-blue-600 font-bold animate-pulse">Running</span>;
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
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Activity className="w-7 h-7 text-green-600" />
                        수집 로그
                    </h1>
                    <p className="text-sm text-gray-500 mt-2">
                        봇의 실행 내역과 상세 에러 로그를 실시간으로 확인합니다.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition flex items-center gap-2 ${
                            autoRefresh
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-white text-gray-500 border-gray-300'
                        }`}
                    >
                        {autoRefresh ? <Activity className="w-4 h-4 animate-pulse" /> : <div className="w-4 h-4 rounded-full bg-gray-300" />}
                        {autoRefresh ? "자동 갱신 (5s)" : "자동 갱신 OFF"}
                    </button>
                    <button
                        onClick={() => { setIsLoading(true); fetchLogs(); }}
                        className="p-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        title="새로고침"
                    >
                        <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
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
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="지역 또는 메시지 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select
                            value={filterStatus}
                            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
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
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-400">~</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Search Button */}
                    <button
                        onClick={handleSearch}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                    >
                        검색
                    </button>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
                        >
                            <X className="w-4 h-4" />
                            필터 초기화
                        </button>
                    )}
                </div>

                {/* Active Filters Display */}
                {hasActiveFilters && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500">적용된 필터:</span>
                        {filterStatus !== "all" && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                상태: {filterStatus}
                            </span>
                        )}
                        {appliedSearch && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                검색: {appliedSearch}
                            </span>
                        )}
                        {dateFrom && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                시작: {dateFrom}
                            </span>
                        )}
                        {dateTo && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                종료: {dateTo}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
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
                    <tbody className="divide-y divide-gray-100">
                        {isLoading && logs.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-12 text-center">
                                    <div className="flex items-center justify-center gap-2 text-gray-400">
                                        <RotateCcw className="w-5 h-5 animate-spin" />
                                        로딩 중...
                                    </div>
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-12 text-center text-gray-400">
                                    검색 결과가 없습니다.
                                </td>
                            </tr>
                        ) : logs.map((log) => (
                            <tr
                                key={log.id}
                                className="hover:bg-gray-50 transition cursor-pointer"
                                onClick={() => goToDetail(log.id)}
                            >
                                <td className="px-4 py-3 text-xs font-mono text-gray-500">
                                    #{log.id}
                                </td>
                                <td className="px-4 py-3 text-xs font-mono text-gray-600">
                                    {new Date(log.started_at).toLocaleString('ko-KR', { hour12: false })}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{log.region}</td>
                                <td className="px-4 py-3">
                                    <LogStatusBadge status={log.status} />
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate" title={log.log_message || ''}>
                                    {log.log_message?.split('\n')[0] || '-'}
                                </td>
                                <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                                    {log.articles_count}건
                                </td>
                                <td className="px-4 py-3 text-center text-xs font-mono text-gray-500">
                                    {getDuration(log.started_at, log.ended_at)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); goToDetail(log.id); }}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
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
                    <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            총 {totalCount}개 중 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)}개 표시
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-3 py-1 text-sm">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
    icon: React.ElementType;
}

function StatCard({ label, value, color, icon: Icon }: StatCardProps) {
    const colors = {
        blue: "bg-blue-50 text-blue-700 border-blue-200",
        green: "bg-green-50 text-green-700 border-green-200",
        amber: "bg-amber-50 text-amber-700 border-amber-200",
        red: "bg-red-50 text-red-700 border-red-200",
        gray: "bg-gray-50 text-gray-700 border-gray-200",
    };

    const iconColors: Record<string, string> = {
        blue: "text-blue-600",
        green: "text-green-600",
        amber: "text-amber-600",
        red: "text-red-600",
        gray: "text-gray-600",
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
    const styles: Record<string, { bg: string; text: string; border: string; icon: React.ElementType; label: string }> = {
        success: { bg: "bg-green-100", text: "text-green-800", border: "border-green-200", icon: CheckCircle, label: "성공" },
        warning: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200", icon: AlertTriangle, label: "경고" },
        failed: { bg: "bg-red-100", text: "text-red-800", border: "border-red-200", icon: XCircle, label: "실패" },
        failure: { bg: "bg-red-100", text: "text-red-800", border: "border-red-200", icon: XCircle, label: "실패" },
        error: { bg: "bg-red-100", text: "text-red-800", border: "border-red-200", icon: XCircle, label: "에러" },
        running: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200", icon: Activity, label: "실행중" },
        stopped: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200", icon: AlertTriangle, label: "중지됨" },
    };

    const config = styles[status] || styles['warning'];
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${config.bg} ${config.text} ${config.border}`}>
            <Icon className={`w-3.5 h-3.5 ${status === 'running' ? 'animate-spin' : ''}`} />
            {config.label}
        </span>
    );
}

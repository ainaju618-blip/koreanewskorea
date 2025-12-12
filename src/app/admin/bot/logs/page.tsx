"use client";

import React, { useState, useEffect } from "react";
import { Activity, CheckCircle, AlertTriangle, XCircle, Search, Filter, Download, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

export default function BotLogsPage() {
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

    const fetchLogs = async () => {
        // 자동 갱신이 아니거나 로딩 중이 아닐 때만 로딩 표시 (깜빡임 방지)
        if (!autoRefresh) setIsLoading(true);

        try {
            const params = new URLSearchParams();
            if (filterStatus !== "all") params.append("status", filterStatus);
            if (searchQuery) params.append("search", searchQuery);
            params.append("limit", "50");

            const res = await fetch(`/api/bot/logs?${params.toString()}`);
            const data = await res.json();
            if (data.logs) {
                setLogs(data.logs);
            }
        } catch (err) {
            console.error("로그 로딩 실패:", err);
        } finally {
            if (!autoRefresh) setIsLoading(false);
            else setIsLoading(false); // 일단 로딩 상태는 해제
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [filterStatus]); // 초기 로드 및 필터 변경 시

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (autoRefresh) {
            interval = setInterval(fetchLogs, 3000); // 3초마다 갱신
        }
        return () => clearInterval(interval);
    }, [autoRefresh, filterStatus, searchQuery]);

    const handleSearch = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') fetchLogs();
    };

    const handleDownload = () => {
        const header = "ID,StartedAt,EndedAt,Region,Status,Articles,Message\n";
        const csv = logs.map(l =>
            `${l.id},${l.started_at},${l.ended_at || ''},${l.region},${l.status},${l.articles_count},"${(l.log_message || '').replace(/"/g, '""')}"`
        ).join("\n");

        const blob = new Blob([header + csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bot_logs_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    const toggleExpand = (id: number) => {
        setExpandedLogId(expandedLogId === id ? null : id);
    };

    const stats = {
        total: logs.filter(l => l.status !== 'running').length, // 실행중 제외 통계
        running: logs.filter(l => l.status === 'running').length,
        success: logs.filter(l => l.status === "success").length,
        warning: logs.filter(l => l.status === "warning").length,
        error: logs.filter(l => l.status === "failed" || l.status === "error").length,
    };

    const getDuration = (start: string, end: string | null) => {
        if (!end) return <span className="text-blue-600 font-bold animate-pulse">Running</span>;
        const diff = new Date(end).getTime() - new Date(start).getTime();
        return `${(diff / 1000).toFixed(1)}s`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Activity className="w-7 h-7 text-green-600" />
                        수집 로그 / 에러 (Collection Logs)
                    </h1>
                    <p className="text-sm text-gray-500 mt-2">
                        봇의 실행 내역과 상세 에러 로그를 실시간으로 확인합니다.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition flex items-center gap-2 ${autoRefresh ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-gray-500 border-gray-300'
                            }`}
                    >
                        {autoRefresh ? <Activity className="w-4 h-4 animate-pulse" /> : <div className="w-4 h-4 rounded-full bg-gray-300" />}
                        {autoRefresh ? "Auto Refresh ON (3s)" : "Auto Refresh OFF"}
                    </button>
                    <button
                        onClick={() => fetchLogs()}
                        className="p-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        title="수동 새로고침"
                    >
                        <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                    >
                        <Download className="w-4 h-4" />
                        로그 다운로드
                    </button>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-5 gap-4">
                <StatCard label="실행 중" value={stats.running} color="blue" />
                <StatCard label="성공" value={stats.success} color="green" />
                <StatCard label="경고" value={stats.warning} color="orange" />
                <StatCard label="실패" value={stats.error} color="red" />
                <StatCard label="완료 합계" value={stats.total} color="gray" />
            </div>

            {/* Filters & Search */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="지역 또는 메시지 검색 (Enter)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearch}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">전체 상태</option>
                        <option value="running">실행중</option>
                        <option value="success">성공만</option>
                        <option value="warning">경고만</option>
                        <option value="failed">실패만</option>
                    </select>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                            <th className="px-5 py-3 font-medium w-10"></th>
                            <th className="px-5 py-3 font-medium">시각</th>
                            <th className="px-5 py-3 font-medium">지역</th>
                            <th className="px-5 py-3 font-medium">상태</th>
                            <th className="px-5 py-3 font-medium">메시지</th>
                            <th className="px-5 py-3 font-medium text-center">수집</th>
                            <th className="px-5 py-3 font-medium text-center">소요시간</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-12 text-center text-gray-400">데이터가 없습니다.</td>
                            </tr>
                        ) : logs.map((log) => (
                            <React.Fragment key={log.id}>
                                <tr
                                    className={`hover:bg-gray-50 transition cursor-pointer ${expandedLogId === log.id ? 'bg-blue-50/50' : ''}`}
                                    onClick={() => toggleExpand(log.id)}
                                >
                                    <td className="px-5 py-3 text-gray-400">
                                        {expandedLogId === log.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </td>
                                    <td className="px-5 py-3 text-xs font-mono text-gray-600">
                                        {new Date(log.started_at).toLocaleString('ko-KR', { hour12: false })}
                                    </td>
                                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{log.region}</td>
                                    <td className="px-5 py-3">
                                        <LogStatusBadge status={log.status} />
                                    </td>
                                    <td className="px-5 py-3 text-sm text-gray-700 max-w-md truncate">
                                        {log.log_message}
                                    </td>
                                    <td className="px-5 py-3 text-center text-sm font-medium text-gray-900">
                                        {log.articles_count}건
                                    </td>
                                    <td className="px-5 py-3 text-center text-xs font-mono text-gray-500">
                                        {getDuration(log.started_at, log.ended_at)}
                                    </td>
                                </tr>
                                {expandedLogId === log.id && (
                                    <tr className="bg-gray-50 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <td colSpan={7} className="px-10 py-4 border-b border-gray-100">
                                            <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs whitespace-pre-wrap max-h-96 overflow-y-auto shadow-inner">
                                                {log.metadata?.full_log || log.metadata?.error || "상세 로그가 없습니다."}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// --- Components ---

function StatCard({ label, value, color }: any) {
    const colors = {
        blue: "bg-blue-50 text-blue-700 border-blue-200",
        green: "bg-green-50 text-green-700 border-green-200",
        orange: "bg-orange-50 text-orange-700 border-orange-200",
        red: "bg-red-50 text-red-700 border-red-200",
        gray: "bg-gray-50 text-gray-700 border-gray-200",
    };

    return (
        <div className={`rounded-lg border p-4 ${colors[color as keyof typeof colors]}`}>
            <p className="text-sm font-medium opacity-80">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
    );
}

function LogStatusBadge({ status }: { status: string }) {
    const styles: any = {
        success: { bg: "bg-green-100", text: "text-green-800", border: "border-green-200", icon: CheckCircle, label: "성공" },
        warning: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200", icon: AlertTriangle, label: "경고" },
        failed: { bg: "bg-red-100", text: "text-red-800", border: "border-red-200", icon: XCircle, label: "실패" },
        error: { bg: "bg-red-100", text: "text-red-800", border: "border-red-200", icon: XCircle, label: "에러" },
        running: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200", icon: Activity, label: "실행중" },
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

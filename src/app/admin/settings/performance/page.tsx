"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Activity,
    RefreshCw,
    Loader2,
    Plus,
    Trash2,
    ExternalLink,
    TrendingUp,
    TrendingDown,
    Minus,
    X,
    Zap,
    Clock,
    Settings,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

interface PerformanceLog {
    id: string;
    measured_at: string;
    performance: number;
    accessibility: number;
    best_practices: number;
    seo: number;
    lcp_ms: number | null;
    fcp_ms: number | null;
    tbt_ms: number | null;
    cls: number | null;
    si_ms: number | null;
    notes: string | null;
    created_by: string;
}

export default function PerformancePage() {
    const [logs, setLogs] = useState<PerformanceLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [analyzeResult, setAnalyzeResult] = useState<{success: boolean; message: string} | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [autoEnabled, setAutoEnabled] = useState(true);

    // Form state
    const [formData, setFormData] = useState({
        performance: '',
        accessibility: '',
        best_practices: '',
        seo: '',
        lcp_ms: '',
        fcp_ms: '',
        tbt_ms: '',
        cls: '',
        si_ms: '',
        notes: ''
    });

    useEffect(() => {
        fetchLogs();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings?key=pagespeed_auto');
            const data = await res.json();
            if (data.value) {
                setAutoEnabled(data.value.enabled !== false);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const runAutoAnalysis = async () => {
        setAnalyzing(true);
        setAnalyzeResult(null);
        try {
            const res = await fetch('/api/admin/pagespeed-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source: 'manual' })
            });
            const data = await res.json();
            if (data.success) {
                setAnalyzeResult({
                    success: true,
                    message: `Performance: ${data.scores.performance}, LCP: ${data.metrics.lcp}`
                });
                fetchLogs();
            } else {
                setAnalyzeResult({
                    success: false,
                    message: data.error || 'Analysis failed'
                });
            }
        } catch (e) {
            setAnalyzeResult({
                success: false,
                message: 'Network error'
            });
        } finally {
            setAnalyzing(false);
            setTimeout(() => setAnalyzeResult(null), 5000);
        }
    };

    const toggleAutoCheck = async () => {
        const newEnabled = !autoEnabled;
        setAutoEnabled(newEnabled);
        try {
            await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key: 'pagespeed_auto',
                    value: { enabled: newEnabled }
                })
            });
        } catch (e) {
            console.error(e);
            setAutoEnabled(!newEnabled);
        }
    };

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/performance');
            const data = await res.json();
            setLogs(data.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const res = await fetch('/api/admin/performance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    created_by: 'manual'
                })
            });

            if (res.ok) {
                setShowForm(false);
                setFormData({
                    performance: '',
                    accessibility: '',
                    best_practices: '',
                    seo: '',
                    lcp_ms: '',
                    fcp_ms: '',
                    tbt_ms: '',
                    cls: '',
                    si_ms: '',
                    notes: ''
                });
                fetchLogs();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this record?')) return;

        try {
            const res = await fetch(`/api/admin/performance/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchLogs();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const latest = logs[0];
    const previous = logs[1];

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-emerald-400';
        if (score >= 50) return 'text-amber-400';
        return 'text-red-400';
    };

    const getScoreBg = (score: number) => {
        if (score >= 90) return 'bg-emerald-500';
        if (score >= 50) return 'bg-amber-500';
        return 'bg-red-500';
    };

    const getTrend = (current: number | undefined, prev: number | undefined) => {
        if (!current || !prev) return null;
        const diff = current - prev;
        if (diff > 0) return <TrendingUp className="w-3 h-3 text-emerald-400" />;
        if (diff < 0) return <TrendingDown className="w-3 h-3 text-red-400" />;
        return <Minus className="w-3 h-3 text-slate-500" />;
    };

    const formatMs = (ms: number | null) => {
        if (ms === null) return '-';
        if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
        return `${ms}ms`;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ko-KR', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <Link
                        href="/admin/settings"
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-4 text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Settings
                    </Link>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-500/20 rounded-xl">
                                <Activity className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">PageSpeed Performance</h1>
                                <p className="text-sm text-slate-400 mt-0.5">Track optimization progress</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={runAutoAnalysis}
                                disabled={analyzing}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm bg-gradient-to-r from-violet-600 to-violet-500 rounded-lg text-white font-medium hover:from-violet-500 hover:to-violet-400 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
                            >
                                {analyzing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Zap className="w-4 h-4" />
                                )}
                                {analyzing ? '분석 중...' : '자동 분석'}
                            </button>
                            <a
                                href="https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fwww.koreanewsone.com%2F"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 text-sm bg-[#21262d] border border-[#30363d] rounded-lg text-slate-300 hover:text-white hover:bg-[#30363d] transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" />
                                수동 분석
                            </a>
                            <button
                                onClick={() => setShowForm(true)}
                                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 rounded-lg text-white hover:bg-blue-500 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                기록 추가
                            </button>
                            <button
                                onClick={fetchLogs}
                                className="p-2 bg-[#21262d] border border-[#30363d] rounded-lg text-slate-400 hover:text-white hover:bg-[#30363d] transition-colors"
                                title="새로고침"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Analysis Result Notification */}
                {analyzeResult && (
                    <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
                        analyzeResult.success
                            ? 'bg-emerald-500/10 border border-emerald-500/30'
                            : 'bg-red-500/10 border border-red-500/30'
                    }`}>
                        {analyzeResult.success ? (
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-red-400" />
                        )}
                        <span className={analyzeResult.success ? 'text-emerald-300' : 'text-red-300'}>
                            {analyzeResult.message}
                        </span>
                    </div>
                )}

                {/* Auto Check Settings */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-500/20 rounded-lg">
                                <Clock className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-white">Auto Check</h3>
                                <p className="text-xs text-slate-500">Daily at 09:00, 15:00, 21:00 KST</p>
                            </div>
                        </div>
                        <button
                            onClick={toggleAutoCheck}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                                autoEnabled ? 'bg-violet-500' : 'bg-slate-600'
                            }`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                autoEnabled ? 'left-7' : 'left-1'
                            }`} />
                        </button>
                    </div>
                </div>

                {/* Score Cards */}
                {latest && (
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Performance', value: latest.performance, prev: previous?.performance },
                            { label: 'Accessibility', value: latest.accessibility, prev: previous?.accessibility },
                            { label: 'Best Practices', value: latest.best_practices, prev: previous?.best_practices },
                            { label: 'SEO', value: latest.seo, prev: previous?.seo }
                        ].map((item) => (
                            <div key={item.label} className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-slate-400 font-medium">{item.label}</span>
                                    {getTrend(item.value, item.prev)}
                                </div>
                                <div className={`text-3xl font-bold ${getScoreColor(item.value)}`}>
                                    {item.value}
                                </div>
                                <div className="mt-2 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${getScoreBg(item.value)} transition-all`}
                                        style={{ width: `${item.value}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Core Web Vitals */}
                {latest && (
                    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 mb-6">
                        <h2 className="text-sm font-semibold text-white mb-4">Core Web Vitals</h2>
                        <div className="grid grid-cols-5 gap-4">
                            {[
                                { label: 'LCP', value: latest.lcp_ms, target: 2500, format: formatMs },
                                { label: 'FCP', value: latest.fcp_ms, target: 1800, format: formatMs },
                                { label: 'TBT', value: latest.tbt_ms, target: 200, format: formatMs },
                                { label: 'CLS', value: latest.cls, target: 0.1, format: (v: number | null) => v?.toFixed(3) || '-' },
                                { label: 'SI', value: latest.si_ms, target: 3400, format: formatMs }
                            ].map((item) => {
                                const isGood = item.value !== null && item.value <= item.target;
                                return (
                                    <div key={item.label} className="text-center">
                                        <div className="text-xs text-slate-500 mb-1">{item.label}</div>
                                        <div className={`text-lg font-bold ${isGood ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            {item.format(item.value)}
                                        </div>
                                        <div className="text-[10px] text-slate-600">
                                            target: {item.label === 'CLS' ? item.target : formatMs(item.target)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* History Table */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-[#30363d] flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-white">Measurement History</h2>
                        <span className="text-xs text-slate-500">{logs.length} records</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-slate-500 border-b border-[#30363d]">
                                    <th className="px-4 py-3 font-medium">Date</th>
                                    <th className="px-4 py-3 font-medium text-center">Perf</th>
                                    <th className="px-4 py-3 font-medium text-center">A11y</th>
                                    <th className="px-4 py-3 font-medium text-center">BP</th>
                                    <th className="px-4 py-3 font-medium text-center">SEO</th>
                                    <th className="px-4 py-3 font-medium text-center">LCP</th>
                                    <th className="px-4 py-3 font-medium text-center">TBT</th>
                                    <th className="px-4 py-3 font-medium">Notes</th>
                                    <th className="px-4 py-3 font-medium w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, idx) => (
                                    <tr
                                        key={log.id}
                                        className={`border-b border-[#21262d] hover:bg-[#21262d]/50 ${idx === 0 ? 'bg-blue-500/5' : ''}`}
                                    >
                                        <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                                            {formatDate(log.measured_at)}
                                        </td>
                                        <td className={`px-4 py-3 text-center font-medium ${getScoreColor(log.performance)}`}>
                                            {log.performance}
                                        </td>
                                        <td className={`px-4 py-3 text-center font-medium ${getScoreColor(log.accessibility)}`}>
                                            {log.accessibility}
                                        </td>
                                        <td className={`px-4 py-3 text-center font-medium ${getScoreColor(log.best_practices)}`}>
                                            {log.best_practices}
                                        </td>
                                        <td className={`px-4 py-3 text-center font-medium ${getScoreColor(log.seo)}`}>
                                            {log.seo}
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-400">
                                            {formatMs(log.lcp_ms)}
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-400">
                                            {formatMs(log.tbt_ms)}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">
                                            {log.notes || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => handleDelete(log.id)}
                                                className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                                            No records yet. Add your first measurement.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add Record Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                        <div className="bg-[#161b22] border border-[#30363d] rounded-xl w-full max-w-lg mx-4">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-[#30363d]">
                                <h3 className="text-lg font-semibold text-white">Add Measurement</h3>
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="p-1 text-slate-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                                {/* Main Scores */}
                                <div className="grid grid-cols-4 gap-3">
                                    {['performance', 'accessibility', 'best_practices', 'seo'].map((field) => (
                                        <div key={field}>
                                            <label className="block text-xs text-slate-400 mb-1 capitalize">
                                                {field.replace('_', ' ')}
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                required
                                                value={formData[field as keyof typeof formData]}
                                                onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                                                className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Vitals */}
                                <div className="grid grid-cols-5 gap-3">
                                    {[
                                        { field: 'lcp_ms', label: 'LCP (ms)' },
                                        { field: 'fcp_ms', label: 'FCP (ms)' },
                                        { field: 'tbt_ms', label: 'TBT (ms)' },
                                        { field: 'cls', label: 'CLS' },
                                        { field: 'si_ms', label: 'SI (ms)' }
                                    ].map(({ field, label }) => (
                                        <div key={field}>
                                            <label className="block text-xs text-slate-400 mb-1">{label}</label>
                                            <input
                                                type="number"
                                                step={field === 'cls' ? '0.001' : '1'}
                                                value={formData[field as keyof typeof formData]}
                                                onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                                                className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Notes</label>
                                    <input
                                        type="text"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="e.g., Phase 3: Image optimization"
                                        className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none placeholder:text-slate-600"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors"
                                    >
                                        {submitting ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Activity,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Clock,
    Calendar,
    Server,
    FileText,
    Database,
    RefreshCw,
    Copy,
    Check,
    StopCircle
} from "lucide-react";
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmModal';

interface LogDetail {
    id: number;
    region: string;
    status: string;
    started_at: string;
    ended_at: string | null;
    articles_count: number;
    log_message: string;
    metadata: any;
}

export default function LogDetailPage() {
    const { showSuccess, showError } = useToast();
    const { confirm } = useConfirm();
    const params = useParams();
    const router = useRouter();
    const [log, setLog] = useState<LogDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isStopping, setIsStopping] = useState(false);

    const fetchLog = async () => {
        try {
            const res = await fetch(`/api/bot/bot-logs/${params.id}`);
            const data = await res.json();

            if (!res.ok) {
                setError(data.message || '로그를 불러올 수 없습니다.');
                return;
            }

            setLog(data.log);
        } catch (err) {
            setError('로그 로딩 실패');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLog();
    }, [params.id]);

    // 실행 중이면 자동 갱신
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (log?.status === 'running') {
            interval = setInterval(fetchLog, 2000);
        }
        return () => clearInterval(interval);
    }, [log?.status]);

    const copyToClipboard = () => {
        if (!log) return;
        const text = `[${log.region}] ${log.status}\n시작: ${log.started_at}\n종료: ${log.ended_at || '진행중'}\n\n${log.log_message}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleStop = async () => {
        if (!log || log.status !== 'running') return;
        const confirmed = await confirm({ message: `${log.region.toUpperCase()} 스크래퍼를 중지하시겠습니까?` });
        if (!confirmed) return;

        setIsStopping(true);
        try {
            // 전체 중지 API 호출
            const res = await fetch('/api/bot/stop', { method: 'POST' });
            const data = await res.json();

            if (data.success) {
                // 로그 다시 불러오기
                await fetchLog();
                showSuccess('스크래퍼가 중지되었습니다.');
            } else {
                showError(`중지 실패: ${data.message}`);
            }
        } catch (err: any) {
            showError(`중지 오류: ${err.message}`);
        } finally {
            setIsStopping(false);
        }
    };

    const getDuration = () => {
        if (!log) return '-';
        if (!log.ended_at) return '진행 중...';
        const diff = new Date(log.ended_at).getTime() - new Date(log.started_at).getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        if (minutes > 0) {
            return `${minutes}분 ${seconds % 60}초`;
        }
        return `${seconds}초`;
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, any> = {
            success: { bg: "bg-green-900/30", text: "text-green-400", border: "border-green-800", icon: CheckCircle, label: "성공", iconColor: "text-green-400" },
            warning: { bg: "bg-orange-900/30", text: "text-orange-400", border: "border-orange-800", icon: AlertTriangle, label: "경고", iconColor: "text-orange-400" },
            failed: { bg: "bg-red-900/30", text: "text-red-400", border: "border-red-800", icon: XCircle, label: "실패", iconColor: "text-red-400" },
            failure: { bg: "bg-red-900/30", text: "text-red-400", border: "border-red-800", icon: XCircle, label: "실패", iconColor: "text-red-400" },
            error: { bg: "bg-red-900/30", text: "text-red-400", border: "border-red-800", icon: XCircle, label: "에러", iconColor: "text-red-400" },
            running: { bg: "bg-blue-900/30", text: "text-blue-400", border: "border-blue-800", icon: Activity, label: "실행중", iconColor: "text-blue-400" },
            stopped: { bg: "bg-orange-900/30", text: "text-orange-400", border: "border-orange-800", icon: StopCircle, label: "중지됨", iconColor: "text-orange-400" },
        };
        return configs[status] || configs['warning'];
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <RefreshCw className="w-8 h-8 text-[#8b949e] animate-spin" />
            </div>
        );
    }

    if (error || !log) {
        return (
            <div className="space-y-6">
                <Link href="/admin/bot/logs" className="inline-flex items-center gap-2 text-[#8b949e] hover:text-[#e6edf3]">
                    <ArrowLeft className="w-4 h-4" />
                    목록으로 돌아가기
                </Link>
                <div className="bg-red-900/30 border border-red-800 rounded-xl p-8 text-center">
                    <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-red-400">{error || '로그를 찾을 수 없습니다'}</h2>
                    <p className="text-sm text-red-500 mt-2">요청하신 로그 ID: {params.id}</p>
                </div>
            </div>
        );
    }

    const statusConfig = getStatusConfig(log.status);
    const StatusIcon = statusConfig.icon;

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Back Button */}
            <Link href="/admin/bot/logs" className="inline-flex items-center gap-2 text-[#8b949e] hover:text-[#e6edf3] transition">
                <ArrowLeft className="w-4 h-4" />
                목록으로 돌아가기
            </Link>

            {/* Header Card */}
            <div className={`rounded-xl border-2 ${statusConfig.border} ${statusConfig.bg} p-6`}>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full bg-[#161b22] shadow-sm`}>
                            <StatusIcon className={`w-8 h-8 ${statusConfig.iconColor} ${log.status === 'running' ? 'animate-spin' : ''}`} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[#e6edf3]">
                                {log.region.toUpperCase()} 스크래퍼
                            </h1>
                            <p className={`text-lg font-semibold mt-1 ${statusConfig.text}`}>
                                {statusConfig.label}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-[#8b949e]">Log ID</p>
                        <p className="text-2xl font-mono font-bold text-[#c9d1d9]">#{log.id}</p>
                    </div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoCard
                    icon={Calendar}
                    label="시작 시각"
                    value={new Date(log.started_at).toLocaleString('ko-KR', { hour12: false })}
                />
                <InfoCard
                    icon={Clock}
                    label="종료 시각"
                    value={log.ended_at ? new Date(log.ended_at).toLocaleString('ko-KR', { hour12: false }) : '진행 중...'}
                    highlight={!log.ended_at}
                />
                <InfoCard
                    icon={Clock}
                    label="소요 시간"
                    value={getDuration()}
                    highlight={log.status === 'running'}
                />
                <InfoCard
                    icon={Database}
                    label="수집 기사"
                    value={`${log.articles_count}건`}
                />
            </div>

            {/* Metadata */}
            {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div className="bg-[#161b22] rounded-xl border border-[#30363d] shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#21262d] bg-[#21262d] flex items-center gap-2">
                        <Server className="w-5 h-5 text-[#8b949e]" />
                        <h2 className="font-bold text-[#e6edf3]">메타데이터</h2>
                    </div>
                    <div className="p-5">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {log.metadata.startDate && (
                                <div>
                                    <p className="text-xs text-[#8b949e] uppercase">수집 시작일</p>
                                    <p className="font-mono text-sm text-[#c9d1d9]">{log.metadata.startDate}</p>
                                </div>
                            )}
                            {log.metadata.endDate && (
                                <div>
                                    <p className="text-xs text-[#8b949e] uppercase">수집 종료일</p>
                                    <p className="font-mono text-sm text-[#c9d1d9]">{log.metadata.endDate}</p>
                                </div>
                            )}
                            {log.metadata.started_at && (
                                <div>
                                    <p className="text-xs text-[#8b949e] uppercase">실행 타임스탬프</p>
                                    <p className="font-mono text-sm text-[#c9d1d9]">{log.metadata.started_at}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Log Message */}
            <div className="bg-[#161b22] rounded-xl border border-[#30363d] shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-[#21262d] bg-[#21262d] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#8b949e]" />
                        <h2 className="font-bold text-[#e6edf3]">실행 로그</h2>
                        {log.status === 'running' && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-900/50 text-blue-400 text-xs rounded-full animate-pulse">
                                실시간 갱신 중
                            </span>
                        )}
                    </div>
                    <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] rounded-lg transition"
                    >
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        {copied ? '복사됨!' : '복사'}
                    </button>
                </div>
                <div className="p-5">
                    <pre className="bg-[#0d1117] text-[#c9d1d9] rounded-lg p-5 font-mono text-sm whitespace-pre-wrap overflow-x-auto max-h-[500px] overflow-y-auto shadow-inner leading-relaxed border border-[#21262d]">
                        {log.log_message || '로그 메시지가 없습니다.'}
                    </pre>
                </div>
            </div>

            {/* Error Detail (if failed) */}
            {(log.status === 'failed' || log.status === 'failure' || log.status === 'error') && log.metadata?.error && (
                <div className="bg-red-900/20 rounded-xl border border-red-800 overflow-hidden">
                    <div className="px-5 py-4 border-b border-red-900/50 bg-red-900/30 flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-400" />
                        <h2 className="font-bold text-red-400">에러 상세</h2>
                    </div>
                    <div className="p-5">
                        <pre className="bg-red-950 text-red-200 rounded-lg p-5 font-mono text-sm whitespace-pre-wrap overflow-x-auto max-h-[300px] overflow-y-auto border border-red-900">
                            {log.metadata.error}
                        </pre>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
                <button
                    onClick={() => router.push('/admin/bot/logs')}
                    className="px-4 py-2 bg-[#21262d] text-[#c9d1d9] rounded-lg font-medium hover:bg-[#30363d] transition border border-[#30363d]"
                >
                    목록으로
                </button>
                <button
                    onClick={fetchLog}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    새로고침
                </button>
                {log.status === 'running' && (
                    <button
                        onClick={handleStop}
                        disabled={isStopping}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <StopCircle className={`w-4 h-4 ${isStopping ? 'animate-spin' : ''}`} />
                        {isStopping ? '중지 중...' : '스크래퍼 중지'}
                    </button>
                )}
            </div>
        </div>
    );
}

function InfoCard({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: string; highlight?: boolean }) {
    return (
        <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-[#6e7681]" />
                <span className="text-xs text-[#8b949e] uppercase tracking-wide">{label}</span>
            </div>
            <p className={`text-sm font-semibold ${highlight ? 'text-blue-400 animate-pulse' : 'text-[#e6edf3]'}`}>
                {value}
            </p>
        </div>
    );
}

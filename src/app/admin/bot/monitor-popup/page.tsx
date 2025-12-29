'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase-client';

interface JobSession {
    id: string;
    started_at: string;
    ended_at: string | null;
    status: string;
    trigger_type: string;
    scraping_total_regions: number;
    scraping_success: number;
    scraping_failed: number;
    scraping_articles_collected: number;
    scraping_articles_duplicate: number;
    ai_total_articles: number;
    ai_processed: number;
    ai_grade_a: number;
    ai_grade_b: number;
    ai_grade_c: number;
    ai_grade_d: number;
    ai_published: number;
    error_count: number;
}

interface JobLog {
    id: number;
    session_id: string;
    phase: string;
    region: string | null;
    log_level: string;
    log_type: string;
    message: string;
    article_id: string | null;
    article_title: string | null;
    ai_attempt: number | null;
    ai_grade: string | null;
    ai_score: number | null;
    layer_results: Record<string, unknown> | null;
    duration_ms: number | null;
    created_at: string;
}

// Region name mapping (Korean)
const REGION_NAMES: Record<string, string> = {
    'gwangju': '광주시',
    'jeonnam': '전라남도',
    'mokpo': '목포시',
    'yeosu': '여수시',
    'suncheon': '순천시',
    'naju': '나주시',
    'gwangyang': '광양시',
    'damyang': '담양군',
    'gokseong': '곡성군',
    'gurye': '구례군',
    'goheung': '고흥군',
    'boseong': '보성군',
    'hwasun': '화순군',
    'jangheung': '장흥군',
    'gangjin': '강진군',
    'haenam': '해남군',
    'yeongam': '영암군',
    'muan': '무안군',
    'hampyeong': '함평군',
    'yeonggwang': '영광군',
    'jangseong': '장성군',
    'wando': '완도군',
    'jindo': '진도군',
    'shinan': '신안군',
    'gwangju_edu': '광주교육청',
    'jeonnam_edu': '전남교육청'
};

export default function MonitorPopupPage() {
    const supabase = createClient();
    const [session, setSession] = useState<JobSession | null>(null);
    const [logs, setLogs] = useState<JobLog[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [filter, setFilter] = useState<'all' | 'scraping' | 'ai_processing'>('all');
    const [autoScroll, setAutoScroll] = useState(true);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when new logs arrive
    useEffect(() => {
        if (autoScroll && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, autoScroll]);

    // Load current session and subscribe to realtime
    useEffect(() => {
        let channel: ReturnType<typeof supabase.channel> | null = null;

        async function loadSession() {
            // Find running session
            const { data: sessions, error } = await supabase
                .from('job_sessions')
                .select('*')
                .order('started_at', { ascending: false })
                .limit(1);

            if (error) {
                console.error('세션 로드 실패:', error);
                return;
            }

            if (sessions && sessions.length > 0) {
                setSession(sessions[0]);

                // Load existing logs for this session
                const { data: existingLogs } = await supabase
                    .from('job_logs')
                    .select('*')
                    .eq('session_id', sessions[0].id)
                    .order('created_at', { ascending: true });

                if (existingLogs) {
                    setLogs(existingLogs);
                }

                // Subscribe to new logs
                channel = supabase
                    .channel('job_logs_realtime')
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'job_logs',
                            filter: `session_id=eq.${sessions[0].id}`
                        },
                        (payload) => {
                            const newLog = payload.new as JobLog;
                            setLogs(prev => [...prev, newLog]);
                        }
                    )
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'job_sessions',
                            filter: `id=eq.${sessions[0].id}`
                        },
                        (payload) => {
                            setSession(payload.new as JobSession);
                        }
                    )
                    .subscribe((status) => {
                        setIsConnected(status === 'SUBSCRIBED');
                    });
            }
        }

        loadSession();

        // Cleanup
        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, []);

    // Filter logs - memoized to prevent recalculation
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            if (filter === 'all') return true;
            return log.phase === filter;
        });
    }, [logs, filter]);

    // Get log level color
    const getLevelColor = (level: string) => {
        switch (level) {
            case 'error': return 'text-red-400';
            case 'warning': return 'text-yellow-400';
            case 'info': return 'text-blue-400';
            case 'debug': return 'text-gray-400';
            default: return 'text-gray-300';
        }
    };

    // Get phase color
    const getPhaseColor = (phase: string) => {
        switch (phase) {
            case 'scraping': return 'bg-purple-600';
            case 'ai_processing': return 'bg-blue-600';
            case 'system': return 'bg-gray-600';
            default: return 'bg-gray-600';
        }
    };

    // Get phase label (Korean)
    const getPhaseLabel = (phase: string) => {
        switch (phase) {
            case 'scraping': return '수집';
            case 'ai_processing': return 'AI';
            case 'system': return '시스템';
            default: return phase;
        }
    };

    // Get grade color
    const getGradeColor = (grade: string | null) => {
        switch (grade) {
            case 'A': return 'bg-green-500';
            case 'B': return 'bg-yellow-500';
            case 'C': return 'bg-orange-500';
            case 'D': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    // Get region name (Korean)
    const getRegionName = (region: string | null) => {
        if (!region) return '';
        return REGION_NAMES[region] || region;
    };

    // Get status label (Korean)
    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'running': return '실행 중';
            case 'completed': return '완료';
            case 'completed_with_errors': return '완료 (오류 있음)';
            case 'completed_with_timeout': return '완료 (시간초과)';
            case 'failed': return '실패';
            default: return status;
        }
    };

    // Render layer results
    const renderLayerResults = (results: Record<string, unknown> | null) => {
        if (!results) return null;

        return (
            <div className="mt-2 pl-4 border-l-2 border-gray-600 text-xs space-y-1">
                {!!results.layer1_2 && (
                    <div className="text-gray-400">
                        <span className="text-purple-400">[레이어 1&2]</span>{' '}
                        팩트: 누락 {(results.layer1_2 as Record<string, unknown[]>).missing?.length || 0}개,
                        추가 {(results.layer1_2 as Record<string, unknown[]>).added?.length || 0}개
                        {(results.layer1_2 as Record<string, boolean>).passed ?
                            <span className="text-green-400 ml-2">통과</span> :
                            <span className="text-red-400 ml-2">실패</span>
                        }
                    </div>
                )}
                {!!results.layer3 && (
                    <div className="text-gray-400">
                        <span className="text-blue-400">[레이어 3]</span>{' '}
                        할루시네이션: {(results.layer3 as Record<string, unknown[]>).hallucinations?.length || 0}건
                        {(results.layer3 as Record<string, boolean>).passed ?
                            <span className="text-green-400 ml-2">통과</span> :
                            <span className="text-red-400 ml-2">실패</span>
                        }
                    </div>
                )}
                {!!results.layer4 && (
                    <div className="text-gray-400">
                        <span className="text-cyan-400">[레이어 4]</span>{' '}
                        점수: {(results.layer4 as Record<string, number>).total || 0}/100점
                        {(results.layer4 as Record<string, boolean>).passed ?
                            <span className="text-green-400 ml-2">통과</span> :
                            <span className="text-red-400 ml-2">실패</span>
                        }
                    </div>
                )}
                {!!results.layer5 && (
                    <div className="text-gray-400">
                        <span className="text-yellow-400">[레이어 5]</span>{' '}
                        길이: {Math.round(((results.layer5 as Record<string, number>).ratio || 0) * 100)}%
                        {(results.layer5 as Record<string, boolean>).passed ?
                            <span className="text-green-400 ml-2">통과</span> :
                            <span className="text-red-400 ml-2">실패</span>
                        }
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
            {/* Header */}
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold">작업 모니터</h1>
                        <span className={`px-2 py-1 rounded text-xs ${isConnected ? 'bg-green-600' : 'bg-red-600'}`}>
                            {isConnected ? '연결됨' : '연결 끊김'}
                        </span>
                        {session && (
                            <span className={`px-2 py-1 rounded text-xs ${
                                session.status === 'running' ? 'bg-blue-600' :
                                session.status === 'completed' ? 'bg-green-600' : 'bg-yellow-600'
                            }`}>
                                {getStatusLabel(session.status)}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-sm">
                            <input
                                type="checkbox"
                                checked={autoScroll}
                                onChange={(e) => setAutoScroll(e.target.checked)}
                                className="rounded"
                            />
                            자동 스크롤
                        </label>
                    </div>
                </div>

                {/* Stats */}
                {session && (
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mt-4">
                        <div className="bg-gray-700 rounded p-2 text-center">
                            <div className="text-xs text-gray-400">수집 지역</div>
                            <div className="text-lg font-bold">{session.scraping_success}/{session.scraping_total_regions}</div>
                        </div>
                        <div className="bg-gray-700 rounded p-2 text-center">
                            <div className="text-xs text-gray-400">수집 기사</div>
                            <div className="text-lg font-bold text-blue-400">{session.scraping_articles_collected}</div>
                        </div>
                        <div className="bg-gray-700 rounded p-2 text-center">
                            <div className="text-xs text-gray-400">중복 기사</div>
                            <div className="text-lg font-bold text-yellow-400">{session.scraping_articles_duplicate}</div>
                        </div>
                        <div className="bg-gray-700 rounded p-2 text-center">
                            <div className="text-xs text-gray-400">AI 처리</div>
                            <div className="text-lg font-bold">{session.ai_processed}/{session.ai_total_articles}</div>
                        </div>
                        <div className="bg-gray-700 rounded p-2 text-center">
                            <div className="text-xs text-gray-400">등급 A</div>
                            <div className="text-lg font-bold text-green-400">{session.ai_grade_a}</div>
                        </div>
                        <div className="bg-gray-700 rounded p-2 text-center">
                            <div className="text-xs text-gray-400">등급 B</div>
                            <div className="text-lg font-bold text-yellow-400">{session.ai_grade_b}</div>
                        </div>
                        <div className="bg-gray-700 rounded p-2 text-center">
                            <div className="text-xs text-gray-400">등급 C/D</div>
                            <div className="text-lg font-bold text-orange-400">{session.ai_grade_c + session.ai_grade_d}</div>
                        </div>
                        <div className="bg-gray-700 rounded p-2 text-center">
                            <div className="text-xs text-gray-400">발행됨</div>
                            <div className="text-lg font-bold text-green-400">{session.ai_published}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    전체 ({logs.length})
                </button>
                <button
                    onClick={() => setFilter('scraping')}
                    className={`px-4 py-2 rounded ${filter === 'scraping' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    수집 ({logs.filter(l => l.phase === 'scraping').length})
                </button>
                <button
                    onClick={() => setFilter('ai_processing')}
                    className={`px-4 py-2 rounded ${filter === 'ai_processing' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    AI 처리 ({logs.filter(l => l.phase === 'ai_processing').length})
                </button>
            </div>

            {/* Logs */}
            <div className="bg-gray-800 rounded-lg p-4 h-[calc(100vh-280px)] overflow-y-auto font-mono text-sm">
                {filteredLogs.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        {session ? '로그 대기 중...' : '활성 세션을 찾을 수 없습니다'}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredLogs.map((log) => (
                            <div key={log.id} className="flex flex-col border-b border-gray-700 pb-2">
                                <div className="flex items-start gap-2">
                                    {/* Timestamp */}
                                    <span className="text-gray-500 text-xs whitespace-nowrap">
                                        {new Date(log.created_at).toLocaleTimeString('ko-KR')}
                                    </span>

                                    {/* Phase Badge */}
                                    <span className={`${getPhaseColor(log.phase)} px-1.5 py-0.5 rounded text-xs`}>
                                        {getPhaseLabel(log.phase)}
                                    </span>

                                    {/* Region */}
                                    {log.region && (
                                        <span className="text-purple-400 text-xs">
                                            [{getRegionName(log.region)}]
                                        </span>
                                    )}

                                    {/* Grade Badge */}
                                    {log.ai_grade && (
                                        <span className={`${getGradeColor(log.ai_grade)} px-1.5 py-0.5 rounded text-xs`}>
                                            {log.ai_grade}등급
                                        </span>
                                    )}

                                    {/* Score */}
                                    {log.ai_score !== null && (
                                        <span className="text-cyan-400 text-xs">
                                            점수: {log.ai_score}점
                                        </span>
                                    )}

                                    {/* Message */}
                                    <span className={getLevelColor(log.log_level)}>
                                        {log.message}
                                    </span>

                                    {/* Duration */}
                                    {log.duration_ms !== null && (
                                        <span className="text-gray-500 text-xs">
                                            ({log.duration_ms}ms)
                                        </span>
                                    )}
                                </div>

                                {/* Article Title */}
                                {log.article_title && (
                                    <div className="text-gray-400 text-xs pl-16 truncate">
                                        {log.article_title}
                                    </div>
                                )}

                                {/* Layer Results */}
                                {log.layer_results && renderLayerResults(log.layer_results)}
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-4 text-center text-gray-500 text-xs">
                {session && (
                    <span>
                        세션: {session.id.substring(0, 8)}... |
                        시작: {new Date(session.started_at).toLocaleString('ko-KR')} |
                        오류: {session.error_count}건
                    </span>
                )}
            </div>
        </div>
    );
}

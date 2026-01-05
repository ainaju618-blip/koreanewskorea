'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

interface VerificationLog {
    id: number;
    article_id: string;
    round: number;
    grade: 'A' | 'B' | 'C' | 'D';
    summary: string;
    improvement: string;
    model_used: string;
    length_ratio: number;
    processing_time_ms: number;
    created_at: string;
    // Joined from posts
    title?: string;
    region?: string;
}

interface GradeSummary {
    grade: string;
    count: number;
    avg_round: number;
    avg_length_ratio: number;
    avg_processing_ms: number;
}

interface DailyStats {
    day: string;
    pass_rate: number;
    total: number;
    a_count: number;
    b_count: number;
    c_count: number;
    d_count: number;
}

export default function VerificationDashboard() {
    const [logs, setLogs] = useState<VerificationLog[]>([]);
    const [gradeSummary, setGradeSummary] = useState<GradeSummary[]>([]);
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            setLoading(true);
            const supabase = createClient();

            // Fetch recent verification logs with article info
            const { data: logsData, error: logsError } = await supabase
                .from('verification_logs')
                .select(`
                    id,
                    article_id,
                    round,
                    grade,
                    summary,
                    improvement,
                    model_used,
                    length_ratio,
                    processing_time_ms,
                    created_at,
                    posts!inner(title, region)
                `)
                .order('created_at', { ascending: false })
                .limit(100);

            if (logsError) {
                console.error('Logs fetch error:', logsError);
                // Try without join
                const { data: simpleLogs, error: simpleError } = await supabase
                    .from('verification_logs')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(100);

                if (simpleError) throw simpleError;
                setLogs(simpleLogs || []);
            } else {
                // Transform joined data
                const transformedLogs = (logsData || []).map((log: Record<string, unknown>) => ({
                    ...log,
                    title: (log.posts as Record<string, unknown>)?.title as string || '',
                    region: (log.posts as Record<string, unknown>)?.region as string || ''
                })) as VerificationLog[];
                setLogs(transformedLogs);
            }

            // Fetch grade summary
            const { data: summaryData, error: summaryError } = await supabase
                .from('verification_grade_summary')
                .select('*');

            if (summaryError) {
                console.warn('Grade summary view not available:', summaryError.message);
            } else {
                setGradeSummary(summaryData || []);
            }

            // Fetch daily stats
            const { data: dailyData, error: dailyError } = await supabase
                .from('daily_pass_rate')
                .select('*');

            if (dailyError) {
                console.warn('Daily pass rate view not available:', dailyError.message);
            } else {
                setDailyStats(dailyData || []);
            }

            setError(null);
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    }

    const getGradeColor = (grade: string) => {
        switch (grade) {
            case 'A': return 'bg-green-600';
            case 'B': return 'bg-yellow-500';
            case 'C': return 'bg-orange-500';
            case 'D': return 'bg-red-600';
            default: return 'bg-gray-500';
        }
    };

    const getGradeBgColor = (grade: string) => {
        switch (grade) {
            case 'A': return 'bg-green-900/50 text-green-400';
            case 'B': return 'bg-yellow-900/50 text-yellow-400';
            case 'C': return 'bg-orange-900/50 text-orange-400';
            case 'D': return 'bg-red-900/50 text-red-400';
            default: return 'bg-[#21262d] text-[#8b949e]';
        }
    };

    // Calculate totals
    const totalVerifications = logs.length;
    const gradeACount = logs.filter(l => l.grade === 'A').length;
    const passRate = totalVerifications > 0 ? ((gradeACount / totalVerifications) * 100).toFixed(1) : '0';

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-[#21262d] rounded w-1/4 mb-6"></div>
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-24 bg-[#21262d] rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-[#0d1117] min-h-screen text-[#e6edf3]">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">AI 검증 대시보드</h1>
                <button
                    onClick={fetchData}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                >
                    새로고침
                </button>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-900/50 border border-red-800 rounded text-red-400">
                    {error}
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#161b22] rounded-lg p-4 border border-[#30363d]">
                    <div className="text-[#8b949e] text-sm">총 검증</div>
                    <div className="text-3xl font-bold text-[#e6edf3]">{totalVerifications}</div>
                </div>
                <div className="bg-[#161b22] rounded-lg p-4 border border-[#30363d]">
                    <div className="text-[#8b949e] text-sm">A등급 통과율</div>
                    <div className="text-3xl font-bold text-green-400">{passRate}%</div>
                </div>
                <div className="bg-[#161b22] rounded-lg p-4 border border-[#30363d]">
                    <div className="text-[#8b949e] text-sm">A등급</div>
                    <div className="text-3xl font-bold text-green-400">{gradeACount}</div>
                </div>
                <div className="bg-[#161b22] rounded-lg p-4 border border-[#30363d]">
                    <div className="text-[#8b949e] text-sm">모델</div>
                    <div className="text-xl font-bold text-blue-400">solar:10.7b</div>
                </div>
            </div>

            {/* Grade Distribution */}
            {gradeSummary.length > 0 && (
                <div className="bg-[#161b22] rounded-lg p-4 mb-6 border border-[#30363d]">
                    <h2 className="text-lg font-semibold mb-4 text-[#e6edf3]">등급별 분포</h2>
                    <div className="grid grid-cols-4 gap-4">
                        {['A', 'B', 'C', 'D'].map(grade => {
                            const data = gradeSummary.find(s => s.grade === grade);
                            return (
                                <div key={grade} className="text-center">
                                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-xl font-bold ${getGradeColor(grade)}`}>
                                        {grade}
                                    </div>
                                    <div className="mt-2 text-2xl font-bold text-[#e6edf3]">{data?.count || 0}</div>
                                    <div className="text-[#8b949e] text-sm">
                                        평균 {data?.avg_round?.toFixed(1) || 0}회
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Daily Pass Rate */}
            {dailyStats.length > 0 && (
                <div className="bg-[#161b22] rounded-lg p-4 mb-6 border border-[#30363d]">
                    <h2 className="text-lg font-semibold mb-4 text-[#e6edf3]">일별 통과율 (최근 7일)</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#30363d]">
                                    <th className="text-left py-2 px-3 text-[#8b949e]">날짜</th>
                                    <th className="text-right py-2 px-3 text-[#8b949e]">통과율</th>
                                    <th className="text-right py-2 px-3 text-[#8b949e]">총</th>
                                    <th className="text-right py-2 px-3 text-[#8b949e]">A</th>
                                    <th className="text-right py-2 px-3 text-[#8b949e]">B</th>
                                    <th className="text-right py-2 px-3 text-[#8b949e]">C</th>
                                    <th className="text-right py-2 px-3 text-[#8b949e]">D</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dailyStats.map((stat, i) => (
                                    <tr key={i} className="border-b border-[#21262d]">
                                        <td className="py-2 px-3 text-[#c9d1d9]">
                                            {new Date(stat.day).toLocaleDateString('ko-KR')}
                                        </td>
                                        <td className="text-right py-2 px-3">
                                            <span className={stat.pass_rate >= 70 ? 'text-green-400' : stat.pass_rate >= 50 ? 'text-yellow-400' : 'text-red-400'}>
                                                {stat.pass_rate?.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="text-right py-2 px-3 text-[#c9d1d9]">{stat.total}</td>
                                        <td className="text-right py-2 px-3 text-green-400">{stat.a_count}</td>
                                        <td className="text-right py-2 px-3 text-yellow-400">{stat.b_count}</td>
                                        <td className="text-right py-2 px-3 text-orange-400">{stat.c_count}</td>
                                        <td className="text-right py-2 px-3 text-red-400">{stat.d_count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Recent Verification Logs */}
            <div className="bg-[#161b22] rounded-lg p-4 border border-[#30363d]">
                <h2 className="text-lg font-semibold mb-4 text-[#e6edf3]">최근 검증 로그 (최근 100건)</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[#30363d]">
                                <th className="text-left py-2 px-2 text-[#8b949e]">시간</th>
                                <th className="text-left py-2 px-2 text-[#8b949e]">제목</th>
                                <th className="text-center py-2 px-2 text-[#8b949e]">회차</th>
                                <th className="text-center py-2 px-2 text-[#8b949e]">등급</th>
                                <th className="text-right py-2 px-2 text-[#8b949e]">길이비</th>
                                <th className="text-right py-2 px-2 text-[#8b949e]">처리시간</th>
                                <th className="text-left py-2 px-2 text-[#8b949e]">요약</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} className="border-b border-[#21262d] hover:bg-[#21262d]">
                                    <td className="py-2 px-2 text-[#6e7681] whitespace-nowrap">
                                        {new Date(log.created_at).toLocaleString('ko-KR', {
                                            timeZone: 'Asia/Seoul',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td className="py-2 px-2 max-w-[200px] truncate text-[#c9d1d9]" title={log.title}>
                                        {log.title || log.article_id.slice(0, 8)}
                                    </td>
                                    <td className="text-center py-2 px-2 text-[#c9d1d9]">{log.round}/5</td>
                                    <td className="text-center py-2 px-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${getGradeBgColor(log.grade)}`}>
                                            {log.grade}
                                        </span>
                                    </td>
                                    <td className="text-right py-2 px-2">
                                        <span className={log.length_ratio >= 0.85 ? 'text-green-400' : 'text-red-400'}>
                                            {(log.length_ratio * 100).toFixed(0)}%
                                        </span>
                                    </td>
                                    <td className="text-right py-2 px-2 text-[#6e7681]">
                                        {(log.processing_time_ms / 1000).toFixed(1)}s
                                    </td>
                                    <td className="py-2 px-2 max-w-[300px] truncate text-[#6e7681]" title={log.summary}>
                                        {log.summary}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {logs.length === 0 && (
                    <div className="text-center py-8 text-[#8b949e]">
                        검증 로그가 없습니다. AI 처리를 실행하면 여기에 표시됩니다.
                    </div>
                )}
            </div>
        </div>
    );
}

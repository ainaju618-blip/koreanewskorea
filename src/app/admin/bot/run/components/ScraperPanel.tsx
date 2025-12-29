"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Play, Calendar, Filter, AlertCircle, Loader2, CheckCircle, Activity, XCircle, Clock, StopCircle, RotateCcw, FileText, ChevronDown, ChevronUp, Github, Zap, X, Monitor } from "lucide-react";
import { RegionCheckboxGroup, SelectionControls } from "./RegionCheckboxGroup";
import { DetailedResultPanel } from "./DetailedResultPanel";
import { localRegions, agencyRegions, allRegions, getRegionLabel } from "./regionData";
import { useConfirm } from '@/components/ui/ConfirmModal';

interface JobResult {
    id: number;
    region: string;
    status: string;
    log_message?: string;
    articles_count?: number;
    created_at?: string;
    metadata?: {
        detailed_stats?: {
            summary: {
                total_processed: number;
                total_created: number;
                total_skipped: number;
                total_failed: number;
                message: string;
            };
            date_breakdown: Array<{
                date: string;
                created: number;
                skipped: number;
                failed: number;
                note?: string;
                articles?: Array<{
                    status: 'created' | 'skipped' | 'failed';
                    title: string;
                    reason?: string;
                }>;
            }>;
            duration_seconds?: number;
            errors?: string[];
        };
        skipped_count?: number;
        full_log?: string;
    };
}

interface RegionStat {
    source: string;
    count: number;
    latestDate: string | null;
}

export function ScraperPanel() {
    const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [activePreset, setActivePreset] = useState<number | null>(null);

    // Status State
    const [isRunning, setIsRunning] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");

    // GitHub Actions result state
    const [ghActionsResult, setGhActionsResult] = useState<{
        status: 'success' | 'failure' | 'cancelled' | null;
        startTime: Date | null;
        endTime: Date | null;
        duration: string;
        total: number;
        completed: number;
        failed: number;
        url: string;
    } | null>(null);

    // Polling State
    const [activeJobIds, setActiveJobIds] = useState<number[]>([]);
    const [jobResults, setJobResults] = useState<JobResult[]>([]);
    const [progress, setProgress] = useState({ total: 0, completed: 0 });
    const [currentJobs, setCurrentJobs] = useState<JobResult[]>([]);

    // 지역별 통계 (기사 수 표시용)
    const [regionStats, setRegionStats] = useState<RegionStat[]>([]);

    // 스크래퍼 활성 상태 (동적 조회)
    const [activeScraperIds, setActiveScraperIds] = useState<string[]>([]);
    const { confirm } = useConfirm();

    // 지역별 통계 정보 매핑
    const regionInfo = React.useMemo(() => {
        const info: Record<string, { count: number; latestDate: string | null }> = {};
        regionStats.forEach(stat => {
            info[stat.source] = { count: stat.count, latestDate: stat.latestDate };
        });
        return info;
    }, [regionStats]);

    // 페이지 로드 시 DB에서 진행 중인 작업 확인 (Supabase 기반)
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/posts/stats/by-region');
                const data = await res.json();
                setRegionStats(data.stats || []);
            } catch (e) {
                console.error('Failed to fetch region stats:', e);
            }
        };
        fetchStats();

        // 스크래퍼 활성 상태 조회 (폴더 내 파일 3개 이상)
        const fetchScraperStatus = async () => {
            try {
                const res = await fetch('/api/bot/scraper-status');
                const data = await res.json();
                setActiveScraperIds(data.activeRegions || []);
                console.log('[ScraperPanel] Active scrapers:', data.activeRegions?.length || 0);
            } catch (e) {
                console.error('Failed to fetch scraper status:', e);
            }
        };
        fetchScraperStatus();

        // DB에서 실행 중인 작업 확인 (Supabase bot_logs 테이블)
        const checkRunningJobs = async () => {
            try {
                console.log('[ScraperPanel] Checking for running jobs in DB...');

                // Cache-busting timestamp to prevent browser caching
                const timestamp = Date.now();
                const res = await fetch(`/api/bot/bot-logs?status=running&limit=50&_t=${timestamp}`, {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' }
                });
                const data = await res.json();

                console.log('[ScraperPanel] Running jobs API response:', {
                    logsCount: data.logs?.length || 0,
                    logs: data.logs?.map((l: JobResult) => ({ id: l.id, region: l.region, status: l.status }))
                });

                if (!data.logs || data.logs.length === 0) {
                    console.log('[ScraperPanel] No running jobs found in DB');
                    return;
                }

                // running 상태인 작업들이 있으면 복원
                const runningJobs: JobResult[] = data.logs;
                const jobIds = runningJobs.map((j) => j.id);

                console.log('[ScraperPanel] Restoring state for running jobs:', {
                    jobIds,
                    regions: runningJobs.map(j => j.region)
                });

                // Batch state updates
                setActiveJobIds(jobIds);
                setCurrentJobs(runningJobs);
                setProgress({ total: runningJobs.length, completed: 0 });
                setStatusMessage(`진행 중인 작업 ${runningJobs.length}개 복원됨`);
                setIsRunning(true);

                console.log('[ScraperPanel] State restoration triggered');

            } catch (e) {
                console.error('[ScraperPanel] Failed to check running jobs:', e);
            }
        };
        checkRunningJobs();

        // GitHub Actions 진행 중인 작업 확인 및 자동 복원
        const checkGitHubActionsStatus = async () => {
            try {
                const res = await fetch('/api/admin/github-actions');
                const data = await res.json();

                if (data.runs && data.runs.length > 0) {
                    const latestRun = data.runs[0];
                    const jobStats = data.jobStats || { total: 0, completed: 0, in_progress: 0, queued: 0, failed: 0 };

                    // 진행 중인 GitHub Actions가 있으면 폴링 시작
                    if (latestRun.status === 'queued' || latestRun.status === 'in_progress' || jobStats.in_progress > 0) {
                        console.log('[ScraperPanel] Found running GitHub Actions, starting polling');
                        setIsRunning(true);
                        setProgress({ total: jobStats.total || 26, completed: jobStats.completed });
                        if (jobStats.in_progress > 0) {
                            setStatusMessage(`실행 중: ${jobStats.completed}/${jobStats.total} 완료, ${jobStats.in_progress}개 진행중`);
                        } else {
                            setStatusMessage('GitHub Actions 대기 중...');
                        }
                        // 폴링 시작 (createdAt 전달하여 정확한 실행 시간 계산)
                        pollGitHubActionsOnLoad(jobStats.total || 26, latestRun.createdAt);
                    }
                }
            } catch (e) {
                console.error('[ScraperPanel] Failed to check GitHub Actions status:', e);
            }
        };
        checkGitHubActionsStatus();
    }, []);

    // 페이지 로드 시 GitHub Actions 폴링 (useEffect에서 호출)
    const pollGitHubActionsOnLoad = (regionCount: number, createdAt?: string) => {
        let pollCount = 0;
        const maxPolls = 120;
        // Use workflow createdAt if available, otherwise use current time
        const runStartTime = createdAt ? new Date(createdAt) : new Date();

        const poll = async () => {
            try {
                const res = await fetch('/api/admin/github-actions');
                const data = await res.json();

                if (data.runs && data.runs.length > 0) {
                    const latestRun = data.runs[0];
                    const jobStats = data.jobStats || { total: 0, completed: 0, in_progress: 0, queued: 0, failed: 0 };

                    if (jobStats.total > 0) {
                        setProgress({ total: jobStats.total, completed: jobStats.completed });
                    }

                    if (latestRun.status === 'completed') {
                        const endTime = new Date();
                        const duration = formatDuration(runStartTime, endTime);

                        setIsRunning(false);
                        setGhActionsResult({
                            status: latestRun.conclusion as 'success' | 'failure' | 'cancelled',
                            startTime: runStartTime,
                            endTime: endTime,
                            duration: duration,
                            total: jobStats.total || regionCount,
                            completed: jobStats.completed || 0,
                            failed: jobStats.failed || 0,
                            url: latestRun.url || data.workflowUrl
                        });
                        setStatusMessage('GitHub Actions 완료!');
                        return;
                    } else if (latestRun.status === 'in_progress' || jobStats.in_progress > 0) {
                        setStatusMessage(`실행 중: ${jobStats.completed}/${jobStats.total} 완료, ${jobStats.in_progress}개 진행중`);
                    } else if (latestRun.status === 'queued') {
                        setStatusMessage('GitHub Actions 대기 중...');
                    }
                }

                pollCount++;
                if (pollCount < maxPolls) {
                    setTimeout(poll, 5000);
                } else {
                    setIsRunning(false);
                    setStatusMessage("Polling timeout.");
                }
            } catch (e) {
                console.error('[ScraperPanel] GitHub polling error:', e);
                pollCount++;
                if (pollCount < maxPolls) {
                    setTimeout(poll, 5000);
                }
            }
        };

        setTimeout(poll, 1000);
    };

    // 다중 작업 폴링 로직 (DB 기반)
    useEffect(() => {
        let interval: NodeJS.Timeout;

        console.log('[ScraperPanel] Polling effect triggered:', { isRunning, activeJobIdsCount: activeJobIds.length, activeJobIds });

        if (isRunning && activeJobIds.length > 0) {
            console.log('[ScraperPanel] Starting polling for jobs:', activeJobIds);

            const checkJobs = async () => {
                try {
                    // Cache-busting to prevent stale data
                    const timestamp = Date.now();
                    const res = await fetch(`/api/bot/bot-logs?limit=50&_t=${timestamp}`, {
                        cache: 'no-store',
                        headers: { 'Cache-Control': 'no-cache' }
                    });
                    const data = await res.json();

                    if (!data.logs) return;

                    const jobs = data.logs.filter((log: JobResult) => activeJobIds.includes(log.id));
                    const completed = jobs.filter((job: JobResult) =>
                        ['success', 'failed', 'failure', 'warning', 'error', 'stopped'].includes(job.status)
                    );

                    console.log('[ScraperPanel] Poll result:', {
                        matchedJobs: jobs.length,
                        completedJobs: completed.length,
                        statuses: jobs.map((j: JobResult) => ({ id: j.id, status: j.status }))
                    });

                    setProgress({
                        total: activeJobIds.length,
                        completed: completed.length
                    });

                    setCurrentJobs(jobs);

                    const running = jobs.find((job: JobResult) => job.status === 'running');
                    if (running) {
                        setStatusMessage(`현재 실행 중... [${getRegionLabel(running.region)}] ${running.log_message || ''} (${completed.length}/${activeJobIds.length} 완료)`);
                    } else if (completed.length === activeJobIds.length) {
                        // 모든 작업 완료
                        console.log('[ScraperPanel] All jobs completed, stopping polling');
                        setIsRunning(false);
                        setJobResults(jobs);
                        setStatusMessage("모든 작업이 완료되었습니다.");
                        setActiveJobIds([]);
                    }

                } catch (e) {
                    console.error("[ScraperPanel] Polling error:", e);
                }
            };

            checkJobs();
            // Optimized: 2s -> 5s (reduces API calls by 60%)
            interval = setInterval(checkJobs, 5000);
        }

        return () => {
            if (interval) {
                console.log('[ScraperPanel] Clearing polling interval');
                clearInterval(interval);
            }
        };
    }, [isRunning, activeJobIds]);

    // Local Python execution for selected regions (real-time monitoring)
    const handleRun = async () => {
        if (selectedRegions.length === 0) return;

        setIsRunning(true);
        setJobResults([]);
        setActiveJobIds([]);
        setGhActionsResult(null);
        setStatusMessage(`${selectedRegions.length}개 지역 수집 시작...`);
        setProgress({ total: selectedRegions.length, completed: 0 });

        try {
            const response = await fetch('/api/bot/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    regions: selectedRegions,
                    startDate,
                    endDate,
                    dryRun: false
                })
            });
            const data = await response.json();

            if (response.ok && data.jobIds) {
                console.log('[ScraperPanel] Local scraper started:', data);
                setActiveJobIds(data.jobIds);
                setProgress({ total: data.jobIds.length, completed: 0 });

                if (data.mode === 'local') {
                    setStatusMessage(`로컬 Python 실행 시작 (${data.jobCount}개 지역)`);
                } else if (data.mode === 'github-actions') {
                    setStatusMessage(`GitHub Actions 트리거됨 (${data.jobCount}개 지역)`);
                } else {
                    setStatusMessage(data.message);
                }
            } else {
                setIsRunning(false);
                setStatusMessage(`Error: ${data.message || 'Unknown error'}`);
            }
        } catch (error: any) {
            setIsRunning(false);
            setStatusMessage(`Failed: ${error.message}`);
        }
    };

    // GitHub Actions execution for ALL 26 regions (parallel)
    const handleGitHubRunAll = async () => {
        const runStartTime = new Date();
        setIsRunning(true);
        setJobResults([]);
        setGhActionsResult(null); // Clear previous result
        setStatusMessage("GitHub Actions: 26개 지역 병렬 실행 시작...");
        setProgress({ total: 26, completed: 0 });

        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            const days = Math.min(Math.max(diffDays, 1), 7).toString();

            const response = await fetch('/api/admin/github-actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ region: 'all', days })
            });
            const data = await response.json();

            if (response.ok && data.success) {
                setStatusMessage(`GitHub Actions started! 26개 지역 병렬 실행 중... (약 5분 소요)`);
                pollGitHubActions(26, runStartTime);
            } else {
                setIsRunning(false);
                setStatusMessage(`Error: ${data.error || data.message}`);
            }
        } catch (error: any) {
            setIsRunning(false);
            setStatusMessage(`Failed: ${error.message}`);
        }
    };

    // Calculate duration string from start/end times
    const formatDuration = (startTime: Date, endTime: Date): string => {
        const diffMs = endTime.getTime() - startTime.getTime();
        const seconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        }
        return `${seconds}s`;
    };

    // Poll GitHub Actions workflow status with job-level progress
    const pollGitHubActions = (regionCount: number, startTime?: Date) => {
        let pollCount = 0;
        const maxPolls = 120; // 10 minutes max (5s * 120)
        const runStartTime = startTime || new Date();

        const poll = async () => {
            try {
                const res = await fetch('/api/admin/github-actions');
                const data = await res.json();

                if (data.runs && data.runs.length > 0) {
                    const latestRun = data.runs[0];
                    const jobStats = data.jobStats || { total: 0, completed: 0, in_progress: 0, queued: 0, failed: 0 };

                    // Update progress based on job stats
                    if (jobStats.total > 0) {
                        setProgress({ total: jobStats.total, completed: jobStats.completed });
                    }

                    if (latestRun.status === 'completed') {
                        const endTime = new Date();
                        const duration = formatDuration(runStartTime, endTime);

                        setIsRunning(false);
                        setGhActionsResult({
                            status: latestRun.conclusion as 'success' | 'failure' | 'cancelled',
                            startTime: runStartTime,
                            endTime: endTime,
                            duration: duration,
                            total: jobStats.total || regionCount,
                            completed: jobStats.completed || 0,
                            failed: jobStats.failed || 0,
                            url: latestRun.url || data.workflowUrl
                        });

                        if (latestRun.conclusion === 'success') {
                            setStatusMessage(`GitHub Actions 완료!`);
                            setProgress({ total: jobStats.total || regionCount, completed: jobStats.completed || regionCount });
                        } else {
                            setStatusMessage(`GitHub Actions 완료`);
                        }
                        return;
                    } else if (latestRun.status === 'in_progress' || jobStats.in_progress > 0) {
                        setStatusMessage(`실행 중: ${jobStats.completed}/${jobStats.total} 완료, ${jobStats.in_progress}개 진행중`);
                    } else if (latestRun.status === 'queued' && jobStats.in_progress === 0) {
                        setStatusMessage(`GitHub Actions 대기 중...`);
                    }
                }

                pollCount++;
                if (pollCount < maxPolls) {
                    setTimeout(poll, 5000);
                } else {
                    setIsRunning(false);
                    setStatusMessage("Polling timeout. GitHub Actions 페이지에서 확인하세요.");
                }
            } catch (e) {
                console.error('[ScraperPanel] GitHub polling error:', e);
                pollCount++;
                if (pollCount < maxPolls) {
                    setTimeout(poll, 5000);
                }
            }
        };

        setTimeout(poll, 3000); // Start polling after 3s
    };

    // 전체 중지 버튼 핸들러
    const handleStop = async () => {
        const confirmed = await confirm({
            title: '스크래퍼 중지',
            message: '모든 스크래퍼를 중지하시겠습니까?',
            type: 'warning',
            confirmText: '중지',
            cancelText: '취소'
        });
        if (!confirmed) return;

        try {
            setStatusMessage('스크래퍼 중지 중...');
            const res = await fetch('/api/bot/stop', { method: 'POST' });
            const data = await res.json();

            if (data.success) {
                setIsRunning(false);
                setActiveJobIds([]);
                setCurrentJobs([]);
                setProgress({ total: 0, completed: 0 });
                setStatusMessage('모든 스크래퍼가 중지되었습니다.');
            } else {
                setStatusMessage(`중지 실패: ${data.message}`);
            }
        } catch (error: any) {
            setStatusMessage(`중지 오류: ${error.message}`);
        }
    };

    // 상태 강제 리셋 핸들러 (DB에서 running 상태 초기화)
    const handleReset = async () => {
        const confirmed = await confirm({
            title: '상태 강제 리셋',
            message: 'DB에서 실행 중(running) 상태인 모든 로그를 강제로 초기화합니다.\n\n서버 재부팅, 크래시 등으로 인해 상태가 정상적으로 업데이트되지 않은 경우에 사용하세요.',
            type: 'warning',
            confirmText: '리셋',
            cancelText: '취소'
        });
        if (!confirmed) return;

        try {
            setStatusMessage('상태 리셋 중...');
            const res = await fetch('/api/bot/reset', { method: 'POST' });
            const data = await res.json();

            if (data.success) {
                setIsRunning(false);
                setActiveJobIds([]);
                setCurrentJobs([]);
                setProgress({ total: 0, completed: 0 });
                setStatusMessage(data.message);
            } else {
                setStatusMessage(`리셋 실패: ${data.message}`);
            }
        } catch (error: any) {
            setStatusMessage(`리셋 오류: ${error.message}`);
        }
    };

    // 개별 지역 중지 핸들러
    const handleStopSingle = async (jobId: number, region: string) => {
        const regionLabel = getRegionLabel(region);
        const confirmed = await confirm({
            title: '스크래퍼 중지',
            message: `${regionLabel} 스크래퍼를 중지하시겠습니까?`,
            type: 'warning',
            confirmText: '중지',
            cancelText: '취소'
        });
        if (!confirmed) return;

        try {
            setStatusMessage(`${regionLabel} 중지 중...`);
            const res = await fetch('/api/bot/stop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ region, jobId })
            });
            const data = await res.json();

            if (data.success) {
                // 해당 작업을 목록에서 제거하거나 상태 업데이트
                setActiveJobIds(prev => prev.filter(id => id !== jobId));
                setCurrentJobs(prev => prev.filter(job => job.id !== jobId));
                setProgress(prev => ({
                    total: prev.total - 1,
                    completed: prev.completed
                }));
                setStatusMessage(`${regionLabel} 스크래퍼가 중지되었습니다.`);

                // 모든 작업이 완료/중지되면 running 상태 해제
                if (activeJobIds.length <= 1) {
                    setIsRunning(false);
                }
            } else {
                setStatusMessage(`중지 실패: ${data.message}`);
            }
        } catch (error: any) {
            setStatusMessage(`중지 오류: ${error.message}`);
        }
    };

    const toggleRegion = (id: string) => {
        setSelectedRegions(prev =>
            prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        setSelectedRegions(allRegions.map(r => r.id));
    };

    const clearAll = () => {
        setSelectedRegions([]);
    };

    // State for detailed result panel
    const [showDetailedResults, setShowDetailedResults] = useState(false);

    const summary = useMemo(() => {
        if (jobResults.length === 0) return null;
        const total = jobResults.length;
        const success = jobResults.filter(j => j.status === 'success').length;
        const failed = jobResults.filter(j => j.status !== 'success').length;
        const totalArticles = jobResults.reduce((sum, j) => sum + (j.articles_count || 0), 0);

        // Calculate skipped count from metadata
        const totalSkipped = jobResults.reduce((sum, j) => {
            const statsSkipped = j.metadata?.detailed_stats?.summary?.total_skipped || 0;
            const metaSkipped = j.metadata?.skipped_count || 0;
            return sum + (statsSkipped || metaSkipped);
        }, 0);

        const failedRegions = jobResults
            .filter(j => j.status !== 'success')
            .map(j => getRegionLabel(j.region))
            .join(', ');

        // Check if any job has detailed stats
        const hasDetailedStats = jobResults.some(j => j.metadata?.detailed_stats);

        return { total, success, failed, totalArticles, totalSkipped, failedRegions, hasDetailedStats };
    }, [jobResults]);

    const datePresets = [
        { label: '오늘', days: 0 },
        { label: '최근 1일', days: 1 },
        { label: '최근 2일', days: 2 },
        { label: '최근 3일', days: 3 },
        { label: '최근 1주', days: 7 },
        { label: '최근 한달', days: 30 }
    ];

    const setDatePreset = (days: number) => {
        const d = new Date();
        d.setDate(d.getDate() - days);
        setStartDate(d.toISOString().split('T')[0]);
        setEndDate(new Date().toISOString().split('T')[0]);
        setActivePreset(days);
    };

    return (
        <div className="space-y-4">
            {/* Status Panel (Running) */}
            {isRunning && (
                <div className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-blue-900/30 border-b border-blue-800 p-4 flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-full">
                            <Activity className="w-5 h-5 text-white animate-spin" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <h3 className="font-bold text-blue-300">봇이 열심히 일하고 있습니다!</h3>
                            <div className="max-h-[4.5rem] overflow-y-auto">
                                <p className="text-sm text-blue-400 font-mono whitespace-pre-wrap">{statusMessage}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleStop}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <StopCircle className="w-4 h-4" />
                                중지
                            </button>
                            <button
                                onClick={handleReset}
                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                                title="서버 크래시 등으로 상태가 멈춘 경우 강제 리셋"
                            >
                                <RotateCcw className="w-4 h-4" />
                                리셋
                            </button>
                        </div>
                    </div>

                    {/* 진행률 바 */}
                    {progress.total > 0 && (
                        <div className="px-6 py-3 bg-[#0d1117] border-b border-[#30363d]">
                            <div className="flex justify-between text-xs text-[#8b949e] mb-1">
                                <span>진행률</span>
                                <span>{progress.completed} / {progress.total} 완료</span>
                            </div>
                            <div className="w-full bg-[#21262d] rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* 각 지역별 진행 상태 */}
                    <div className="p-4 max-h-32 overflow-y-auto">
                        <div className="space-y-2">
                            {currentJobs.map((job) => {
                                const regionLabel = getRegionLabel(job.region);
                                let statusIcon, statusColor, statusText;

                                if (job.status === 'running') {
                                    statusIcon = <Loader2 className="w-4 h-4 animate-spin" />;
                                    statusColor = 'text-blue-400 bg-blue-900/30 border-blue-700';
                                    statusText = job.log_message || '스크랩 진행 중...';
                                } else if (job.status === 'success') {
                                    statusIcon = <CheckCircle className="w-4 h-4" />;
                                    statusColor = 'text-green-400 bg-green-900/30 border-green-700';
                                    statusText = job.log_message || '완료';
                                } else if (['failed', 'error'].includes(job.status)) {
                                    statusIcon = <XCircle className="w-4 h-4" />;
                                    statusColor = 'text-red-400 bg-red-900/30 border-red-700';
                                    statusText = job.log_message || '실패';
                                } else if (job.status === 'stopped') {
                                    statusIcon = <StopCircle className="w-4 h-4" />;
                                    statusColor = 'text-orange-400 bg-orange-900/30 border-orange-700';
                                    statusText = '중지됨';
                                } else {
                                    statusIcon = <Clock className="w-4 h-4" />;
                                    statusColor = 'text-[#8b949e] bg-[#21262d] border-[#30363d]';
                                    statusText = job.log_message || '대기 중...';
                                }

                                return (
                                    <div key={job.id} className={`flex items-center justify-between p-2 rounded-lg border ${statusColor}`}>
                                        <div className="flex items-center gap-2">
                                            {statusIcon}
                                            <span className="font-medium text-sm">{regionLabel}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs truncate max-w-[150px]">{statusText}</span>
                                            {job.status === 'running' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStopSingle(job.id, job.region);
                                                    }}
                                                    className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded flex items-center gap-1 transition-colors"
                                                    title={`${regionLabel} 중지`}
                                                >
                                                    <StopCircle className="w-3 h-3" />
                                                    중지
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* GitHub Actions Result Panel */}
            {!isRunning && ghActionsResult && (
                <div className="bg-[#161b22] rounded-xl border border-[#30363d] shadow-lg overflow-hidden">
                    <div className={`p-4 ${ghActionsResult.status === 'success' ? 'bg-green-900/30 border-b border-green-700' : 'bg-red-900/30 border-b border-red-700'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${ghActionsResult.status === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                                    {ghActionsResult.status === 'success' ? (
                                        <CheckCircle className="w-7 h-7 text-white" />
                                    ) : (
                                        <XCircle className="w-7 h-7 text-white" />
                                    )}
                                </div>
                                <div>
                                    <h3 className={`text-lg font-bold ${ghActionsResult.status === 'success' ? 'text-green-300' : 'text-red-300'}`}>
                                        GitHub Actions {ghActionsResult.status === 'success' ? '완료!' : '완료 (일부 실패)'}
                                    </h3>
                                    <p className="text-sm text-[#8b949e]">
                                        {ghActionsResult.startTime?.toLocaleTimeString('ko-KR')} ~ {ghActionsResult.endTime?.toLocaleTimeString('ko-KR')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={ghActionsResult.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-[#21262d] text-[#e6edf3] border border-[#30363d] rounded-lg text-sm font-medium hover:bg-[#30363d] transition"
                                >
                                    <Github className="w-4 h-4" />
                                    GitHub에서 보기
                                </a>
                                <button
                                    onClick={() => setGhActionsResult(null)}
                                    className="p-2 text-[#8b949e] hover:text-[#e6edf3] transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-4 gap-6">
                            <div className="text-center p-4 bg-[#0d1117] border border-[#30363d] rounded-xl">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Clock className="w-5 h-5 text-purple-400" />
                                    <span className="text-xs font-medium text-[#8b949e] uppercase">실행 시간</span>
                                </div>
                                <p className="text-3xl font-bold text-purple-400">{ghActionsResult.duration}</p>
                            </div>
                            <div className="text-center p-4 bg-[#0d1117] border border-[#30363d] rounded-xl">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Activity className="w-5 h-5 text-blue-400" />
                                    <span className="text-xs font-medium text-[#8b949e] uppercase">전체 지역</span>
                                </div>
                                <p className="text-3xl font-bold text-blue-400">{ghActionsResult.total}개</p>
                            </div>
                            <div className="text-center p-4 bg-[#0d1117] border border-[#30363d] rounded-xl">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    <span className="text-xs font-medium text-[#8b949e] uppercase">성공</span>
                                </div>
                                <p className="text-3xl font-bold text-green-400">{ghActionsResult.completed}개</p>
                            </div>
                            <div className="text-center p-4 bg-[#0d1117] border border-[#30363d] rounded-xl">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <XCircle className="w-5 h-5 text-red-400" />
                                    <span className="text-xs font-medium text-[#8b949e] uppercase">실패</span>
                                </div>
                                <p className={`text-3xl font-bold ${ghActionsResult.failed > 0 ? 'text-red-400' : 'text-[#8b949e]'}`}>{ghActionsResult.failed}개</p>
                            </div>
                        </div>

                        {ghActionsResult.status === 'success' && ghActionsResult.failed === 0 && (
                            <div className="mt-4 p-3 bg-green-900/30 border border-green-700 rounded-lg flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                <span className="text-sm text-green-300 font-medium">
                                    모든 지역 수집이 성공적으로 완료되었습니다!
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Result Panel (Completed - for DB-based scraping) */}
            {!isRunning && !ghActionsResult && summary && (
                <div className="space-y-4">
                    {/* Summary Card */}
                    <div className="bg-[#161b22] rounded-xl border border-[#30363d] shadow-lg overflow-hidden">
                        <div className={`p-4 ${summary.failed === 0 ? 'bg-green-900/30 border-b border-green-700' : 'bg-red-900/30 border-b border-red-700'}`}>
                            <div className="flex items-center justify-between">
                                <h3 className={`font-bold flex items-center gap-2 ${summary.failed === 0 ? 'text-green-300' : 'text-red-300'}`}>
                                    {summary.failed === 0 ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                                    {summary.failed === 0 ? "수집 작업 완료!" : "수집 작업 완료 (일부 실패)"}
                                </h3>
                                <button
                                    onClick={() => setShowDetailedResults(!showDetailedResults)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded-lg text-sm font-medium text-[#e6edf3] hover:bg-[#30363d] transition"
                                >
                                    <FileText className="w-4 h-4" />
                                    상세 로그
                                    {showDetailedResults ? (
                                        <ChevronUp className="w-4 h-4" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="p-4 grid grid-cols-4 gap-4 text-center">
                            <div>
                                <p className="text-xs text-[#8b949e] mb-1">신규 수집</p>
                                <p className="text-2xl font-bold text-green-400">{summary.totalArticles}건</p>
                            </div>
                            <div>
                                <p className="text-xs text-[#8b949e] mb-1">중복 제외</p>
                                <p className="text-2xl font-bold text-yellow-400">{summary.totalSkipped}건</p>
                            </div>
                            <div>
                                <p className="text-xs text-[#8b949e] mb-1">성공 지역</p>
                                <p className="text-2xl font-bold text-blue-400">{summary.success} / {summary.total}</p>
                            </div>
                            <div>
                                <p className="text-xs text-[#8b949e] mb-1">실패 지역</p>
                                <p className={`text-2xl font-bold ${summary.failed > 0 ? 'text-red-400' : 'text-[#8b949e]'}`}>{summary.failed}</p>
                                {summary.failed > 0 && <p className="text-xs text-red-400 mt-1 truncate">{summary.failedRegions}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Detailed Results Panel (Expandable) */}
                    {showDetailedResults && (
                        <DetailedResultPanel
                            jobResults={jobResults}
                            onClose={() => setShowDetailedResults(false)}
                        />
                    )}
                </div>
            )}

            {/* Control Panel */}
            <div className={`bg-[#161b22] rounded-xl border border-[#30363d] shadow-sm overflow-hidden transition-opacity ${isRunning ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="p-4 border-b border-[#30363d] bg-blue-900/20">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-[#e6edf3] flex items-center gap-2">
                            <Filter className="w-5 h-5 text-blue-500" />
                            수집 조건 설정
                        </h3>
                        <button
                            onClick={() => {
                                window.open(
                                    '/admin/bot/monitor-popup',
                                    'JobMonitor',
                                    'width=1000,height=800,menubar=no,toolbar=no,location=no,status=no'
                                );
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[#21262d] text-[#e6edf3] border border-[#30363d] rounded-lg text-sm font-medium hover:bg-[#30363d] transition"
                            title="Open real-time job monitor in popup window"
                        >
                            <Monitor className="w-4 h-4" />
                            실시간 모니터
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    {/* Date Range */}
                    <div>
                        <label className="block text-sm font-medium text-[#c9d1d9] mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            수집 기간
                        </label>
                        <div className="flex items-center gap-2 flex-wrap">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setActivePreset(null);
                                }}
                                className="border border-[#30363d] bg-[#0d1117] text-[#e6edf3] rounded-lg px-3 py-1.5 text-sm"
                            />
                            <span className="text-[#8b949e]">~</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setActivePreset(null);
                                }}
                                className="border border-[#30363d] bg-[#0d1117] text-[#e6edf3] rounded-lg px-3 py-1.5 text-sm"
                            />
                        </div>
                        <div className="flex gap-1.5 flex-wrap mt-2">
                            {datePresets.map(preset => (
                                <button
                                    key={preset.label}
                                    onClick={() => setDatePreset(preset.days)}
                                    className={`text-xs px-2 py-1 rounded border transition ${activePreset === preset.days
                                        ? 'bg-blue-600 text-white border-blue-600 font-bold'
                                        : 'border-[#30363d] bg-[#21262d] text-blue-400 hover:bg-[#30363d]'
                                        }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-blue-400 mt-2 font-medium">
                            {startDate} ~ {endDate}
                            ({Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}일간)
                        </p>
                    </div>

                    {/* Region Select */}
                    <div>
                        <label className="block text-sm font-medium text-[#c9d1d9] mb-2 flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            수집 대상 ({selectedRegions.length}개 선택)
                        </label>

                        {/* 교육기관 */}
                        <RegionCheckboxGroup
                            title="교육기관"
                            regions={agencyRegions}
                            selectedRegions={selectedRegions}
                            onToggle={toggleRegion}
                            selectionKey="id"
                            accentColor="blue"
                            showScraperStatus
                            regionInfo={regionInfo}
                            activeScraperIds={activeScraperIds}
                        />

                        {/* 지자체 */}
                        <div className="mt-2">
                            <RegionCheckboxGroup
                                title="지자체"
                                regions={localRegions}
                                selectedRegions={selectedRegions}
                                onToggle={toggleRegion}
                                selectionKey="id"
                                accentColor="blue"
                                showScraperStatus
                                regionInfo={regionInfo}
                                activeScraperIds={activeScraperIds}
                            />
                        </div>

                        <SelectionControls
                            onSelectAll={selectAll}
                            onClearAll={clearAll}
                            selectedCount={selectedRegions.length}
                            totalCount={allRegions.length}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-3 border-t border-[#30363d]">
                        <button
                            onClick={handleRun}
                            disabled={isRunning || selectedRegions.length === 0}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-sm transition disabled:opacity-50"
                            title="로컬 개발 서버에서만 동작 (병렬 실행 + 실시간 모니터링)"
                        >
                            {isRunning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                            {isRunning ? '실행 중...' : '로컬 병렬 실행'}
                        </button>
                        <button
                            onClick={handleGitHubRunAll}
                            disabled={isRunning}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 shadow-sm transition disabled:opacity-50"
                            title="GitHub Actions로 26개 지역 병렬 실행 (약 5분)"
                        >
                            <Zap className="w-5 h-5" />
                            GitHub 병렬
                        </button>
                        <a
                            href="https://github.com/korea-news/koreanewsone/actions/workflows/daily_scrape.yml"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-[#21262d] text-[#e6edf3] border border-[#30363d] rounded-lg font-bold hover:bg-[#30363d] shadow-sm transition"
                            title="GitHub Actions 페이지에서 직접 확인"
                        >
                            <Github className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ScraperPanel;

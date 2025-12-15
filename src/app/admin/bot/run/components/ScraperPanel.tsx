"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Play, Calendar, Filter, AlertCircle, Loader2, CheckCircle, Activity, XCircle, Clock, StopCircle, RotateCcw } from "lucide-react";
import { RegionCheckboxGroup, SelectionControls } from "./RegionCheckboxGroup";
import { localRegions, agencyRegions, allRegions, getRegionLabel } from "./regionData";
import { useConfirm } from '@/components/ui/ConfirmModal';

interface JobResult {
    id: number;
    region: string;
    status: string;
    log_message?: string;
    articles_count?: number;
    created_at?: string;
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
                // running 상태인 작업만 직접 조회
                const res = await fetch('/api/bot/logs?status=running&limit=50');
                const data = await res.json();

                console.log('[ScraperPanel] Running jobs from DB:', data.logs?.length || 0);

                if (!data.logs || data.logs.length === 0) {
                    console.log('[ScraperPanel] No running jobs found');
                    return;
                }

                // running 상태인 작업들이 있으면 복원
                const runningJobs: JobResult[] = data.logs;
                const jobIds = runningJobs.map((j) => j.id);

                console.log('[ScraperPanel] Restoring job IDs:', jobIds);

                setActiveJobIds(jobIds);
                setIsRunning(true);
                setStatusMessage(`진행 중인 작업 ${runningJobs.length}개 복원됨`);
                setProgress({ total: runningJobs.length, completed: 0 });
                setCurrentJobs(runningJobs);

            } catch (e) {
                console.error('Failed to check running jobs:', e);
            }
        };
        checkRunningJobs();
    }, []);

    // 다중 작업 폴링 로직 (DB 기반)
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isRunning && activeJobIds.length > 0) {
            const checkJobs = async () => {
                try {
                    const res = await fetch('/api/bot/logs?limit=50');
                    const data = await res.json();

                    if (!data.logs) return;

                    const jobs = data.logs.filter((log: JobResult) => activeJobIds.includes(log.id));
                    const completed = jobs.filter((job: JobResult) =>
                        ['success', 'failed', 'failure', 'warning', 'error', 'stopped'].includes(job.status)
                    );

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
                        setIsRunning(false);
                        setJobResults(jobs);
                        setStatusMessage("모든 작업이 완료되었습니다.");
                        setActiveJobIds([]);
                    }

                } catch (e) {
                    console.error("Polling error:", e);
                }
            };

            checkJobs();
            interval = setInterval(checkJobs, 2000);
        }

        return () => clearInterval(interval);
    }, [isRunning, activeJobIds]);

    const handleRun = async () => {
        setIsRunning(true);
        setJobResults([]);
        setActiveJobIds([]);
        setStatusMessage("작업 큐 등록 중...");
        setProgress({ total: 0, completed: 0 });

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
                setStatusMessage(`작업 시작! 총 ${data.jobCount}개 지역 수집 대기 중...`);
                setActiveJobIds(data.jobIds);
                setProgress({ total: data.jobCount, completed: 0 });
            } else {
                setIsRunning(false);
                setStatusMessage(`오류 발생: ${data.message}`);
            }
        } catch (error: any) {
            setIsRunning(false);
            setStatusMessage(`전송 실패: ${error.message}`);
        }
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

    const summary = useMemo(() => {
        if (jobResults.length === 0) return null;
        const total = jobResults.length;
        const success = jobResults.filter(j => j.status === 'success').length;
        const failed = jobResults.filter(j => j.status !== 'success').length;
        const totalArticles = jobResults.reduce((sum, j) => sum + (j.articles_count || 0), 0);
        const failedRegions = jobResults
            .filter(j => j.status !== 'success')
            .map(j => getRegionLabel(j.region))
            .join(', ');

        return { total, success, failed, totalArticles, failedRegions };
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
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-blue-50 border-b border-blue-100 p-4 flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-full">
                            <Activity className="w-5 h-5 text-white animate-spin" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <h3 className="font-bold text-blue-900">봇이 열심히 일하고 있습니다!</h3>
                            <div className="max-h-[4.5rem] overflow-y-auto">
                                <p className="text-sm text-blue-700 font-mono whitespace-pre-wrap">{statusMessage}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleStop}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <StopCircle className="w-4 h-4" />
                                중지
                            </button>
                            <button
                                onClick={handleReset}
                                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                                title="서버 크래시 등으로 상태가 멈춘 경우 강제 리셋"
                            >
                                <RotateCcw className="w-4 h-4" />
                                리셋
                            </button>
                        </div>
                    </div>

                    {/* 진행률 바 */}
                    {progress.total > 0 && (
                        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>진행률</span>
                                <span>{progress.completed} / {progress.total} 완료</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
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
                                    statusColor = 'text-blue-600 bg-blue-50 border-blue-200';
                                    statusText = job.log_message || '스크랩 진행 중...';
                                } else if (job.status === 'success') {
                                    statusIcon = <CheckCircle className="w-4 h-4" />;
                                    statusColor = 'text-green-600 bg-green-50 border-green-200';
                                    statusText = job.log_message || '완료';
                                } else if (['failed', 'error'].includes(job.status)) {
                                    statusIcon = <XCircle className="w-4 h-4" />;
                                    statusColor = 'text-red-600 bg-red-50 border-red-200';
                                    statusText = job.log_message || '실패';
                                } else if (job.status === 'stopped') {
                                    statusIcon = <StopCircle className="w-4 h-4" />;
                                    statusColor = 'text-orange-600 bg-orange-50 border-orange-200';
                                    statusText = '중지됨';
                                } else {
                                    statusIcon = <Clock className="w-4 h-4" />;
                                    statusColor = 'text-gray-500 bg-gray-50 border-gray-200';
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
                                                    className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded flex items-center gap-1 transition-colors"
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

            {/* Result Panel (Completed) */}
            {!isRunning && summary && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                    <div className={`p-4 ${summary.failed === 0 ? 'bg-green-50 border-b border-green-100' : 'bg-red-50 border-b border-red-100'}`}>
                        <h3 className={`font-bold flex items-center gap-2 ${summary.failed === 0 ? 'text-green-800' : 'text-red-800'}`}>
                            {summary.failed === 0 ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                            {summary.failed === 0 ? "수집 작업 완료 성공!" : "수집 작업 완료 (일부 실패)"}
                        </h3>
                    </div>
                    <div className="p-4 grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">총 수집 기사</p>
                            <p className="text-2xl font-bold text-gray-900">{summary.totalArticles}건</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">성공 지역</p>
                            <p className="text-2xl font-bold text-green-600">{summary.success} / {summary.total}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">실패 지역</p>
                            <p className={`text-2xl font-bold ${summary.failed > 0 ? 'text-red-600' : 'text-gray-400'}`}>{summary.failed}</p>
                            {summary.failed > 0 && <p className="text-xs text-red-500 mt-1">{summary.failedRegions}</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Control Panel */}
            <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-opacity ${isRunning ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="p-4 border-b border-gray-100 bg-blue-50/50">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Filter className="w-5 h-5 text-blue-600" />
                        수집 조건 설정
                    </h3>
                </div>

                <div className="p-4 space-y-4">
                    {/* Date Range */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
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
                                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                            />
                            <span className="text-gray-400">~</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setActivePreset(null);
                                }}
                                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                            />
                        </div>
                        <div className="flex gap-1.5 flex-wrap mt-2">
                            {datePresets.map(preset => (
                                <button
                                    key={preset.label}
                                    onClick={() => setDatePreset(preset.days)}
                                    className={`text-xs px-2 py-1 rounded border transition ${activePreset === preset.days
                                        ? 'bg-blue-600 text-white border-blue-600 font-bold'
                                        : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                                        }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-blue-600 mt-2 font-medium">
                            📅 {startDate} ~ {endDate}
                            ({Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}일간)
                        </p>
                    </div>

                    {/* Region Select */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
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
                    <div className="flex gap-3 pt-3 border-t border-gray-100">
                        <button
                            onClick={handleRun}
                            disabled={isRunning || selectedRegions.length === 0}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
                        >
                            {isRunning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                            {isRunning ? '실행 중...' : '수집 시작'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ScraperPanel;

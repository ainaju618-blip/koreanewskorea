"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Play, Loader2, CheckCircle, XCircle, AlertCircle, Clock,
  RefreshCw, Cpu, Power, Calendar, Filter, StopCircle, RotateCcw
} from "lucide-react";
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmModal';

// Region data (from existing ScraperPanel)
const REGIONS = [
  { id: 'gwangju', nameKo: '광주', group: 'agency' },
  { id: 'jeonnam', nameKo: '전남', group: 'agency' },
  { id: 'gwangju_edu', nameKo: '광주교육청', group: 'agency' },
  { id: 'jeonnam_edu', nameKo: '전남교육청', group: 'agency' },
  { id: 'jeonnam_edu_org', nameKo: '전남교육청(기관)', group: 'agency' },
  { id: 'jeonnam_edu_school', nameKo: '전남교육청(학교)', group: 'agency' },
  { id: 'mokpo', nameKo: '목포', group: 'local' },
  { id: 'yeosu', nameKo: '여수', group: 'local' },
  { id: 'suncheon', nameKo: '순천', group: 'local' },
  { id: 'naju', nameKo: '나주', group: 'local' },
  { id: 'gwangyang', nameKo: '광양', group: 'local' },
  { id: 'damyang', nameKo: '담양', group: 'local' },
  { id: 'gokseong', nameKo: '곡성', group: 'local' },
  { id: 'gurye', nameKo: '구례', group: 'local' },
  { id: 'goheung', nameKo: '고흥', group: 'local' },
  { id: 'boseong', nameKo: '보성', group: 'local' },
  { id: 'hwasun', nameKo: '화순', group: 'local' },
  { id: 'jangheung', nameKo: '장흥', group: 'local' },
  { id: 'gangjin', nameKo: '강진', group: 'local' },
  { id: 'haenam', nameKo: '해남', group: 'local' },
  { id: 'yeongam', nameKo: '영암', group: 'local' },
  { id: 'muan', nameKo: '무안', group: 'local' },
  { id: 'hampyeong', nameKo: '함평', group: 'local' },
  { id: 'yeonggwang', nameKo: '영광', group: 'local' },
  { id: 'jangseong', nameKo: '장성', group: 'local' },
  { id: 'wando', nameKo: '완도', group: 'local' },
  { id: 'jindo', nameKo: '진도', group: 'local' },
  { id: 'shinan', nameKo: '신안', group: 'local' },
];

interface LogEntry {
  id: number;
  message: string;
  level: 'info' | 'success' | 'error' | 'warning';
  timestamp: Date;
}

interface JobResult {
  id: number;
  region: string;
  status: string;
  log_message?: string;
  articles_count?: number;
  new_articles?: number;
  error?: string;
}

interface ScraperResult {
  region: string;
  regionName: string;
  status: 'success' | 'failed' | 'stopped';
  articlesCount: number;
  error?: string;
}

interface AiResult {
  total: number;
  published: number;
  held: number;
  failed: number;
  elapsed: string;
}

export default function Dec30Page() {
  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirm();

  // Scraper State
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [activePreset, setActivePreset] = useState<number | null>(0);
  const [isScraperRunning, setIsScraperRunning] = useState(false);
  const [activeJobIds, setActiveJobIds] = useState<number[]>([]);
  const [currentJobs, setCurrentJobs] = useState<JobResult[]>([]);
  const [scraperProgress, setScraperProgress] = useState({ total: 0, completed: 0 });
  const [statusMessage, setStatusMessage] = useState('');

  // AI Processing State
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isAiRunning, setIsAiRunning] = useState(false);
  const [isStartingOllama, setIsStartingOllama] = useState(false);
  const [aiLimit, setAiLimit] = useState(10);
  const [pendingCount, setPendingCount] = useState(0);

  // Log State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logIdRef = useRef(0);
  const loggedJobsRef = useRef<Set<string>>(new Set()); // Track logged job status changes
  const lastRunningLogRef = useRef<Map<number, string>>(new Map()); // Track last log message per job
  const pollingStartRef = useRef<number>(0); // Track polling start time for timeout
  const POLLING_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes max polling time

  // Result State
  const [scraperResults, setScraperResults] = useState<ScraperResult[]>([]);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Date Presets
  const datePresets = [
    { label: '오늘', days: 0 },
    { label: '1일', days: 1 },
    { label: '2일', days: 2 },
    { label: '3일', days: 3 },
    { label: '1주', days: 7 },
  ];

  const setDatePreset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    setStartDate(d.toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setActivePreset(days);
  };

  // Add log entry and save to server
  const addLog = useCallback((message: string, level: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const entry: LogEntry = {
      id: logIdRef.current++,
      message,
      level,
      timestamp: new Date()
    };
    setLogs(prev => [entry, ...prev].slice(0, 200));

    // Save to server log file (fire and forget)
    fetch('/api/bot/write-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'dec30',
        level,
        message,
        timestamp: entry.timestamp.toISOString()
      })
    }).catch(() => {});
  }, []);

  // Get region name by ID
  const getRegionName = (id: string) => {
    const region = REGIONS.find(r => r.id === id);
    return region ? region.nameKo : id;
  };

  // Check Ollama status
  const checkOllama = useCallback(async (silent = true) => {
    setOllamaStatus('checking');
    try {
      const res = await fetch('/api/bot/ollama-status');
      const data = await res.json();
      const status = data.online ? 'online' : 'offline';
      setOllamaStatus(status);
      if (!silent) {
        addLog(`[시스템] Ollama: ${status === 'online' ? '실행중' : '중지됨'}`, status === 'online' ? 'success' : 'warning');
      }
    } catch {
      setOllamaStatus('offline');
      if (!silent) {
        addLog(`[시스템] Ollama: 오프라인`, 'error');
      }
    }
  }, [addLog]);

  // Start Ollama
  const startOllama = async () => {
    setIsStartingOllama(true);
    addLog(`[시스템] Ollama 시작 중...`, 'info');

    try {
      const res = await fetch('/api/bot/start-ollama', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        addLog(`[시스템] Ollama 시작 완료`, 'success');
        showSuccess('Ollama가 시작되었습니다.');
        setOllamaStatus('online');
      } else {
        addLog(`[시스템] Ollama 시작 실패: ${data.message}`, 'error');
        showError(`Ollama 시작 실패: ${data.message}`);
      }
    } catch (error: unknown) {
      const err = error as Error;
      addLog(`[시스템] Ollama 시작 오류: ${err.message}`, 'error');
      showError(`Ollama 시작 오류: ${err.message}`);
    } finally {
      setIsStartingOllama(false);
      checkOllama(true);
    }
  };

  // Load pending count
  const loadPendingCount = useCallback(async (silent = true) => {
    try {
      const res = await fetch('/api/bot/pending-count');
      const data = await res.json();
      const count = data.count || 0;
      setPendingCount(count);
      if (!silent) {
        addLog(`[시스템] 대기중 기사: ${count}건`, 'info');
      }
    } catch {
      setPendingCount(0);
    }
  }, [addLog]);

  // Poll AI processing status
  const pollAiStatus = useCallback((startTime: number, targetCount: number) => {
    let lastProcessed = 0;
    let lastPublished = 0;
    let lastHeld = 0;
    let lastFailed = 0;

    const poll = async () => {
      try {
        const res = await fetch('/api/bot/run-ai-processing');
        const data = await res.json();
        const { isActive, stats } = data;

        if (stats) {
          const newProcessed = stats.processed - lastProcessed;
          const newPublished = stats.published - lastPublished;
          const newHeld = stats.held - lastHeld;
          const newFailed = stats.failed - lastFailed;

          if (newProcessed > 0) {
            if (newPublished > 0) {
              addLog(`[AI] ✓ ${stats.processed}/${targetCount} 발행됨`, 'success');
            }
            if (newHeld > 0) {
              addLog(`[AI] △ ${stats.processed}/${targetCount} 보류됨`, 'warning');
            }
            if (newFailed > 0) {
              addLog(`[AI] ✗ ${stats.processed}/${targetCount} 실패`, 'error');
            }
          }

          lastProcessed = stats.processed;
          lastPublished = stats.published;
          lastHeld = stats.held;
          lastFailed = stats.failed;

          if (!isActive) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            addLog(`[AI] ========================================`, 'info');
            addLog(`[AI] 완료: ${stats.published}건 발행, ${stats.held}건 보류 (${elapsed}초)`, 'success');
            addLog(`[AI] ========================================`, 'info');
            setIsAiRunning(false);
            showSuccess(`AI 처리 완료: ${stats.published}건 발행`);
            loadPendingCount();

            // Save AI result for display
            setAiResult({
              total: stats.processed || 0,
              published: stats.published || 0,
              held: stats.held || 0,
              failed: stats.failed || 0,
              elapsed
            });
            setShowResults(true);
            return;
          }
        }

        setTimeout(poll, 3000);
      } catch {
        addLog(`[AI] 상태 조회 오류, 재시도...`, 'warning');
        setTimeout(poll, 5000);
      }
    };

    setTimeout(poll, 2000);
  }, [addLog, showSuccess, loadPendingCount]);

  // Restore running jobs from server on page load
  const restoreRunningJobs = useCallback(async () => {
    try {
      // 1. Check for running scraper jobs
      const res = await fetch('/api/bot/bot-logs?limit=50&status=running');
      const data = await res.json();

      if (data.logs && data.logs.length > 0) {
        const runningJobs = data.logs.filter((log: JobResult) => log.status === 'running');
        if (runningJobs.length > 0) {
          const jobIds = runningJobs.map((j: JobResult) => j.id);
          setActiveJobIds(jobIds);
          setCurrentJobs(runningJobs);
          setIsScraperRunning(true);
          setScraperProgress({ total: jobIds.length, completed: 0 });
          addLog(`[시스템] 실행 중인 스크래퍼 ${runningJobs.length}개 발견 - 모니터링 재개`, 'warning');
        }
      }

      // 2. Check for running AI processing
      const aiRes = await fetch('/api/bot/run-ai-processing');
      const aiData = await aiRes.json();

      if (aiData.isActive) {
        setIsAiRunning(true);
        addLog(`[시스템] AI 처리 진행 중 발견 - 모니터링 재개`, 'warning');
        // Start polling for AI status
        pollAiStatus(Date.now(), aiData.stats?.total || 0);
      }
    } catch (e) {
      console.error('[Restore] Error:', e);
    }
  }, [addLog, pollAiStatus]);

  // Initialize
  useEffect(() => {
    addLog(`[시스템] ========================================`, 'info');
    addLog(`[시스템] 12월30일 컨트롤 패널 초기화`, 'info');

    const init = async () => {
      await checkOllama(false);
      await loadPendingCount(false);
      await restoreRunningJobs(); // Restore running jobs
      addLog(`[시스템] 준비 완료`, 'success');
      addLog(`[시스템] ========================================`, 'info');
    };
    init();

    const interval = setInterval(() => {
      checkOllama(true);
      loadPendingCount(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [checkOllama, loadPendingCount, addLog, restoreRunningJobs]);

  // Region selection handlers
  const toggleRegion = (id: string) => {
    setSelectedRegions(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };
  const selectAll = () => setSelectedRegions(REGIONS.map(r => r.id));
  const clearAll = () => setSelectedRegions([]);

  // Polling for scraper jobs - Fixed stale closure and memory leak issues
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const abortController = new AbortController();

    if (isScraperRunning && activeJobIds.length > 0) {
      // Initialize polling start time
      if (pollingStartRef.current === 0) {
        pollingStartRef.current = Date.now();
      }

      const checkJobs = async () => {
        // Check for timeout
        if (Date.now() - pollingStartRef.current > POLLING_TIMEOUT_MS) {
          addLog(`[스크래퍼] 타임아웃 (30분 초과) - 폴링 중단`, 'warning');
          setIsScraperRunning(false);
          setActiveJobIds([]);
          pollingStartRef.current = 0;
          return;
        }

        try {
          const timestamp = Date.now();
          // Use ids parameter to fetch exactly the jobs we're tracking
          const idsParam = activeJobIds.join(',');
          const res = await fetch(`/api/bot/bot-logs?ids=${idsParam}&_t=${timestamp}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' },
            signal: abortController.signal
          });
          const data = await res.json();

          if (!data.logs) return;

          // All returned logs should be our tracked jobs
          const jobs = data.logs as JobResult[];

          // Safety: if we can't find our jobs after a while, stop polling
          if (jobs.length === 0) {
            console.warn('[Polling] No jobs found for IDs:', activeJobIds);
            return;
          }

          const completed = jobs.filter((job: JobResult) =>
            ['success', 'failed', 'failure', 'warning', 'error', 'stopped'].includes(job.status)
          );

          setScraperProgress({
            total: activeJobIds.length,
            completed: completed.length
          });

          setCurrentJobs(jobs);

          // Log running jobs with changed messages
          for (const job of jobs) {
            const regionName = getRegionName(job.region);

            if (job.status === 'running') {
              // Check if log message changed
              const lastMsg = lastRunningLogRef.current.get(job.id);
              const currentMsg = job.log_message || '';
              if (lastMsg !== currentMsg && currentMsg) {
                addLog(`[스크래퍼] ${regionName}: ${currentMsg}`, 'info');
                lastRunningLogRef.current.set(job.id, currentMsg);
              }
            } else {
              // Log completed/failed jobs only once
              const logKey = `${job.id}-${job.status}`;
              if (!loggedJobsRef.current.has(logKey)) {
                loggedJobsRef.current.add(logKey);
                if (job.status === 'success') {
                  const count = job.articles_count || job.new_articles || 0;
                  addLog(`[스크래퍼] ${regionName}: 완료 - ${count}건 수집`, 'success');
                } else if (job.status === 'stopped') {
                  addLog(`[스크래퍼] ${regionName}: 중지됨`, 'warning');
                } else {
                  addLog(`[스크래퍼] ${regionName}: 실패 - ${job.error || job.log_message || ''}`, 'error');
                }
              }
            }
          }

          const running = jobs.find((job: JobResult) => job.status === 'running');
          if (running) {
            setStatusMessage(`[${getRegionName(running.region)}] ${running.log_message || '진행중...'}`);
          } else if (completed.length >= jobs.length && jobs.length === activeJobIds.length) {
            // All tracked jobs are found and all are completed
            setIsScraperRunning(false);
            setActiveJobIds([]);
            // Clear refs for next run
            loggedJobsRef.current.clear();
            lastRunningLogRef.current.clear();
            pollingStartRef.current = 0; // Reset timeout tracker

            const success = completed.filter((j: JobResult) => j.status === 'success').length;
            const totalArticles = completed.reduce((sum: number, j: JobResult) => sum + (j.articles_count || j.new_articles || 0), 0);
            addLog(`[스크래퍼] ========================================`, 'info');
            addLog(`[스크래퍼] 완료: ${success}/${completed.length} 성공, ${totalArticles}건 수집`, 'success');
            addLog(`[스크래퍼] ========================================`, 'info');
            setStatusMessage('완료');
            loadPendingCount();

            // Save results for display
            const results: ScraperResult[] = completed.map((job: JobResult) => ({
              region: job.region,
              regionName: getRegionName(job.region),
              status: job.status === 'success' ? 'success' : job.status === 'stopped' ? 'stopped' : 'failed',
              articlesCount: job.articles_count || job.new_articles || 0,
              error: job.error || job.log_message
            }));
            setScraperResults(results);
            setShowResults(true);
            showSuccess(`스크래핑 완료: ${success}/${completed.length} 성공, ${totalArticles}건 수집`);
          }

        } catch (e) {
          // Ignore abort errors (expected when cleanup runs)
          if (e instanceof Error && e.name === 'AbortError') {
            return;
          }
          console.error("[Polling error]", e);
        }
      };

      checkJobs();
      interval = setInterval(checkJobs, 3000); // 3초로 단축
    }

    return () => {
      if (interval) clearInterval(interval);
      abortController.abort(); // Cancel any pending fetch requests
    };
  }, [isScraperRunning, activeJobIds, addLog, loadPendingCount, showSuccess]); // currentJobs 제거

  // Run Scraper (Local Python parallel execution - copied from ScraperPanel)
  const handleRun = async () => {
    if (selectedRegions.length === 0) {
      showError('지역을 선택해주세요');
      return;
    }

    setIsScraperRunning(true);
    setCurrentJobs([]);
    setActiveJobIds([]);
    setScraperProgress({ total: selectedRegions.length, completed: 0 });
    // Clear tracking refs for fresh run
    loggedJobsRef.current.clear();
    lastRunningLogRef.current.clear();
    pollingStartRef.current = 0; // Reset timeout tracker

    const regionNames = selectedRegions.slice(0, 5).map(getRegionName).join(', ');
    addLog(`[스크래퍼] ========================================`, 'info');
    addLog(`[스크래퍼] ${selectedRegions.length}개 지역 병렬 실행 시작`, 'info');
    addLog(`[스크래퍼] 대상: ${regionNames}${selectedRegions.length > 5 ? '...' : ''}`, 'info');
    addLog(`[스크래퍼] 기간: ${startDate} ~ ${endDate}`, 'info');
    addLog(`[스크래퍼] ========================================`, 'info');

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
        setActiveJobIds(data.jobIds);
        setScraperProgress({ total: data.jobIds.length, completed: 0 });
        addLog(`[스크래퍼] ${data.jobIds.length}개 작업 생성됨`, 'success');
        setStatusMessage(`${data.jobIds.length}개 지역 실행중...`);
      } else {
        setIsScraperRunning(false);
        addLog(`[스크래퍼] 오류: ${data.message || 'Unknown error'}`, 'error');
        setStatusMessage(`오류: ${data.message}`);
      }
    } catch (error: unknown) {
      const err = error as Error;
      setIsScraperRunning(false);
      addLog(`[스크래퍼] 실패: ${err.message}`, 'error');
      setStatusMessage(`실패: ${err.message}`);
    }
  };

  // Stop Scraper
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
      addLog(`[스크래퍼] 중지 요청...`, 'warning');
      const res = await fetch('/api/bot/stop', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setIsScraperRunning(false);
        setActiveJobIds([]);
        setCurrentJobs([]);
        setScraperProgress({ total: 0, completed: 0 });
        addLog(`[스크래퍼] 중지됨`, 'warning');
        setStatusMessage('중지됨');
      } else {
        addLog(`[스크래퍼] 중지 실패: ${data.message}`, 'error');
      }
    } catch (error: unknown) {
      const err = error as Error;
      addLog(`[스크래퍼] 중지 오류: ${err.message}`, 'error');
    }
  };

  // Reset stuck jobs
  const handleReset = async () => {
    const confirmed = await confirm({
      title: '상태 강제 리셋',
      message: 'DB에서 실행 중(running) 상태인 모든 로그를 강제로 초기화합니다.',
      type: 'warning',
      confirmText: '리셋',
      cancelText: '취소'
    });
    if (!confirmed) return;

    try {
      const res = await fetch('/api/bot/reset', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setIsScraperRunning(false);
        setActiveJobIds([]);
        setCurrentJobs([]);
        setScraperProgress({ total: 0, completed: 0 });
        addLog(`[스크래퍼] 상태 리셋됨`, 'warning');
        setStatusMessage('리셋됨');
      }
    } catch (error: unknown) {
      const err = error as Error;
      addLog(`[스크래퍼] 리셋 오류: ${err.message}`, 'error');
    }
  };

  // Run AI Processing
  const runAiProcessing = async () => {
    if (ollamaStatus !== 'online') {
      showError('Ollama가 실행되지 않았습니다.');
      return;
    }

    setIsAiRunning(true);
    addLog(`[AI] ========================================`, 'info');
    addLog(`[AI] AI 가공 시작 (${aiLimit}건)`, 'info');
    addLog(`[AI] ========================================`, 'info');

    try {
      const startTime = Date.now();
      const res = await fetch('/api/bot/run-ai-processing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: aiLimit })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const targetCount = data.total || aiLimit;
        addLog(`[AI] ${targetCount}건 처리 시작`, 'success');
        pollAiStatus(startTime, targetCount);
      } else {
        addLog(`[AI] 실패: ${data.error || data.message}`, 'error');
        setIsAiRunning(false);
      }
    } catch (error: unknown) {
      const err = error as Error;
      addLog(`[AI] 오류: ${err.message}`, 'error');
      setIsAiRunning(false);
    }
  };

  const clearLogs = () => setLogs([]);

  const agencyRegions = REGIONS.filter(r => r.group === 'agency');
  const localRegions = REGIONS.filter(r => r.group === 'local');

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-[#e6edf3] flex items-center gap-3">
          <Calendar className="w-7 h-7 text-blue-500" />
          12월30일버전
        </h1>
        <p className="text-sm text-[#8b949e] mt-2">
          수동 스크래핑 & AI 가공 컨트롤 패널
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Scraper Control */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-[#e6edf3] flex items-center gap-2">
            <Filter className="w-5 h-5 text-green-500" />
            수동 스크래핑
          </h2>

          {/* Running Status */}
          {isScraperRunning && (
            <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-300" />
                <span className="text-blue-300 text-sm font-medium">
                  {statusMessage}
                </span>
              </div>
              <div className="flex justify-between text-xs text-blue-300 mb-1">
                <span>진행률</span>
                <span>{scraperProgress.completed} / {scraperProgress.total}</span>
              </div>
              <div className="w-full bg-[#21262d] rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${scraperProgress.total > 0 ? (scraperProgress.completed / scraperProgress.total) * 100 : 0}%` }}
                />
              </div>
              {/* Current jobs */}
              {currentJobs.length > 0 && (
                <div className="mt-2 max-h-20 overflow-y-auto space-y-1">
                  {currentJobs.filter(j => j.status === 'running').map(job => (
                    <div key={job.id} className="text-xs text-blue-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {getRegionName(job.region)}: {job.log_message || '진행중...'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Date Range */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#c9d1d9] mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              수집 기간
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setActivePreset(null); }}
                className="border border-[#30363d] bg-[#0d1117] text-[#e6edf3] rounded px-2 py-1 text-sm"
              />
              <span className="text-[#8b949e]">~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setActivePreset(null); }}
                className="border border-[#30363d] bg-[#0d1117] text-[#e6edf3] rounded px-2 py-1 text-sm"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {datePresets.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => setDatePreset(preset.days)}
                  className={`text-xs px-2 py-1 rounded border transition ${
                    activePreset === preset.days
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-[#30363d] bg-[#21262d] text-blue-400 hover:bg-[#30363d]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Region Selection */}
          <div className="mb-4">
            <div className="flex gap-2 mb-2">
              <button
                onClick={selectAll}
                disabled={isScraperRunning}
                className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded text-sm text-[#c9d1d9] disabled:opacity-50"
              >
                전체 선택
              </button>
              <button
                onClick={clearAll}
                disabled={isScraperRunning}
                className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded text-sm text-[#c9d1d9] disabled:opacity-50"
              >
                선택 해제
              </button>
              <span className="text-[#8b949e] ml-auto text-sm">
                {selectedRegions.length} / {REGIONS.length}
              </span>
            </div>

            {/* Agency Regions */}
            <div className="mb-2 p-2 bg-[#0d1117] rounded border border-[#21262d]">
              <p className="text-xs text-[#8b949e] mb-1">교육기관</p>
              <div className="flex flex-wrap gap-2">
                {agencyRegions.map(region => (
                  <label key={region.id} className="flex items-center gap-1 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={selectedRegions.includes(region.id)}
                      onChange={() => toggleRegion(region.id)}
                      disabled={isScraperRunning}
                      className="accent-[#58a6ff]"
                    />
                    <span className="text-[#c9d1d9]">{region.nameKo}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Local Regions */}
            <div className="p-2 bg-[#0d1117] rounded border border-[#21262d] max-h-[200px] overflow-y-auto">
              <p className="text-xs text-[#8b949e] mb-1">지자체</p>
              <div className="grid grid-cols-4 gap-2">
                {localRegions.map(region => (
                  <label key={region.id} className="flex items-center gap-1 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={selectedRegions.includes(region.id)}
                      onChange={() => toggleRegion(region.id)}
                      disabled={isScraperRunning}
                      className="accent-[#58a6ff]"
                    />
                    <span className="text-[#c9d1d9]">{region.nameKo}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Run / Stop Buttons */}
          {isScraperRunning ? (
            <div className="flex gap-2">
              <button
                onClick={handleStop}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded transition-colors flex items-center justify-center gap-2"
              >
                <StopCircle className="w-5 h-5" />
                중지
              </button>
              <button
                onClick={handleReset}
                className="py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                리셋
              </button>
            </div>
          ) : (
            <button
              onClick={handleRun}
              disabled={selectedRegions.length === 0}
              className="w-full py-2 px-4 bg-[#238636] hover:bg-[#2ea043] disabled:bg-[#21262d] disabled:text-[#484f58] text-white font-medium rounded transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              로컬 병렬 실행 ({selectedRegions.length}개)
            </button>
          )}
        </div>

        {/* Right: AI Processing */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-[#e6edf3] flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-500" />
            AI 가공
          </h2>

          {/* Ollama Status */}
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[#8b949e]">Ollama:</span>
              <span className={`px-2 py-1 rounded text-sm ${
                ollamaStatus === 'online' ? 'bg-green-900/50 text-green-400' :
                ollamaStatus === 'offline' ? 'bg-red-900/50 text-red-400' :
                'bg-[#21262d] text-[#8b949e]'
              }`}>
                {ollamaStatus === 'checking' ? '확인중...' :
                 ollamaStatus === 'online' ? '실행중' : '중지됨'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#8b949e]">대기중:</span>
              <span className="text-[#58a6ff] font-bold">{pendingCount}건</span>
            </div>
            <button
              onClick={() => {
                addLog(`[시스템] 새로고침`, 'info');
                checkOllama(false);
                loadPendingCount(false);
              }}
              className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded text-sm text-[#c9d1d9] ml-auto flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {ollamaStatus === 'offline' && (
            <div className="bg-red-900/20 border border-red-700/50 rounded p-3 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-400 text-sm">Ollama가 실행되지 않았습니다.</p>
                  <code className="text-xs text-[#8b949e]">ollama serve</code>
                </div>
                <button
                  onClick={startOllama}
                  disabled={isStartingOllama}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-[#21262d] disabled:text-[#484f58] text-white text-sm font-medium rounded transition-colors flex items-center gap-1"
                >
                  {isStartingOllama ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      시작중...
                    </>
                  ) : (
                    <>
                      <Power className="w-4 h-4" />
                      Ollama 실행
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Limit Selection */}
          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2">
              <span className="text-[#8b949e]">처리 개수:</span>
              <select
                value={aiLimit}
                onChange={(e) => setAiLimit(Number(e.target.value))}
                disabled={isAiRunning}
                className="bg-[#21262d] border border-[#30363d] rounded px-3 py-1.5 text-[#c9d1d9]"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
              </select>
            </label>
          </div>

          {/* Run Button */}
          <button
            onClick={runAiProcessing}
            disabled={isAiRunning || ollamaStatus !== 'online' || pendingCount === 0}
            className="w-full py-2 px-4 bg-[#238636] hover:bg-[#2ea043] disabled:bg-[#21262d] disabled:text-[#484f58] text-white font-medium rounded transition-colors flex items-center justify-center gap-2"
          >
            {isAiRunning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                처리 중...
              </>
            ) : (
              <>
                <Power className="w-5 h-5" />
                AI 가공 실행 ({aiLimit}개)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Panel */}
      {showResults && (scraperResults.length > 0 || aiResult) && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d] bg-[#21262d]">
            <h3 className="font-medium text-[#e6edf3] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              실행 결과
            </h3>
            <button
              onClick={() => { setShowResults(false); setScraperResults([]); setAiResult(null); }}
              className="text-xs text-[#8b949e] hover:text-[#c9d1d9]"
            >
              닫기
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Scraper Results */}
            {scraperResults.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-[#c9d1d9] mb-2">스크래퍼 결과</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[#8b949e] border-b border-[#30363d]">
                        <th className="pb-2 pr-4">지역</th>
                        <th className="pb-2 pr-4">상태</th>
                        <th className="pb-2 pr-4">수집</th>
                        <th className="pb-2">비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scraperResults.map((result, idx) => (
                        <tr key={idx} className="border-b border-[#21262d]">
                          <td className="py-2 pr-4 text-[#c9d1d9]">{result.regionName}</td>
                          <td className="py-2 pr-4">
                            {result.status === 'success' && <span className="text-green-400">성공</span>}
                            {result.status === 'failed' && <span className="text-red-400">실패</span>}
                            {result.status === 'stopped' && <span className="text-yellow-400">중지</span>}
                          </td>
                          <td className="py-2 pr-4 text-[#58a6ff]">{result.articlesCount}건</td>
                          <td className="py-2 text-[#8b949e] text-xs truncate max-w-[200px]">{result.error || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-[#30363d] font-medium">
                        <td className="pt-2 text-[#c9d1d9]">합계</td>
                        <td className="pt-2">
                          <span className="text-green-400">{scraperResults.filter(r => r.status === 'success').length}</span>
                          <span className="text-[#8b949e]"> / {scraperResults.length}</span>
                        </td>
                        <td className="pt-2 text-[#58a6ff]">
                          {scraperResults.reduce((sum, r) => sum + r.articlesCount, 0)}건
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* AI Results */}
            {aiResult && (
              <div>
                <h4 className="text-sm font-medium text-[#c9d1d9] mb-2">AI 가공 결과</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#0d1117] border border-[#21262d] rounded p-3 text-center">
                    <p className="text-2xl font-bold text-[#58a6ff]">{aiResult.total}</p>
                    <p className="text-xs text-[#8b949e]">처리</p>
                  </div>
                  <div className="bg-[#0d1117] border border-[#21262d] rounded p-3 text-center">
                    <p className="text-2xl font-bold text-green-400">{aiResult.published}</p>
                    <p className="text-xs text-[#8b949e]">발행</p>
                  </div>
                  <div className="bg-[#0d1117] border border-[#21262d] rounded p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-400">{aiResult.held}</p>
                    <p className="text-xs text-[#8b949e]">보류</p>
                  </div>
                  <div className="bg-[#0d1117] border border-[#21262d] rounded p-3 text-center">
                    <p className="text-2xl font-bold text-red-400">{aiResult.failed}</p>
                    <p className="text-xs text-[#8b949e]">실패</p>
                  </div>
                </div>
                <p className="text-xs text-[#8b949e] mt-2">소요시간: {aiResult.elapsed}초</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Log Viewer */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d] bg-[#21262d]">
          <h3 className="font-medium text-[#e6edf3] flex items-center gap-2">
            <Clock className="w-4 h-4" />
            실행 로그
          </h3>
          <button onClick={clearLogs} className="text-xs text-[#8b949e] hover:text-[#c9d1d9]">
            지우기
          </button>
        </div>

        <div className="h-[400px] overflow-y-auto p-4 font-mono text-xs space-y-0.5 bg-[#0d1117]">
          {logs.length === 0 ? (
            <p className="text-[#6e7681]">로그 없음...</p>
          ) : (
            logs.map(log => (
              <div key={log.id} className="flex gap-2">
                <span className="text-[#6e7681] flex-shrink-0">
                  [{log.timestamp.toLocaleTimeString('ko-KR')}]
                </span>
                <span className={
                  log.level === 'error' ? 'text-red-400' :
                  log.level === 'success' ? 'text-green-400' :
                  log.level === 'warning' ? 'text-yellow-400' :
                  'text-[#c9d1d9]'
                }>
                  {log.level === 'error' && <XCircle className="w-4 h-4 inline mr-1" />}
                  {log.level === 'success' && <CheckCircle className="w-4 h-4 inline mr-1" />}
                  {log.level === 'warning' && <AlertCircle className="w-4 h-4 inline mr-1" />}
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

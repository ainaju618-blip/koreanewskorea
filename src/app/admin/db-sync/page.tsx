"use client";

/**
 * 운영 DB 동기화 페이지
 * =====================
 * STEP 1: 순수 데이터 동기화 (기자 정보 제외)
 * STEP 2: 기자 배정
 * STEP 3: 완료
 */

import { useState, useEffect, useCallback } from "react";
import {
  DatabaseZap,
  Download,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Calendar,
  Info,
} from "lucide-react";

// 동기화 대상 테이블
const SYNC_OPTIONS = [
  {
    key: "posts",
    label: "기사 (posts)",
    description: "보도자료, 뉴스 기사",
    required: true,
  },
  {
    key: "categories",
    label: "카테고리 (categories)",
    description: "기사 분류 카테고리",
    required: true,
  },
  {
    key: "sources",
    label: "출처 (sources)",
    description: "기사 수집 출처 정보",
    required: false,
  },
] as const;

// 날짜 범위 옵션
const DATE_RANGE_OPTIONS = [
  { value: "1day", label: "1일" },
  { value: "2days", label: "2일" },
  { value: "3days", label: "3일" },
  { value: "5days", label: "5일" },
  { value: "week", label: "7일" },
  { value: "month", label: "30일" },
  { value: "all", label: "전체" },
] as const;

type SyncStep = 1 | 2 | 3;
type DateRange = "1day" | "2days" | "3days" | "5days" | "week" | "month" | "all";

interface SyncResult {
  table: string;
  success: boolean;
  count: number;
  error?: string;
}

interface SyncStatus {
  pendingAssignment: number;
  totalSynced: number;
}

interface Reporter {
  id: string;
  name: string;
  email: string;
}

interface Category {
  id: string;
  name: string;
}

interface CategoryGroup {
  name: string;
  count: number;
}

interface AssignmentRule {
  categoryId: string;
  categoryName: string;
  reporterId: string;
}

export default function DbSyncPage() {
  // 스텝 상태
  const [currentStep, setCurrentStep] = useState<SyncStep>(1);

  // STEP 1: 동기화 설정
  const [selectedTables, setSelectedTables] = useState<string[]>(["posts", "categories"]);
  const [dateRange, setDateRange] = useState<DateRange>("3days");
  const [syncMode, setSyncMode] = useState<"merge" | "overwrite">("merge");

  // 동기화 진행 상태
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [syncError, setSyncError] = useState<string | null>(null);

  // 동기화 현황
  const [status, setStatus] = useState<SyncStatus | null>(null);

  // STEP 2: 기자 배정
  const [reporters, setReporters] = useState<Reporter[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<Record<string, CategoryGroup>>({});
  const [assignmentRules, setAssignmentRules] = useState<AssignmentRule[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // 현황 조회
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/db-sync");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error("Failed to fetch sync status:", err);
    }
  }, []);

  // 기자 목록 조회
  const fetchReporters = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/reporters");
      if (res.ok) {
        const data = await res.json();
        setReporters(data.reporters || []);
      }
    } catch (err) {
      console.error("Failed to fetch reporters:", err);
    }
  }, []);

  // 카테고리 목록 조회
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || data || []);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }, []);

  // 미배정 기사 카테고리 그룹 조회
  const fetchPendingPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/db-sync/assign");
      if (res.ok) {
        const data = await res.json();
        setCategoryGroups(data.categoryGroups || {});

        // 초기 배정 규칙 설정
        const initialRules = Object.entries(data.categoryGroups || {}).map(
          ([catId, group]) => ({
            categoryId: catId,
            categoryName: (group as CategoryGroup).name,
            reporterId: "",
          })
        );
        setAssignmentRules(initialRules);
      }
    } catch (err) {
      console.error("Failed to fetch pending posts:", err);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // STEP 2 진입 시 데이터 로드
  useEffect(() => {
    if (currentStep === 2) {
      fetchReporters();
      fetchCategories();
      fetchPendingPosts();
    }
  }, [currentStep, fetchReporters, fetchCategories, fetchPendingPosts]);

  // 테이블 선택 토글
  const toggleTable = (key: string) => {
    const option = SYNC_OPTIONS.find((o) => o.key === key);
    if (option?.required) return; // 필수 항목은 해제 불가

    setSelectedTables((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
    );
  };

  // 동기화 실행
  const handleSync = async () => {
    setIsSyncing(true);
    setSyncError(null);
    setSyncResults([]);

    try {
      const res = await fetch("/api/admin/db-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tables: selectedTables,
          dateRange,
          mode: syncMode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSyncError(data.error || "동기화에 실패했습니다.");
        if (data.hint) {
          setSyncError(`${data.error}\n${data.hint}`);
        }
        return;
      }

      setSyncResults(data.results);

      // 성공 시 STEP 2로 이동
      if (data.success) {
        await fetchStatus();
        setCurrentStep(2);
      }
    } catch (err) {
      setSyncError("서버 연결에 실패했습니다.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-[#e6edf3] flex items-center gap-3">
          <DatabaseZap className="w-7 h-7 text-cyan-400" />
          운영 DB 동기화
        </h1>
        <p className="text-sm text-[#8b949e] mt-2">
          운영서버(koreanewsone.com)의 데이터를 개발서버로 가져옵니다.
        </p>
      </header>

      {/* Stepper */}
      <div className="flex items-center gap-4 bg-[#161b22] rounded-xl border border-[#30363d] p-4">
        <StepIndicator
          step={1}
          label="동기화"
          icon={Download}
          current={currentStep}
          completed={currentStep > 1}
        />
        <div className="flex-1 h-0.5 bg-[#30363d]">
          <div
            className={`h-full bg-cyan-500 transition-all ${
              currentStep > 1 ? "w-full" : "w-0"
            }`}
          />
        </div>
        <StepIndicator
          step={2}
          label="기자 배정"
          icon={UserPlus}
          current={currentStep}
          completed={currentStep > 2}
        />
        <div className="flex-1 h-0.5 bg-[#30363d]">
          <div
            className={`h-full bg-cyan-500 transition-all ${
              currentStep > 2 ? "w-full" : "w-0"
            }`}
          />
        </div>
        <StepIndicator
          step={3}
          label="완료"
          icon={CheckCircle}
          current={currentStep}
          completed={currentStep === 3}
        />
      </div>

      {/* Step Content */}
      {currentStep === 1 && (
        <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6 space-y-6">
          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-200">
              <p className="font-medium mb-1">순수 데이터만 동기화됩니다</p>
              <p className="text-blue-300/80">
                기자 정보(author_id)는 제외됩니다. 동기화 후 STEP 2에서 기자를 배정하세요.
              </p>
            </div>
          </div>

          {/* 동기화 대상 선택 */}
          <div>
            <h3 className="text-sm font-semibold text-[#e6edf3] mb-3">동기화 대상</h3>
            <div className="space-y-2">
              {SYNC_OPTIONS.map((option) => (
                <label
                  key={option.key}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition cursor-pointer ${
                    selectedTables.includes(option.key)
                      ? "border-cyan-500/50 bg-cyan-900/20"
                      : "border-[#30363d] hover:border-[#484f58]"
                  } ${option.required ? "cursor-default" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTables.includes(option.key)}
                    onChange={() => toggleTable(option.key)}
                    disabled={option.required}
                    className="w-4 h-4 rounded border-[#30363d] bg-[#0d1117] text-cyan-500 focus:ring-cyan-500"
                  />
                  <div className="flex-1">
                    <span className="text-[#e6edf3] font-medium">{option.label}</span>
                    {option.required && (
                      <span className="ml-2 text-xs text-amber-400">(필수)</span>
                    )}
                    <p className="text-xs text-[#8b949e] mt-0.5">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 날짜 범위 */}
          <div>
            <h3 className="text-sm font-semibold text-[#e6edf3] mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              기사 날짜 범위
            </h3>
            <div className="flex gap-2">
              {DATE_RANGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDateRange(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    dateRange === option.value
                      ? "bg-cyan-600 text-white"
                      : "bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 동기화 모드 */}
          <div>
            <h3 className="text-sm font-semibold text-[#e6edf3] mb-3">동기화 모드</h3>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="syncMode"
                  value="merge"
                  checked={syncMode === "merge"}
                  onChange={() => setSyncMode("merge")}
                  className="w-4 h-4 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-[#e6edf3]">병합</span>
                <span className="text-xs text-[#8b949e]">(기존 데이터 유지 + 새 데이터 추가)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="syncMode"
                  value="overwrite"
                  checked={syncMode === "overwrite"}
                  onChange={() => setSyncMode("overwrite")}
                  className="w-4 h-4 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-[#e6edf3]">덮어쓰기</span>
                <span className="text-xs text-[#8b949e]">(기존 데이터 삭제 후 새로 복사)</span>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {syncError && (
            <div className="flex items-start gap-3 p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-200 whitespace-pre-line">{syncError}</p>
            </div>
          )}

          {/* Sync Results */}
          {syncResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-[#e6edf3]">동기화 결과</h3>
              {syncResults.map((result, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    result.success
                      ? "bg-green-900/20 border border-green-800/50"
                      : "bg-red-900/20 border border-red-800/50"
                  }`}
                >
                  {result.success ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-sm text-[#e6edf3]">{result.table}</span>
                  <span className="text-xs text-[#8b949e]">
                    {result.success ? `${result.count}건 동기화됨` : result.error}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSync}
              disabled={isSyncing || selectedTables.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:from-cyan-600/50 disabled:to-cyan-500/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition shadow-lg shadow-cyan-500/25"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  동기화 중...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  동기화 시작
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6 space-y-6">
          {/* Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#0d1117] rounded-lg border border-[#30363d]">
              <p className="text-xs text-[#8b949e] mb-1">동기화된 기사</p>
              <p className="text-2xl font-bold text-cyan-400">{status?.totalSynced || 0}건</p>
            </div>
            <div className="p-4 bg-[#0d1117] rounded-lg border border-amber-500/30">
              <p className="text-xs text-[#8b949e] mb-1">기자 미배정</p>
              <p className="text-2xl font-bold text-amber-400">{status?.pendingAssignment || 0}건</p>
            </div>
          </div>

          {/* Auto Assignment Rules */}
          <div>
            <h3 className="text-lg font-semibold text-[#e6edf3] mb-4 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-cyan-400" />
              카테고리별 기자 배정
            </h3>

            {assignmentRules.length === 0 ? (
              <div className="p-6 bg-[#0d1117] rounded-lg border border-[#30363d] text-center">
                <p className="text-[#8b949e]">미배정 기사가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignmentRules.map((rule, idx) => (
                  <div
                    key={rule.categoryId}
                    className="flex items-center gap-4 p-4 bg-[#0d1117] rounded-lg border border-[#30363d]"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-[#e6edf3]">{rule.categoryName}</p>
                      <p className="text-xs text-[#8b949e]">
                        {categoryGroups[rule.categoryId]?.count || 0}건의 기사
                      </p>
                    </div>
                    <div className="text-[#8b949e]">→</div>
                    <select
                      value={rule.reporterId}
                      onChange={(e) => {
                        const newRules = [...assignmentRules];
                        newRules[idx].reporterId = e.target.value;
                        setAssignmentRules(newRules);
                      }}
                      className="w-48 px-3 py-2 bg-[#21262d] border border-[#30363d] rounded-lg text-[#e6edf3] text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">기자 선택...</option>
                      {reporters.map((reporter) => (
                        <option key={reporter.id} value={reporter.id}>
                          {reporter.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* Error Message */}
            {assignError && (
              <div className="flex items-start gap-3 p-4 bg-red-900/20 border border-red-800/50 rounded-lg mt-4">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-200">{assignError}</p>
              </div>
            )}

            {/* Auto Assign Button */}
            {assignmentRules.length > 0 && (
              <button
                onClick={async () => {
                  // 기자가 선택된 규칙만 필터링
                  const validRules = assignmentRules.filter((r) => r.reporterId);
                  if (validRules.length === 0) {
                    setAssignError("최소 하나의 카테고리에 기자를 선택해주세요.");
                    return;
                  }

                  setIsAssigning(true);
                  setAssignError(null);

                  try {
                    const res = await fetch("/api/admin/db-sync/assign", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        mode: "auto",
                        rules: validRules.map((r) => ({
                          categoryId: r.categoryId,
                          reporterId: r.reporterId,
                        })),
                      }),
                    });

                    const data = await res.json();

                    if (!res.ok) {
                      setAssignError(data.error || "배정에 실패했습니다.");
                      return;
                    }

                    // 성공 시 상태 갱신 및 완료 단계로 이동
                    await fetchStatus();
                    await fetchPendingPosts();

                    // 미배정 기사가 없으면 완료 단계로
                    if (Object.keys(categoryGroups).length === 0) {
                      setCurrentStep(3);
                    }
                  } catch (err) {
                    setAssignError("서버 연결에 실패했습니다.");
                  } finally {
                    setIsAssigning(false);
                  }
                }}
                disabled={isAssigning || assignmentRules.every((r) => !r.reporterId)}
                className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:from-cyan-600/50 disabled:to-cyan-500/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition shadow-lg shadow-cyan-500/25"
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    배정 중...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    선택한 기자로 자동 배정
                  </>
                )}
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t border-[#30363d]">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 text-[#8b949e] hover:text-[#e6edf3] transition"
            >
              이전 단계
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition"
            >
              배정 완료 (건너뛰기)
            </button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-8 text-center">
          <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-[#e6edf3] mb-2">동기화 완료!</h2>
          <p className="text-[#8b949e] mb-6">
            운영서버의 데이터가 성공적으로 동기화되었습니다.
          </p>
          <button
            onClick={() => {
              setCurrentStep(1);
              setSyncResults([]);
            }}
            className="px-6 py-3 bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] font-medium rounded-lg transition"
          >
            처음으로 돌아가기
          </button>
        </div>
      )}
    </div>
  );
}

// Step Indicator Component
function StepIndicator({
  step,
  label,
  icon: Icon,
  current,
  completed,
}: {
  step: number;
  label: string;
  icon: typeof Download;
  current: SyncStep;
  completed: boolean;
}) {
  const isActive = current === step;

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
          completed
            ? "bg-cyan-600"
            : isActive
            ? "bg-cyan-900/50 border-2 border-cyan-500"
            : "bg-[#21262d]"
        }`}
      >
        {completed ? (
          <CheckCircle className="w-5 h-5 text-white" />
        ) : (
          <Icon
            className={`w-5 h-5 ${
              isActive ? "text-cyan-400" : "text-[#8b949e]"
            }`}
          />
        )}
      </div>
      <span
        className={`text-sm font-medium ${
          isActive || completed ? "text-[#e6edf3]" : "text-[#8b949e]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

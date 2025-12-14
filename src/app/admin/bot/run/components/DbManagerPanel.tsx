"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Trash2, RefreshCw, Loader2, AlertTriangle, Database, Calendar } from "lucide-react";
import { ConfirmModal, DangerConfirmModal } from "@/components/admin/shared";
import { RegionCheckboxGroup, SelectionControls } from "./RegionCheckboxGroup";
import { localRegions, agencyRegions, allRegions, getRegionId } from "./regionData";
import { useToast } from '@/components/ui/Toast';

interface RegionStat {
    source: string;
    count: number;
    latestDate: string | null;
}

interface DeletePreview {
    preview: Record<string, number>;
    totalCount: number;
}

export function DbManagerPanel() {
    // 상태
    const [stats, setStats] = useState<RegionStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSources, setSelectedSources] = useState<string[]>([]);
    const [deleting, setDeleting] = useState(false);
    const [deleteResult, setDeleteResult] = useState<{ total: number; sources: string[] } | null>(null);

    // 기간 필터 (선택적)
    const [useDateFilter, setUseDateFilter] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // 삭제 확인 모달
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        preview: DeletePreview | null;
    }>({ isOpen: false, preview: null });

    // 전체 삭제 모달
    const [deleteAllModal, setDeleteAllModal] = useState(false);
    const { showSuccess, showError, showWarning } = useToast();

    // 통계 로드
    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/posts/stats/by-region');
            const data = await res.json();
            setStats(data.stats || []);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // 지역 정보 매핑 (통계 데이터)
    const regionInfo = React.useMemo(() => {
        const info: Record<string, { count: number; latestDate: string | null }> = {};
        stats.forEach(stat => {
            info[stat.source] = { count: stat.count, latestDate: stat.latestDate };
        });
        return info;
    }, [stats]);

    // 선택 토글
    const toggleSource = (source: string) => {
        setSelectedSources(prev =>
            prev.includes(source)
                ? prev.filter(s => s !== source)
                : [...prev, source]
        );
    };

    // 전체 선택/해제
    const selectAllSources = () => {
        setSelectedSources(allRegions.map(r => r.label));
    };

    const clearAllSources = () => {
        setSelectedSources([]);
    };

    // 삭제 미리보기 요청
    const handleDeleteClick = async () => {
        if (selectedSources.length === 0) {
            showWarning('삭제할 지역을 선택해주세요.');
            return;
        }

        try {
            const body: any = { sources: selectedSources };
            if (useDateFilter && startDate && endDate) {
                body.dateRange = { startDate, endDate };
            }

            const res = await fetch('/api/posts/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const preview = await res.json();

            if (preview.totalCount === 0) {
                showWarning('삭제할 기사가 없습니다.');
                return;
            }

            setDeleteModal({ isOpen: true, preview });
        } catch (error) {
            console.error('Preview error:', error);
            showError('미리보기 요청 중 오류가 발생했습니다.');
        }
    };

    // 실제 삭제 실행
    const confirmDelete = async () => {
        setDeleteModal({ isOpen: false, preview: null });
        setDeleting(true);

        try {
            const body: any = { sources: selectedSources };
            if (useDateFilter && startDate && endDate) {
                body.dateRange = { startDate, endDate };
            }

            const res = await fetch('/api/posts/bulk-delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const result = await res.json();

            if (result.success) {
                setDeleteResult({
                    total: result.totalDeleted,
                    sources: selectedSources
                });
                setSelectedSources([]);
                // 통계 새로고침
                await fetchStats();
            } else {
                showError('삭제 중 오류가 발생했습니다: ' + result.message);
            }
        } catch (error) {
            console.error('Delete error:', error);
            showError('삭제 요청 중 오류가 발생했습니다.');
        } finally {
            setDeleting(false);
        }
    };

    // 전체 삭제 실행 (모든 source)
    const confirmDeleteAll = async () => {
        setDeleteAllModal(false);
        setDeleting(true);

        try {
            const res = await fetch('/api/posts/bulk-delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deleteAll: true })
            });

            const result = await res.json();

            if (result.success) {
                setDeleteResult({
                    total: result.totalDeleted,
                    sources: ['전체']
                });
                setSelectedSources([]);
                await fetchStats();
            } else {
                showError('삭제 중 오류가 발생했습니다: ' + result.message);
            }
        } catch (error) {
            console.error('Delete all error:', error);
            showError('삭제 요청 중 오류가 발생했습니다.');
        } finally {
            setDeleting(false);
        }
    };

    // 선택된 기사 총 수
    const selectedTotalCount = React.useMemo(() => {
        return selectedSources.reduce((sum, source) => {
            const stat = stats.find(s => s.source === source);
            return sum + (stat?.count || 0);
        }, 0);
    }, [selectedSources, stats]);

    // 전체 기사 수
    const totalArticles = stats.reduce((sum, s) => sum + s.count, 0);

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-red-50/50">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Database className="w-5 h-5 text-red-600" />
                        DB 관리 (기사 삭제)
                    </h3>
                    <button
                        onClick={fetchStats}
                        disabled={loading}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                        title="새로고침"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    스크래퍼 테스트 전 기존 기사를 삭제하세요
                </p>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
                {/* 삭제 결과 알림 */}
                {deleteResult && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                        <Trash2 className="w-4 h-4 text-green-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-green-800">
                                {deleteResult.total}건 삭제 완료
                            </p>
                            <p className="text-xs text-green-600 mt-0.5">
                                {deleteResult.sources.join(', ')}
                            </p>
                        </div>
                        <button
                            onClick={() => setDeleteResult(null)}
                            className="ml-auto text-green-500 hover:text-green-700"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* 통계 요약 */}
                <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">전체 기사 수</span>
                        <span className="font-bold text-gray-900">{totalArticles.toLocaleString()}건</span>
                    </div>
                    {selectedSources.length > 0 && (
                        <div className="flex items-center justify-between text-sm mt-1 text-red-600">
                            <span>선택된 지역 기사 수</span>
                            <span className="font-bold">{selectedTotalCount.toLocaleString()}건</span>
                        </div>
                    )}
                </div>

                {/* 기간 필터 (선택적) */}
                <div className="border border-gray-200 rounded-lg p-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={useDateFilter}
                            onChange={(e) => setUseDateFilter(e.target.checked)}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            특정 기간만 삭제
                        </span>
                    </label>

                    {useDateFilter && (
                        <div className="mt-3 flex items-center gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                            />
                            <span className="text-gray-400">~</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                            />
                        </div>
                    )}
                </div>

                {/* 지역 선택 */}
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <>
                        {/* 교육기관 */}
                        <RegionCheckboxGroup
                            title="교육기관"
                            regions={agencyRegions}
                            selectedRegions={selectedSources}
                            onToggle={toggleSource}
                            selectionKey="label"
                            regionInfo={regionInfo}
                            accentColor="red"
                            compact
                        />

                        {/* 지자체 */}
                        <RegionCheckboxGroup
                            title="지자체"
                            regions={localRegions}
                            selectedRegions={selectedSources}
                            onToggle={toggleSource}
                            selectionKey="label"
                            regionInfo={regionInfo}
                            accentColor="red"
                            compact
                        />

                        {/* 선택 컨트롤 */}
                        <SelectionControls
                            onSelectAll={selectAllSources}
                            onClearAll={clearAllSources}
                            selectedCount={selectedSources.length}
                            totalCount={allRegions.length}
                        />
                    </>
                )}
            </div>

            {/* Footer - 삭제 버튼 */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-2">
                {selectedSources.length > 0 && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-700 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {selectedSources.length}개 지역, 약 {selectedTotalCount.toLocaleString()}건이 삭제됩니다
                        </p>
                    </div>
                )}
                <button
                    onClick={handleDeleteClick}
                    disabled={deleting || selectedSources.length === 0}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    {deleting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Trash2 className="w-5 h-5" />
                    )}
                    {deleting ? '삭제 중...' : '선택 지역 기사 삭제'}
                </button>
                {/* 전체 삭제 버튼 */}
                <button
                    onClick={() => setDeleteAllModal(true)}
                    disabled={deleting || totalArticles === 0}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    <Trash2 className="w-4 h-4" />
                    전체 삭제 ({totalArticles.toLocaleString()}건)
                </button>
            </div>

            {/* 삭제 확인 모달 */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                title="기사 삭제 확인"
                message={
                    deleteModal.preview
                        ? `다음 지역의 기사를 삭제합니다:\n\n${Object.entries(deleteModal.preview.preview)
                            .filter(([, count]) => count > 0)
                            .map(([source, count]) => `• ${source}: ${count}건`)
                            .join('\n')
                        }\n\n총 ${deleteModal.preview.totalCount}건이 영구 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.`
                        : ''
                }
                confirmLabel="삭제 실행"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteModal({ isOpen: false, preview: null })}
            />

            {/* 전체 삭제 확인 모달 - 5번 확인 필요 */}
            <DangerConfirmModal
                isOpen={deleteAllModal}
                message={`모든 기사 ${totalArticles.toLocaleString()}건을 삭제합니다.\n\n이 작업은 되돌릴 수 없습니다.\n정말 삭제하시겠습니까?`}
                onConfirm={confirmDeleteAll}
                onCancel={() => setDeleteAllModal(false)}
            />
        </div>
    );
}

export default DbManagerPanel;

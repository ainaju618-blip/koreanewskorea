"use client";

import React from "react";
import { CheckCircle, XCircle, AlertTriangle, Clock, Loader2 } from "lucide-react";

export interface RegionHealthData {
    lastSuccess: string | null;
    lastFailure: string | null;
    lastRun: string | null;
    lastStatus: string;
    totalArticles: number;
    successRate: number;
    recentRuns: number;
}

export interface RegionHeatmapProps {
    healthData: Record<string, RegionHealthData>;
    isLoading?: boolean;
    onRegionClick?: (regionId: string) => void;
}

const REGION_GROUPS = {
    metro: [
        { id: "gwangju", label: "광주" },
        { id: "jeonnam", label: "전남" }
    ],
    cities: [
        { id: "mokpo", label: "목포" },
        { id: "yeosu", label: "여수" },
        { id: "suncheon", label: "순천" },
        { id: "naju", label: "나주" },
        { id: "gwangyang", label: "광양" }
    ],
    counties: [
        { id: "damyang", label: "담양" },
        { id: "gokseong", label: "곡성" },
        { id: "gurye", label: "구례" },
        { id: "goheung", label: "고흥" },
        { id: "boseong", label: "보성" },
        { id: "hwasun", label: "화순" },
        { id: "jangheung", label: "장흥" },
        { id: "gangjin", label: "강진" },
        { id: "haenam", label: "해남" },
        { id: "yeongam", label: "영암" },
        { id: "muan", label: "무안" },
        { id: "hampyeong", label: "함평" },
        { id: "yeonggwang", label: "영광" },
        { id: "jangseong", label: "장성" },
        { id: "wando", label: "완도" },
        { id: "jindo", label: "진도" },
        { id: "shinan", label: "신안" }
    ],
    education: [
        { id: "gwangju_edu", label: "광주교육청" },
        { id: "jeonnam_edu", label: "전남교육청" }
    ]
};

type HealthStatus = "healthy" | "warning" | "error" | "stale" | "running" | "unknown";

function getHealthStatus(data: RegionHealthData | undefined): HealthStatus {
    if (!data) return "unknown";

    if (data.lastStatus === "running") return "running";
    if (data.lastStatus === "success") {
        if (data.lastSuccess) {
            const hoursSinceSuccess = (Date.now() - new Date(data.lastSuccess).getTime()) / (1000 * 60 * 60);
            if (hoursSinceSuccess > 48) return "stale";
            if (hoursSinceSuccess > 24) return "warning";
        }
        return "healthy";
    }
    if (["failed", "error"].includes(data.lastStatus)) return "error";
    if (data.lastStatus === "warning") return "warning";

    return "unknown";
}

function getStatusStyles(status: HealthStatus) {
    switch (status) {
        case "healthy":
            return {
                bg: "bg-green-100 hover:bg-green-200",
                border: "border-green-300",
                text: "text-green-800",
                icon: CheckCircle,
                iconColor: "text-green-600"
            };
        case "warning":
            return {
                bg: "bg-amber-100 hover:bg-amber-200",
                border: "border-amber-300",
                text: "text-amber-800",
                icon: AlertTriangle,
                iconColor: "text-amber-600"
            };
        case "error":
            return {
                bg: "bg-red-100 hover:bg-red-200",
                border: "border-red-300",
                text: "text-red-800",
                icon: XCircle,
                iconColor: "text-red-600"
            };
        case "stale":
            return {
                bg: "bg-gray-100 hover:bg-gray-200",
                border: "border-gray-300",
                text: "text-gray-600",
                icon: Clock,
                iconColor: "text-gray-500"
            };
        case "running":
            return {
                bg: "bg-blue-100 hover:bg-blue-200",
                border: "border-blue-300",
                text: "text-blue-800",
                icon: Loader2,
                iconColor: "text-blue-600"
            };
        default:
            return {
                bg: "bg-gray-50 hover:bg-gray-100",
                border: "border-gray-200",
                text: "text-gray-500",
                icon: Clock,
                iconColor: "text-gray-400"
            };
    }
}

function formatTimeAgo(dateString: string | null): string {
    if (!dateString) return "-";

    const now = Date.now();
    const then = new Date(dateString).getTime();
    const diffMs = now - then;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "1h 이내";
    if (diffHours < 24) return `${diffHours}h 전`;
    if (diffDays < 7) return `${diffDays}d 전`;
    return `${Math.floor(diffDays / 7)}w 전`;
}

interface RegionCardProps {
    id: string;
    label: string;
    data?: RegionHealthData;
    onClick?: () => void;
}

function RegionCard({ id, label, data, onClick }: RegionCardProps) {
    const status = getHealthStatus(data);
    const styles = getStatusStyles(status);
    const Icon = styles.icon;

    return (
        <button
            onClick={onClick}
            className={`relative flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-200 cursor-pointer ${styles.bg} ${styles.border}`}
            title={`${label}: ${data?.lastStatus || "unknown"} (${formatTimeAgo(data?.lastRun || null)})`}
        >
            <Icon className={`w-4 h-4 ${styles.iconColor} ${status === "running" ? "animate-spin" : ""}`} />
            <span className={`text-xs font-medium mt-1 ${styles.text} truncate max-w-full`}>
                {label}
            </span>
            {data?.totalArticles !== undefined && data.totalArticles > 0 && (
                <span className="text-[10px] text-gray-500 mt-0.5">
                    {data.totalArticles.toLocaleString()}
                </span>
            )}
        </button>
    );
}

interface RegionGroupProps {
    title: string;
    regions: { id: string; label: string }[];
    healthData: Record<string, RegionHealthData>;
    onRegionClick?: (regionId: string) => void;
    gridCols?: string;
}

function RegionGroup({ title, regions, healthData, onRegionClick, gridCols = "grid-cols-5" }: RegionGroupProps) {
    return (
        <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {title}
            </h4>
            <div className={`grid ${gridCols} gap-2`}>
                {regions.map(region => (
                    <RegionCard
                        key={region.id}
                        id={region.id}
                        label={region.label}
                        data={healthData[region.id]}
                        onClick={() => onRegionClick?.(region.id)}
                    />
                ))}
            </div>
        </div>
    );
}

export function RegionHeatmap({ healthData, isLoading, onRegionClick }: RegionHeatmapProps) {
    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-center h-48">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            </div>
        );
    }

    const allStatuses = Object.values(healthData).map(d => getHealthStatus(d));
    const healthy = allStatuses.filter(s => s === "healthy").length;
    const warning = allStatuses.filter(s => s === "warning" || s === "stale").length;
    const error = allStatuses.filter(s => s === "error").length;
    const running = allStatuses.filter(s => s === "running").length;

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">
                    지역별 수집 상태
                </h3>
                <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        정상 {healthy}
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        주의 {warning}
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        오류 {error}
                    </span>
                    {running > 0 && (
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                            실행중 {running}
                        </span>
                    )}
                </div>
            </div>

            <div className="p-4">
                <RegionGroup
                    title="광역/도"
                    regions={REGION_GROUPS.metro}
                    healthData={healthData}
                    onRegionClick={onRegionClick}
                    gridCols="grid-cols-2"
                />

                <RegionGroup
                    title="시 (5)"
                    regions={REGION_GROUPS.cities}
                    healthData={healthData}
                    onRegionClick={onRegionClick}
                    gridCols="grid-cols-5"
                />

                <RegionGroup
                    title="군 (17)"
                    regions={REGION_GROUPS.counties}
                    healthData={healthData}
                    onRegionClick={onRegionClick}
                    gridCols="grid-cols-6"
                />

                <RegionGroup
                    title="교육청"
                    regions={REGION_GROUPS.education}
                    healthData={healthData}
                    onRegionClick={onRegionClick}
                    gridCols="grid-cols-2"
                />
            </div>

            <div className="px-4 pb-4">
                <div className="flex items-center justify-center gap-6 text-xs text-gray-500 border-t border-gray-100 pt-3">
                    <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        24h 이내 성공
                    </span>
                    <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        24-48h 전
                    </span>
                    <span className="flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-red-600" />
                        실패
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        48h+ 미수집
                    </span>
                </div>
            </div>
        </div>
    );
}

export default RegionHeatmap;

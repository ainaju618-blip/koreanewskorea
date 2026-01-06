"use client";

import React from "react";
import { MapPin, Check } from "lucide-react";

// 중앙 집중 지역 데이터 import (중복 방지)
import {
    allRegions,
    getRegionLabel as getLabel,
    metroRegions,
    provinceRegions,
    governmentRegions,
} from "@/app/admin/bot/run/components/regionData";

interface RegionSelectorProps {
    selectedRegions: string[];
    onChange: (regions: string[]) => void;
}

export function RegionSelector({ selectedRegions, onChange }: RegionSelectorProps) {
    const handleToggle = (regionId: string) => {
        if (selectedRegions.includes(regionId)) {
            onChange(selectedRegions.filter(id => id !== regionId));
        } else {
            onChange([...selectedRegions, regionId]);
        }
    };

    const handleSelectAll = () => {
        onChange(allRegions.map(r => r.id));
    };

    const handleClearAll = () => {
        onChange([]);
    };

    // 그룹별 렌더링 헬퍼
    const renderGroup = (title: string, regions: typeof allRegions) => (
        <div key={title} className="space-y-1">
            <div className="text-xs font-medium text-gray-500 px-1">{title}</div>
            <div className="flex flex-wrap gap-2">
                {regions.map(region => {
                    const isSelected = selectedRegions.includes(region.id);
                    return (
                        <label
                            key={region.id}
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer transition text-sm ${isSelected
                                ? "bg-blue-100 text-blue-800 border border-blue-300"
                                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggle(region.id)}
                                className="sr-only"
                            />
                            {isSelected && <Check className="w-3 h-3 text-blue-600" />}
                            <span className="truncate">{region.label}</span>
                        </label>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-700">
                        적용 지역 선택
                    </span>
                    <span className="text-xs text-gray-500">
                        ({selectedRegions.length}/{allRegions.length})
                    </span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSelectAll}
                        className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition"
                    >
                        전체선택
                    </button>
                    <button
                        onClick={handleClearAll}
                        className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded transition"
                    >
                        해제
                    </button>
                </div>
            </div>

            {/* Grouped Checkboxes */}
            <div className="space-y-4 p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
                {renderGroup("정부", governmentRegions)}
                {renderGroup("특별시·광역시", metroRegions)}
                {renderGroup("도", provinceRegions)}
            </div>
        </div>
    );
}

// 지역 ID로 라벨 조회 (중앙 함수 re-export)
export function getRegionLabel(regionId: string): string {
    return getLabel(regionId);
}

// 전체 지역 목록 export (호환성)
export const ALL_REGIONS = allRegions;

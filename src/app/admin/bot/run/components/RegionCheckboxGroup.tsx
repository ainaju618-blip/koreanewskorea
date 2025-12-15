"use client";

import React from "react";
import { Region } from "./regionData";

interface RegionCheckboxGroupProps {
    title: string;
    regions: Region[];
    selectedRegions: string[];
    onToggle: (id: string) => void;
    /** 선택 기준: 'id' (스크래퍼용) 또는 'label' (DB용) */
    selectionKey?: 'id' | 'label';
    /** 각 지역별 추가 정보 (기사 수 등) */
    regionInfo?: Record<string, { count?: number; latestDate?: string | null }>;
    /** 색상 테마 */
    accentColor?: 'blue' | 'red';
    /** 최대 높이 (스크롤) */
    maxHeight?: string;
    /** 컴팩트 모드 */
    compact?: boolean;
    /** 스크래퍼 존재 여부 표시 (좌측 스크래퍼 패널용) */
    showScraperStatus?: boolean;
    /** 활성 스크래퍼 ID 목록 (동적 조회된 값) */
    activeScraperIds?: string[];
}

export function RegionCheckboxGroup({
    title,
    regions,
    selectedRegions,
    onToggle,
    selectionKey = 'id',
    regionInfo,
    accentColor = 'blue',
    maxHeight,
    compact = false,
    showScraperStatus = false,
    activeScraperIds = []
}: RegionCheckboxGroupProps) {
    const colors = {
        blue: {
            selected: 'bg-blue-100 border-blue-300 text-blue-900',
            dot: 'bg-blue-600',
            title: 'text-blue-800',
            checkbox: 'text-blue-600 focus:ring-blue-500'
        },
        red: {
            selected: 'bg-red-100 border-red-300 text-red-900',
            dot: 'bg-red-600',
            title: 'text-red-800',
            checkbox: 'text-red-600 focus:ring-red-500'
        }
    };

    const theme = colors[accentColor];

    const getValue = (region: Region) => selectionKey === 'id' ? region.id : region.label;
    const isSelected = (region: Region) => selectedRegions.includes(getValue(region));


    return (
        <div>
            <p className={`text-xs font-bold ${theme.title} mb-1 flex items-center gap-1`}>
                <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`}></span>
                {title}
            </p>
            <div
                className={`grid ${compact ? 'grid-cols-4' : 'grid-cols-4 md:grid-cols-5 lg:grid-cols-5'} gap-1.5 bg-gray-50 p-2 rounded-lg border border-gray-100 ${maxHeight ? 'overflow-y-auto' : ''}`}
                style={maxHeight ? { maxHeight } : undefined}
            >
                {regions.map((region) => {
                    // regionInfo는 label 키 또는 id 키로 검색  (API가 source=label로 반환)
                    const info = regionInfo?.[region.label] || regionInfo?.[region.id];
                    const selected = isSelected(region);

                    return (
                        <label
                            key={region.id}
                            className={`flex items-center gap-2 cursor-pointer p-2 rounded border transition text-sm ${selected
                                ? `${theme.selected} font-medium shadow-sm`
                                : `bg-white border-transparent hover:bg-gray-100`
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => onToggle(getValue(region))}
                                className={`rounded border-gray-300 ${theme.checkbox}`}
                            />
                            <span className="flex-1 text-sm whitespace-nowrap text-gray-900">
                                {region.label}
                            </span>
                            {info && info.count !== undefined && (
                                <span className="text-xs text-gray-500 font-medium">
                                    ({info.count})
                                </span>
                            )}
                        </label>
                    );
                })}
            </div>
        </div>
    );
}

interface SelectionControlsProps {
    onSelectAll: () => void;
    onClearAll: () => void;
    selectedCount: number;
    totalCount: number;
}

export function SelectionControls({
    onSelectAll,
    onClearAll,
    selectedCount,
    totalCount
}: SelectionControlsProps) {
    return (
        <div className="mt-2 flex items-center gap-4 text-xs">
            <button onClick={onSelectAll} className="text-blue-600 hover:underline">
                전체 선택
            </button>
            <button onClick={onClearAll} className="text-gray-500 hover:underline">
                전체 해제
            </button>
            <span className="text-gray-400">
                ({selectedCount}/{totalCount} 선택됨)
            </span>
        </div>
    );
}

export default RegionCheckboxGroup;

"use client";

import React from "react";
import { MapPin, Check } from "lucide-react";

// 27개 지역 데이터
const ALL_REGIONS = [
    // 광역/도
    { id: "gwangju", label: "광주광역시" },
    { id: "jeonnam", label: "전라남도" },
    // 시
    { id: "mokpo", label: "목포시" },
    { id: "yeosu", label: "여수시" },
    { id: "suncheon", label: "순천시" },
    { id: "naju", label: "나주시" },
    { id: "gwangyang", label: "광양시" },
    // 군
    { id: "damyang", label: "담양군" },
    { id: "gokseong", label: "곡성군" },
    { id: "gurye", label: "구례군" },
    { id: "goheung", label: "고흥군" },
    { id: "boseong", label: "보성군" },
    { id: "hwasun", label: "화순군" },
    { id: "jangheung", label: "장흥군" },
    { id: "gangjin", label: "강진군" },
    { id: "haenam", label: "해남군" },
    { id: "yeongam", label: "영암군" },
    { id: "muan", label: "무안군" },
    { id: "hampyeong", label: "함평군" },
    { id: "yeonggwang", label: "영광군" },
    { id: "jangseong", label: "장성군" },
    { id: "wando", label: "완도군" },
    { id: "jindo", label: "진도군" },
    { id: "sinan", label: "신안군" },
    // 교육청
    { id: "gwangju_edu", label: "광주교육청" },
    { id: "jeonnam_edu", label: "전남교육청" },
];

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
        onChange(ALL_REGIONS.map(r => r.id));
    };

    const handleClearAll = () => {
        onChange([]);
    };

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
                        ({selectedRegions.length}/{ALL_REGIONS.length})
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

            {/* Checkbox Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                {ALL_REGIONS.map(region => {
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
}

// 지역 ID로 라벨 조회
export function getRegionLabel(regionId: string): string {
    const region = ALL_REGIONS.find(r => r.id === regionId);
    return region?.label || regionId;
}

// 전체 지역 목록 export
export { ALL_REGIONS };

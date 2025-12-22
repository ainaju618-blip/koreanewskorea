"use client";

import React from "react";
import { Info, AlertTriangle } from "lucide-react";
import { getRegionLabel } from "./RegionSelector";

interface SettingsSummaryProps {
    enabled: boolean;
    enabledRegions: string[];
}

export function SettingsSummary({ enabled, enabledRegions }: SettingsSummaryProps) {
    if (!enabled) {
        return (
            <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700">AI 재가공 비활성화</h4>
                        <p className="text-sm text-gray-600 mt-1">
                            현재 AI 기사 재가공 기능이 비활성화되어 있습니다.
                            활성화 토글을 켜고 저장하면 선택된 지역의 기사에 AI 재가공이 적용됩니다.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (enabledRegions.length === 0) {
        return (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-semibold text-amber-800">지역 미선택</h4>
                        <p className="text-sm text-amber-700 mt-1">
                            AI 재가공이 활성화되었지만 적용할 지역이 선택되지 않았습니다.
                            위에서 지역을 선택해주세요.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // 선택된 지역 라벨들
    const regionLabels = enabledRegions.map(id => getRegionLabel(id));
    const displayRegions = regionLabels.length > 5
        ? [...regionLabels.slice(0, 5), `외 ${regionLabels.length - 5}개`].join(", ")
        : regionLabels.join(", ");

    return (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-semibold text-blue-800">현재 설정</h4>
                    <p className="text-sm text-blue-700 mt-1">
                        <strong>{displayRegions}</strong> 기사가 자동으로 AI 기사 재가공이 설정되어
                        본문의 기사가 AI를 통해서 수정, 편집되어 기사가 게재됩니다.
                    </p>
                </div>
            </div>
        </div>
    );
}

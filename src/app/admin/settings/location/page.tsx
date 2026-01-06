"use client";

// Location-Based News Admin Settings Page
// Manages ON/OFF toggle and configuration for personalized news feature

import React, { useState, useEffect } from "react";
import { MapPin, Save, Loader2, ToggleLeft, ToggleRight, Globe, Users } from "lucide-react";
import { useToast } from '@/components/ui/Toast';
import { REGIONS, RegionCode, getRegionsByType } from '@/lib/location';

// Setting keys for site_settings table
const SETTING_KEYS = {
    enabled: 'location_news_enabled',
    defaultRegion: 'location_default_region',
    showNearby: 'location_show_nearby',
    nearbyCount: 'location_nearby_count',
};

interface LocationSettings {
    enabled: boolean;
    defaultRegion: RegionCode;
    showNearby: boolean;
    nearbyCount: number;
}

const DEFAULT_SETTINGS: LocationSettings = {
    enabled: false, // Default: OFF - enable after testing
    defaultRegion: 'korea', // 전국판: 정부 보도자료가 기본값
    showNearby: true,
    nearbyCount: 4,
};

export default function LocationSettingsPage() {
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<LocationSettings>(DEFAULT_SETTINGS);

    const grouped = getRegionsByType();

    // Load settings from API
    useEffect(() => {
        async function loadSettings() {
            try {
                const response = await fetch('/api/site-settings?keys=' + Object.values(SETTING_KEYS).join(','));
                if (response.ok) {
                    const data = await response.json();
                    setSettings({
                        enabled: data[SETTING_KEYS.enabled] ?? DEFAULT_SETTINGS.enabled,
                        defaultRegion: data[SETTING_KEYS.defaultRegion] ?? DEFAULT_SETTINGS.defaultRegion,
                        showNearby: data[SETTING_KEYS.showNearby] ?? DEFAULT_SETTINGS.showNearby,
                        nearbyCount: data[SETTING_KEYS.nearbyCount] ?? DEFAULT_SETTINGS.nearbyCount,
                    });
                }
            } catch (error) {
                console.error('Failed to load location settings:', error);
            } finally {
                setLoading(false);
            }
        }
        loadSettings();
    }, []);

    // Save settings to API
    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/site-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    settings: [
                        { key: SETTING_KEYS.enabled, value: settings.enabled },
                        { key: SETTING_KEYS.defaultRegion, value: settings.defaultRegion },
                        { key: SETTING_KEYS.showNearby, value: settings.showNearby },
                        { key: SETTING_KEYS.nearbyCount, value: settings.nearbyCount },
                    ]
                }),
            });

            if (response.ok) {
                showSuccess('설정이 저장되었습니다');
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error('Failed to save location settings:', error);
            showError('설정 저장에 실패했습니다');
        } finally {
            setSaving(false);
        }
    };

    // Toggle handler
    const handleToggle = (field: keyof LocationSettings) => {
        setSettings(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-[#e6edf3] flex items-center gap-3">
                        <MapPin className="w-7 h-7 text-blue-600" />
                        위치 기반 뉴스 설정
                    </h1>
                    <p className="text-sm text-[#8b949e] mt-2">
                        사용자 위치에 따른 맞춤형 뉴스 기능을 설정합니다
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm transition flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? '저장 중...' : '설정 저장'}
                </button>
            </header>

            {/* Main Toggle - Most Prominent */}
            <div className={`rounded-xl border-2 p-6 ${settings.enabled ? 'bg-green-500/10 border-green-500/40' : 'bg-[#21262d] border-[#30363d]'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-4 h-4 rounded-full ${settings.enabled ? 'bg-green-500 animate-pulse' : 'bg-[#6e7681]'}`} />
                        <div>
                            <h2 className="text-xl font-bold text-[#e6edf3]">
                                위치 기반 뉴스 {settings.enabled ? 'ON' : 'OFF'}
                            </h2>
                            <p className={`text-sm mt-1 ${settings.enabled ? 'text-green-400' : 'text-[#8b949e]'}`}>
                                {settings.enabled
                                    ? '홈페이지에 사용자 위치 기반 맞춤형 뉴스가 표시됩니다'
                                    : 'OFF 상태: 기존 홈페이지 그대로 표시됩니다 (위치 기능 미적용)'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleToggle('enabled')}
                        className={`p-2 rounded-full transition-all transform hover:scale-110 ${settings.enabled ? 'text-green-400 bg-green-500/20' : 'text-[#6e7681] bg-[#30363d]'}`}
                    >
                        {settings.enabled ? (
                            <ToggleRight className="w-14 h-14" />
                        ) : (
                            <ToggleLeft className="w-14 h-14" />
                        )}
                    </button>
                </div>
            </div>

            {/* Detail Settings - Only visible when enabled */}
            {settings.enabled && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Toggle Options */}
                        <div className="bg-[#161b22] rounded-xl border border-[#30363d] shadow-sm p-6 space-y-4">
                            <h3 className="font-semibold text-[#e6edf3] flex items-center gap-2 pb-3 border-b border-[#30363d]">
                                <Globe className="w-5 h-5 text-blue-600" />
                                표시 옵션
                            </h3>

                            {/* Show Nearby */}
                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <p className="font-medium text-[#e6edf3]">인근 지역 표시</p>
                                    <p className="text-sm text-[#8b949e]">주변 지역의 뉴스도 함께 표시합니다</p>
                                </div>
                                <button
                                    onClick={() => handleToggle('showNearby')}
                                    className={`p-1 rounded-full transition-colors ${settings.showNearby ? 'text-green-400' : 'text-[#6e7681]'}`}
                                >
                                    {settings.showNearby ? (
                                        <ToggleRight className="w-10 h-10" />
                                    ) : (
                                        <ToggleLeft className="w-10 h-10" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Configuration */}
                        <div className="bg-[#161b22] rounded-xl border border-[#30363d] shadow-sm p-6 space-y-4">
                            <h3 className="font-semibold text-[#e6edf3] flex items-center gap-2 pb-3 border-b border-[#30363d]">
                                <Users className="w-5 h-5 text-blue-600" />
                                상세 설정
                            </h3>

                            {/* Default Region */}
                            <div>
                                <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
                                    기본 지역
                                </label>
                                <p className="text-xs text-[#8b949e] mb-2">
                                    IP 감지 실패 또는 서비스 지역 외 사용자에게 표시할 기본 지역
                                </p>
                                <select
                                    value={settings.defaultRegion}
                                    onChange={(e) => setSettings(prev => ({ ...prev, defaultRegion: e.target.value as RegionCode }))}
                                    className="w-full px-4 py-2 border border-[#30363d] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-[#21262d] text-[#e6edf3]"
                                >
                                    <optgroup label="정부 보도자료">
                                        {grouped.government.map(code => (
                                            <option key={code} value={code}>{REGIONS[code as RegionCode].name}</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="특별시·광역시">
                                        {grouped.metro.map(code => (
                                            <option key={code} value={code}>{REGIONS[code as RegionCode].name}</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="도">
                                        {grouped.province.map(code => (
                                            <option key={code} value={code}>{REGIONS[code as RegionCode].name}</option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>

                            {/* Nearby Count */}
                            {settings.showNearby && (
                                <div>
                                    <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
                                        인근 지역 표시 수
                                    </label>
                                    <p className="text-xs text-[#8b949e] mb-2">
                                        함께 표시할 인근 지역의 최대 개수 (2-6개)
                                    </p>
                                    <select
                                        value={settings.nearbyCount}
                                        onChange={(e) => setSettings(prev => ({ ...prev, nearbyCount: parseInt(e.target.value) }))}
                                        className="w-full px-4 py-2 border border-[#30363d] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-[#21262d] text-[#e6edf3]"
                                    >
                                        {[2, 3, 4, 5, 6].map(n => (
                                            <option key={n} value={n}>{n}개 지역</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Current Settings Summary */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                        <p className="text-sm text-blue-300">
                            <strong>현재 설정:</strong> 기본 지역 <strong>{REGIONS[settings.defaultRegion]?.name}</strong> |
                            인근 지역 <strong>{settings.showNearby ? `최대 ${settings.nearbyCount}개 표시` : '숨김'}</strong>
                        </p>
                    </div>
                </>
            )}

            {/* Info when disabled */}
            {!settings.enabled && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                    <p className="text-sm text-amber-300">
                        <strong>OFF 상태 안내:</strong> 위치 기반 뉴스 기능이 비활성화되어 있습니다.
                        홈페이지는 기존과 동일하게 표시됩니다. 기능을 테스트하려면 위 토글을 ON으로 변경하세요.
                    </p>
                </div>
            )}
        </div>
    );
}

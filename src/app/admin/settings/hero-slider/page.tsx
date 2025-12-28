'use client';

import React, { useState, useEffect } from 'react';
import {
    Sliders,
    Plus,
    X,
    Loader2,
    Save,
    Eye,
    GripVertical,
    Trash2,
    RefreshCw
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

// All available regions
const ALL_REGIONS = [
    { code: 'gwangju', name: 'Gwangju', nameKr: '광주' },
    { code: 'jeonnam', name: 'Jeonnam', nameKr: '전남' },
    { code: 'naju', name: 'Naju', nameKr: '나주' },
    { code: 'mokpo', name: 'Mokpo', nameKr: '목포' },
    { code: 'yeosu', name: 'Yeosu', nameKr: '여수' },
    { code: 'suncheon', name: 'Suncheon', nameKr: '순천' },
    { code: 'gwangyang', name: 'Gwangyang', nameKr: '광양' },
    { code: 'damyang', name: 'Damyang', nameKr: '담양' },
    { code: 'gokseong', name: 'Gokseong', nameKr: '곡성' },
    { code: 'gurye', name: 'Gurye', nameKr: '구례' },
    { code: 'goheung', name: 'Goheung', nameKr: '고흥' },
    { code: 'boseong', name: 'Boseong', nameKr: '보성' },
    { code: 'hwasun', name: 'Hwasun', nameKr: '화순' },
    { code: 'jangheung', name: 'Jangheung', nameKr: '장흥' },
    { code: 'gangjin', name: 'Gangjin', nameKr: '강진' },
    { code: 'haenam', name: 'Haenam', nameKr: '해남' },
    { code: 'yeongam', name: 'Yeongam', nameKr: '영암' },
    { code: 'muan', name: 'Muan', nameKr: '무안' },
    { code: 'hampyeong', name: 'Hampyeong', nameKr: '함평' },
    { code: 'yeonggwang', name: 'Yeonggwang', nameKr: '영광' },
    { code: 'jangseong', name: 'Jangseong', nameKr: '장성' },
    { code: 'wando', name: 'Wando', nameKr: '완도' },
    { code: 'jindo', name: 'Jindo', nameKr: '진도' },
    { code: 'shinan', name: 'Shinan', nameKr: '신안' },
];

interface HeroSliderSettings {
    regions: string[];
    interval: number;
    enabled: boolean;
}

const DEFAULT_SETTINGS: HeroSliderSettings = {
    regions: ['gwangju', 'jeonnam', 'naju', 'suncheon', 'gwangyang', 'gwangju'],
    interval: 4000,
    enabled: true,
};

export default function HeroSliderSettingsPage() {
    const { showSuccess, showError } = useToast();
    const [settings, setSettings] = useState<HeroSliderSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [preview, setPreview] = useState<any[]>([]);
    const [loadingPreview, setLoadingPreview] = useState(false);

    // Drag state
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Fetch current settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/site-settings?key=hero_slider');
                if (res.ok) {
                    const data = await res.json();
                    if (data.setting?.value) {
                        setSettings(data.setting.value);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    // Load preview
    const loadPreview = async () => {
        setLoadingPreview(true);
        try {
            const res = await fetch('/api/hero-slider');
            if (res.ok) {
                const data = await res.json();
                setPreview(data.articles || []);
            }
        } catch (error) {
            console.error('Failed to load preview:', error);
        } finally {
            setLoadingPreview(false);
        }
    };

    // Save settings
    const handleSave = async () => {
        if (settings.regions.length === 0) {
            showError('At least one region is required');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/site-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key: 'hero_slider',
                    value: settings,
                    description: 'Hero Slider Settings',
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message);
            }

            showSuccess('Settings saved successfully!');
            loadPreview(); // Refresh preview
        } catch (error: any) {
            showError(error.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    // Add region
    const addRegion = (code: string) => {
        setSettings((prev) => ({
            ...prev,
            regions: [...prev.regions, code],
        }));
    };

    // Remove region at index
    const removeRegion = (index: number) => {
        setSettings((prev) => ({
            ...prev,
            regions: prev.regions.filter((_, i) => i !== index),
        }));
    };

    // Drag handlers
    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newRegions = [...settings.regions];
        const draggedItem = newRegions[draggedIndex];
        newRegions.splice(draggedIndex, 1);
        newRegions.splice(index, 0, draggedItem);

        setSettings((prev) => ({ ...prev, regions: newRegions }));
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    // Get region info
    const getRegionInfo = (code: string) => {
        return ALL_REGIONS.find((r) => r.code === code) || { code, name: code, nameKr: code };
    };

    // Interval options
    const INTERVAL_OPTIONS = [
        { value: 3000, label: '3 seconds' },
        { value: 4000, label: '4 seconds (recommended)' },
        { value: 5000, label: '5 seconds' },
        { value: 6000, label: '6 seconds' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-[#e6edf3] flex items-center gap-3">
                        <Sliders className="w-7 h-7 text-red-600" />
                        Hero Slider Settings
                    </h1>
                    <p className="text-sm text-[#8b949e] mt-2">
                        Configure regions and transition timing for the main page hero slider
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 font-medium disabled:opacity-50"
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Settings Panel */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Enable/Disable Toggle */}
                    <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-[#e6edf3]">Enable Slider</h3>
                                <p className="text-sm text-[#8b949e]">Turn the hero slider on or off</p>
                            </div>
                            <button
                                onClick={() => setSettings((prev) => ({ ...prev, enabled: !prev.enabled }))}
                                className={`w-12 h-6 rounded-full transition-colors relative ${
                                    settings.enabled ? 'bg-green-500' : 'bg-gray-300'
                                }`}
                            >
                                <span
                                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                                        settings.enabled ? 'left-6' : 'left-0.5'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Transition Interval */}
                    <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6">
                        <h3 className="font-semibold text-[#e6edf3] mb-4">Transition Interval</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {INTERVAL_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setSettings((prev) => ({ ...prev, interval: option.value }))}
                                    className={`p-3 rounded-lg border text-center transition-all ${
                                        settings.interval === option.value
                                            ? 'border-red-500 bg-red-500/20 text-red-400'
                                            : 'border-[#30363d] hover:border-[#6e7681] text-[#c9d1d9]'
                                    }`}
                                >
                                    <div className="text-lg font-bold">{option.value / 1000}s</div>
                                    {option.value === 4000 && (
                                        <div className="text-xs text-[#8b949e]">Recommended</div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Region Slots */}
                    <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-semibold text-[#e6edf3]">Region Slots ({settings.regions.length})</h3>
                                <p className="text-sm text-[#8b949e]">
                                    Drag to reorder. Same region can appear multiple times.
                                </p>
                            </div>
                        </div>

                        {/* Current Slots */}
                        <div className="space-y-2 mb-4">
                            {settings.regions.map((regionCode, index) => {
                                const region = getRegionInfo(regionCode);
                                return (
                                    <div
                                        key={`${regionCode}-${index}`}
                                        draggable
                                        onDragStart={() => handleDragStart(index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragEnd={handleDragEnd}
                                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-move ${
                                            draggedIndex === index
                                                ? 'border-red-400 bg-red-500/10 opacity-50'
                                                : 'border-[#30363d] bg-[#21262d] hover:bg-[#30363d]'
                                        }`}
                                    >
                                        <GripVertical className="w-4 h-4 text-[#6e7681]" />
                                        <span className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-sm font-bold">
                                            {index + 1}
                                        </span>
                                        <div className="flex-1">
                                            <span className="font-medium text-[#e6edf3]">{region.nameKr}</span>
                                            <span className="text-[#6e7681] mx-2">|</span>
                                            <span className="text-[#8b949e] text-sm">{region.name}</span>
                                        </div>
                                        <button
                                            onClick={() => removeRegion(index)}
                                            className="p-1.5 text-[#6e7681] hover:text-red-400 hover:bg-red-500/10 rounded"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })}
                            {settings.regions.length === 0 && (
                                <div className="text-center py-8 text-[#6e7681]">
                                    No regions added. Add regions below.
                                </div>
                            )}
                        </div>

                        {/* Add Region */}
                        <div className="border-t border-[#30363d] pt-4">
                            <h4 className="text-sm font-medium text-[#c9d1d9] mb-3">Add Region</h4>
                            <div className="flex flex-wrap gap-2">
                                {ALL_REGIONS.slice(0, 7).map((region) => (
                                    <button
                                        key={region.code}
                                        onClick={() => addRegion(region.code)}
                                        className="px-3 py-1.5 text-sm bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-full flex items-center gap-1 transition-colors"
                                    >
                                        <Plus className="w-3 h-3" />
                                        {region.nameKr}
                                    </button>
                                ))}
                                <details className="relative">
                                    <summary className="px-3 py-1.5 text-sm bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-full cursor-pointer list-none">
                                        More regions...
                                    </summary>
                                    <div className="absolute top-full left-0 mt-2 p-3 bg-[#161b22] border border-[#30363d] rounded-lg shadow-lg z-10 min-w-[200px] max-h-[300px] overflow-y-auto">
                                        <div className="flex flex-wrap gap-2">
                                            {ALL_REGIONS.slice(7).map((region) => (
                                                <button
                                                    key={region.code}
                                                    onClick={() => addRegion(region.code)}
                                                    className="px-2 py-1 text-xs bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded flex items-center gap-1"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    {region.nameKr}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </details>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview Panel */}
                <div className="space-y-4">
                    <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-[#e6edf3] flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                Preview
                            </h3>
                            <button
                                onClick={loadPreview}
                                disabled={loadingPreview}
                                className="p-2 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] rounded"
                            >
                                <RefreshCw className={`w-4 h-4 ${loadingPreview ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        {loadingPreview ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="animate-pulse">
                                        <div className="h-4 bg-[#21262d] rounded w-1/4 mb-2" />
                                        <div className="h-3 bg-[#21262d] rounded w-full" />
                                    </div>
                                ))}
                            </div>
                        ) : preview.length > 0 ? (
                            <div className="space-y-3">
                                {preview.map((article, idx) => (
                                    <div
                                        key={article.id}
                                        className="p-3 bg-[#21262d] rounded-lg border border-[#30363d]"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded">
                                                {idx + 1}. {article.regionName}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[#c9d1d9] line-clamp-2">
                                            {article.title}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-[#6e7681]">
                                <p className="mb-3">No preview available</p>
                                <button
                                    onClick={loadPreview}
                                    className="text-red-400 hover:text-red-300 text-sm"
                                >
                                    Load Preview
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-300">
                        <p className="font-medium mb-2">How it works:</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-400">
                            <li>Each slot shows the latest article from that region</li>
                            <li>Same region twice = shows 1st and 2nd latest articles</li>
                            <li>Hover on slider pauses auto-transition</li>
                            <li>Mobile users can swipe left/right</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

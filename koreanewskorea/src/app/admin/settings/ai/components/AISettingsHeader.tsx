"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Save, RefreshCw, List, Settings } from "lucide-react";
import { AISettings } from "../hooks/useAISettings";

interface AISettingsHeaderProps {
    settings: AISettings;
    saving: boolean;
    onToggleEnabled: () => void;
    onSave: () => void;
}

export function AISettingsHeader({
    settings,
    saving,
    onToggleEnabled,
    onSave
}: AISettingsHeaderProps) {
    return (
        <div className="space-y-4">
            {/* Tab Navigation */}
            <div className="flex items-center gap-2">
                <Link
                    href="/admin/settings"
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <Link
                        href="/admin/sources"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-md transition"
                    >
                        <List className="w-4 h-4" />
                        수집처 관리
                    </Link>
                    <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white text-blue-600 shadow-sm rounded-md">
                        <Settings className="w-4 h-4" />
                        AI 설정
                    </div>
                </div>
            </div>

            {/* Header Bar */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">
                            AI 기사 재가공 설정
                        </h1>
                        <p className="text-xs text-gray-500">
                            AI를 활용한 기사 자동 재가공 기능
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Toggle */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">활성화</span>
                        <button
                            onClick={onToggleEnabled}
                            className={`relative w-12 h-6 rounded-full transition-colors ${settings.enabled ? "bg-blue-600" : "bg-gray-300"
                                }`}
                        >
                            <span
                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.enabled ? "translate-x-6" : ""
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                        {saving ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        저장
                    </button>
                </div>
            </div>
        </div>
    );
}


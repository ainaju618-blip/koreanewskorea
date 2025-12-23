"use client";

import React, { useState } from "react";
import { RefreshCw, AlertTriangle, CheckCircle, ExternalLink } from "lucide-react";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/ai-prompts";
import { useAISettings, SavedPrompt, GeminiKeyEntry } from "./hooks/useAISettings";
import {
    AISettingsHeader,
    PromptEditor,
    AISimulation,
    APIKeyManager,
    ReporterKeyManager,
    RegionSelector,
    UsagePanel,
    SettingsSummary,
    GeminiMultiKeyTester,
    ALL_REGIONS
} from "./components";
import Link from "next/link";

export default function AISettingsPage() {
    const {
        settings,
        loading,
        saving,
        testing,
        testingAll,
        testResults,
        testInput,
        testOutput,
        parsedOutput,
        isRewriting,
        setSettings,
        updateSettings,
        updateApiKey,
        setDefaultProvider,
        setTestInput,
        setTestOutput,
        handleSave,
        handleTest,
        handleTestAll,
        handleSimulation,
        handleRealTest,
        realTestResult,
        saveSettings,
        showSuccess,
    } = useAISettings();

    // Save Message State
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    const handleToggleEnabled = () => {
        updateSettings({ enabled: !settings.enabled });
    };

    const handlePromptChange = (value: string) => {
        updateSettings({ systemPrompt: value });
    };

    const handlePromptReset = () => {
        updateSettings({ systemPrompt: DEFAULT_SYSTEM_PROMPT });
    };

    const handleRegionChange = (regions: string[]) => {
        updateSettings({ enabledRegions: regions });
    };

    const handleLoadPrompt = (prompt: SavedPrompt) => {
        updateSettings({ systemPrompt: prompt.content });
    };

    const handleSavePrompt = async (name: string) => {
        const newPrompt: SavedPrompt = {
            id: Date.now().toString(),
            name,
            content: settings.systemPrompt || ""
        };
        const newSavedPrompts = [...(settings.savedPrompts || []), newPrompt];
        const newSettings = { ...settings, savedPrompts: newSavedPrompts };
        setSettings(newSettings);
        const success = await saveSettings(newSettings);
        if (success) showSuccess(`"${name}" 프롬프트가 저장되었습니다.`);
    };

    const handleDeletePrompt = async (promptId: string) => {
        const newSavedPrompts = settings.savedPrompts?.filter(p => p.id !== promptId) || [];
        const newSettings = { ...settings, savedPrompts: newSavedPrompts };
        setSettings(newSettings);
        const success = await saveSettings(newSettings);
        if (success) showSuccess("프롬프트가 삭제되었습니다.");
    };

    const handleCopyOutput = () => {
        navigator.clipboard.writeText(testOutput);
        showSuccess("클립보드에 복사되었습니다.");
    };

    // Handle Gemini multi-key changes
    const handleGeminiKeysChange = (keys: GeminiKeyEntry[]) => {
        updateSettings({ geminiMultiKeys: keys });
    };

    // Save Gemini multi-keys
    const handleSaveGeminiKeys = async () => {
        const success = await saveSettings(settings);
        if (success) {
            showSuccess("Gemini 키가 저장되었습니다.");
        }
    };

    return (
        <div className="space-y-5 max-w-6xl mx-auto">
            {/* Header: Back + Title + Toggle + Save */}
            <AISettingsHeader
                settings={settings}
                saving={saving}
                onToggleEnabled={handleToggleEnabled}
                onSave={async () => {
                    await handleSave();
                    // Build region names for message
                    const regionNames = (settings.enabledRegions || [])
                        .map(id => {
                            const region = ALL_REGIONS.find(r => r.id === id);
                            return region?.label || id;
                        })
                        .join(', ');

                    if (regionNames) {
                        setSaveMessage(regionNames);
                    } else {
                        setSaveMessage(null);
                    }
                }}
            />

            {/* Quick Navigation - 승인대기 바로가기 */}
            <div className="flex items-center gap-2">
                <Link
                    href="/admin/news?status=draft"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition text-sm font-medium shadow-sm"
                >
                    <ExternalLink className="w-4 h-4" />
                    승인대기 기사 바로가기
                </Link>
                <span className="text-xs text-gray-500">
                    AI 설정 후 승인대기 기사를 승인하면 자동으로 AI 재가공됩니다.
                </span>
            </div>

            {/* Prompt Editor - Full Width */}
            <PromptEditor
                systemPrompt={settings.systemPrompt}
                savedPrompts={settings.savedPrompts || []}
                onPromptChange={handlePromptChange}
                onReset={handlePromptReset}
                onLoadPrompt={handleLoadPrompt}
                onSavePrompt={handleSavePrompt}
                onDeletePrompt={handleDeletePrompt}
            />

            {/* Save Confirmation Message */}
            {saveMessage && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <span className="font-semibold">{saveMessage}</span>
                        {settings.enabledRegions && settings.enabledRegions.length > 1
                            ? '가 '
                            : '이 '
                        }
                        AI 재가공을 사용하도록 저장되었습니다.
                        <br />
                        <span className="text-blue-600">
                            활성화 버튼을 클릭하시면 이후 수집되는
                            <span className="font-semibold">{saveMessage}</span> 기사는
                            수집 후 승인 버튼을 누르는 시점에 재가공되어 기사로 정식 등록됩니다.
                        </span>
                    </div>
                    <button
                        onClick={() => setSaveMessage(null)}
                        className="ml-auto text-blue-400 hover:text-blue-600 text-lg leading-none"
                    >
                        &times;
                    </button>
                </div>
            )}

            {/* 지역 선택 + 설정 요약 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <RegionSelector
                    selectedRegions={settings.enabledRegions || []}
                    onChange={handleRegionChange}
                />
                <SettingsSummary
                    enabled={settings.enabled}
                    enabledRegions={settings.enabledRegions || []}
                />
            </div>

            {/* 2-Column Layout: Settings | Simulation */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left: API 키 관리 (1/3) */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-6">
                    {/* API 키 입력 */}
                    <APIKeyManager
                        settings={settings}
                        testing={testing}
                        testingAll={testingAll}
                        testResults={testResults}
                        defaultProvider={settings.defaultProvider}
                        onUpdateApiKey={updateApiKey}
                        onTest={handleTest}
                        onTestAll={handleTestAll}
                        onSetDefaultProvider={setDefaultProvider}
                    />

                    {/* Gemini Multi-Key Manager */}
                    <GeminiMultiKeyTester
                        geminiKeys={settings.geminiMultiKeys || []}
                        onKeysChange={handleGeminiKeysChange}
                        onSave={handleSaveGeminiKeys}
                        saving={saving}
                    />

                    {/* 사용량 패널 */}
                    <div className="border-t border-gray-100 pt-4">
                        <UsagePanel
                            dailyLimit={settings.dailyLimit || 100}
                            monthlyTokenLimit={settings.monthlyTokenLimit || 1000000}
                        />
                    </div>

                    {/* 기자별 API 키 관리 */}
                    <div className="border-t border-gray-100 pt-4">
                        <ReporterKeyManager />
                    </div>
                </div>

                {/* Right: Simulation (2/3) */}
                <div className="lg:col-span-2">
                    <AISimulation
                        testInput={testInput}
                        testOutput={testOutput}
                        parsedOutput={parsedOutput}
                        isRewriting={isRewriting}
                        currentProvider={settings.defaultProvider}
                        onInputChange={setTestInput}
                        onOutputChange={setTestOutput}
                        onRun={handleSimulation}
                        onRealTest={handleRealTest}
                        onCopy={handleCopyOutput}
                        realTestResult={realTestResult ?? undefined}
                    />
                </div>
            </div>

            {/* Notice - Compact */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                <p className="text-sm text-yellow-700">
                    <span className="font-medium">기자 개인 API 키:</span> 기자가 개인 키를 설정하면 해당 기자의 기사는 개인 키로 처리됩니다.
                </p>
            </div>
        </div>
    );
}

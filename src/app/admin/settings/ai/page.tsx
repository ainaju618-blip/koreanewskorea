"use client";

import React from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/ai-prompts";
import { useAISettings, SavedPrompt } from "./hooks/useAISettings";
import {
    AISettingsHeader,
    PromptEditor,
    AISimulation,
    APIKeyManager,
    ReporterKeyManager,
    RegionSelector,
    UsagePanel,
    SettingsSummary
} from "./components";

export default function AISettingsPage() {
    const {
        settings,
        loading,
        saving,
        testing,
        testResults,
        testInput,
        testOutput,
        parsedOutput,
        isRewriting,
        setSettings,
        updateSettings,
        updateApiKey,
        setTestInput,
        setTestOutput,
        handleSave,
        handleTest,
        handleSimulation,
        handleRealTest,
        realTestResult,
        saveSettings,
        showSuccess,
    } = useAISettings();

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

    return (
        <div className="space-y-5 max-w-6xl mx-auto">
            {/* Header: Back + Title + Toggle + Save */}
            <AISettingsHeader
                settings={settings}
                saving={saving}
                onToggleEnabled={handleToggleEnabled}
                onSave={handleSave}
            />

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
                        testResults={testResults}
                        onUpdateApiKey={updateApiKey}
                        onTest={handleTest}
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
                        realTestResult={realTestResult}
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

"use client";

import React, { useEffect, useState } from "react";
import { Bot, Key, Eye, EyeOff, Save, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

type AIProvider = "gemini" | "claude" | "grok";

interface AISettingsSectionProps {
    reporterId: string;
}

export default function AISettingsSection({ reporterId }: AISettingsSectionProps) {
    const { showSuccess, showError } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [aiEnabled, setAiEnabled] = useState(false);
    const [aiProvider, setAiProvider] = useState<AIProvider>("gemini");
    const [aiApiKey, setAiApiKey] = useState("");
    const [showApiKey, setShowApiKey] = useState(false);
    const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
    const [savedKeyMask, setSavedKeyMask] = useState<Record<AIProvider, string | null>>({
        gemini: null,
        claude: null,
        grok: null,
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/reporter/ai-settings");
            if (res.ok) {
                const data = await res.json();
                if (data.settings) {
                    setAiEnabled(data.settings.enabled || false);
                    setAiProvider(data.settings.provider || "gemini");
                    setSavedKeyMask({
                        gemini: data.settings.api_keys?.gemini || null,
                        claude: data.settings.api_keys?.claude || null,
                        grok: data.settings.api_keys?.grok || null,
                    });
                }
            }
        } catch (err) {
            console.error("Failed to fetch AI settings:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestConnection = async () => {
        if (!aiApiKey.trim()) {
            showError("API key is required");
            return;
        }
        setTestStatus("testing");
        try {
            const res = await fetch("/api/ai/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ provider: aiProvider, apiKey: aiApiKey }),
            });
            if (res.ok) {
                setTestStatus("success");
                showSuccess("Connection successful!");
            } else {
                setTestStatus("error");
                showError("Connection failed");
            }
        } catch {
            setTestStatus("error");
            showError("Test failed");
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/reporter/ai-settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    enabled: aiEnabled,
                    provider: aiProvider,
                    apiKey: aiApiKey.trim() || undefined,
                }),
            });
            if (res.ok) {
                showSuccess("AI settings saved!");
                setAiApiKey("");
                fetchSettings();
            } else {
                const error = await res.json();
                showError(error.error || "Failed to save");
            }
        } catch {
            showError("Save failed");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
            </div>
        );
    }

    // Suppress unused variable warning
    void reporterId;

    return (
        <div className="space-y-6">
            {/* Enable Toggle */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Bot className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">AI Rewriting</h3>
                            <p className="text-sm text-gray-500">Use your own API key</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setAiEnabled(!aiEnabled)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${aiEnabled ? "bg-purple-600" : "bg-gray-300"
                            }`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${aiEnabled ? "translate-x-6" : ""
                                }`}
                        />
                    </button>
                </div>
            </div>

            {aiEnabled && (
                <>
                    {/* Provider Selection */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="font-semibold text-gray-900 mb-3">AI Provider</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {(["gemini", "claude", "grok"] as const).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => {
                                        setAiProvider(p);
                                        setAiApiKey("");
                                        setTestStatus("idle");
                                    }}
                                    className={`p-3 rounded-lg border-2 text-center transition ${aiProvider === p
                                            ? "border-purple-600 bg-purple-50"
                                            : "border-gray-200 hover:border-gray-300"
                                        }`}
                                >
                                    <div className={`font-medium ${aiProvider === p ? "text-purple-700" : "text-gray-700"}`}>
                                        {p === "gemini" ? "Gemini" : p === "claude" ? "Claude" : "Grok"}
                                    </div>
                                    {savedKeyMask[p] && (
                                        <div className="text-xs text-green-600 mt-0.5">Saved</div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* API Key */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Key className="w-4 h-4 text-gray-500" />
                            <h3 className="font-semibold text-gray-900">API Key</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">
                            Leave empty to use global settings
                        </p>

                        {savedKeyMask[aiProvider] && (
                            <div className="mb-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                                Current: {savedKeyMask[aiProvider]}
                            </div>
                        )}

                        <div className="relative">
                            <input
                                type={showApiKey ? "text" : "password"}
                                value={aiApiKey}
                                onChange={(e) => setAiApiKey(e.target.value)}
                                placeholder="Enter new API key..."
                                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        <button
                            onClick={handleTestConnection}
                            disabled={!aiApiKey.trim() || testStatus === "testing"}
                            className="mt-2 w-full px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {testStatus === "testing" && <Loader2 className="w-4 h-4 animate-spin" />}
                            {testStatus === "success" && <CheckCircle className="w-4 h-4 text-green-600" />}
                            {testStatus === "error" && <XCircle className="w-4 h-4 text-red-600" />}
                            Test Connection
                        </button>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isSaving ? "Saving..." : "Save AI Settings"}
                    </button>
                </>
            )}

            {!aiEnabled && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center">
                    <Bot className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Enable to configure your AI API keys</p>
                </div>
            )}
        </div>
    );
}

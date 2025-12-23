"use client";

import React, { useState } from "react";
import {
    Eye,
    EyeOff,
    Zap,
    RefreshCw,
    CheckCircle,
    XCircle,
    PlayCircle,
    Key,
    Plus,
    Trash2,
    Save
} from "lucide-react";

interface GeminiKeyEntry {
    key: string;
    label: string;
    enabled?: boolean;
}

interface GeminiMultiKeyTesterProps {
    geminiKeys: GeminiKeyEntry[];
    onKeysChange?: (keys: GeminiKeyEntry[]) => void;
    onSave?: () => Promise<void>;
    saving?: boolean;
}

export function GeminiMultiKeyTester({
    geminiKeys,
    onKeysChange,
    onSave,
    saving
}: GeminiMultiKeyTesterProps) {
    const [showKeys, setShowKeys] = useState<Record<number, boolean>>({});
    const [testing, setTesting] = useState<number | null>(null);
    const [testingAll, setTestingAll] = useState(false);
    const [results, setResults] = useState<Record<number, boolean | null>>({});

    // New key input state
    const [newKeyLabel, setNewKeyLabel] = useState("");
    const [newKeyValue, setNewKeyValue] = useState("");
    const [showNewKey, setShowNewKey] = useState(false);

    const toggleShowKey = (index: number) => {
        setShowKeys(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const testSingleKey = async (index: number, key: string) => {
        setTesting(index);
        setResults(prev => ({ ...prev, [index]: null }));

        try {
            const res = await fetch("/api/ai/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ provider: "gemini", apiKey: key }),
            });

            const data = await res.json();
            setResults(prev => ({ ...prev, [index]: res.ok && data.success }));
        } catch {
            setResults(prev => ({ ...prev, [index]: false }));
        } finally {
            setTesting(null);
        }
    };

    const testAllKeys = async () => {
        setTestingAll(true);
        setResults({});

        for (let i = 0; i < geminiKeys.length; i++) {
            const entry = geminiKeys[i];
            if (entry.enabled !== false && entry.key) {
                setTesting(i);
                try {
                    const res = await fetch("/api/ai/test", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ provider: "gemini", apiKey: entry.key }),
                    });
                    const data = await res.json();
                    setResults(prev => ({ ...prev, [i]: res.ok && data.success }));
                } catch {
                    setResults(prev => ({ ...prev, [i]: false }));
                }
            }
        }

        setTesting(null);
        setTestingAll(false);
    };

    // Add new key
    const handleAddKey = () => {
        if (!newKeyLabel.trim() || !newKeyValue.trim()) return;

        const newKey: GeminiKeyEntry = {
            key: newKeyValue.trim(),
            label: newKeyLabel.trim(),
            enabled: true
        };

        const updatedKeys = [...geminiKeys, newKey];
        onKeysChange?.(updatedKeys);

        // Reset input fields
        setNewKeyLabel("");
        setNewKeyValue("");
    };

    // Delete key
    const handleDeleteKey = (index: number) => {
        const updatedKeys = geminiKeys.filter((_, i) => i !== index);
        onKeysChange?.(updatedKeys);

        // Clear test result for deleted key
        setResults(prev => {
            const newResults: Record<number, boolean | null> = {};
            Object.keys(prev).forEach(k => {
                const keyIndex = parseInt(k);
                if (keyIndex < index) {
                    newResults[keyIndex] = prev[keyIndex];
                } else if (keyIndex > index) {
                    newResults[keyIndex - 1] = prev[keyIndex];
                }
            });
            return newResults;
        });
    };

    // Update key label
    const handleLabelChange = (index: number, newLabel: string) => {
        const updatedKeys = geminiKeys.map((entry, i) =>
            i === index ? { ...entry, label: newLabel } : entry
        );
        onKeysChange?.(updatedKeys);
    };

    // Update key value
    const handleKeyChange = (index: number, newValue: string) => {
        const updatedKeys = geminiKeys.map((entry, i) =>
            i === index ? { ...entry, key: newValue } : entry
        );
        onKeysChange?.(updatedKeys);
    };

    const enabledKeys = geminiKeys.filter(k => k.enabled !== false && k.key);
    const successCount = Object.values(results).filter(r => r === true).length;

    return (
        <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-semibold text-gray-700">
                        Gemini Multi-Key ({geminiKeys.length}개)
                    </h4>
                    {successCount > 0 && (
                        <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                            {successCount}/{enabledKeys.length} 연결됨
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {onSave && (
                        <button
                            onClick={onSave}
                            disabled={saving}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {saving ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                                <Save className="w-3 h-3" />
                            )}
                            저장
                        </button>
                    )}
                    <button
                        onClick={testAllKeys}
                        disabled={testingAll || testing !== null || geminiKeys.length === 0}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {testingAll ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                            <PlayCircle className="w-3 h-3" />
                        )}
                        전체 테스트
                    </button>
                </div>
            </div>

            {/* Existing keys list */}
            <div className="space-y-2">
                {geminiKeys.map((entry, index) => (
                    <div
                        key={index}
                        className={`flex items-center gap-2 p-2 rounded-lg ${
                            entry.enabled === false ? 'bg-gray-50 opacity-60' : 'bg-gray-50'
                        }`}
                    >
                        {/* Label input */}
                        <input
                            type="text"
                            value={entry.label}
                            onChange={(e) => handleLabelChange(index, e.target.value)}
                            placeholder="key1"
                            className="w-20 px-2 py-1.5 text-xs border border-gray-200 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />

                        {/* Key display */}
                        <div className="relative flex-1">
                            <input
                                type={showKeys[index] ? "text" : "password"}
                                value={entry.key}
                                onChange={(e) => handleKeyChange(index, e.target.value)}
                                placeholder="AIzaSy..."
                                className="w-full px-2 py-1.5 pr-8 text-xs border border-gray-200 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                                type="button"
                                onClick={() => toggleShowKey(index)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showKeys[index] ? (
                                    <EyeOff className="w-3 h-3" />
                                ) : (
                                    <Eye className="w-3 h-3" />
                                )}
                            </button>
                        </div>

                        {/* Test button */}
                        <button
                            onClick={() => testSingleKey(index, entry.key)}
                            disabled={testing === index || entry.enabled === false || !entry.key}
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition ${
                                results[index] === true
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : results[index] === false
                                        ? 'bg-red-50 text-red-700 border border-red-200'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {testing === index ? (
                                <>
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                </>
                            ) : results[index] === true ? (
                                <>
                                    <CheckCircle className="w-3 h-3" />
                                    OK
                                </>
                            ) : results[index] === false ? (
                                <>
                                    <XCircle className="w-3 h-3" />
                                    Fail
                                </>
                            ) : (
                                <>
                                    <Zap className="w-3 h-3" />
                                    Test
                                </>
                            )}
                        </button>

                        {/* Delete button */}
                        <button
                            onClick={() => handleDeleteKey(index)}
                            className="p-1 text-gray-400 hover:text-red-600 transition"
                            title="Delete key"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Add new key section */}
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                    <Plus className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">새 키 추가</span>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newKeyLabel}
                        onChange={(e) => setNewKeyLabel(e.target.value)}
                        placeholder="키 이름 (예: key4)"
                        className="w-24 px-2 py-1.5 text-xs border border-blue-200 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="relative flex-1">
                        <input
                            type={showNewKey ? "text" : "password"}
                            value={newKeyValue}
                            onChange={(e) => setNewKeyValue(e.target.value)}
                            placeholder="API Key (AIzaSy...)"
                            className="w-full px-2 py-1.5 pr-8 text-xs border border-blue-200 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewKey(!showNewKey)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showNewKey ? (
                                <EyeOff className="w-3 h-3" />
                            ) : (
                                <Eye className="w-3 h-3" />
                            )}
                        </button>
                    </div>
                    <button
                        onClick={handleAddKey}
                        disabled={!newKeyLabel.trim() || !newKeyValue.trim()}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <Plus className="w-3 h-3" />
                        추가
                    </button>
                </div>
            </div>

            <p className="text-xs text-gray-400 mt-2">
                라운드로빈 방식으로 키가 순환 사용됩니다. (key1 → key2 → key3 → key1...)
            </p>
        </div>
    );
}

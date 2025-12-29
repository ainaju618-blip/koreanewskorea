"use client";

import React from "react";
import { FileText, RotateCcw, Plus, Trash2 } from "lucide-react";
import { SavedPrompt } from "../hooks/useAISettings";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/ai-prompts";

interface PromptEditorProps {
    systemPrompt: string;
    savedPrompts: SavedPrompt[];
    onPromptChange: (value: string) => void;
    onReset: () => void;
    onLoadPrompt: (prompt: SavedPrompt) => void;
    onSavePrompt: (name: string) => void;
    onDeletePrompt: (promptId: string) => void;
}

export function PromptEditor({
    systemPrompt,
    savedPrompts,
    onPromptChange,
    onReset,
    onLoadPrompt,
    onSavePrompt,
    onDeletePrompt
}: PromptEditorProps) {
    const [newPromptName, setNewPromptName] = React.useState("");

    const handleSave = () => {
        const name = newPromptName.trim();
        if (!name) return;
        onSavePrompt(name);
        setNewPromptName("");
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">시스템 프롬프트</h3>
                </div>
                <button
                    type="button"
                    onClick={onReset}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                    <RotateCcw className="w-3 h-3" />
                    초기화
                </button>
            </div>

            {/* Saved Prompts Chips */}
            {savedPrompts && savedPrompts.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                    {savedPrompts.map((p) => (
                        <div
                            key={p.id}
                            className="flex items-center gap-1 px-2 py-1 bg-purple-50 border border-purple-200 rounded text-xs"
                        >
                            <button
                                type="button"
                                onClick={() => onLoadPrompt(p)}
                                className="text-purple-700 hover:text-purple-900 font-medium"
                            >
                                {p.name}
                            </button>
                            <button
                                type="button"
                                onClick={() => onDeletePrompt(p.id)}
                                className="ml-1 text-purple-400 hover:text-red-500"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Textarea - Full Width */}
            <textarea
                value={systemPrompt || ""}
                onChange={(e) => onPromptChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm resize-none mb-3 min-h-[280px]"
                placeholder="AI에게 전달할 시스템 프롬프트를 입력하세요..."
            />

            {/* Quick Save */}
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={newPromptName}
                    onChange={(e) => setNewPromptName(e.target.value)}
                    placeholder="새 프롬프트 이름으로 저장"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <button
                    type="button"
                    disabled={!newPromptName.trim() || !systemPrompt?.trim()}
                    onClick={handleSave}
                    className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

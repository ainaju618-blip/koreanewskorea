"use client";

import React, { useState } from "react";
import { TestTube, Play, Loader2, Copy, FileText, Code } from "lucide-react";
import { AIProvider } from "../hooks/useAISettings";
import { ParsedArticle } from "@/lib/ai-output-parser";

interface AISimulationProps {
    testInput: string;
    testOutput: string;
    parsedOutput: ParsedArticle | null;
    isRewriting: boolean;
    currentProvider: AIProvider;
    onInputChange: (value: string) => void;
    onOutputChange: (value: string) => void;
    onRun: () => void;
    onRealTest: () => void; // 실전 테스트 핸들러
    onCopy: () => void;
    realTestResult?: any; // 테스트 결과
}

import { Database, ExternalLink, Globe } from "lucide-react";

export function AISimulation({
    testInput,
    testOutput,
    parsedOutput,
    isRewriting,
    currentProvider,
    onInputChange,
    onOutputChange,
    onRun,
    onRealTest,
    onCopy,
    realTestResult
}: AISimulationProps) {
    const [viewMode, setViewMode] = useState<"preview" | "json">("preview");

    return (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <TestTube className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">AI 시뮬레이션</h3>
                </div>
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                    {currentProvider}
                </span>
            </div>

            <div className="flex-1 flex flex-col gap-3">
                {/* Input */}
                <div className="flex-1 flex flex-col">
                    <label className="text-xs font-medium text-gray-500 mb-1">
                        입력 (보도자료 원문)
                    </label>
                    <textarea
                        value={testInput}
                        onChange={(e) => onInputChange(e.target.value)}
                        className="w-full flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-none min-h-[120px]"
                        placeholder="테스트할 보도자료 내용을 여기에 붙여넣으세요..."
                    />
                </div>

                {/* Run Button */}
                <div className="flex justify-center gap-3">
                    <button
                        onClick={onRun}
                        disabled={isRewriting || !testInput}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
                    >
                        {isRewriting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                재가공 중...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 fill-current" />
                                시뮬레이션 (단순 확인)
                            </>
                        )}
                    </button>

                    <button
                        onClick={onRealTest}
                        disabled={isRewriting || !testInput}
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 transition shadow-sm"
                        title="임시 기사를 생성하고 AI 재가공을 거쳐 DB에 저장합니다."
                    >
                        <Database className="w-4 h-4" />
                        실전 DB 테스트
                    </button>
                </div>

                {/* Real Test Result Message */}
                {realTestResult && (
                    <div className={`p-4 rounded-lg border ${realTestResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center gap-2 mb-1">
                            {realTestResult.success ? (
                                <span className="text-green-700 font-bold">✅ 테스트 성공!</span>
                            ) : (
                                <span className="text-red-700 font-bold">❌ 테스트 실패</span>
                            )}
                        </div>
                        <p className="text-sm text-gray-700">{realTestResult.message || realTestResult.error}</p>
                        {realTestResult.success && (
                            <div className="mt-3 flex flex-col gap-2">
                                <div className="text-xs text-gray-500">
                                    생성된 기사 ID: <span className="font-mono bg-white px-1 border roundedselect-all">{realTestResult.articleId}</span>
                                </div>
                                <div className="flex gap-2 mt-1">
                                    <a
                                        href={`/news/${realTestResult.articleId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        로컬에서 보기 (Localhost)
                                    </a>
                                    <a
                                        href={`https://koreanewsone.com/news/${realTestResult.articleId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded text-xs font-medium text-blue-700 hover:bg-blue-100 transition"
                                    >
                                        <Globe className="w-3 h-3" />
                                        인터넷으로 보기 (Production)
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Output */}
                <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-gray-500">
                            결과 (AI 출력)
                        </label>
                        <div className="flex items-center gap-2">
                            {parsedOutput && (
                                <div className="flex bg-gray-200 rounded p-0.5">
                                    <button
                                        onClick={() => setViewMode("preview")}
                                        className={`px-2 py-0.5 text-xs rounded ${viewMode === "preview" ? "bg-white shadow text-blue-600" : "text-gray-600"}`}
                                    >
                                        <FileText className="w-3 h-3 inline mr-1" />
                                        미리보기
                                    </button>
                                    <button
                                        onClick={() => setViewMode("json")}
                                        className={`px-2 py-0.5 text-xs rounded ${viewMode === "json" ? "bg-white shadow text-blue-600" : "text-gray-600"}`}
                                    >
                                        <Code className="w-3 h-3 inline mr-1" />
                                        JSON
                                    </button>
                                </div>
                            )}
                            {testOutput && (
                                <button
                                    onClick={onCopy}
                                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition"
                                >
                                    <Copy className="w-3 h-3" />
                                    복사
                                </button>
                            )}
                        </div>
                    </div>

                    {parsedOutput && viewMode === "preview" ? (
                        <div className="flex-1 p-3 bg-white border border-gray-300 rounded-lg text-sm overflow-y-auto min-h-[150px] max-h-[500px]">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold text-gray-500 mb-1">제목</h4>
                                    <p className="font-semibold text-lg">{parsedOutput.title}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-500 mb-1">Slug</h4>
                                        <p className="text-gray-600 text-xs font-mono bg-gray-50 p-1 rounded">
                                            {parsedOutput.slug}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-500 mb-1">Tags</h4>
                                        <div className="flex flex-wrap gap-1">
                                            {parsedOutput.tags.map((tag, i) => (
                                                <span key={i} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-500 mb-1">요약 (Description)</h4>
                                    <p className="text-gray-700 bg-gray-50 p-2 rounded">{parsedOutput.summary}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-500 mb-1">본문 (HTML Preview)</h4>
                                    <div
                                        className="prose prose-sm max-w-none p-3 border rounded bg-gray-50"
                                        dangerouslySetInnerHTML={{ __html: parsedOutput.content }}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <textarea
                            value={testOutput}
                            onChange={(e) => onOutputChange(e.target.value)}
                            className="w-full flex-1 p-3 bg-white border border-gray-300 rounded-lg text-sm resize-none min-h-[150px] font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="실행 버튼을 누르면 여기에 결과가 표시됩니다."
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

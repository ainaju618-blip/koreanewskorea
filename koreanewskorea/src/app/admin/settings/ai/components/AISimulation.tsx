"use client";

import React, { useState, useMemo } from "react";
import { TestTube, Play, Loader2, Copy, FileText, Code, CheckCircle, XCircle, Database, ExternalLink, Globe } from "lucide-react";
import { AIProvider } from "../hooks/useAISettings";
import { ParsedArticle } from "@/lib/ai-output-parser";
import { PRODUCTION_DOMAIN } from "@/lib/ai-consts";
import DOMPurify from "dompurify";

// Real Test Result Interface (P2: any 타입 제거)
interface RealTestResult {
    success: boolean;
    articleId?: string;
    message?: string;
    error?: string;
    parsed?: ParsedArticle;
    step?: string;
}

interface AISimulationProps {
    testInput: string;
    testOutput: string;
    parsedOutput: ParsedArticle | null;
    isRewriting: boolean;
    currentProvider: AIProvider;
    onInputChange: (value: string) => void;
    onOutputChange: (value: string) => void;
    onRun: () => void;
    onRealTest: () => void;
    onCopy: () => void;
    realTestResult?: RealTestResult;
}

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
                    <h3 className="font-semibold text-gray-900">AI Simulation</h3>
                </div>
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                    {currentProvider}
                </span>
            </div>

            <div className="flex-1 flex flex-col gap-3">
                {/* Input */}
                <div className="flex-1 flex flex-col">
                    <label className="text-xs font-medium text-gray-500 mb-1">
                        Input (Press Release)
                    </label>
                    <textarea
                        value={testInput}
                        onChange={(e) => onInputChange(e.target.value)}
                        className="w-full flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-none min-h-[120px]"
                        placeholder="Paste press release content here..."
                    />
                </div>

                {/* Run Buttons */}
                <div className="flex justify-center gap-3">
                    <button
                        onClick={onRun}
                        disabled={isRewriting || !testInput}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
                    >
                        {isRewriting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 fill-current" />
                                Simulation (Preview)
                            </>
                        )}
                    </button>

                    <button
                        onClick={onRealTest}
                        disabled={isRewriting || !testInput}
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 transition shadow-sm"
                        title="Create a temporary article, process with AI, and save to DB."
                    >
                        <Database className="w-4 h-4" />
                        Real DB Test
                    </button>
                </div>

                {/* Real Test Result Message */}
                {realTestResult && (
                    <div className={`p-4 rounded-lg border ${realTestResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center gap-2 mb-1">
                            {realTestResult.success ? (
                                <span className="text-green-700 font-bold flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" /> Test Success
                                </span>
                            ) : (
                                <span className="text-red-700 font-bold flex items-center gap-1">
                                    <XCircle className="w-4 h-4" /> Test Failed
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-700">{realTestResult.message || realTestResult.error}</p>
                        {realTestResult.success && realTestResult.articleId && (
                            <div className="mt-3 flex flex-col gap-2">
                                <div className="text-xs text-gray-500">
                                    Article ID: <span className="font-mono bg-white px-1 border rounded select-all">{realTestResult.articleId}</span>
                                </div>
                                <div className="flex gap-2 mt-1">
                                    <a
                                        href={`/news/${realTestResult.articleId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        Localhost
                                    </a>
                                    <a
                                        href={`${PRODUCTION_DOMAIN}/news/${realTestResult.articleId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded text-xs font-medium text-blue-700 hover:bg-blue-100 transition"
                                    >
                                        <Globe className="w-3 h-3" />
                                        Production
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
                            Output (AI Result)
                        </label>
                        <div className="flex items-center gap-2">
                            {parsedOutput && (
                                <div className="flex bg-gray-200 rounded p-0.5">
                                    <button
                                        onClick={() => setViewMode("preview")}
                                        className={`px-2 py-0.5 text-xs rounded ${viewMode === "preview" ? "bg-white shadow text-blue-600" : "text-gray-600"}`}
                                    >
                                        <FileText className="w-3 h-3 inline mr-1" />
                                        Preview
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
                                    Copy
                                </button>
                            )}
                        </div>
                    </div>

                    {parsedOutput && viewMode === "preview" ? (
                        <SafeHTMLPreview parsedOutput={parsedOutput} />
                    ) : (
                        <textarea
                            value={testOutput}
                            onChange={(e) => onOutputChange(e.target.value)}
                            className="w-full flex-1 p-3 bg-white border border-gray-300 rounded-lg text-sm resize-none min-h-[150px] font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Click Run to see results here."
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// XSS Safe Preview Component (P0: DOMPurify sanitization)
function SafeHTMLPreview({ parsedOutput }: { parsedOutput: ParsedArticle }) {
    const sanitizedContent = useMemo(() => {
        if (typeof window === 'undefined') return parsedOutput.content;
        return DOMPurify.sanitize(parsedOutput.content, {
            ALLOWED_TAGS: ['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'br', 'strong', 'em'],
            ALLOWED_ATTR: []
        });
    }, [parsedOutput.content]);

    return (
        <div className="flex-1 p-3 bg-white border border-gray-300 rounded-lg text-sm overflow-y-auto min-h-[150px] max-h-[500px]">
            <div className="space-y-4">
                <div>
                    <h4 className="text-xs font-bold text-gray-500 mb-1">Title</h4>
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
                    <h4 className="text-xs font-bold text-gray-500 mb-1">Summary (Meta Description)</h4>
                    <p className="text-gray-700 bg-gray-50 p-2 rounded">{parsedOutput.summary}</p>
                </div>
                <div>
                    <h4 className="text-xs font-bold text-gray-500 mb-1">Content (HTML Preview)</h4>
                    <div
                        className="prose prose-sm max-w-none p-3 border rounded bg-gray-50"
                        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                    />
                </div>
            </div>
        </div>
    );
}

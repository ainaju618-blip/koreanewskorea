"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, RefreshCw, Loader2, GitCommit, User, Clock, FileText, Plus, Minus, AlertCircle, Copy, Check } from 'lucide-react';

interface FileChange {
    filename: string;
    additions: number;
    deletions: number;
    binary: boolean;
}

interface CommitDetail {
    hash: string;
    shortHash: string;
    date: string;
    author: string;
    email: string;
    subject: string;
    body: string;
    parents: string[];
    fileChanges: FileChange[];
    totalAdditions: number;
    totalDeletions: number;
    totalFiles: number;
    diff: string;
}

export default function CommitDetailPage() {
    const params = useParams();
    const hash = params.hash as string;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<CommitDetail | null>(null);
    const [copied, setCopied] = useState(false);
    const [showDiff, setShowDiff] = useState(false);

    useEffect(() => {
        fetchCommitDetail();
    }, [hash]);

    const fetchCommitDetail = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/admin/git-status?tab=commit-detail&hash=${hash}`);
            const result = await res.json();

            if (result.error) {
                setError(result.error);
                return;
            }

            setData(result.data);
        } catch (e: any) {
            setError(e.message || 'Failed to fetch commit detail');
        } finally {
            setLoading(false);
        }
    };

    const copyHash = async () => {
        if (data?.hash) {
            await navigator.clipboard.writeText(data.hash);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white">
                <div className="max-w-5xl mx-auto px-4 py-6">
                    <Link href="/admin/git-status" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm">
                        <ArrowLeft className="w-4 h-4" />
                        Back to list
                    </Link>
                    <div className="p-4 border-2 border-red-500 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-5 h-5" />
                            <span className="font-semibold">Error</span>
                        </div>
                        <p className="text-sm text-red-600 mt-1">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-5xl mx-auto px-4 py-6">
                {/* Header */}
                <header className="mb-6">
                    <Link
                        href="/admin/git-status"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to list
                    </Link>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <GitCommit className="w-6 h-6 text-gray-700" />
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Commit detail</h1>
                                <p className="text-sm text-gray-500 font-mono">{data.shortHash}</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchCommitDetail}
                            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </header>

                {/* Commit Info Card */}
                <div className="border border-gray-200 rounded-lg mb-6">
                    {/* Title */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-bold text-gray-900">{data.subject}</h2>
                        {data.body && (
                            <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{data.body}</p>
                        )}
                    </div>

                    {/* Meta Info */}
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-3">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                                <span className="font-medium text-gray-900">{data.author}</span>
                                <span className="text-gray-500 ml-2">&lt;{data.email}&gt;</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{data.date}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <GitCommit className="w-4 h-4 text-gray-400" />
                            <div className="flex items-center gap-2">
                                <code className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{data.hash}</code>
                                <button
                                    onClick={copyHash}
                                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Copy full hash"
                                >
                                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        {data.parents.length > 0 && (
                            <div className="flex items-center gap-3">
                                <span className="text-gray-500">Parent:</span>
                                <div className="flex gap-2">
                                    {data.parents.map((p, i) => (
                                        <Link
                                            key={i}
                                            href={`/admin/git-status/${p.substring(0, 7)}`}
                                            className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-blue-600 hover:text-blue-800"
                                        >
                                            {p.substring(0, 7)}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="border border-gray-200 rounded-lg p-4 text-center">
                        <FileText className="w-5 h-5 mx-auto text-gray-400 mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{data.totalFiles}</p>
                        <p className="text-xs text-gray-500">Changed files</p>
                    </div>
                    <div className="border border-green-200 bg-green-50 rounded-lg p-4 text-center">
                        <Plus className="w-5 h-5 mx-auto text-green-500 mb-2" />
                        <p className="text-2xl font-bold text-green-700">+{data.totalAdditions}</p>
                        <p className="text-xs text-green-600">Additions</p>
                    </div>
                    <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-center">
                        <Minus className="w-5 h-5 mx-auto text-red-500 mb-2" />
                        <p className="text-2xl font-bold text-red-700">-{data.totalDeletions}</p>
                        <p className="text-xs text-red-600">Deletions</p>
                    </div>
                </div>

                {/* File Changes List */}
                <div className="border border-gray-200 rounded-lg mb-6">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                        <h3 className="font-semibold text-gray-900">Changed files ({data.totalFiles})</h3>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                        {data.fileChanges.map((file, idx) => (
                            <div key={idx} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center gap-3 min-w-0">
                                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="font-mono text-sm text-gray-900 truncate" title={file.filename}>
                                        {file.filename}
                                    </span>
                                    {file.binary && (
                                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Binary</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0 text-sm">
                                    <span className="text-green-600 font-medium">+{file.additions}</span>
                                    <span className="text-red-600 font-medium">-{file.deletions}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Diff Toggle */}
                <div className="border border-gray-200 rounded-lg">
                    <button
                        onClick={() => setShowDiff(!showDiff)}
                        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
                    >
                        <h3 className="font-semibold text-gray-900">Diff details</h3>
                        <span className="text-sm text-gray-500">{showDiff ? 'Hide' : 'Show'}</span>
                    </button>
                    {showDiff && data.diff && (
                        <div className="p-4 bg-gray-900 rounded-b-lg overflow-x-auto">
                            <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap">
                                {data.diff.split('\n').map((line, i) => {
                                    let className = 'text-gray-300';
                                    if (line.startsWith('+') && !line.startsWith('+++')) {
                                        className = 'text-green-400 bg-green-900/30';
                                    } else if (line.startsWith('-') && !line.startsWith('---')) {
                                        className = 'text-red-400 bg-red-900/30';
                                    } else if (line.startsWith('@@')) {
                                        className = 'text-blue-400';
                                    } else if (line.startsWith('diff --git') || line.startsWith('index ')) {
                                        className = 'text-yellow-400';
                                    }
                                    return (
                                        <div key={i} className={className}>
                                            {line}
                                        </div>
                                    );
                                })}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
